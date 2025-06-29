export default function LoadingSpinner() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-screen items-center justify-center py-12 md:py-20">
          <div className="text-center">
            {/* Animated fire icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <svg 
                  className="h-16 w-16 text-red-500 animate-pulse" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <div className="absolute inset-0 h-16 w-16 animate-ping">
                  <svg 
                    className="h-16 w-16 text-red-500/30" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
            </div>

            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),#f5e6d3,var(--color-gray-50),#e3bb9b,var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Roasting Your Portfolio...
            </h2>
            
            <p className="text-lg text-indigo-200/65 mb-8">
              Our AI is analyzing your stock picks and preparing some brutal honesty.
              <br />
              This might take a moment... ⏰
            </p>

            {/* Loading dots */}
            <div className="flex justify-center space-x-2">
              <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>

            {/* Fun loading messages */}
            <div className="mt-8 text-sm text-gray-400">
              <p className="animate-pulse">
                🔍 Analyzing your questionable investment choices...
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}