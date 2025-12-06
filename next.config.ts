import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',
  
  // Permitir imágenes de Habbo Hotel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.habbo.es',
        pathname: '/habbo-imaging/**',
      },
    ],
  },
};

export default nextConfig;
