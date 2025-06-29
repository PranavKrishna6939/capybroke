import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - in production, this would call the Go backend
const mockRoastData = {
  roast: "Oh boy, where do I even start with this portfolio? You've managed to create what I like to call the 'Basic Tech Bro Starter Pack' - it's like you took a screenshot of every finance influencer's top picks and called it diversification. AAPL because you own an iPhone, TSLA because Elon tweeted something funny once, AMZN because you shop there daily, and NVDA because someone mentioned 'AI' and you got FOMO. This isn't a portfolio, it's a greatest hits album of Reddit's r/wallstreetbets. But hey, at least you're consistently predictable in your unpredictability!",
  stocks: {
    "AAPL": {
      company: "Apple Inc.",
      pros: [
        "Massive cash reserves that could buy small countries",
        "Brand loyalty so strong it borders on religious devotion",
        "Ecosystem stickier than a toddler's hands after eating candy",
        "Dividend payments that actually show up on time"
      ],
      cons: [
        "Innovation peaked somewhere around the iPhone 6",
        "Charging $1000+ for what's essentially last year's phone with a new camera",
        "More dependent on China than a panda's diet",
        "Tim Cook's charisma makes watching paint dry seem exciting"
      ]
    },
    "TSLA": {
      company: "Tesla Inc.",
      pros: [
        "Actually revolutionized the auto industry (credit where it's due)",
        "Supercharger network is genuinely impressive",
        "Autopilot technology that's only occasionally terrifying",
        "Elon's Twitter antics provide endless entertainment value"
      ],
      cons: [
        "Valuation more inflated than a Thanksgiving Day parade balloon",
        "Quality control that makes early 2000s GM look premium",
        "CEO who treats Twitter like his personal diary",
        "Competition catching up faster than a Tesla in ludicrous mode"
      ]
    },
    "AMZN": {
      company: "Amazon.com Inc.",
      pros: [
        "AWS basically prints money while you sleep",
        "Logistics network that makes FedEx jealous",
        "Prime membership stickier than superglue",
        "Bezos finally stepped down (that's a pro, right?)"
      ],
      cons: [
        "Retail margins thinner than your patience during Prime Day",
        "Antitrust regulators circling like vultures",
        "Employee turnover higher than a McDonald's drive-thru",
        "Stock price moves like it's powered by rocket fuel or lead weights"
      ]
    },
    "NVDA": {
      company: "NVIDIA Corporation",
      pros: [
        "AI boom made them the golden child of tech",
        "GPU technology that makes gamers weep with joy",
        "Data center revenue growing faster than your regret buying this stock at the peak",
        "Actually has real products that people desperately want"
      ],
      cons: [
        "Valuation so high it needs oxygen masks",
        "Crypto mining demand more volatile than your ex's mood swings",
        "China tensions could crater sales overnight",
        "Stock price swings wider than a playground see-saw"
      ]
    }
  }
};

export async function POST(request: NextRequest) {
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
    const validTickers = tickers.filter(ticker => 
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

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, this would call your Go backend
    // For now, return mock data filtered by requested tickers
    const filteredStocks: Record<string, { company: string; pros: string[]; cons: string[]; }> = {};
    validTickers.forEach((ticker: string) => {
      if (mockRoastData.stocks[ticker as keyof typeof mockRoastData.stocks]) {
        filteredStocks[ticker] = mockRoastData.stocks[ticker as keyof typeof mockRoastData.stocks];
      } else {
        // Generate basic mock data for unknown tickers
        filteredStocks[ticker] = {
          company: `${ticker} Corporation`,
          pros: [
            "You picked a ticker that exists, so that's something",
            "At least it's not a meme coin",
            "Could potentially make money (no guarantees)"
          ],
          cons: [
            "I don't have enough data to properly roast this one",
            "Might be a penny stock (yikes)",
            "Your research skills need work if you're buying random tickers"
          ]
        };
      }
    });

    return NextResponse.json({
      roast: mockRoastData.roast,
      stocks: filteredStocks
    });

  } catch (error) {
    console.error('Error processing roast request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}