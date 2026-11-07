import path from 'node:path';
import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: { root: workspaceRoot },
  transpilePackages: [
    '@devforge/api-contracts',
    '@devforge/observability',
    '@devforge/database',
    '@devforge/domain',
  ],
};

export default nextConfig;
