/*
 * ======================================================
 * SESSION SERVICE
 * ======================================================
 *
 * Satu dokumen session = satu DEVICE yang login.
 *
 * Konsekuensinya:
 *
 *   - Login di device B membuat session BARU, tidak
 *     menimpa session device A.
 *   - Logout di device A hanya me-revoke session A.
 *   - Logout benar-benar mengakhiri session di SERVER,
 *     bukan sekadar menghapus token di browser.
 *
 * Yang disimpan adalah HASH refresh token, bukan token
 * mentah: kalau database bocor, isinya tidak bisa dipakai.
 *
 * ======================================================
 */

import crypto from "node:crypto";
import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";

const REFRESH_TOKEN_BYTES = 48;

export class SessionService extends BaseService {
  constructor(db) {
    super(db);

    this.ttlDays = Number(
      process.env.REFRESH_TOKEN_TTL_DAYS || 30
    );

    // Tenggang waktu setelah rotasi: refresh token LAMA
    // masih diterima sesaat. Ini mencegah beberapa tab
    // yang refresh bersamaan saling membatalkan.
    this.graceMs =
      Number(process.env.REFRESH_GRACE_SECONDS || 60) * 1000;
  }

  async sessions() {
    return this.collection("sessions");
  }

  static hashToken(token) {
    return crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
  }

  static generateToken() {
    return crypto
      .randomBytes(REFRESH_TOKEN_BYTES)
      .toString("hex");
  }

  expiryFrom(from = new Date()) {
    return new Date(
      from.getTime() + this.ttlDays * 24 * 60 * 60 * 1000
    );
  }


  // ====================================================
  // CREATE
  // ====================================================

  async create({ userId, userAgent, ip }) {
    const sessions = await this.sessions();

    const now = BaseService.now();
    const refreshToken = SessionService.generateToken();

    const session = {
      userId: new ObjectId(userId),
      refreshTokenHash: SessionService.hashToken(refreshToken),
      previousTokenHash: null,
      previousTokenExpiresAt: null,
      userAgent: userAgent || "unknown",
      ip: ip || "unknown",
      createdAt: now,
      lastUsedAt: now,
      expiresAt: this.expiryFrom(now),
      revokedAt: null
    };

    const result = await sessions.insertOne(session);

    return {
      sessionId: result.insertedId.toString(),
      refreshToken,
      expiresAt: session.expiresAt
    };
  }


  // ====================================================
  // GET ACTIVE
  // ====================================================
  //
  // Dipakai auth middleware pada SETIAP request. Inilah
  // yang membuat logout langsung berlaku: begitu revokedAt
  // terisi, access token yang belum kedaluwarsa pun
  // ditolak.
  //
  // ====================================================

  async getActive(sessionId) {
    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return null;
    }

    const sessions = await this.sessions();

    return sessions.findOne({
      _id: new ObjectId(sessionId),
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    });
  }


  // ====================================================
  // ROTATE
  // ====================================================
  //
  // Hasil yang mungkin:
  //
  //   rotated -> request ini yang MEMENANGKAN rotasi.
  //              Kirim cookie refresh token baru.
  //
  //   grace   -> memakai token lama yang masih dalam
  //              tenggang waktu (tab lain sudah merotasi
  //              lebih dulu). Beri access token baru, TAPI
  //              JANGAN ubah cookie -- supaya cookie hasil
  //              rotasi pemenang tidak tertimpa.
  //
  //   reused  -> token lama dipakai di luar tenggang waktu.
  //              Indikasi token dicuri: revoke session INI
  //              saja, bukan seluruh session user.
  //
  //   invalid -> tidak cocok dengan session mana pun.
  //
  // ====================================================

  async rotate(refreshToken, { userAgent, ip } = {}) {
    if (!refreshToken) {
      return { status: "invalid" };
    }

    const sessions = await this.sessions();

    const now = BaseService.now();
    const hash = SessionService.hashToken(refreshToken);

    const nextToken = SessionService.generateToken();


    /*
     * Rotasi bersifat ATOMIC.
     *
     * Filter memakai refreshTokenHash saat ini, jadi dari
     * beberapa request bersamaan hanya SATU yang berhasil
     * memperbarui dokumen. Sisanya jatuh ke jalur grace.
     */
    const rotated = await sessions.findOneAndUpdate(
      {
        refreshTokenHash: hash,
        revokedAt: null,
        expiresAt: { $gt: now }
      },
      {
        $set: {
          refreshTokenHash: SessionService.hashToken(nextToken),
          previousTokenHash: hash,
          previousTokenExpiresAt: new Date(
            now.getTime() + this.graceMs
          ),
          lastUsedAt: now,
          ...(userAgent ? { userAgent } : {}),
          ...(ip ? { ip } : {})
        }
      },
      { returnDocument: "after" }
    );

    const rotatedDoc = BaseService.unwrap(rotated);

    if (rotatedDoc) {
      return {
        status: "rotated",
        session: rotatedDoc,
        refreshToken: nextToken
      };
    }


    // Token lama, masih dalam tenggang waktu.
    const withinGrace = await sessions.findOne({
      previousTokenHash: hash,
      revokedAt: null,
      expiresAt: { $gt: now },
      previousTokenExpiresAt: { $gt: now }
    });

    if (withinGrace) {
      await sessions.updateOne(
        { _id: withinGrace._id },
        { $set: { lastUsedAt: now } }
      );

      return { status: "grace", session: withinGrace };
    }


    /*
     * Token lama di luar tenggang waktu: reuse detection.
     *
     * HANYA session ini yang di-revoke. Device lain milik
     * user yang sama TIDAK terpengaruh.
     */
    const stale = await sessions.findOne({
      previousTokenHash: hash
    });

    if (stale) {
      if (!stale.revokedAt) {
        await sessions.updateOne(
          { _id: stale._id },
          { $set: { revokedAt: now } }
        );
      }

      return { status: "reused" };
    }

    return { status: "invalid" };
  }


  // ====================================================
  // REVOKE
  // ====================================================

  async revoke(sessionId) {
    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return false;
    }

    const sessions = await this.sessions();

    const result = await sessions.updateOne(
      { _id: new ObjectId(sessionId), revokedAt: null },
      { $set: { revokedAt: BaseService.now() } }
    );

    return result.modifiedCount > 0;
  }


  /*
   * Dipakai logout: cookie refresh token menentukan
   * session MANA yang diakhiri, sehingga device lain tetap
   * login.
   */
  async revokeByRefreshToken(refreshToken) {
    if (!refreshToken) {
      return false;
    }

    const sessions = await this.sessions();

    const hash = SessionService.hashToken(refreshToken);

    const result = await sessions.updateOne(
      {
        $or: [
          { refreshTokenHash: hash },
          { previousTokenHash: hash }
        ],
        revokedAt: null
      },
      { $set: { revokedAt: BaseService.now() } }
    );

    return result.modifiedCount > 0;
  }


  async revokeAll(userId) {
    if (!userId || !ObjectId.isValid(userId)) {
      return 0;
    }

    const sessions = await this.sessions();

    const result = await sessions.updateMany(
      { userId: new ObjectId(userId), revokedAt: null },
      { $set: { revokedAt: BaseService.now() } }
    );

    return result.modifiedCount;
  }


  // ====================================================
  // LIST
  // ====================================================
  //
  // Daftar device yang sedang login. Tidak pernah
  // mengembalikan hash token.
  //
  // ====================================================

  async list(userId) {
    if (!userId || !ObjectId.isValid(userId)) {
      return [];
    }

    const sessions = await this.sessions();

    const docs = await sessions
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

    return docs.map((session) => ({
      id: session._id.toString(),
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt
    }));
  }
}

export const sessionService = new SessionService();
