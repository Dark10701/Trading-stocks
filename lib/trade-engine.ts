import { supabase } from './supabase';
import { getQuote } from './polygon';

export async function executeBuy(symbol: string, companyName: string, quantity: number) {
  if (quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error('Quantity must be a positive integer');
  }

  // 1. Fetch current price
  const quote = await getQuote(symbol);
  if (!quote || !quote.c) {
    throw new Error('Could not fetch current price for ' + symbol);
  }
  const currentPrice = quote.c;
  const totalCost = currentPrice * quantity;

  // Fetch portfolio and check position
  const [{ data: portfolio }, { data: position }] = await Promise.all([
    supabase.from('portfolio').select('*').single(),
    supabase.from('positions').select('*').eq('symbol', symbol.toUpperCase()).single()
  ]);

  if (!portfolio) throw new Error('Portfolio not found');
  
  // 3. Validate cash balance
  if (totalCost > portfolio.cash_balance) {
    throw new Error('Insufficient funds');
  }

  // 4. Validate no existing position
  if (position) {
    throw new Error('You already hold this stock');
  }

  // 5. Execute "transaction" (Sequentially for MVP)
  const newBalance = portfolio.cash_balance - totalCost;

  const { error: portfolioError } = await supabase
    .from('portfolio')
    .update({ cash_balance: newBalance })
    .eq('id', portfolio.id);
  if (portfolioError) throw new Error('Failed to update portfolio balance');

  const { error: posError } = await supabase
    .from('positions')
    .insert({
      symbol: symbol.toUpperCase(),
      company_name: companyName,
      quantity,
      avg_buy_price: currentPrice
    });
  if (posError) {
    // Rollback attempt
    await supabase.from('portfolio').update({ cash_balance: portfolio.cash_balance }).eq('id', portfolio.id);
    throw new Error('Failed to create position');
  }

  const { error: tradeError } = await supabase
    .from('trades')
    .insert({
      symbol: symbol.toUpperCase(),
      company_name: companyName,
      trade_type: 'BUY',
      quantity,
      price_at_trade: currentPrice,
      total_value: totalCost
    });

  if (tradeError) console.error('Failed to log trade, but position was created:', tradeError);

  return { success: true, newBalance, currentPrice, totalCost };
}

export async function executeSell(symbol: string) {
  // 1. Fetch current price
  const quote = await getQuote(symbol);
  if (!quote || !quote.c) {
    throw new Error('Could not fetch current price for ' + symbol);
  }
  const currentPrice = quote.c;

  // 2. Look up existing position
  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .single();

  // 3. Validate
  if (!position) {
    throw new Error('You do not hold a position in ' + symbol);
  }

  const { data: portfolio } = await supabase.from('portfolio').select('*').single();
  if (!portfolio) throw new Error('Portfolio not found');

  // 4 & 5. Calculate values
  const totalValue = currentPrice * position.quantity;
  const pnl = (currentPrice - position.avg_buy_price) * position.quantity;
  const newBalance = portfolio.cash_balance + totalValue;

  // 6. Execute "transaction"
  const { error: portfolioError } = await supabase
    .from('portfolio')
    .update({ cash_balance: newBalance })
    .eq('id', portfolio.id);
  if (portfolioError) throw new Error('Failed to update portfolio balance');

  const { error: posError } = await supabase
    .from('positions')
    .delete()
    .eq('symbol', symbol.toUpperCase());
  if (posError) {
    // Rollback attempt
    await supabase.from('portfolio').update({ cash_balance: portfolio.cash_balance }).eq('id', portfolio.id);
    throw new Error('Failed to delete position');
  }

  const { data: tradeData, error: tradeError } = await supabase
    .from('trades')
    .insert({
      symbol: symbol.toUpperCase(),
      company_name: position.company_name,
      trade_type: 'SELL',
      quantity: position.quantity,
      price_at_trade: currentPrice,
      total_value: totalValue,
      pnl: pnl
    })
    .select()
    .single();

  if (tradeError) console.error('Failed to log trade, but position was closed:', tradeError);

  // 7. Trigger AI debrief asynchronously
  if (tradeData) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/debrief`, {
      method: 'POST',
      body: JSON.stringify({ tradeId: tradeData.id }),
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.error('Failed to trigger debrief:', err));
  }

  return { success: true, pnl, newBalance, totalValue };
}
