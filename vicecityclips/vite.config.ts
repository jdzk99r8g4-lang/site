import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Port du petit serveur Node qui parle a la base SQLite. */
const PORT_API = 4317;

export default defineConfig({
  plugins: [react()],
  server: {
    // host: true expose l'interface sur le reseau local : c'est ce qui permet
    // d'ouvrir l'application depuis l'iPhone sur le meme Wi-Fi.
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': { target: `http://127.0.0.1:${PORT_API}`, changeOrigin: false },
      '/pieces-jointes': { target: `http://127.0.0.1:${PORT_API}`, changeOrigin: false },
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
