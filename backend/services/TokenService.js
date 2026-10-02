/*
 * ======================================================
 * TOKEN SERVICE
 * ======================================================
 *
 * Access token menyertakan "sid" (session id), sehingga
 * auth middleware tahu token ini milik DEVICE mana -- dan
 * bisa menolaknya begitu session device itu di-revoke.
 *
 * Masa hidupnya PENDEK. Itu aman karena frontend
 * memperbarui token lewat /api/auth/refresh secara
 * otomatis. Kombinasi inilah yang membuat logout terasa
 * langsung tanpa memaksa user login ulang tiap 15 menit.
 *
 * ======================================================
 */

import jwt from "jsonwebtoken";

export class TokenService {
  constructor() {
    this.accessTokenTtl =
      process.env.ACCESS_TOKEN_TTL ||
      process.env.JWT_EXPIRES_IN ||
      "15m";
  }

  get secret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_SECRET is not defined in backend/.env"
      );
    }

    return secret;
  }

  signAccessToken({
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
      this.secret,
      { expiresIn: this.accessTokenTtl }
    );
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.secret);
  }
}

export const tokenService = new TokenService();
