import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 4321,
  },
  output: 'static',
});