export default function LoadingSpinner() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-screen items-center justify-center py-12 md:py-20">
          <div className="text-center">
            {/* Animated PortfolioBara icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brown-200/20 p-2 animate-pulse">
                  <img
                    src="/portfoliobara.png"
                    alt="Portfolio Capybara"
                    className="h-12 w-12 rounded-full"
                  />
                </div>
                <div className="absolute inset-0 h-16 w-16 animate-ping">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brown-200/10 p-2">
                    <img
                      src="/portfoliobara.png"
                      alt="Portfolio Capybara"
                      className="h-12 w-12 rounded-full opacity-30"
                    />
                  </div>
                </div>
              </div>
            </div>

            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-brown-200),var(--color-gray-50),var(--color-brown-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Roasting Your Portfolio...
            </h2>
            
            <p className="text-lg text-brown-200/65 mb-8">
              PortfolioBara is analyzing your stock picks and preparing some brutal honesty.
              <br />
              This might take a moment...
            </p>

            {/* Loading dots */}
            <div className="flex justify-center space-x-2">
              <div className="h-2 w-2 bg-brown-500 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-brown-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-2 w-2 bg-brown-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>

            {/* Fun loading messages */}
            <div className="mt-8 text-sm text-gray-400">
              <p className="animate-pulse">
                Analyzing your questionable investment choices...
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}