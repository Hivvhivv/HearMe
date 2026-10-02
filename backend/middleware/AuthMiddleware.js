/*
 * ======================================================
 * AUTH MIDDLEWARE
 * ======================================================
 *
 * Rantai pemeriksaan pada SETIAP request terproteksi:
 *
 *   1. JWT valid (tanda tangan + belum kedaluwarsa)
 *   2. token menyertakan sid (session id)
 *   3. session ada, belum di-revoke, belum kedaluwarsa
 *   4. session itu benar milik user di token
 *   5. user masih ada dan masih aktif
 *
 * Langkah 3 adalah inti dari "logout harus benar-benar
 * logout": sebelumnya middleware HANYA memverifikasi
 * tanda tangan JWT tanpa menyentuh database, sehingga
 * token tetap sah sampai exp walaupun user sudah logout.
 *
 * req.user berisi { sub, sid, role, verificationStatus,
 * email, name } -- nilainya diambil dari DATABASE, bukan
 * dari isi token, agar perubahan role / status verifikasi
 * langsung berlaku tanpa menunggu token baru.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { tokenService } from "../services/TokenService.js";
import { sessionService } from "../services/SessionService.js";
import { userService } from "../services/UserService.js";

export class AuthMiddleware {
  constructor({
    tokens = tokenService,
    sessions = sessionService,
    users = userService
  } = {}) {
    this.tokens = tokens;
    this.sessions = sessions;
    this.users = users;

    // Diikat supaya bisa dipakai langsung sebagai
    // middleware Express tanpa kehilangan `this`.
    this.authenticate = this.authenticate.bind(this);
    this.requireVerifiedPsychologist =
      this.requireVerifiedPsychologist.bind(this);
  }

  static deny(res, status, message, code) {
    return res.status(status).json({ message, ...(code ? { code } : {}) });
  }


  // ====================================================
  // AUTHENTICATE
  // ====================================================

  async authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return AuthMiddleware.deny(
        res,
        401,
        "Authentication required"
      );
    }

    let payload;

    try {
      payload = this.tokens.verifyAccessToken(
        header.substring(7)
      );
    } catch {
      return AuthMiddleware.deny(
        res,
        401,
        "Invalid or expired token"
      );
    }


    /*
     * Token lama (terbit sebelum fitur session per device)
     * tidak punya sid. Token seperti itu DITOLAK supaya
     * tidak ada session yang tidak bisa di-revoke.
     * Frontend menanganinya sebagai 401 biasa dan meminta
     * user login ulang sekali.
     */
    if (!payload?.sid) {
      return AuthMiddleware.deny(
        res,
        401,
        "Session expired, please sign in again",
        "SESSION_REQUIRED"
      );
    }

    try {
      const session = await this.sessions.getActive(
        payload.sid
      );

      if (!session) {
        return AuthMiddleware.deny(
          res,
          401,
          "Session has been ended",
          "SESSION_REVOKED"
        );
      }

      if (!ObjectId.isValid(payload.sub)) {
        return AuthMiddleware.deny(
          res,
          401,
          "Invalid token subject"
        );
      }

      // Session harus benar-benar milik user di token.
      if (session.userId?.toString() !== String(payload.sub)) {
        return AuthMiddleware.deny(
          res,
          401,
          "Session does not match user"
        );
      }

      const user = await this.users.findById(payload.sub);

      if (!user || user.isActive === false) {
        return AuthMiddleware.deny(
          res,
          401,
          "Account is not active",
          "ACCOUNT_INACTIVE"
        );
      }

      req.user = {
        sub: user._id.toString(),
        sid: payload.sid,
        role: user.role,
        verificationStatus: user.verificationStatus,
        email: user.email,
        name: user.name
      };

      req.session = session;

      return next();

    } catch (error) {
      console.error("Authentication error:", error);

      /*
       * Database bermasalah BUKAN berarti token salah.
       * 503 supaya frontend tidak menghapus session user
       * hanya karena backend sedang gangguan.
       */
      return AuthMiddleware.deny(
        res,
        503,
        "Authentication service unavailable"
      );
    }
  }


  // ====================================================
  // AUTHORIZE BY ROLE
  // ====================================================

  authorize(...allowedRoles) {
    return (req, res, next) => {
      if (
        !req.user ||
        !allowedRoles.includes(req.user.role)
      ) {
        return AuthMiddleware.deny(res, 403, "Forbidden");
      }

      next();
    };
  }


  // ====================================================
  // PSIKOLOG TERVERIFIKASI
  // ====================================================

  requireVerifiedPsychologist(req, res, next) {
    if (!req.user) {
      return AuthMiddleware.deny(
        res,
        401,
        "Authentication required"
      );
    }

    if (req.user.role !== "psychologist") {
      return AuthMiddleware.deny(
        res,
        403,
        "Psychologist access only"
      );
    }

    if (req.user.verificationStatus !== "approved") {
      return AuthMiddleware.deny(
        res,
        403,
        "Psychologist account is not verified"
      );
    }

    next();
  }
}

export const auth = new AuthMiddleware();

// Alias agar pemakaian di route tetap ringkas.
export const authenticate = auth.authenticate;
export const authorize = (...roles) => auth.authorize(...roles);
export const requireVerifiedPsychologist =
  auth.requireVerifiedPsychologist;
