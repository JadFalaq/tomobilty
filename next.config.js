/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // output: 'standalone', // Temporairement désactivé pour éviter les erreurs de prerendering
}

module.exports = nextConfig
