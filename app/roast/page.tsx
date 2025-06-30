"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageIllustration from "@/components/page-illustration";
import RoastDisplay from "@/components/roast-display";
import LoadingSpinner from "@/components/loading-spinner";

interface RoastData {
  roast: string;
  stocks: {
    [ticker: string]: {
      company: string;
      pros: string[];
      cons: string[];
    };
  };
}

interface RateLimitError {
  isRateLimit: boolean;
  retryAfter: number;
  message: string;
}

function RoastContent() {
  const searchParams = useSearchParams();
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    const tickers = searchParams.get('tickers');
    
    if (!tickers) {
      setError("No tickers provided");
      setLoading(false);
      return;
    }

    const fetchRoast = async () => {
      try {
        const tickerList = tickers.split(',').map(t => t.trim().toUpperCase());
        
        const response = await fetch('/api/roast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tickers: tickerList }),
        });

        if (response.status === 429) {
          // Handle rate limiting
          const rateLimitData = await response.json();
          const retryAfter = rateLimitData.retryAfter || 60;
          setRateLimitError({
            isRateLimit: true,
            retryAfter: retryAfter,
            message: rateLimitData.message || 'Rate limit exceeded'
          });
          setCountdown(retryAfter);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to generate roast');
        }

        const data = await response.json();
        setRoastData(data);
      } catch (err) {
        if (!rateLimitError) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoast();
  }, [searchParams]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rateLimitError && countdown === 0) {
      // Reset rate limit error when countdown reaches 0
      setRateLimitError(null);
    }
  }, [countdown, rateLimitError]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (rateLimitError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <div className="rounded-2xl bg-gray-900/50 p-8 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            
            {/* Rate limit icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 mx-auto mb-6">
              <svg className="h-8 w-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-orange-400 mb-4">
              Whoa there, speed demon! 
            </h1>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              You can make another request in
            </p>

            {countdown > 0 && (
              <div className="mb-6">
                <div className="text-3xl font-bold text-brown-400 mb-2">
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {countdown === 0 ? (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full btn bg-linear-to-t from-brown-600 to-brown-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                >
                  Try Again Now
                </button>
              ) : (
                <button
                  disabled
                  className="w-full btn bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  Wait {countdown}s...
                </button>
              )}
              
              <a
                href="/"
                className="block w-full btn bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                Back to Portfolio Input
              </a>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <p className="text-xs text-gray-500">
                Rate limiting helps us keep the service fair for everyone. 
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a
            href="/"
            className="btn bg-linear-to-t from-brown-600 to-brown-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return roastData ? <RoastDisplay data={roastData} /> : null;
}

export default function RoastPage() {
  return (
    <>
      <PageIllustration />
      <Suspense fallback={<LoadingSpinner />}>
        <RoastContent />
      </Suspense>
    </>
  );
}