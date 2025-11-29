import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import path from "node:path";
import node from '@astrojs/node';

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
        '@c': path.resolve('./src/components'),
        '@ui': path.resolve('./src/lib/components/ui'),
        '@layouts': path.resolve('./src/layouts'),
        '@utils': path.resolve('./src/utils'),
      },
    },
  },
  server: {
    port: 4321,
  },
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
});