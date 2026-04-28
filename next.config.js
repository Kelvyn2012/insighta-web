/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    INSIGHTA_API_URL: process.env.INSIGHTA_API_URL || "https://insighta-backend.onrender.com",
  },
};

module.exports = nextConfig;
