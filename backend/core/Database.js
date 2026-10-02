/*
 * ======================================================
 * DATABASE
 * ======================================================
 *
 * Satu objek yang memegang koneksi MongoDB untuk seluruh
 * aplikasi (singleton diekspor di bawah).
 *
 * Yang dijaga kelas ini:
 *
 *   - timeout eksplisit: kalau Atlas tak bisa dihubungi,
 *     request GAGAL CEPAT dengan pesan jelas, bukan
 *     menggantung ~30 detik
 *   - single-flight connect: banyak request bersamaan saat
 *     server baru hidup berbagi SATU proses connect
 *   - retry: kalau connect gagal, promise direset supaya
 *     request berikutnya mencoba lagi
 *
 * ======================================================
 */

import { MongoClient } from "mongodb";

export class Database {
  constructor(uri, dbName = "hearme") {
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not defined in backend/.env"
      );
    }

    this.dbName = dbName;

    this.client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    this.db = null;
    this.connectPromise = null;
  }


  // ====================================================
  // CONNECT
  // ====================================================

  async getDb() {
    if (this.db) {
      return this.db;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.client
        .connect()
        .then((connected) => {
          this.db = connected.db(this.dbName);

          console.log(`MongoDB connected: ${this.dbName}`);

          return this.db;
        })
        .catch((error) => {
          // Reset supaya request berikutnya bisa retry.
          this.connectPromise = null;

          throw error;
        });
    }

    return this.connectPromise;
  }


  async collection(name) {
    const db = await this.getDb();

    return db.collection(name);
  }


  // ====================================================
  // PING
  // ====================================================
  //
  // Tidak pernah throw, supaya endpoint health selalu
  // membalas sesuatu.
  //
  // ====================================================

  async ping() {
    try {
      const db = await this.getDb();

      await db.command({ ping: 1 });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message:
          error?.message || "Database connection failed"
      };
    }
  }


  async close() {
    await this.client.close();

    this.db = null;
    this.connectPromise = null;
  }


  // ====================================================
  // ENSURE INDEX
  // ====================================================
  //
  // createIndex GAGAL kalau index dengan key sama sudah
  // ada tapi opsinya berbeda (misal perlu diubah menjadi
  // sparse). MongoDB memakai dua kode untuk itu:
  //
  //   85 IndexOptionsConflict
  //   86 IndexKeySpecsConflict
  //
  // Di kasus itu index lama di-drop lalu dibuat ulang.
  //
  // ====================================================

  async ensureIndex(collectionName, keys, options = {}) {
    const col = await this.collection(collectionName);

    try {
      await col.createIndex(keys, options);
    } catch (error) {
      if (error?.code !== 85 && error?.code !== 86) {
        throw error;
      }

      const existing = await col.indexes();

      const match = existing.find(
        (i) => JSON.stringify(i.key) === JSON.stringify(keys)
      );

      if (match) {
        console.log(
          `Index ${collectionName}.${match.name} diperbarui (opsi berubah)`
        );

        await col.dropIndex(match.name);
      }

      await col.createIndex(keys, options);
    }
  }


  // ====================================================
  // SETUP INDEXES
  // ====================================================

  async setupIndexes() {
    const idx = (collection, keys, options) =>
      this.ensureIndex(collection, keys, options);


    // ---------------- USERS ----------------

    await idx("users", { email: 1 }, { unique: true });
    await idx("users", { username: 1 }, { unique: true, sparse: true });
    await idx("users", { role: 1 });
    await idx("users", { verificationStatus: 1 });


    // ---------------- SESSIONS ----------------
    //
    // Satu dokumen = satu device yang login.
    // TTL pada expiresAt menghapus session kedaluwarsa
    // secara otomatis.

    await idx("sessions", { userId: 1 });
    await idx("sessions", { refreshTokenHash: 1 }, { unique: true });
    await idx("sessions", { expiresAt: 1 }, { expireAfterSeconds: 0 });


    // ---------------- PSYCHOLOGISTS ----------------
    //
    // Field `id` adalah sisa dump mockData dan TIDAK ada
    // pada profil yang dibuat lewat API. Index-nya harus
    // SPARSE -- tanpa itu, profil kedua tersimpan dengan
    // id: null dan langsung melanggar unique.

    await idx("psychologists", { id: 1 }, { unique: true, sparse: true });
    await idx("psychologists", { userId: 1 }, { unique: true, sparse: true });
    await idx("psychologists", { rating: -1, ratingCount: -1 });
    await idx("psychologists", { specialization: 1 });
    await idx("psychologists", { priceValue: 1 });


    // ---------------- RATINGS ----------------
    //
    // 1 CONSULTATION = 1 RATING

    await idx("psychologist_ratings", { consultationId: 1 }, { unique: true });
    await idx("psychologist_ratings", { psychologistId: 1, createdAt: -1 });
    await idx("psychologist_ratings", { userId: 1, createdAt: -1 });


    // ---------------- CONSULTATIONS ----------------
    //
    // `id` adalah sisa dump mockData ("c1".."c3") dan TIDAK
    // ada pada consultation yang dibuat lewat API.
    //
    // WAJIB sparse. Tanpa sparse, setiap consultation baru
    // tersimpan dengan id: null, sehingga hanya SATU yang
    // bisa ada -- booking kedua selamanya gagal dengan
    // duplicate key. Ini sempat tertutup karena tes selalu
    // membersihkan datanya, tapi di produksi booking kedua
    // akan langsung pecah.

    await idx("consultations", { id: 1 }, { unique: true, sparse: true });

    await idx("consultations", { userId: 1, createdAt: -1 });
    await idx("consultations", { userId: 1, date: -1 });
    await idx("consultations", { psychologistId: 1, scheduledAt: -1 });
    await idx("consultations", { psychologistId: 1, date: 1, time: 1 });


    // ---------------- SCHEDULES ----------------

    await idx(
      "schedules",
      { psychologistId: 1, date: 1, time: 1 },
      { unique: true }
    );


    // ---------------- MESSAGES ----------------

    await idx("consultation_messages", { consultationId: 1, createdAt: 1 });


    // ---------------- VERIFICATION ----------------

    await idx("verification_submissions", { psychologistId: 1, submittedAt: -1 });
    await idx("verification_submissions", { psychologistId: 1, submissionNumber: 1 });
    await idx("verification_submissions", { status: 1 });


    // ---------------- DAILY MOOD ----------------
    //
    // 1 USER + 1 DATE = 1 MOOD

    await idx("daily_moods", { userId: 1, date: 1 }, { unique: true });
    await idx("daily_moods", { userId: 1, date: -1 });


    // ---------------- JOURNALS ----------------
    //
    // Jurnal selalu diambil per user, urut terbaru.

    await idx("journals", { userId: 1, createdAt: -1 });
    await idx("journals", { userId: 1, mood: 1 });


    // ---------------- FORUM ----------------

    await idx("forums", { status: 1, createdAt: -1 });
    await idx("forums", { category: 1, status: 1, createdAt: -1 });
    await idx("forums", { userId: 1, createdAt: -1 });
    await idx("forums", { savedBy: 1 });
    await idx("forums", { likes: 1 });

    await idx("forum_replies", { postId: 1, createdAt: 1 });
    await idx("forum_replies", { userId: 1, createdAt: -1 });

    /*
     * SATU user hanya boleh melaporkan SATU post sekali
     * (spec section 19). Dijaga unique index, bukan hanya
     * pengecekan di aplikasi.
     */
    await idx(
      "forum_reports",
      { forumId: 1, reporterId: 1 },
      { unique: true }
    );

    await idx("forum_reports", { status: 1, createdAt: -1 });
    await idx("forum_reports", { forumId: 1, status: 1 });


    // ---------------- BAN & AUDIT ----------------

    await idx("users", { "forumBan.isBanned": 1 });

    await idx("audit_logs", { adminId: 1, createdAt: -1 });
    await idx("audit_logs", { targetType: 1, targetId: 1 });


    // ---------------- KONTEN ----------------

    await idx("forum_posts", { id: 1 }, { unique: true, sparse: true });
    await idx("articles", { id: 1 }, { unique: true, sparse: true });
    await idx("mind_hub_contents", { id: 1 }, { unique: true, sparse: true });
    await idx("mind_hub_contents", {
      category: 1,
      status: 1,
      publishedAt: -1
    });

    console.log("MongoDB indexes ready");
  }
}


/*
 * Singleton: seluruh aplikasi memakai instance yang sama,
 * sehingga hanya ada satu connection pool.
 */
import dotenv from "dotenv";

dotenv.config();

export const database = new Database(process.env.MONGODB_URI);
