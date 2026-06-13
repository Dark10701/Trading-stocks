import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Returns portfolio value snapshots over time (oldest first) for the dashboard chart.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('total_value, cash_balance, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch portfolio history' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Portfolio history API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch portfolio history' }, { status: 500 });
  }
}
