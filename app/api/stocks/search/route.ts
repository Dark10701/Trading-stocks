import { NextRequest, NextResponse } from 'next/server';
import { searchTickers } from '@/lib/polygon';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    const results = await searchTickers(query);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error searching tickers:', error);
    return NextResponse.json({ error: error.message || 'Failed to search tickers' }, { status: 500 });
  }
}
