// ======================================================
// COOKIE HELPER
// ======================================================
//
// Ditulis sendiri supaya tidak menambah dependensi baru
// (cookie-parser belum terpasang di project ini).
//
// PENTING -- kenapa opsi cookie harus konsisten:
//
// Cookie httpOnly TIDAK BISA dihapus dari JavaScript.
// Backend-lah yang harus menghapusnya, dan hanya berhasil
// kalau opsinya SAMA PERSIS dengan saat dibuat
// (path, domain, sameSite, secure). Karena itu set dan
// clear di sini memakai satu sumber opsi yang sama.
//
// ======================================================

export const REFRESH_COOKIE_NAME = "hearme_refresh";


// Path dibatasi ke endpoint auth saja, jadi cookie tidak
// ikut terkirim pada setiap request API lain.
const COOKIE_PATH = "/api/auth";


// ======================================================
// PARSE COOKIE HEADER
// ======================================================

export function parseCookies(req) {
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


export function getRefreshTokenFromRequest(req) {
  const cookies = parseCookies(req);

  // Cookie adalah sumber utama. Body hanya dipakai
  // sebagai cadangan untuk klien non-browser (misalnya
  // tes dengan curl).
  return (
    cookies[REFRESH_COOKIE_NAME] ||
    req.body?.refreshToken ||
    null
  );
}


// ======================================================
// COOKIE OPTIONS
// ======================================================
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
// ======================================================

function cookieOptions() {
  const sameSite = (
    process.env.COOKIE_SAMESITE || "lax"
  ).toLowerCase();

  // secure=true di production, atau kalau dipaksa lewat
  // .env, atau kalau sameSite=none (syarat dari browser).
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    sameSite === "none" ||
    process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: COOKIE_PATH,
    ...(process.env.COOKIE_DOMAIN
      ? { domain: process.env.COOKIE_DOMAIN }
      : {})
  };
}


// ======================================================
// SET / CLEAR
// ======================================================

export function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...cookieOptions(),
    expires: expiresAt
  });
}


export function clearRefreshCookie(res) {
  // Opsi harus sama dengan saat dibuat, kalau tidak
  // browser akan menyimpan cookie lamanya.
  res.clearCookie(
    REFRESH_COOKIE_NAME,
    cookieOptions()
  );
}
