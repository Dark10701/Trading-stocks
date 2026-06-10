import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .order('traded_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch trade history' }, { status: 500 });
    }

    return NextResponse.json(trades || []);
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch history' }, { status: 500 });
  }
}
