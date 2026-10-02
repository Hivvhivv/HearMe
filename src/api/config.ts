// ======================================================
// API CONFIG
// ======================================================
//
// SATU sumber kebenaran untuk alamat backend.
//
// Sebelumnya "http://localhost:5000" di-hardcode di 8
// tempat. Akibatnya device kedua (misal HP yang membuka
// app lewat IP LAN) mengirim request ke "localhost"
// milik HP itu sendiri -- bukan ke laptop -- sehingga
// semua request gagal dengan "Failed to fetch".
//
// Atur lewat .env di root project:
//
//   VITE_API_URL=http://192.168.1.5:5000/api
//
// ======================================================

const RAW_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// Buang trailing slash supaya `${API_BASE_URL}/auth`
// tidak pernah menghasilkan "//auth".
export const API_BASE_URL = RAW_BASE_URL.replace(
  /\/+$/,
  ""
);
