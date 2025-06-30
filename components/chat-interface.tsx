"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Track user session for analytics
  useEffect(() => {
    // Generate session ID for analytics tracking
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analyticsSessionId', sessionId);
    
    // Track page view
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer capybara-analytics-2025`,
      },
      body: JSON.stringify({
        event: 'page_view',
        page: 'chat_interface',
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {}); // Silent fail for analytics
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    setIsSubmitting(true);
    
    // Parse and validate tickers
    const tickers = input
      .split(',')
      .map(ticker => ticker.trim().toUpperCase())
      .filter(ticker => ticker.length > 0 && ticker.length <= 5 && /^[A-Z]+$/.test(ticker));

    if (tickers.length === 0) {
      alert("Please enter valid stock tickers (e.g., AAPL, TSLA, AMZN)");
      setIsSubmitting(false);
      return;
    }

    if (tickers.length > 10) {
      alert("Please limit to 10 tickers or fewer");
      setIsSubmitting(false);
      return;
    }

    // Track portfolio roast request
    const sessionId = sessionStorage.getItem('analyticsSessionId');
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer capybara-analytics-2025`,
      },
      body: JSON.stringify({
        event: 'portfolio_roast_request',
        tickerCount: tickers.length,
        tickers: tickers,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {}); // Silent fail for analytics

    // Navigate to roast page with tickers as query params
    router.push(`/roast?tickers=${tickers.join(',')}`);
  };

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Hero content */}
          <div className="mx-auto max-w-4xl text-center">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-brown-200),var(--color-gray-50),var(--color-brown-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-8 font-nacelle text-4xl font-semibold text-transparent md:text-6xl"
              data-aos="fade-up"
            >
              Roast My Portfolio
            </h1>
            <p
              className="mb-12 text-xl text-brown-200/65 md:text-2xl"
              data-aos="fade-up"
              data-aos-delay={200}
            >
              Get your stock picks brutally analyzed with humor and insight. 
              <br />
              Enter your tickers and prepare to be roasted.
            </p>

            {/* Chat Interface */}
            <div 
              className="mx-auto max-w-2xl"
              data-aos="fade-up"
              data-aos-delay={400}
            >
              <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
                
                {/* Input form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter your stock tickers (e.g., AAPL, TSLA, AMZN, NVDA)..."
                      className="form-textarea w-full resize-none rounded-lg bg-gray-800/50 px-4 py-3 text-gray-200 placeholder-gray-500 focus:border-brown-500 focus:ring-2 focus:ring-brown-500/20"
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Max 10 tickers 
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting || !input.trim()}
                      className="btn bg-linear-to-t from-brown-600 to-brown-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Roasting...
                        </span>
                      ) : (
                        "Roast My Portfolio"
                      )}
                    </button>
                  </div>
                </form>

                {/* Example tickers */}
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                  <p className="text-sm text-gray-400 mb-3">Just paste your stock tickers below, separated by commas. Popular examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {["AAPL, MSFT, GOOGL", "TSLA, NVDA, AMD", "SPY, QQQ, VTI", "AMZN, META, NFLX"].map((example, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setInput(example)}
                        className="rounded-full bg-gray-800/40 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700/40 transition-colors"
                        disabled={isSubmitting}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}