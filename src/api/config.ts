// ======================================================
// API CONFIG
// ======================================================
//
// SATU sumber kebenaran untuk alamat backend.
//
// DEFAULT-NYA RELATIF: "/api"
//
// Itu keputusan penting, bukan kebetulan:
//
//   - Dev: Vite dev server mem-proxy /api ke backend
//     (lihat vite.config.ts). Jadi membuka app dari HP
//     lewat IP LAN langsung jalan tanpa konfigurasi.
//
//     Sebelumnya nilainya "http://localhost:5000/api", dan
//     "localhost" di HP berarti HP ITU SENDIRI -- itulah
//     penyebab "failed to fetch" saat diakses dari device
//     lain.
//
//   - Produksi (Vercel): vercel.json me-rewrite /api/* ke
//     serverless function, jadi frontend dan API berada di
//     SATU origin.
//
//   - Same-origin berarti tidak ada masalah CORS, dan
//     cookie refresh token tidak bergantung pada setelan
//     SameSite lintas domain.
//
// Isi VITE_API_URL HANYA kalau backend benar-benar berada
// di host lain, misalnya:
//
//   VITE_API_URL=https://api.hearme.example.com/api
//
// ======================================================

const RAW_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Buang trailing slash supaya `${API_BASE_URL}/auth`
// tidak pernah menghasilkan "//auth".
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");


/*
 * Origin untuk Socket.IO.
 *
 * Kalau API_BASE_URL relatif, socket memakai origin halaman
 * saat ini. Kalau absolut, host-nya diambil dari situ.
 */
export function socketOrigin(): string {
  if (!API_BASE_URL.startsWith("http")) {
    return typeof window !== "undefined"
      ? window.location.origin
      : "";
  }

  return API_BASE_URL.replace(/\/api\/?$/, "");
}
