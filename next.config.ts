import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure ESLint to run during development only, not in production build
  eslint: {
    // Don't run ESLint during production builds
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors in build (let them show in development)
  typescript: {
    // Don't fail the build if there are TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
