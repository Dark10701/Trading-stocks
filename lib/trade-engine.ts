import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuote } from "./polygon";
import { ensurePortfolio } from "./portfolio";

/**
 * Record a snapshot of the user's total portfolio value (cash + current market
 * value of all positions). Called after every trade so the dashboard chart has a
 * time series. Best-effort: failures are logged but never block the trade.
 */
async function recordSnapshot(supabase: SupabaseClient, userId: string) {
  try {
    const { data: portfolio } = await supabase
      .from("portfolio")
      .select("cash_balance")
      .eq("user_id", userId)
      .single();
    if (!portfolio) return;

    const { data: positions } = await supabase
      .from("positions")
      .select("symbol, quantity, avg_buy_price")
      .eq("user_id", userId);

    let marketValue = 0;
    for (const pos of positions || []) {
      try {
        const quote = await getQuote(pos.symbol);
        marketValue += (quote?.c ?? pos.avg_buy_price) * pos.quantity;
      } catch {
        marketValue += pos.avg_buy_price * pos.quantity;
      }
    }

    await supabase.from("portfolio_snapshots").insert({
      user_id: userId,
      total_value: portfolio.cash_balance + marketValue,
      cash_balance: portfolio.cash_balance,
    });
  } catch (err) {
    console.error("Failed to record portfolio snapshot:", err);
  }
}

export async function executeBuy(
  supabase: SupabaseClient,
  userId: string,
  symbol: string,
  companyName: string,
  quantity: number
) {
  if (quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error("Quantity must be a positive integer");
  }

  // Make sure the user has a portfolio.
  await ensurePortfolio(supabase, userId);

  // 1. Fetch current price
  const quote = await getQuote(symbol);
  if (!quote || !quote.c) {
    throw new Error("Could not fetch current price for " + symbol);
  }
  const currentPrice = quote.c;
  const totalCost = currentPrice * quantity;
  const upperSymbol = symbol.toUpperCase();

  // 2. Fetch portfolio and any existing position for this symbol
  const [{ data: portfolio }, { data: position }] = await Promise.all([
    supabase.from("portfolio").select("*").eq("user_id", userId).single(),
    supabase
      .from("positions")
      .select("*")
      .eq("user_id", userId)
      .eq("symbol", upperSymbol)
      .maybeSingle(),
  ]);

  if (!portfolio) throw new Error("Portfolio not found");

  // 3. Validate cash balance
  if (totalCost > portfolio.cash_balance) {
    throw new Error("Insufficient funds");
  }

  // 4. Deduct cash
  const newBalance = portfolio.cash_balance - totalCost;
  const { error: portfolioError } = await supabase
    .from("portfolio")
    .update({ cash_balance: newBalance })
    .eq("id", portfolio.id);
  if (portfolioError) throw new Error("Failed to update portfolio balance");

  // 5. Add to existing position (weighted-average buy price) or create a new one
  if (position) {
    const newQuantity = position.quantity + quantity;
    const newAvgPrice =
      (position.avg_buy_price * position.quantity + currentPrice * quantity) /
      newQuantity;

    const { error: updateError } = await supabase
      .from("positions")
      .update({ quantity: newQuantity, avg_buy_price: newAvgPrice })
      .eq("id", position.id);

    if (updateError) {
      await supabase
        .from("portfolio")
        .update({ cash_balance: portfolio.cash_balance })
        .eq("id", portfolio.id);
      throw new Error("Failed to update position");
    }
  } else {
    const { error: posError } = await supabase.from("positions").insert({
      user_id: userId,
      symbol: upperSymbol,
      company_name: companyName,
      quantity,
      avg_buy_price: currentPrice,
    });

    if (posError) {
      await supabase
        .from("portfolio")
        .update({ cash_balance: portfolio.cash_balance })
        .eq("id", portfolio.id);
      throw new Error("Failed to create position");
    }
  }

  // 6. Log the trade
  const { error: tradeError } = await supabase.from("trades").insert({
    user_id: userId,
    symbol: upperSymbol,
    company_name: companyName,
    trade_type: "BUY",
    quantity,
    price_at_trade: currentPrice,
    total_value: totalCost,
  });

  if (tradeError)
    console.error("Failed to log trade, but position was updated:", tradeError);

  // 7. Snapshot portfolio value for the chart
  await recordSnapshot(supabase, userId);

  return { success: true, newBalance, currentPrice, totalCost };
}

export async function executeSell(
  supabase: SupabaseClient,
  userId: string,
  symbol: string,
  quantity?: number
) {
  // 1. Fetch current price
  const quote = await getQuote(symbol);
  if (!quote || !quote.c) {
    throw new Error("Could not fetch current price for " + symbol);
  }
  const currentPrice = quote.c;
  const upperSymbol = symbol.toUpperCase();

  // 2. Look up existing position
  const { data: position } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("symbol", upperSymbol)
    .maybeSingle();

  if (!position) {
    throw new Error("You do not hold a position in " + symbol);
  }

  // 3. Determine how many shares to sell (default: all of them)
  const sellQuantity = quantity && quantity > 0 ? quantity : position.quantity;
  if (!Number.isInteger(sellQuantity) || sellQuantity <= 0) {
    throw new Error("Sell quantity must be a positive integer");
  }
  if (sellQuantity > position.quantity) {
    throw new Error(
      `You only hold ${position.quantity} share${position.quantity === 1 ? "" : "s"} of ${symbol}`
    );
  }

  const { data: portfolio } = await supabase
    .from("portfolio")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!portfolio) throw new Error("Portfolio not found");

  // 4. Calculate proceeds and realized P&L for the shares being sold
  const totalValue = currentPrice * sellQuantity;
  const pnl = (currentPrice - position.avg_buy_price) * sellQuantity;
  const newBalance = portfolio.cash_balance + totalValue;
  const isFullSell = sellQuantity === position.quantity;

  // 5. Add proceeds to cash
  const { error: portfolioError } = await supabase
    .from("portfolio")
    .update({ cash_balance: newBalance })
    .eq("id", portfolio.id);
  if (portfolioError) throw new Error("Failed to update portfolio balance");

  // 6. Close the position (full sell) or reduce its quantity (partial sell)
  if (isFullSell) {
    const { error: posError } = await supabase
      .from("positions")
      .delete()
      .eq("id", position.id);
    if (posError) {
      await supabase
        .from("portfolio")
        .update({ cash_balance: portfolio.cash_balance })
        .eq("id", portfolio.id);
      throw new Error("Failed to close position");
    }
  } else {
    const { error: posError } = await supabase
      .from("positions")
      .update({ quantity: position.quantity - sellQuantity })
      .eq("id", position.id);
    if (posError) {
      await supabase
        .from("portfolio")
        .update({ cash_balance: portfolio.cash_balance })
        .eq("id", portfolio.id);
      throw new Error("Failed to update position");
    }
  }

  // 7. Log the trade
  const { data: tradeData, error: tradeError } = await supabase
    .from("trades")
    .insert({
      user_id: userId,
      symbol: upperSymbol,
      company_name: position.company_name,
      trade_type: "SELL",
      quantity: sellQuantity,
      price_at_trade: currentPrice,
      total_value: totalValue,
      pnl: pnl,
    })
    .select()
    .single();

  if (tradeError)
    console.error("Failed to log trade, but position was updated:", tradeError);

  // 8. Snapshot portfolio value for the chart
  await recordSnapshot(supabase, userId);

  // The client triggers the optional AI debrief (so the request carries the
  // user's session). We return the trade id for that.
  return {
    success: true,
    pnl,
    newBalance,
    totalValue,
    sharesSold: sellQuantity,
    remainingShares: position.quantity - sellQuantity,
    tradeId: tradeData?.id ?? null,
  };
}
