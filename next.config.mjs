/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for development
  images: {
    unoptimized: true,
  },
  
  // Development optimizations
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Webpack configuration to suppress warnings
  webpack: (config, { dev, isServer }) => {
    // Suppress warnings that don't affect functionality
    config.ignoreWarnings = [
      /Critical dependency/,
      /require function is used in a way/,
    ]
    
    return config
  },
};

export default nextConfig;