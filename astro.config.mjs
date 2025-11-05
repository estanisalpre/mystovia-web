import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import path from "node:path";

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@hooks': path.resolve('./src/hooks'),
        '@lib': path.resolve('./src/lib'),
        '@components': path.resolve('./src/lib/components'),
        '@ui': path.resolve('./src/lib/components/ui'),
      },
    },
  },
  server: {
    port: 4321,
  },
  output: 'static',
});