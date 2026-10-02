import { ObjectId } from "mongodb";

import { getDb } from "./db.js";
import { verifyAccessToken } from "./token.service.js";
import { getActiveSession } from "./session.service.js";


// ======================================================
// AUTHENTICATE
// ======================================================
//
// Rantai pemeriksaan:
//
//   1. JWT valid (tanda tangan + belum kedaluwarsa)
//   2. Token menyertakan sid (session id)
//   3. Session ada, belum di-revoke, belum kedaluwarsa
//   4. User masih ada dan masih aktif
//
// Langkah 3 adalah inti dari "logout harus benar-benar
// logout". Sebelumnya middleware ini HANYA memverifikasi
// tanda tangan JWT, tanpa menyentuh database -- sehingga
// token tetap sah sampai exp walaupun user sudah logout.
//
// req.user tetap berisi { sub, role, verificationStatus }
// seperti sebelumnya, supaya route lain tidak berubah.
// Nilainya kini diambil dari DATABASE, bukan dari isi
// token, agar perubahan role / status verifikasi langsung
// berlaku tanpa menunggu token baru.
//
// ======================================================

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  const token = header.substring(7);

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }


  // ----------------------------------------------------
  // Token lama (terbit sebelum fitur session per device)
  // tidak punya sid. Token seperti itu ditolak supaya
  // tidak ada session yang tidak bisa di-revoke.
  // Frontend akan menanganinya sebagai 401 biasa dan
  // meminta user login ulang sekali.
  // ----------------------------------------------------

  if (!payload?.sid) {
    return res.status(401).json({
      message: "Session expired, please sign in again",
      code: "SESSION_REQUIRED"
    });
  }

  try {
    const session = await getActiveSession(payload.sid);

    if (!session) {
      return res.status(401).json({
        message: "Session has been ended",
        code: "SESSION_REVOKED"
      });
    }

    if (!ObjectId.isValid(payload.sub)) {
      return res.status(401).json({
        message: "Invalid token subject"
      });
    }

    // Session harus benar-benar milik user di token.
    if (session.userId?.toString() !== String(payload.sub)) {
      return res.status(401).json({
        message: "Session does not match user"
      });
    }

    const db = await getDb();

    const user = await db.collection("users").findOne(
      {
        _id: new ObjectId(payload.sub)
      },
      {
        projection: {
          passwordHash: 0
        }
      }
    );

    if (!user || user.isActive === false) {
      return res.status(401).json({
        message: "Account is not active",
        code: "ACCOUNT_INACTIVE"
      });
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

    // Database bermasalah bukan berarti token salah.
    // 503 supaya frontend TIDAK menghapus session user
    // hanya karena backend sedang gangguan.
    return res.status(503).json({
      message: "Authentication service unavailable"
    });
  }
}


// ======================================================
// AUTHORIZE BY ROLE
// ======================================================

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}


// ======================================================
// REQUIRE VERIFIED PSYCHOLOGIST
// ======================================================

export function requireVerifiedPsychologist(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  if (req.user.role !== "psychologist") {
    return res.status(403).json({
      message: "Psychologist access only"
    });
  }

  if (req.user.verificationStatus !== "approved") {
    return res.status(403).json({
      message: "Psychologist account is not verified"
    });
  }

  next();
}
