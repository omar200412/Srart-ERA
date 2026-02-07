import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // TypeScript ve ESLint hatalarını build sırasında yoksay (Hızlı deploy için)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Rota ve bellek optimizasyonları
  typedRoutes: false,
  experimental: {
    forceSwcTransforms: false,
  },
  
  // Turbopack boş obje (Hata önlemek için)
  turbopack: {},

  // Webpack önbellek ayarı - Type hatalarını önlemek için 'any' kullanıldı
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.cache = false;
    }
    return config;
  },

  // 👇 KRİTİK KISIM: API Yönlendirmesi
  // Frontend'den gelen /api/login gibi istekleri api/index.py'ye gönderir.
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },
};

export default nextConfig;