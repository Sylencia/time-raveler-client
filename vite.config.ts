import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      stores: '/src/stores',
      components: '/src/components',
      hooks: '/src/hooks',
      types: '/src/types',
      utils: '/src/utils',
      assets: '/src/assets',
    },
  },
});
