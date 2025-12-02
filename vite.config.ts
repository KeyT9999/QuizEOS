import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            timeout: 5000,
            configure: (proxy, _options) => {
              let errorCount = 0;
              const maxErrors = 3;
              
              proxy.on('error', (err, req, res) => {
                errorCount++;
                if (errorCount <= maxErrors) {
                  console.warn(`[Vite Proxy] Backend server không chạy (${errorCount}/${maxErrors}). Vui lòng chạy: npm run dev:server`);
                }
                // Tránh spam lỗi - chỉ log một vài lần đầu
                if (errorCount > maxErrors) {
                  return; // Không log nữa
                }
              });
              
              proxy.on('proxyReq', () => {
                // Reset counter khi có request thành công
                errorCount = 0;
              });
            },
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
