/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports if needed for static hosting
  // output: 'export',
  
  // Optimize for production
  poweredByHeader: false,
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Redirect trailing slashes
  trailingSlash: false,
  
  // Image optimization
  images: {
    domains: ['your-custom-domain.com'],
    unoptimized: false,
  },
};

module.exports = nextConfig;
