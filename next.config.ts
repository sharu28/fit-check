import type { NextConfig } from 'next';

const r2Hostname = process.env.R2_PUBLIC_DOMAIN
  ? new URL(process.env.R2_PUBLIC_DOMAIN).hostname
  : 'pub-c9e9f1f3e5414eaf8122d6cde9aa0fc6.r2.dev';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: r2Hostname,
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
