import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    /*
     * 백엔드가 same-origin(localhost:8080) 만 CORS 로 허용한다.
     * http://localhost:5173 에서 직접 호출하면 preflight 가 403 "Invalid CORS request" 로 막히므로
     * 개발 중에는 프록시로 우회한다. .env 의 VITE_API_BASE_URL 은 비워 두어야 한다
     * (그래야 요청이 same-origin /api/... 로 나가 이 프록시를 탄다).
     *
     * 백엔드에서 5173 을 허용하도록 CORS 를 열면, .env 에 주소를 채우고 이 프록시를 지워도 된다.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'FinSight 매장 운영 분석',
        short_name: 'FinSight',
        description: '소상공인 매장 운영 데이터를 분석해 운영 안정성 지표를 제공합니다.',
        lang: 'ko',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // 로고에서 실측한 브랜드 노란색. 스플래시 화면과 이어지도록 background_color 도 같게 둔다.
        theme_color: '#FDBC03',
        background_color: '#FDBC03',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // 금융·매출 데이터를 서비스워커에 남기지 않는다. API 는 언제나 네트워크에서만 읽는다.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
