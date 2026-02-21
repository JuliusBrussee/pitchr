import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.glsl': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
