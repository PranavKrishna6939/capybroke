"use client";

import { useEffect } from "react";
import AOS from "aos";

interface RoastData {
  roast: string;
  score: number;
  stocks: {
    [ticker: string]: {
      company: string;
      pros: string[];
      cons: string[];
    };
  };
}

interface RoastDisplayProps {
  data: RoastData;
}

export default function RoastDisplay({ data }: RoastDisplayProps) {
  useEffect(() => {
    AOS.refresh();
  }, []);

  const getRiskLevel = (score: number) => {
    if (score <= 20) {
      return {
        label: "Extremely Risky",
        color: "from-purple-500 to-purple-700",
        textColor: "text-purple-400",
        bgColor: "bg-purple-500/20",
        description: "Neon purple danger zone"
      };
    } else if (score <= 40) {
      return {
        label: "High Risk",
        color: "from-red-500 to-red-700",
        textColor: "text-red-400",
        bgColor: "bg-red-500/20",
        description: "Red alert territory"
      };
    } else if (score <= 60) {
      return {
        label: "Moderate Risk",
        color: "from-yellow-500 to-orange-600",
        textColor: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        description: "Yellow caution zone"
      };
    } else if (score <= 80) {
      return {
        label: "Low Risk",
        color: "from-green-500 to-green-600",
        textColor: "text-green-400",
        bgColor: "bg-green-500/20",
        description: "Green safe zone"
      };
    } else {
      return {
        label: "Ultra Safe",
        color: "from-green-600 to-green-800",
        textColor: "text-green-300",
        bgColor: "bg-green-600/20",
        description: "Deep green fortress"
      };
    }
  };

  const riskLevel = getRiskLevel(data.score);

  return (
    <section className="relative">
      <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="py-6 md:py-12">
          
          {/* Header */}
          <div className="text-center mb-8" data-aos="fade-up">
            <p className="text-lg text-brown-200/65">
              Here's what PortfolioBara really thinks about your investment choices...
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            
            {/* Left Column - Main Roast */}
            <div data-aos="fade-right">
              <div className="rounded-2xl bg-gray-900/50 p-8 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-200">The Brutal Truth</h2>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {data.roast}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Analyzed {Object.keys(data.stocks).length} stocks
                    </span>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="btn-sm bg-linear-to-t from-brown-600 to-brown-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                    >
                      Roast Another Portfolio
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Capybarometer and Stock Cards */}
            <div data-aos="fade-left">
              {/* Capybarometer Score */}
              <div className="rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative" data-aos="fade-up" data-aos-delay="200">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${riskLevel.bgColor}`}>
                    <svg className={`h-4 w-4 ${riskLevel.textColor}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 112 0v3.5a.5.5 0 01-1 0V6a1 1 0 01-1-1zm1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-200">Capybarometer</h2>
                </div>
                
                <p className="text-gray-400 text-xs mb-4">PortfolioBara's gut feeling, scientifically measured.</p>
                
                {/* Score Display */}
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${riskLevel.color} shadow-lg mb-3 relative`}>
                    <span className="text-xl font-bold text-white">{data.score}</span>
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${riskLevel.color} opacity-20 animate-pulse`}></div>
                  </div>
                  <h3 className={`text-lg font-semibold ${riskLevel.textColor} mb-1`}>{riskLevel.label}</h3>
                  <p className="text-gray-400 text-xs">{riskLevel.description}</p>
                </div>

                {/* Risk Meter */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>Safe Zone</span>
                    <span>100</span>
                  </div>
                  <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-red-500 via-yellow-500 via-green-500 to-green-700"></div>
                    {/* Score indicator */}
                    <div 
                      className="absolute top-0 h-full w-1 bg-white shadow-lg rounded-full transform -translate-x-0.5 transition-all duration-500"
                      style={{ left: `${data.score}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      Based on sector concentration, market cap mix, volatility, and diversification
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Breakdown Section */}
              <div className="mt-6">
                {/* Stock Cards Grid - 2 per row */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {Object.entries(data.stocks).map(([ticker, stock], index) => (
                    <div
                      key={ticker}
                      className="group rounded-2xl bg-gray-900/50 p-6 backdrop-blur-xs before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative hover:bg-gray-900/70 transition-all duration-300"
                      data-aos="fade-up"
                      data-aos-delay={index * 100}
                    >
                      {/* Stock Header */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="rounded-lg bg-brown-500/20 px-3 py-1 text-sm font-bold text-brown-400">
                            {ticker}
                          </span>
                          <div className="h-px flex-1 bg-gray-700/50"></div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                          {stock.company}
                        </h3>
                      </div>

                      {/* Pros and Cons */}
                      <div className="space-y-3">
                        {/* Pros */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-medium text-green-400 mb-2">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Pros
                          </h4>
                          <ul className="space-y-1">
                            {stock.pros.map((pro, proIndex) => (
                              <li key={proIndex} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">•</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Cons */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-medium text-red-400 mb-2">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Cons
                          </h4>
                          <ul className="space-y-1">
                            {stock.cons.map((con, conIndex) => (
                              <li key={conIndex} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}