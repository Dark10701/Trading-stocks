import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const STARTING_CASH = 10000.0;

// Wipes all positions, trades, and snapshots, then resets cash to the starting
// balance and seeds a fresh snapshot. Used by the dashboard "Reset" button.
export async function POST() {
  try {
    const { data: portfolio, error: pErr } = await supabase.from('portfolio').select('id').single();
    if (pErr || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Delete all rows. `not id is null` matches every row.
    await supabase.from('positions').delete().not('id', 'is', null);
    await supabase.from('trades').delete().not('id', 'is', null);
    await supabase.from('portfolio_snapshots').delete().not('id', 'is', null);

    // Reset cash to the starting balance.
    const { error: resetErr } = await supabase
      .from('portfolio')
      .update({ cash_balance: STARTING_CASH })
      .eq('id', portfolio.id);
    if (resetErr) {
      return NextResponse.json({ error: 'Failed to reset portfolio' }, { status: 500 });
    }

    // Seed an initial snapshot so the chart has a starting point.
    await supabase.from('portfolio_snapshots').insert({
      total_value: STARTING_CASH,
      cash_balance: STARTING_CASH,
    });

    return NextResponse.json({ success: true, cash_balance: STARTING_CASH });
  } catch (error: any) {
    console.error('Reset API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset portfolio' }, { status: 500 });
  }
}
