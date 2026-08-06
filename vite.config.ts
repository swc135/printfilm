import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['.monkeycode-ai.online'],
        proxy: {
          '/api-proxy': {
            target: 'https://api.agnes-ai.cn',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-proxy/, ''),
          },
        },
      },
      preview: {
        port: 3005,
        host: '0.0.0.0',
        proxy: {
          '/api-proxy': {
            target: 'https://api.agnes-ai.cn',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-proxy/, ''),
          },
        },
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'gemini-service': ['./services/geminiService.ts'],
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.AGNES_API_KEY),
        'process.env.AGNES_API_KEY': JSON.stringify(env.AGNES_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
