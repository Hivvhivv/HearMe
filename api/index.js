// ======================================================
// ENTRY SERVERLESS (VERCEL)
// ======================================================
//
// Vercel memperlakukan berkas di dalam folder /api sebagai
// serverless function. Berkas ini dilayani pada rute /api,
// lalu rewrite di vercel.json mengirim SELURUH /api/* ke
// sini:
//
//   { "source": "/api/(.*)", "destination": "/api" }
//
// Express tetap menerima URL aslinya (/api/auth/login),
// bukan hasil rewrite-nya, dan route di backend memang
// dipasang pada prefix /api -- jadi pencocokan jalurnya
// sama persis dengan saat dijalankan lokal.
//
// Sebelumnya berkas ini bernama "[...path].js" supaya
// menangkap /api/* lewat konvensi nama. Diganti ke pola
// rewrite eksplisit karena routing catch-all berkurung siku
// tidak terdokumentasi untuk project non-framework, dan
// gejalanya kalau tidak didukung persis seperti yang
// terjadi: build sukses, tapi setiap /api/* menjadi 404.
//
// Di sini TIDAK ada listen(). server.js hanya meng-export
// app-nya; Vercel yang memanggil app sebagai handler.
// Socket.IO juga tidak dipasang di jalur ini -- serverless
// tidak bisa menahan koneksi WebSocket. Lihat DEPLOYMENT.md.
//
// ======================================================

import app from "../backend/server.js";

export default app;
