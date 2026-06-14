import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuote } from "@/lib/polygon";
import { ensurePortfolio } from "@/lib/portfolio";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Create the portfolio on first access.
    await ensurePortfolio(supabase, user.id);

    const [{ data: portfolio, error: pErr }, { data: positions, error: posErr }] =
      await Promise.all([
        supabase.from("portfolio").select("*").eq("user_id", user.id).single(),
        supabase
          .from("positions")
          .select("*")
          .eq("user_id", user.id)
          .order("bought_at", { ascending: false }),
      ]);

    if (pErr || !portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }
    if (posErr) {
      return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
    }

    // Enrich each position with current price + unrealized P&L
    const enrichedPositions = await Promise.all(
      (positions || []).map(async (pos) => {
        try {
          const quote = await getQuote(pos.symbol);
          const currentPrice = quote?.c ?? pos.avg_buy_price;
          const marketValue = currentPrice * pos.quantity;
          const costBasis = pos.avg_buy_price * pos.quantity;
          const unrealizedPnl = marketValue - costBasis;
          const pnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
          return {
            ...pos,
            current_price: currentPrice,
            market_value: marketValue,
            cost_basis: costBasis,
            unrealized_pnl: unrealizedPnl,
            pnl_percent: pnlPercent,
          };
        } catch {
          const costBasis = pos.avg_buy_price * pos.quantity;
          return {
            ...pos,
            current_price: pos.avg_buy_price,
            market_value: costBasis,
            cost_basis: costBasis,
            unrealized_pnl: 0,
            pnl_percent: 0,
          };
        }
      })
    );

    const totalMarketValue = enrichedPositions.reduce((sum, p) => sum + p.market_value, 0);
    const totalCostBasis = enrichedPositions.reduce((sum, p) => sum + p.cost_basis, 0);
    const totalUnrealizedPnl = totalMarketValue - totalCostBasis;
    const totalPortfolioValue = portfolio.cash_balance + totalMarketValue;

    return NextResponse.json({
      cash_balance: portfolio.cash_balance,
      total_market_value: totalMarketValue,
      total_portfolio_value: totalPortfolioValue,
      total_unrealized_pnl: totalUnrealizedPnl,
      positions: enrichedPositions,
    });
  } catch (error: any) {
    console.error("Portfolio API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}
