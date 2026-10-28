import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { viteApiPlugin } from './vite-api-plugin';

export default defineConfig({
  plugins: [vue(), viteApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
});
