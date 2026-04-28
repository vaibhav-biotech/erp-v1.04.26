import type { NextConfig } from "next";

const getApiRewriteBase = () => {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

  try {
    const parsedUrl = new URL(rawUrl);
    return parsedUrl.origin;
  } catch {
    return rawUrl.replace(/\/api(?:\/.*)?$/, '').replace(/\/+$/, '');
  }
};

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async rewrites() {
    const apiBase = getApiRewriteBase();

    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${apiBase}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
