import { NextRequest, NextResponse } from 'next/server';
import { getQuote } from '@/lib/polygon';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const quote = await getQuote(symbol);
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    return NextResponse.json(quote);
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch quote' }, { status: 500 });
  }
}
