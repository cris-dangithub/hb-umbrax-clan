import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone solo para Docker, no para Vercel
  // Vercel detecta automáticamente y usa su propio sistema
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),
  
  // Permitir imágenes de Habbo Hotel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.habbo.es',
        pathname: '/habbo-imaging/**',
      },
      {
        protocol: 'https',
        hostname: 'www.habbo.com',
        pathname: '/habbo-imaging/**',
      },
    ],
  },
};

export default nextConfig;
