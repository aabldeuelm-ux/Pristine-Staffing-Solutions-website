import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        careers: resolve(import.meta.dirname, 'careers.html'),
        gallery: resolve(import.meta.dirname, 'gallery.html'),
      },
    },
  },
});
