import jwt from "jsonwebtoken";


// ======================================================
// ACCESS TOKEN
// ======================================================
//
// Access token sekarang menyertakan "sid" (session id),
// sehingga auth middleware bisa tahu token ini milik
// DEVICE mana -- dan menolaknya kalau session device itu
// sudah di-revoke (logout).
//
// Masa hidupnya dibuat PENDEK. Itu aman karena frontend
// memperbarui token lewat /api/auth/refresh secara
// otomatis. Kombinasi ini yang membuat logout terasa
// langsung, tanpa memaksa user login ulang tiap 15 menit.
//
// ======================================================

const ACCESS_TOKEN_TTL =
  process.env.ACCESS_TOKEN_TTL ||
  process.env.JWT_EXPIRES_IN ||
  "15m";


function requireSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not defined in backend/.env"
    );
  }

  return secret;
}


export function signAccessToken({
  userId,
  role,
  verificationStatus,
  sessionId
}) {
  return jwt.sign(
    {
      sub: String(userId),
      role,
      verificationStatus,
      sid: String(sessionId)
    },
    requireSecret(),
    {
      expiresIn: ACCESS_TOKEN_TTL
    }
  );
}


export function verifyAccessToken(token) {
  return jwt.verify(token, requireSecret());
}


export { ACCESS_TOKEN_TTL };
