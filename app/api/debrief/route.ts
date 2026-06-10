import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateDebrief, isClaudeConfigured } from '@/lib/claude';

export async function POST(request: Request) {
  try {
    const { tradeId } = await request.json();
    if (!tradeId) {
      return NextResponse.json({ error: 'tradeId is required' }, { status: 400 });
    }

    if (!isClaudeConfigured()) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured; skipping debrief' },
        { status: 503 }
      );
    }

    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    if (trade.trade_type !== 'SELL') {
      return NextResponse.json({ error: 'Debriefs are only generated for SELL trades' }, { status: 400 });
    }
    if (trade.ai_debrief) {
      return NextResponse.json({ debrief: trade.ai_debrief, cached: true });
    }

    // Find the matching BUY for hold-period context (best effort)
    const { data: buyTrade } = await supabase
      .from('trades')
      .select('price_at_trade, traded_at')
      .eq('symbol', trade.symbol)
      .eq('trade_type', 'BUY')
      .lt('traded_at', trade.traded_at)
      .order('traded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const debrief = await generateDebrief({
      symbol: trade.symbol,
      company_name: trade.company_name,
      quantity: trade.quantity,
      price_at_trade: trade.price_at_trade,
      total_value: trade.total_value,
      pnl: trade.pnl,
      traded_at: trade.traded_at,
      buy_price: buyTrade?.price_at_trade ?? null,
      buy_date: buyTrade?.traded_at ?? null,
    });

    const { error: updateError } = await supabase
      .from('trades')
      .update({ ai_debrief: debrief })
      .eq('id', tradeId);

    if (updateError) {
      console.error('Failed to save debrief:', updateError);
      return NextResponse.json({ error: 'Failed to save debrief' }, { status: 500 });
    }

    return NextResponse.json({ debrief });
  } catch (err) {
    console.error('Debrief error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
