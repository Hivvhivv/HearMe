import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    strictPort: true,

    /*
     * PROXY KE BACKEND
     *
     * Frontend memakai URL RELATIF "/api", lalu dev server
     * meneruskannya ke backend di port 5000.
     *
     * Kenapa ini penting:
     *
     *   - Akses dari HP lewat IP LAN langsung jalan tanpa
     *     mengisi VITE_API_URL. Sebelumnya frontend
     *     memanggil "localhost:5000" yang di HP berarti HP
     *     itu sendiri -- penyebab "failed to fetch".
     *   - Frontend dan API jadi SAME-ORIGIN, sehingga
     *     cookie refresh token tidak lagi bergantung pada
     *     setelan SameSite lintas port.
     *   - Perilaku dev jadi sama dengan produksi (di
     *     Vercel /api juga satu origin lewat rewrites).
     *
     * Ganti target lewat BACKEND_URL kalau backend
     * dijalankan di tempat lain.
     */
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: false,
      },
      '/uploads': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: false,
      },
      '/socket.io': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: false,

        // Socket.IO butuh upgrade ke WebSocket.
        ws: true,
      },
    },
  },

  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
  },
})
