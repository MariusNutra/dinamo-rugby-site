/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '168.119.233.198',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
      // Security: route parinti auth/verify through secure versions
      {
        source: '/api/parinti/auth',
        destination: '/api/parinti-secure/auth',
      },
      {
        source: '/api/parinti/verify',
        destination: '/api/parinti-secure/verify',
      },
      {
        source: '/api/parinti/solicita-acces',
        destination: '/api/parinti-secure/solicita-acces',
      },
{
        source: '/api/admin/sportivi',
        destination: '/api/admin-sportivi',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
};

export default nextConfig;
