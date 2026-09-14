import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    '@devforge/api-contracts',
    '@devforge/observability',
    '@devforge/database',
    '@devforge/domain',
  ],
};

export default nextConfig;
