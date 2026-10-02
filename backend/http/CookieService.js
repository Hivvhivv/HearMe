/*
 * ======================================================
 * COOKIE SERVICE
 * ======================================================
 *
 * Ditulis sendiri supaya tidak menambah dependensi baru
 * (cookie-parser belum terpasang di project ini).
 * res.cookie / res.clearCookie sendiri sudah bawaan
 * Express -- cookie-parser hanya dibutuhkan untuk MEMBACA.
 *
 * PENTING -- kenapa opsi cookie harus konsisten:
 *
 * Cookie httpOnly TIDAK BISA dihapus dari JavaScript.
 * Backend-lah yang harus menghapusnya, dan hanya berhasil
 * kalau opsinya SAMA PERSIS dengan saat dibuat (path,
 * domain, sameSite, secure). Karena itu set dan clear di
 * sini memakai satu sumber opsi yang sama.
 *
 * ======================================================
 */

export class CookieService {
  constructor() {
    this.name = "hearme_refresh";

    // Path dibatasi ke endpoint auth saja, jadi cookie
    // tidak ikut terkirim pada setiap request API lain.
    this.path = "/api/auth";
  }


  // ====================================================
  // READ
  // ====================================================

  parse(req) {
    const header = req.headers?.cookie;

    if (!header) {
      return {};
    }

    const out = {};

    for (const part of header.split(";")) {
      const index = part.indexOf("=");

      if (index < 1) {
        continue;
      }

      const name = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();

      if (!name) {
        continue;
      }

      try {
        out[name] = decodeURIComponent(value);
      } catch {
        out[name] = value;
      }
    }

    return out;
  }


  getRefreshToken(req) {
    const cookies = this.parse(req);

    // Cookie adalah sumber utama. Body hanya cadangan
    // untuk klien non-browser (misalnya tes dengan curl).
    return (
      cookies[this.name] ||
      req.body?.refreshToken ||
      null
    );
  }


  // ====================================================
  // OPTIONS
  // ====================================================
  //
  // sameSite "lax" sudah cukup karena frontend dan backend
  // berada pada HOST yang sama (beda port tidak membuat
  // cookie dianggap cross-site). Ini juga yang membuat
  // akses dari HP lewat IP LAN tetap jalan:
  //
  //   http://192.168.1.5:8443  ->  http://192.168.1.5:5000
  //
  // Kalau nanti frontend dan backend dipisah ke DOMAIN
  // berbeda, set di .env:
  //
  //   COOKIE_SAMESITE=none
  //   COOKIE_SECURE=true
  //
  // sameSite=none WAJIB disertai secure=true, dan secure
  // hanya berlaku di HTTPS. Itu sebabnya dev lewat IP LAN
  // memakai lax, bukan none.
  //
  // ====================================================

  options() {
    const sameSite = (
      process.env.COOKIE_SAMESITE || "lax"
    ).toLowerCase();

    const secure =
      process.env.COOKIE_SECURE === "true" ||
      sameSite === "none" ||
      process.env.NODE_ENV === "production";

    return {
      httpOnly: true,
      sameSite,
      secure,
      path: this.path,
      ...(process.env.COOKIE_DOMAIN
        ? { domain: process.env.COOKIE_DOMAIN }
        : {})
    };
  }


  // ====================================================
  // WRITE
  // ====================================================

  set(res, token, expiresAt) {
    res.cookie(this.name, token, {
      ...this.options(),
      expires: expiresAt
    });
  }

  clear(res) {
    // Opsi harus sama dengan saat dibuat, kalau tidak
    // browser akan menyimpan cookie lamanya.
    res.clearCookie(this.name, this.options());
  }
}

export const cookieService = new CookieService();
