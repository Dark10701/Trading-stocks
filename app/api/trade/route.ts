import { NextRequest, NextResponse } from 'next/server';
import { executeBuy, executeSell } from '@/lib/trade-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, companyName, quantity, tradeType } = body;

    if (!symbol || !tradeType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (tradeType !== 'BUY' && tradeType !== 'SELL') {
      return NextResponse.json({ error: 'tradeType must be BUY or SELL' }, { status: 400 });
    }

    if (tradeType === 'BUY') {
      if (!quantity || quantity <= 0) {
        return NextResponse.json({ error: 'Quantity must be a positive integer for BUY' }, { status: 400 });
      }
      if (!companyName) {
        return NextResponse.json({ error: 'companyName is required for BUY' }, { status: 400 });
      }

      const result = await executeBuy(symbol, companyName, quantity);
      return NextResponse.json(result);
    } else {
      // For SELL, quantity is implied (all shares), but we could validate.
      const result = await executeSell(symbol);
      return NextResponse.json(result);
    }

  } catch (error: any) {
    console.error(`Trade execution error:`, error);
    return NextResponse.json({ error: error.message || 'Trade execution failed' }, { status: 500 });
  }
}
