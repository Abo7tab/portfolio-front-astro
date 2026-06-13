import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://mohamed-emad-astro.vercel.app',
  output: 'static',

  build: {
    assets: 'assets',
    inlineStylesheets: 'auto',
  },

  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'https://folio.alwaysdata.net',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      cssMinify: true,
    },
  },

  integrations: [sitemap(), react()],
});