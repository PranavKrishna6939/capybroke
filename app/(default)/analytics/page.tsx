"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AnalyticsData {
  requestsPerMinute: { [key: string]: number };
  totalRequests: { [key: string]: number };
  requestsToday: { [key: string]: number };
  uniqueUsers: number;
  totalPageVisits: number;
  concurrentUsers: number;
  highestConcurrent: number;
  geminiKeyMetrics: Array<{
    keyIndex: number;
    keyName: string;
    requestCount: number;
    errorCount: number;
    lastUsed: string;
    isActive: boolean;
  }>;
  systemUptime: number;
  lastUpdate: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch and auto-refresh every 30 seconds
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button
            onClick={fetchAnalytics}
            className="btn bg-linear-to-t from-brown-600 to-brown-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="relative min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Last updated: {formatDate(data.lastUpdate)}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="btn-sm bg-linear-to-t from-brown-600 to-brown-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-sm bg-linear-to-t from-gray-600 to-gray-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
            >
              Back to Site
            </button>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Unique Users</h3>
            <p className="text-3xl font-bold text-green-400">{data.uniqueUsers.toLocaleString()}</p>
          </div>
          
          <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Total Page Visits</h3>
            <p className="text-3xl font-bold text-cyan-400">{data.totalPageVisits.toLocaleString()}</p>
          </div>
          
          <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Current Users</h3>
            <p className="text-3xl font-bold text-blue-400">{data.concurrentUsers}</p>
          </div>
          
          <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Peak Concurrent</h3>
            <p className="text-3xl font-bold text-purple-400">{data.highestConcurrent}</p>
          </div>
        </div>

        {/* System Uptime */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">System Uptime</h3>
            <p className="text-xl font-bold text-orange-400">{formatUptime(data.systemUptime)}</p>
          </div>
        </div>

        {/* API Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Requests Per Minute */}
          <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            <h3 className="text-xl font-semibold text-gray-200 mb-4">Requests Per Minute</h3>
            <div className="space-y-3">
              {Object.entries(data.requestsPerMinute).map(([endpoint, rpm]) => (
                <div key={endpoint} className="flex justify-between items-center">
                  <span className="text-gray-300 capitalize">{endpoint}</span>
                  <span className="text-lg font-bold text-green-400">{rpm.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Requests */}
          <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            <h3 className="text-xl font-semibold text-gray-200 mb-4">Total Requests</h3>
            <div className="space-y-3">
              {Object.entries(data.totalRequests).map(([endpoint, total]) => (
                <div key={endpoint} className="flex justify-between items-center">
                  <span className="text-gray-300 capitalize">{endpoint}</span>
                  <span className="text-lg font-bold text-blue-400">{total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Requests Today */}
          <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
            <h3 className="text-xl font-semibold text-gray-200 mb-4">Requests Today</h3>
            <div className="space-y-3">
              {Object.entries(data.requestsToday).map(([endpoint, today]) => (
                <div key={endpoint} className="flex justify-between items-center">
                  <span className="text-gray-300 capitalize">{endpoint}</span>
                  <span className="text-lg font-bold text-purple-400">{today.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gemini API Key Metrics */}
        <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
          <h3 className="text-xl font-semibold text-gray-200 mb-6">Gemini API Key Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Key Name</th>
                  <th className="text-left py-3 px-4 text-gray-300">Requests</th>
                  <th className="text-left py-3 px-4 text-gray-300">Errors</th>
                  <th className="text-left py-3 px-4 text-gray-300">Error Rate</th>
                  <th className="text-left py-3 px-4 text-gray-300">Last Used</th>
                  <th className="text-left py-3 px-4 text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.geminiKeyMetrics.map((keyMetric) => {
                  const errorRate = keyMetric.requestCount > 0 
                    ? ((keyMetric.errorCount / keyMetric.requestCount) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <tr key={keyMetric.keyIndex} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-gray-200">{keyMetric.keyName}</td>
                      <td className="py-3 px-4 text-green-400 font-bold">{keyMetric.requestCount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-400 font-bold">{keyMetric.errorCount}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${parseFloat(errorRate) > 10 ? 'text-red-400' : parseFloat(errorRate) > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {errorRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {keyMetric.lastUsed ? formatDate(keyMetric.lastUsed) : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${keyMetric.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                          {keyMetric.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}