import { NextRequest, NextResponse } from 'next/server';

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  let validTickers: string[] = [];
  
  try {
    const body = await request.json();
    const { tickers } = body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tickers provided' },
        { status: 400 }
      );
    }

    // Validate tickers (basic validation)
    validTickers = tickers.filter(ticker => 
      typeof ticker === 'string' && 
      ticker.length <= 5 && 
      /^[A-Z]+$/.test(ticker)
    );

    if (validTickers.length === 0) {
      return NextResponse.json(
        { error: 'No valid tickers provided' },
        { status: 400 }
      );
    }

    // Generate user ID for analytics tracking
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for') || '';
    const clientIP = xForwardedFor.split(',')[0] || 'unknown';
    const userID = `${clientIP}-${Date.now()}`;

    // Forward request to Go backend with user tracking
    const response = await fetch(`${GO_BACKEND_URL}/roast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userID,
        'X-User-Agent': userAgent,
      },
      body: JSON.stringify({ tickers: validTickers }),
    });

    // Handle rate limiting specifically
    if (response.status === 429) {
      const rateLimitData = await response.json();
      return NextResponse.json(rateLimitData, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit') || '1',
          'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining') || '0',
          'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset') || '',
        }
      });
    }

    if (!response.ok) {
      throw new Error(`Go backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error calling Go backend:', error);
    
    // Fallback response if Go backend is unavailable
    const fallbackStocks = validTickers.reduce((acc: any, ticker: string) => {
      acc[ticker] = {
        company: `${ticker} Corporation`,
        pros: [
          "The backend is down, so you're safe from roasting for now",
          "At least you're trying to invest (that's something)",
          "Could be worse - you could be investing in crypto"
        ],
        cons: [
          "Our roasting service is temporarily unavailable",
          "You'll have to wait for the brutal honesty",
          "Maybe this is a sign to do more research first"
        ]
      };
      return acc;
    }, {});

    return NextResponse.json({
      roast: "Oops! Our roasting service is taking a coffee break. Your portfolio is probably fine... or maybe it's not. Who knows? Try again in a moment when our sarcastic AI wakes up from its nap.",
      stocks: fallbackStocks
    });
  }
}