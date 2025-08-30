/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Increase API route timeout and optimize for long-running requests
  serverExternalPackages: ['anthropic'],
  
  // API route configuration for longer timeouts
  experimental: {
    serverActionsTimeout: 180, // 3 minutes for server actions
    serverComponentsExternalPackages: ['anthropic'],
  },
  
  // Optimize for development server performance
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce memory pressure in development
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
      }
    }
    return config
  },
}

module.exports = nextConfig