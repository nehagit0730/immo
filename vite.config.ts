import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          'pages/about-us/index': path.resolve(__dirname, 'pages/about-us/index.html'),
          'pages/verification-disclaimer/index': path.resolve(__dirname, 'pages/verification-disclaimer/index.html'),
          'pages/privacy-policy/index': path.resolve(__dirname, 'pages/privacy-policy/index.html'),
          'pages/terms-and-conditions/index': path.resolve(__dirname, 'pages/terms-and-conditions/index.html'),
          'pages/service-agreement/index': path.resolve(__dirname, 'pages/service-agreement/index.html'),
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
