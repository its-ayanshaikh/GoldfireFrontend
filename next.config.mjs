/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Rewrite all admin routes to main page
      {
        source: '/admin/:path*',
        destination: '/',
      },
      // Rewrite all employee routes to main page  
      {
        source: '/employee/:path*',
        destination: '/',
      },
      // Rewrite all pos routes to main page
      {
        source: '/pos/:path*',
        destination: '/',
      },
      // Rewrite all inventory routes to main page
      {
        source: '/inventory/:path*',
        destination: '/',
      },
    ]
  },
}

export default nextConfig
