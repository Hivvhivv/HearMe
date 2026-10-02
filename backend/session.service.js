import crypto from "node:crypto";
import { ObjectId } from "mongodb";

import { getDb } from "./db.js";


// ======================================================
// SESSION SERVICE
// ======================================================
//
// Satu dokumen session = satu DEVICE yang login.
//
// Konsekuensinya:
//
//   - Login di device B membuat session BARU, tidak
//     menimpa session device A.
//   - Logout di device A hanya me-revoke session A.
//   - Logout benar-benar mengakhiri session di server,
//     bukan hanya menghapus token di browser.
//
// Yang disimpan di database adalah HASH refresh token,
// bukan token mentah. Kalau database bocor, token di
// dalamnya tidak bisa dipakai.
//
// ======================================================

const REFRESH_TOKEN_BYTES = 48;

const REFRESH_TTL_DAYS = Number(
  process.env.REFRESH_TOKEN_TTL_DAYS || 30
);

// Tenggang waktu setelah rotasi: refresh token LAMA
// masih diterima sesaat. Ini mencegah beberapa tab yang
// refresh bersamaan saling membatalkan.
const ROTATION_GRACE_MS = Number(
  process.env.REFRESH_GRACE_SECONDS || 60
) * 1000;


function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}


function generateRefreshToken() {
  return crypto
    .randomBytes(REFRESH_TOKEN_BYTES)
    .toString("hex");
}


function refreshExpiry(from = new Date()) {
  return new Date(
    from.getTime() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
  );
}


// ======================================================
// CREATE SESSION
// ======================================================

export async function createSession({
  userId,
  userAgent,
  ip
}) {
  const db = await getDb();

  const now = new Date();
  const refreshToken = generateRefreshToken();

  const session = {
    userId: new ObjectId(userId),
    refreshTokenHash: hashToken(refreshToken),
    previousTokenHash: null,
    previousTokenExpiresAt: null,
    userAgent: userAgent || "unknown",
    ip: ip || "unknown",
    createdAt: now,
    lastUsedAt: now,
    expiresAt: refreshExpiry(now),
    revokedAt: null
  };

  const result = await db
    .collection("sessions")
    .insertOne(session);

  return {
    sessionId: result.insertedId.toString(),
    refreshToken,
    expiresAt: session.expiresAt
  };
}


// ======================================================
// GET ACTIVE SESSION
// ======================================================
//
// Dipakai auth middleware pada SETIAP request. Inilah
// yang membuat logout benar-benar berlaku: begitu
// revokedAt terisi, access token yang masih belum
// kedaluwarsa pun langsung ditolak.
//
// ======================================================

export async function getActiveSession(sessionId) {
  if (!sessionId || !ObjectId.isValid(sessionId)) {
    return null;
  }

  const db = await getDb();

  return db.collection("sessions").findOne({
    _id: new ObjectId(sessionId),
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });
}


// ======================================================
// ROTATE SESSION
// ======================================================
//
// Hasil yang mungkin:
//
//   rotated  -> request ini yang memenangkan rotasi.
//               Kirim cookie refresh token BARU.
//
//   grace    -> request ini memakai token lama yang
//               masih dalam tenggang waktu (tab lain
//               sudah merotasi lebih dulu).
//               Beri access token baru, TAPI JANGAN
//               mengubah cookie -- supaya cookie hasil
//               rotasi pemenang tidak tertimpa.
//
//   reused   -> token lama dipakai di luar tenggang
//               waktu. Indikasi token dicuri/dipakai
//               ulang: revoke session INI saja, bukan
//               seluruh session milik user.
//
//   invalid  -> tidak cocok dengan session mana pun.
//
// ======================================================

export async function rotateSession(
  refreshToken,
  { userAgent, ip } = {}
) {
  if (!refreshToken) {
    return { status: "invalid" };
  }

  const db = await getDb();

  const now = new Date();
  const hash = hashToken(refreshToken);


  // ----------------------------------------------------
  // Rotasi bersifat ATOMIC.
  //
  // Filter memakai refreshTokenHash saat ini, jadi dari
  // beberapa request bersamaan hanya SATU yang berhasil
  // memperbarui dokumen. Sisanya jatuh ke jalur grace.
  // ----------------------------------------------------

  const nextToken = generateRefreshToken();

  const rotated = await db
    .collection("sessions")
    .findOneAndUpdate(
      {
        refreshTokenHash: hash,
        revokedAt: null,
        expiresAt: { $gt: now }
      },
      {
        $set: {
          refreshTokenHash: hashToken(nextToken),
          previousTokenHash: hash,
          previousTokenExpiresAt: new Date(
            now.getTime() + ROTATION_GRACE_MS
          ),
          lastUsedAt: now,
          ...(userAgent ? { userAgent } : {}),
          ...(ip ? { ip } : {})
        }
      },
      {
        returnDocument: "after"
      }
    );

  if (rotated) {
    return {
      status: "rotated",
      session: rotated,
      refreshToken: nextToken
    };
  }


  // ----------------------------------------------------
  // Token lama, masih dalam tenggang waktu.
  // ----------------------------------------------------

  const withinGrace = await db
    .collection("sessions")
    .findOne({
      previousTokenHash: hash,
      revokedAt: null,
      expiresAt: { $gt: now },
      previousTokenExpiresAt: { $gt: now }
    });

  if (withinGrace) {
    await db.collection("sessions").updateOne(
      { _id: withinGrace._id },
      { $set: { lastUsedAt: now } }
    );

    return {
      status: "grace",
      session: withinGrace
    };
  }


  // ----------------------------------------------------
  // Token lama di luar tenggang waktu: reuse detection.
  //
  // Hanya session ini yang di-revoke. Device lain milik
  // user yang sama TIDAK terpengaruh.
  // ----------------------------------------------------

  const stale = await db
    .collection("sessions")
    .findOne({ previousTokenHash: hash });

  if (stale) {
    if (!stale.revokedAt) {
      await db.collection("sessions").updateOne(
        { _id: stale._id },
        { $set: { revokedAt: now } }
      );
    }

    return { status: "reused" };
  }

  return { status: "invalid" };
}


// ======================================================
// REVOKE ONE SESSION
// ======================================================

export async function revokeSession(sessionId) {
  if (!sessionId || !ObjectId.isValid(sessionId)) {
    return false;
  }

  const db = await getDb();

  const result = await db.collection("sessions").updateOne(
    {
      _id: new ObjectId(sessionId),
      revokedAt: null
    },
    {
      $set: { revokedAt: new Date() }
    }
  );

  return result.modifiedCount > 0;
}


// ======================================================
// REVOKE BY REFRESH TOKEN
// ======================================================
//
// Dipakai logout: cookie refresh token menentukan
// session MANA yang diakhiri, sehingga device lain
// tetap login.
//
// ======================================================

export async function revokeSessionByRefreshToken(
  refreshToken
) {
  if (!refreshToken) {
    return false;
  }

  const db = await getDb();

  const hash = hashToken(refreshToken);

  const result = await db.collection("sessions").updateOne(
    {
      $or: [
        { refreshTokenHash: hash },
        { previousTokenHash: hash }
      ],
      revokedAt: null
    },
    {
      $set: { revokedAt: new Date() }
    }
  );

  return result.modifiedCount > 0;
}


// ======================================================
// REVOKE ALL SESSIONS
// ======================================================

export async function revokeAllSessions(userId) {
  if (!userId || !ObjectId.isValid(userId)) {
    return 0;
  }

  const db = await getDb();

  const result = await db.collection("sessions").updateMany(
    {
      userId: new ObjectId(userId),
      revokedAt: null
    },
    {
      $set: { revokedAt: new Date() }
    }
  );

  return result.modifiedCount;
}


// ======================================================
// LIST ACTIVE SESSIONS
// ======================================================
//
// Daftar device yang sedang login. Tidak pernah
// mengembalikan hash token.
//
// ======================================================

export async function listSessions(userId) {
  if (!userId || !ObjectId.isValid(userId)) {
    return [];
  }

  const db = await getDb();

  const sessions = await db
    .collection("sessions")
    .find(
      {
        userId: new ObjectId(userId),
        revokedAt: null,
        expiresAt: { $gt: new Date() }
      },
      {
        projection: {
          refreshTokenHash: 0,
          previousTokenHash: 0,
          previousTokenExpiresAt: 0
        }
      }
    )
    .sort({ lastUsedAt: -1 })
    .toArray();

  return sessions.map((session) => ({
    id: session._id.toString(),
    userAgent: session.userAgent,
    ip: session.ip,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt
  }));
}
