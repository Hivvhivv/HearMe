/*
 * ======================================================
 * SECURITY MIDDLEWARE
 * ======================================================
 *
 * Spec section 25.
 *
 * Dikumpulkan di satu kelas supaya setelan keamanan tidak
 * tersebar di server.js dan mudah ditinjau sekaligus.
 *
 * ======================================================
 */

import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/*
 * ipKeyGenerator menormalkan alamat IPv6 ke prefix /64.
 *
 * Tanpa itu, satu pengguna IPv6 bisa melewati pembatas hanya
 * dengan berganti alamat di dalam blok yang sama -- karena
 * tiap alamat dihitung sebagai "pengunjung" berbeda.
 */
function ipKey(req) {
  return ipKeyGenerator(req.ip || "");
}

export class Security {

  // ====================================================
  // HELMET
  // ====================================================
  //
  // API ini hanya membalas JSON, jadi CSP tidak relevan
  // dan dimatikan agar tidak mengganggu dev tooling.
  //
  // crossOriginResourcePolicy dilonggarkan karena frontend
  // berjalan di port berbeda.
  //
  // ====================================================

  static headers() {
    return helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    });
  }


  // ====================================================
  // RATE LIMIT
  // ====================================================
  //
  // PENTING soal pembatas berbasis IP:
  //
  // Beberapa device di jaringan yang sama (kantor, kampus,
  // WiFi rumah) terlihat memakai SATU IP publik. Limit yang
  // terlalu ketat membuat mereka saling kena 429 -- salah
  // satu penyebab "aplikasi tidak bisa diakses" yang sudah
  // kita selidiki di awal.
  //
  // Karena itu:
  //
  //   - limit umum dibuat longgar
  //   - untuk endpoint yang sudah login, kunci pembatas
  //     memakai USER ID, bukan IP, sehingga satu user yang
  //     agresif tidak menjatuhkan user lain di IP sama
  //   - hanya login/register yang ketat (anti brute force),
  //     dan itu per IP + email, bukan per IP saja
  //
  // ====================================================

  static jsonLimitHandler(req, res) {
    res.status(429).json({
      success: false,
      message:
        "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.",
      code: "RATE_LIMITED"
    });
  }

  static base(options) {
    return rateLimit({
      standardHeaders: true,
      legacyHeaders: false,
      handler: Security.jsonLimitHandler,
      ...options
    });
  }


  // Pembatas umum untuk seluruh /api.
  static general() {
    return Security.base({
      windowMs: 60 * 1000,
      limit: 300,

      // Kalau sudah login, hitung per user. Device lain di
      // IP yang sama tidak terpengaruh.
      keyGenerator: (req) => req.user?.sub || ipKey(req)
    });
  }


  // Login & register: ketat, untuk menahan brute force.
  // Kunci = IP + email, supaya menyerang satu akun tidak
  // memblokir seluruh jaringan.
  static auth() {
    return Security.base({
      windowMs: 15 * 60 * 1000,
      limit: 20,

      // Request yang BERHASIL tidak dihitung, jadi user yang
      // memang tahu passwordnya tidak pernah terkunci.
      skipSuccessfulRequests: true,

      keyGenerator: (req) => {
        const email = String(req.body?.email || "")
          .trim()
          .toLowerCase();

        return `${ipKey(req)}|${email}`;
      }
    });
  }


  // Endpoint yang menulis file (base64 besar) dibatasi
  // lebih ketat.
  static upload() {
    return Security.base({
      windowMs: 60 * 1000,
      limit: 30,
      keyGenerator: (req) => req.user?.sub || ipKey(req)
    });
  }


  // ====================================================
  // PERINGATAN KONFIGURASI
  // ====================================================
  //
  // Dicetak saat start supaya setelan berbahaya tidak lolos
  // ke production tanpa disadari.
  //
  // ====================================================

  static auditConfig() {
    const warnings = [];

    const secret = process.env.JWT_SECRET || "";

    if (!secret) {
      warnings.push("JWT_SECRET belum diisi.");
    } else if (
      secret.length < 32 ||
      secret.includes("ubah_ini") ||
      secret === "hearme_super_secret_ubah_ini"
    ) {
      warnings.push(
        "JWT_SECRET masih nilai default / terlalu pendek. " +
          "Buat yang acak: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
      );
    }

    if (!process.env.CORS_ORIGINS) {
      warnings.push(
        "CORS_ORIGINS kosong -> semua origin diizinkan. " +
          "Aman untuk dev, TIDAK untuk production."
      );
    }

    if (
      process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "true"
    ) {
      warnings.push(
        "NODE_ENV=production tapi COOKIE_SECURE bukan true."
      );
    }

    if (warnings.length > 0) {
      console.warn("\n[PERINGATAN KEAMANAN]");

      for (const w of warnings) {
        console.warn("  - " + w);
      }

      console.warn("");
    }

    return warnings;
  }
}
