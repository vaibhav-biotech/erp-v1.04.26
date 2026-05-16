import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin app root to frontend/ — avoids picking ~/package-lock.json as monorepo root
const appRoot = path.dirname(fileURLToPath(import.meta.url));

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
  turbopack: {
    root: appRoot,
  },
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
