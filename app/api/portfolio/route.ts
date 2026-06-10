import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getQuote } from '@/lib/polygon';

export async function GET() {
  try {
    // Fetch portfolio balance and all positions in parallel
    const [{ data: portfolio, error: pErr }, { data: positions, error: posErr }] = await Promise.all([
      supabase.from('portfolio').select('*').single(),
      supabase.from('positions').select('*').order('bought_at', { ascending: false })
    ]);

    if (pErr || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    if (posErr) {
      return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
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
          // If quote fetch fails, return position with buy-price as current
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
    console.error('Portfolio API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch portfolio' }, { status: 500 });
  }
}
