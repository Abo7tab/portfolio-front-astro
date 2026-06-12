import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://folio.iceiy.com',
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
});
