/*
 * ======================================================
 * HEARME SERVER
 * ======================================================
 *
 * Struktur backend:
 *
 *   routes/      -> URL -> controller (tipis, tanpa logika)
 *   controllers/ -> HTTP: baca request, bentuk response
 *   services/    -> logika bisnis + MongoDB
 *   core/        -> Database, Validator, AppError, base class
 *   middleware/  -> autentikasi & otorisasi
 *   http/        -> cookie
 *
 * Aturan yang dijaga:
 *
 *   - controller TIDAK pernah query MongoDB
 *   - service TIDAK pernah menyentuh req/res
 *   - route TIDAK berisi logika
 *
 * ======================================================
 */

import path from "node:path";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { database } from "./core/Database.js";
import { registerRoutes } from "./routes/index.js";
import { Security } from "./middleware/Security.js";
import { chatGateway } from "./realtime/ChatGateway.js";

dotenv.config();


// Origin frontend yang diizinkan (dipakai CORS dan Socket.IO).
function allowedOrigins() {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}


/*
 * Nilai `origin` untuk cors() dan Socket.IO.
 *
 * Aturannya sengaja berbeda antara dev dan production:
 *
 *   - ada daftar          -> pakai daftar itu
 *   - kosong + dev        -> true (pantulkan origin apa pun)
 *                            supaya akses dari IP LAN/HP
 *                            tidak perlu konfigurasi
 *   - kosong + production -> false, BUKAN true
 *
 * Kasus terakhir itu yang penting. Membiarkan default
 * permisif di production sama dengan CORS terbuka, dan itu
 * dilarang. Dan memang tidak dibutuhkan: frontend memanggil
 * "/api" relatif, jadi request-nya same-origin — browser
 * tidak meminta header CORS sama sekali. `false` hanya
 * menutup pemanggilan dari origin LAIN.
 */
function corsOrigin() {
  const origins = allowedOrigins();

  if (origins.length > 0) {
    return origins;
  }

  return process.env.NODE_ENV !== "production";
}


export class Server {
  constructor({ db = database } = {}) {
    this.database = db;
    this.app = express();
    this.bootstrapped = null;

    this.configure();
    this.registerHealthCheck();

    registerRoutes(this.app);

    this.registerNotFound();
    this.registerErrorHandler();
  }


  // ====================================================
  // MIDDLEWARE DASAR
  // ====================================================

  configure() {
    // Security header (Helmet) dipasang PALING AWAL supaya
    // berlaku untuk semua response, termasuk error.
    this.app.use(Security.headers());

    /*
     * CORS
     *
     * CORS_ORIGINS di .env, dipisah koma. Contoh:
     *
     *   CORS_ORIGINS=http://localhost:8443,http://192.168.1.5:8443
     *
     * Kalau tidak diisi: di dev semua origin dipantulkan,
     * di production justru DITUTUP. Lihat corsOrigin().
     */
    this.app.use(
      cors({
        origin: corsOrigin(),

        // Wajib true: cookie refresh token httpOnly hanya
        // terkirim kalau kredensial diizinkan.
        credentials: true
      })
    );

    this.app.use(express.json({ limit: "10mb" }));

    /*
     * Rate limit umum untuk seluruh /api.
     *
     * Dibuat longgar dan — untuk request yang sudah login —
     * dihitung PER USER, bukan per IP. Beberapa device di
     * satu jaringan (kantor, kampus, WiFi rumah) terlihat
     * memakai satu IP publik; limit per IP yang ketat
     * membuat mereka saling kena 429.
     */
    this.app.use("/api", Security.general());

    /*
     * Berkas upload disajikan sebagai static file.
     *
     * MongoDB hanya menyimpan URL-nya (spec section 23),
     * bukan isi filenya.
     *
     * Disajikan read-only, dan UploadService memastikan
     * hanya tipe yang diizinkan yang pernah tertulis di sini.
     */
    const uploadDir =
      process.env.UPLOAD_DIR ||
      path.join(process.cwd(), "uploads");

    this.app.use(
      "/uploads",
      express.static(uploadDir, {
        index: false,
        dotfiles: "deny",
        setHeaders: (res) => {
          // Jangan biarkan browser menebak tipe file.
          res.set("X-Content-Type-Options", "nosniff");
        }
      })
    );
  }


  // ====================================================
  // HEALTH CHECK
  // ====================================================
  //
  // Membalas 503 (bukan 500) ketika database tidak bisa
  // dihubungi, supaya jelas bedanya antara "backend mati"
  // (fetch gagal total) dan "backend hidup, database
  // bermasalah" (dapat JSON 503).
  //
  // ====================================================

  registerHealthCheck() {
    this.app.get("/api/health", async (_req, res) => {
      const result = await this.database.ping();

      if (!result.ok) {
        /*
         * Detailnya HANYA ke log server, tidak pernah ke
         * klien.
         *
         * Pesan mentah dari driver MongoDB bisa memuat
         * potongan connection string. Contoh nyata: URI
         * dengan "@" yang tidak di-percent-encode membuat
         * driver salah memotong, lalu errornya berbunyi
         *
         *   querySrv ENOTFOUND _mongodb._tcp.Nadi
         *
         * -- "Nadi" di situ adalah bagian dari PASSWORD.
         * Endpoint ini publik, jadi meneruskan pesan itu
         * sama dengan membocorkan kredensial.
         */
        console.error("Health check failed:", result.message);

        return res.status(503).json({
          ok: false,
          database: "hearme",
          code: "DATABASE_UNAVAILABLE",
          message:
            "Database tidak dapat dihubungi. " +
            "Penyebabnya ada di log server."
        });
      }

      return res.json({ ok: true, database: "hearme" });
    });
  }


  registerNotFound() {
    this.app.use("/api", (req, res) => {
      res.status(404).json({
        success: false,
        message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`,
        code: "ENDPOINT_NOT_FOUND"
      });
    });
  }


  /*
   * Jaring terakhir. Error yang lolos dari controller tetap
   * dibalas sebagai JSON, dan stack trace HANYA masuk log
   * server -- tidak pernah dikirim ke frontend
   * (spec section 24).
   */
  registerErrorHandler() {
    this.app.use((error, _req, res, _next) => {
      console.error("Unhandled error:", error);

      if (res.headersSent) {
        return;
      }

      res.status(error?.status || 500).json({
        success: false,
        message:
          error?.isOperational && error?.message
            ? error.message
            : "Terjadi kesalahan pada server",
        code: error?.code || "INTERNAL_ERROR"
      });
    });
  }


  // ====================================================
  // START
  // ====================================================

  async start(port = process.env.PORT || 5000) {
    /*
     * Server HARUS tetap listen walaupun setup index gagal
     * (misalnya Atlas lambat, IP belum masuk allowlist, atau
     * internet mati sebentar).
     *
     * Sebelumnya proses di-exit, sehingga gangguan sesaat
     * pada database membuat backend mati total dan frontend
     * hanya melihat "Failed to fetch".
     */
    return new Promise((resolve) => {
      const server = this.app.listen(port, "0.0.0.0", () => {
        console.log(`HearMe backend running on port ${port}`);

        /*
         * Socket.IO dipasang pada HTTP server yang sama,
         * jadi tidak perlu port tambahan.
         *
         * Autentikasinya memakai rantai yang sama dengan
         * HTTP (JWT -> sid -> session belum di-revoke),
         * sehingga logout juga memutus koneksi realtime.
         */
        chatGateway.attach(server, { origin: corsOrigin() });

        this.bootstrap();

        resolve(server);
      });
    });
  }


  // ====================================================
  // BOOTSTRAP
  // ====================================================
  //
  // Audit konfigurasi + pembuatan index.
  //
  // Dipisah dari start() karena start() TIDAK dipanggil di
  // production (Vercel memakai export default app). Dulu
  // kedua hal ini ada di dalam start(), jadi di Vercel index
  // MongoDB tidak pernah dibuat sama sekali -- database baru
  // akan jalan tanpa unique index, dan proteksi seperti
  // "satu mood per user per hari" ikut hilang.
  //
  // Tidak di-await: request pertama tidak perlu menunggu,
  // dan ensureIndex() idempoten. Diberi penjaga supaya pada
  // serverless hanya jalan sekali per instance.
  //
  // ====================================================

  bootstrap() {
    if (this.bootstrapped) {
      return this.bootstrapped;
    }

    // Peringatkan setelan berbahaya (JWT_SECRET default,
    // cookie tidak secure) supaya tidak lolos ke production.
    Security.auditConfig();

    this.bootstrapped = this.database
      .setupIndexes()
      .catch((error) => {
        console.error(
          "MongoDB index setup failed (server tetap jalan):",
          error?.message || error
        );
      });

    return this.bootstrapped;
  }
}


// ======================================================
// EXPORT
// ======================================================

const server = new Server();

// Vercel memakai export default ini.
export default server.app;

export { server };


// ======================================================
// LOCAL
// ======================================================
//
// Hanya dijalankan saat backend dijalankan secara lokal.
// Di Vercel, platform memakai export default di atas.
//
// ======================================================

if (process.env.NODE_ENV !== "production") {
  server.start();
} else {
  // Serverless: tidak ada listen(), tapi index dan audit
  // konfigurasi tetap harus jalan sekali per cold start.
  server.bootstrap();
}
