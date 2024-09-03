/** @type {import('next').NextConfig} */
const nextConfig = {
  env:{
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    NEETS_API_KEY: process.env.NEETS_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
