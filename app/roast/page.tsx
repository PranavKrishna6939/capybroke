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

function RoastContent() {
  const searchParams = useSearchParams();
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        if (!response.ok) {
          throw new Error('Failed to generate roast');
        }

        const data = await response.json();
        setRoastData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRoast();
  }, [searchParams]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a
            href="/"
            className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
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