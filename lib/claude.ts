import Anthropic from '@anthropic-ai/sdk';

export interface DebriefTrade {
  symbol: string;
  company_name: string | null;
  quantity: number;
  price_at_trade: number;
  total_value: number;
  pnl: number | null;
  traded_at: string;
  buy_price?: number | null;
  buy_date?: string | null;
}

export function isClaudeConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key !== 'your_anthropic_key');
}

export async function generateDebrief(trade: DebriefTrade): Promise<string> {
  const client = new Anthropic();

  const pnl = trade.pnl ?? 0;
  const outcome = pnl >= 0 ? 'profit' : 'loss';
  const holdInfo = trade.buy_date
    ? `Bought at $${trade.buy_price} on ${trade.buy_date}, sold on ${trade.traded_at}.`
    : `Sold on ${trade.traded_at}.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    system:
      'You are a friendly trading coach for a paper-trading app used by beginners learning US stock investing. ' +
      'Given the details of a closed trade, write a short post-trade debrief (3-5 sentences): what went well or poorly, ' +
      'one concrete lesson, and one thing to watch next time. Be encouraging but honest. Plain text only, no markdown headers.',
    messages: [
      {
        role: 'user',
        content:
          `Trade closed: SELL ${trade.quantity} shares of ${trade.symbol}` +
          `${trade.company_name ? ` (${trade.company_name})` : ''} at $${trade.price_at_trade} ` +
          `for a total of $${trade.total_value}. Realized ${outcome}: $${pnl.toFixed(2)}. ${holdInfo}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }
  return textBlock.text.trim();
}
