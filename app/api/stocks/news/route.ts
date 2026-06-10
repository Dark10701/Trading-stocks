import { NextRequest, NextResponse } from 'next/server';
import { getCompanyNews } from '@/lib/finnhub';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!symbol || !from || !to) {
    return NextResponse.json({ error: 'Missing required parameters: symbol, from, to' }, { status: 400 });
  }

  try {
    const news = await getCompanyNews(symbol, from, to);
    return NextResponse.json(news);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch news' }, { status: 500 });
  }
}
