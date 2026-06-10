import { NextRequest, NextResponse } from 'next/server';
import { getPriceHistory } from '@/lib/polygon';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!symbol || !from || !to) {
    return NextResponse.json({ error: 'Missing required parameters: symbol, from, to' }, { status: 400 });
  }

  try {
    const history = await getPriceHistory(symbol, from, to);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch history' }, { status: 500 });
  }
}
