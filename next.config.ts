import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  output: 'standalone',
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://21.0.16.85:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://21.0.16.85:3000',
  ],
  // Target modern browsers — no legacy polyfills
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['warn', 'error'] } : false,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    qualities: [75, 85],
  },
  // Modern browsers — no legacy polyfills (see browserslist in package.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Only set COOP/COEP in production (breaks dev preview panel cross-origin)
          ...(process.env.NODE_ENV === 'production' ? [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          ] : []),
        ],
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache flag images
      {
        source: '/flags/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

export default nextConfig;
