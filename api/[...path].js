// ======================================================
// ENTRY SERVERLESS (VERCEL)
// ======================================================
//
// Vercel memperlakukan berkas di dalam folder /api sebagai
// serverless function secara otomatis. Nama "[...path].js"
// adalah catch-all: SEMUA permintaan ke /api/* masuk ke
// berkas ini, termasuk /api/auth/login dan
// /api/forums/123/replies.
//
// Karena itu tidak perlu rewrite khusus untuk /api di
// vercel.json, dan tidak perlu mendaftarkan "runtime" --
// pendaftaran itu justru yang membuat build gagal dengan
// "Function Runtimes must have a valid version".
//
// Express menerima URL asli (/api/auth/login), dan route di
// backend memang dipasang pada prefix /api, jadi pencocokan
// jalurnya sama persis dengan saat dijalankan lokal.
//
// Di sini TIDAK ada listen(). server.js hanya meng-export
// app-nya; Vercel yang memanggil app sebagai handler.
// Socket.IO juga tidak dipasang di jalur ini -- serverless
// tidak bisa menahan koneksi WebSocket. Lihat DEPLOYMENT.md.
//
// ======================================================

import app from "../backend/server.js";

export default app;
