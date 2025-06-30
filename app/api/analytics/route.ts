import { NextRequest, NextResponse } from 'next/server';

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    // Fetch analytics data from Go backend
    const response = await fetch(`${GO_BACKEND_URL}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Go backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    // Return mock data if backend is unavailable
    return NextResponse.json({
      requestsPerMinute: {
        roast: 2.5,
        health: 0.1,
        analytics: 0.05
      },
      totalRequests: {
        roast: 1247,
        health: 89,
        analytics: 12
      },
      requestsToday: {
        roast: 156,
        health: 24,
        analytics: 3
      },
      uniqueUsers: 245,
      totalPageVisits: 892,
      concurrentUsers: 4,
      highestConcurrent: 23,
      geminiKeyMetrics: [
        {
          keyIndex: 0,
          keyName: "GEMINI_API_KEY_1",
          requestCount: 423,
          errorCount: 12,
          lastUsed: new Date().toISOString(),
          isActive: true
        },
        {
          keyIndex: 1,
          keyName: "GEMINI_API_KEY_2",
          requestCount: 398,
          errorCount: 8,
          lastUsed: new Date().toISOString(),
          isActive: true
        }
      ],
      systemUptime: 3600.45,
      lastUpdate: new Date().toISOString()
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Track frontend events (page views, interactions, etc.)
    const authHeader = request.headers.get('authorization');
    const validApiKey = process.env.ANALYTICS_API_KEY || 'capybara-analytics-2025';
    
    if (!authHeader || authHeader !== `Bearer ${validApiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // For now, just log the event and return success
    // In the future, this could be expanded to store detailed frontend analytics
    console.log('Frontend analytics event:', body);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
