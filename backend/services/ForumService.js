/*
 * ======================================================
 * FORUM SERVICE
 * ======================================================
 *
 * Spec section 16-21.
 *
 * TIGA ATURAN YANG MENENTUKAN DESAIN DI SINI:
 *
 * 1. ANONYMOUS (section 17)
 *    userId TETAP disimpan untuk ownership, moderation,
 *    report, dan audit. Yang disembunyikan hanyalah
 *    IDENTITAS pada RESPONSE PUBLIK. Jadi anonim bukan
 *    "tanpa pemilik" -- pemiliknya tetap diketahui server.
 *
 * 2. OWNERSHIP (section 18)
 *    archive / restore / delete hanya oleh pemilik. Query
 *    selalu menyertakan userId, bukan memeriksa setelah
 *    data diambil.
 *
 * 3. BAN (section 21)
 *    User yang di-ban MASIH boleh login dan membaca, tapi
 *    tidak boleh membuat post / reply / like. Dicek di
 *    BACKEND, bukan dengan men-disable tombol.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";
import { AppError } from "../core/AppError.js";
import { Validator } from "../core/Validator.js";
import { uploadService } from "./UploadService.js";

const CATEGORIES = [
  "Self Improvement",
  "Kesehatan Mental",
  "Hubungan",
  "Karir",
  "Keluarga",
  "Lainnya"
];

const STATUSES = ["active", "archived", "deleted"];

const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "self_harm",
  "misinformation",
  "other"
];

const BAN_DURATIONS = {
  "1d": 1,
  "3d": 3,
  "7d": 7,
  "30d": 30,
  permanent: null
};

const ANONYMOUS_NAME = "Anonymous User";


export class ForumService extends BaseService {
  constructor(db, uploads = uploadService) {
    super(db);

    this.uploads = uploads;
  }

  async forums() {
    return this.collection("forums");
  }

  async replies() {
    return this.collection("forum_replies");
  }

  async reports() {
    return this.collection("forum_reports");
  }

  async users() {
    return this.collection("users");
  }


  // ====================================================
  // BAN CHECK
  // ====================================================
  //
  // Ban yang sudah kedaluwarsa dianggap tidak aktif lagi
  // (spec: "jika ban sudah expired, backend dapat menganggap
  // user tidak lagi banned").
  //
  // ====================================================

  static isBanActive(forumBan) {
    if (!forumBan?.isBanned) {
      return false;
    }

    // bannedUntil null + isBanned true = permanen.
    if (!forumBan.bannedUntil) {
      return true;
    }

    return new Date(forumBan.bannedUntil) > new Date();
  }


  async assertNotBanned(userId) {
    const users = await this.users();

    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { forumBan: 1 } }
    );

    if (!ForumService.isBanActive(user?.forumBan)) {
      return;
    }

    const until = user.forumBan.bannedUntil;

    throw AppError.forbidden(
      until
        ? `Akses forum dibatasi sampai ${new Date(until).toLocaleDateString("id-ID")}. Alasan: ${user.forumBan.reason || "pelanggaran aturan komunitas"}`
        : `Akses forum dibatasi permanen. Alasan: ${user.forumBan.reason || "pelanggaran aturan komunitas"}`,
      "FORUM_BANNED"
    );
  }


  // ====================================================
  // BENTUK PUBLIK
  // ====================================================
  //
  // Inilah satu-satunya tempat identitas penulis dibentuk.
  //
  // Kalau isAnonymous, nama / username / foto TIDAK ikut --
  // dibuang di sini, bukan disembunyikan di frontend.
  //
  // `isOwn` dipakai UI untuk menampilkan tombol kelola tanpa
  // perlu tahu userId penulis.
  //
  // ====================================================

  static toPublic(doc, viewerId, { includeOwner = false } = {}) {
    const ownerId = doc.userId?.toString() || null;

    const isOwn = Boolean(
      viewerId && ownerId && ownerId === String(viewerId)
    );

    const author = doc.isAnonymous
      ? { name: ANONYMOUS_NAME, avatar: "", anonymous: true }
      : {
          name: doc.authorName || "Pengguna",
          avatar: doc.authorAvatar || "",
          anonymous: false
        };

    return {
      id: doc._id.toString(),
      category: doc.category,
      title: doc.title,
      content: doc.content,
      image: doc.image || "",
      isAnonymous: Boolean(doc.isAnonymous),
      status: doc.status || "active",

      author,

      likeCount: Array.isArray(doc.likes) ? doc.likes.length : 0,
      replyCount: doc.replyCount || 0,

      likedByMe: Boolean(
        viewerId &&
          Array.isArray(doc.likes) &&
          doc.likes.some((id) => String(id) === String(viewerId))
      ),

      savedByMe: Boolean(
        viewerId &&
          Array.isArray(doc.savedBy) &&
          doc.savedBy.some((id) => String(id) === String(viewerId))
      ),

      isOwn,

      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,

      /*
       * userId HANYA disertakan untuk admin (moderation).
       * Untuk response publik tidak pernah ikut, termasuk
       * pada post non-anonim -- id internal bukan data publik.
       */
      ...(includeOwner ? { userId: ownerId } : {})
    };
  }


  // ====================================================
  // LIST
  // ====================================================

  async list(viewerId, { category, search, page, limit } = {}) {
    const forums = await this.forums();

    // Hanya post aktif yang tampil di feed publik.
    const filter = { status: "active" };

    if (category && category !== "Semua") {
      filter.category = category;
    }

    if (typeof search === "string" && search.trim()) {
      const safe = Validator.escapeRegex(search.trim());

      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { content: { $regex: safe, $options: "i" } }
      ];
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const size = Validator.clampLimit(limit, 20, 100);

    const [items, total] = await Promise.all([
      forums
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * size)
        .limit(size)
        .toArray(),
      forums.countDocuments(filter)
    ]);

    return {
      posts: items.map((d) => ForumService.toPublic(d, viewerId)),
      pagination: {
        page: currentPage,
        limit: size,
        total,
        totalPages: Math.ceil(total / size) || 1
      }
    };
  }


  async getById(viewerId, postId) {
    const forums = await this.forums();

    const doc = await forums.findOne({
      _id: Validator.objectId(postId, "ID post"),
      status: { $ne: "deleted" }
    });

    if (!doc) {
      throw AppError.notFound(
        "Post tidak ditemukan",
        "NOT_FOUND"
      );
    }

    // Post yang diarsipkan hanya bisa dibuka pemiliknya.
    if (
      doc.status === "archived" &&
      String(doc.userId) !== String(viewerId)
    ) {
      throw AppError.notFound(
        "Post tidak ditemukan",
        "NOT_FOUND"
      );
    }

    return ForumService.toPublic(doc, viewerId);
  }


  // ====================================================
  // MY FORUM (spec section 18)
  // ====================================================

  async listMine(userId, tab = "posts") {
    const forums = await this.forums();

    const owner = { userId: new ObjectId(userId) };

    if (tab === "archived") {
      const docs = await forums
        .find({ ...owner, status: "archived" })
        .sort({ updatedAt: -1 })
        .toArray();

      return docs.map((d) => ForumService.toPublic(d, userId));
    }

    if (tab === "saved") {
      // Post yang DISIMPAN user -- bukan miliknya.
      const docs = await forums
        .find({
          savedBy: new ObjectId(userId),
          status: "active"
        })
        .sort({ createdAt: -1 })
        .toArray();

      return docs.map((d) => ForumService.toPublic(d, userId));
    }

    if (tab === "likes") {
      const docs = await forums
        .find({
          likes: new ObjectId(userId),
          status: "active"
        })
        .sort({ createdAt: -1 })
        .toArray();

      return docs.map((d) => ForumService.toPublic(d, userId));
    }

    if (tab === "replies") {
      const replies = await this.replies();

      const mine = await replies
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return mine.map((r) => ({
        id: r._id.toString(),
        postId: r.postId.toString(),
        content: r.content,
        isAnonymous: Boolean(r.isAnonymous),
        createdAt: r.createdAt
      }));
    }

    // default: post milik sendiri yang masih aktif
    const docs = await forums
      .find({ ...owner, status: "active" })
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((d) => ForumService.toPublic(d, userId));
  }


  // ====================================================
  // CREATE
  // ====================================================

  async create(userId, body) {
    // Ban dicek SEBELUM apa pun ditulis.
    await this.assertNotBanned(userId);

    const raw = Validator.pickAllowed(body, [
      "category",
      "title",
      "content",
      "image",
      "isAnonymous"
    ]);

    const category = Validator.oneOf(
      raw.category,
      "Kategori",
      CATEGORIES,
      { required: true }
    );

    const title = Validator.string(raw.title, "Judul", {
      required: true,
      min: 3,
      max: 200
    });

    const content = Validator.string(raw.content, "Cerita", {
      required: true,
      min: 10,
      max: 20000
    });

    let image = "";

    if (raw.image) {
      const value = String(raw.image);

      if (value.startsWith("data:")) {
        const saved = await this.uploads.saveDataUrl(value, {
          folder: "forum"
        });

        image = saved.url;
      } else {
        image = Validator.string(value, "Gambar", {
          max: 2000
        });
      }
    }

    const users = await this.users();

    const author = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, username: 1 } }
    );

    const now = BaseService.now();

    const doc = {
      // userId SELALU disimpan, termasuk untuk post anonim.
      userId: new ObjectId(userId),

      // Nama disimpan sebagai snapshot agar feed tidak perlu
      // $lookup. TIDAK dikirim ke klien bila anonim.
      authorName: author?.name || "Pengguna",
      authorAvatar: "",

      category,
      title,
      content,
      image,

      isAnonymous: raw.isAnonymous === true,

      status: "active",

      likes: [],
      savedBy: [],
      replyCount: 0,

      createdAt: now,
      updatedAt: now
    };

    const forums = await this.forums();

    const result = await forums.insertOne(doc);

    return ForumService.toPublic(
      { ...doc, _id: result.insertedId },
      userId
    );
  }


  // ====================================================
  // OWNERSHIP ACTIONS
  // ====================================================
  //
  // Filter menyertakan userId, jadi post orang lain tidak
  // akan pernah cocok -> 404.
  //
  // ====================================================

  async setStatus(userId, postId, status) {
    const valid = Validator.oneOf(
      status,
      "Status",
      STATUSES,
      { required: true }
    );

    const forums = await this.forums();

    const result = await forums.findOneAndUpdate(
      {
        _id: Validator.objectId(postId, "ID post"),
        userId: new ObjectId(userId)
      },
      {
        $set: { status: valid, updatedAt: BaseService.now() }
      },
      { returnDocument: "after" }
    );

    const doc = BaseService.unwrap(result);

    if (!doc) {
      throw AppError.notFound(
        "Post tidak ditemukan atau bukan milik Anda",
        "NOT_FOUND"
      );
    }

    return ForumService.toPublic(doc, userId);
  }


  // Soft delete (spec section 16): data tetap ada untuk
  // moderation/audit.
  async remove(userId, postId) {
    return this.setStatus(userId, postId, "deleted");
  }


  // ====================================================
  // LIKE & SAVE
  // ====================================================

  async toggleLike(userId, postId) {
    await this.assertNotBanned(userId);

    const forums = await this.forums();

    const _id = Validator.objectId(postId, "ID post");
    const uid = new ObjectId(userId);

    const post = await forums.findOne({
      _id,
      status: "active"
    });

    if (!post) {
      throw AppError.notFound(
        "Post tidak ditemukan",
        "NOT_FOUND"
      );
    }

    const liked = (post.likes || []).some(
      (id) => String(id) === String(uid)
    );

    // $addToSet / $pull bersifat atomic, jadi dua klik
    // bersamaan tidak membuat like ganda.
    const result = await forums.findOneAndUpdate(
      { _id },
      liked
        ? { $pull: { likes: uid } }
        : { $addToSet: { likes: uid } },
      { returnDocument: "after" }
    );

    const doc = BaseService.unwrap(result);

    return {
      liked: !liked,
      likeCount: (doc.likes || []).length
    };
  }


  // Save bersifat pribadi, jadi TIDAK dibatasi ban --
  // menyimpan bacaan bukan tindakan sosial.
  async toggleSave(userId, postId) {
    const forums = await this.forums();

    const _id = Validator.objectId(postId, "ID post");
    const uid = new ObjectId(userId);

    const post = await forums.findOne({ _id });

    if (!post) {
      throw AppError.notFound(
        "Post tidak ditemukan",
        "NOT_FOUND"
      );
    }

    const saved = (post.savedBy || []).some(
      (id) => String(id) === String(uid)
    );

    const result = await forums.findOneAndUpdate(
      { _id },
      saved
        ? { $pull: { savedBy: uid } }
        : { $addToSet: { savedBy: uid } },
      { returnDocument: "after" }
    );

    const doc = BaseService.unwrap(result);

    return {
      saved: !saved,
      savedCount: (doc.savedBy || []).length
    };
  }


  // ====================================================
  // REPLY
  // ====================================================

  async listReplies(viewerId, postId) {
    const _id = Validator.objectId(postId, "ID post");

    const replies = await this.replies();

    const docs = await replies
      .find({ postId: _id, status: { $ne: "deleted" } })
      .sort({ createdAt: 1 })
      .toArray();

    return docs.map((r) => ({
      id: r._id.toString(),
      content: r.content,
      isAnonymous: Boolean(r.isAnonymous),

      // Identitas disembunyikan sama seperti post.
      author: r.isAnonymous
        ? { name: ANONYMOUS_NAME, anonymous: true }
        : {
            name: r.authorName || "Pengguna",
            anonymous: false
          },

      isOwn:
        Boolean(viewerId) &&
        String(r.userId) === String(viewerId),

      createdAt: r.createdAt
    }));
  }


  async reply(userId, postId, body) {
    await this.assertNotBanned(userId);

    const content = Validator.string(
      body?.content,
      "Balasan",
      { required: true, min: 1, max: 5000 }
    );

    const forums = await this.forums();

    const _id = Validator.objectId(postId, "ID post");

    const post = await forums.findOne({
      _id,
      status: "active"
    });

    if (!post) {
      throw AppError.notFound(
        "Post tidak ditemukan",
        "NOT_FOUND"
      );
    }

    const users = await this.users();

    const author = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1 } }
    );

    const now = BaseService.now();

    const doc = {
      postId: _id,
      userId: new ObjectId(userId),
      authorName: author?.name || "Pengguna",
      content,
      isAnonymous: body?.isAnonymous === true,
      status: "active",
      createdAt: now,
      updatedAt: now
    };

    const replies = await this.replies();

    const result = await replies.insertOne(doc);

    await forums.updateOne(
      { _id },
      { $inc: { replyCount: 1 }, $set: { updatedAt: now } }
    );

    return {
      id: result.insertedId.toString(),
      content: doc.content,
      isAnonymous: doc.isAnonymous,
      author: doc.isAnonymous
        ? { name: ANONYMOUS_NAME, anonymous: true }
        : { name: doc.authorName, anonymous: false },
      isOwn: true,
      createdAt: doc.createdAt
    };
  }


  // ====================================================
  // REPORT (spec section 19)
  // ====================================================

  async report(reporterId, postId, body) {
    const reason = Validator.oneOf(
      body?.reason,
      "Alasan",
      REPORT_REASONS,
      { required: true }
    );

    const description = Validator.string(
      body?.description,
      "Keterangan",
      { max: 1000 }
    );

    const forums = await this.forums();

    const _id = Validator.objectId(postId, "ID post");

    const post = await forums.findOne({ _id });

    if (!post || post.status === "deleted") {
      throw AppError.notFound(
        "Post tidak ditemukan",
        "NOT_FOUND"
      );
    }

    // Tidak perlu melaporkan post sendiri.
    if (String(post.userId) === String(reporterId)) {
      throw AppError.badRequest(
        "Tidak bisa melaporkan post sendiri",
        "CANNOT_REPORT_OWN"
      );
    }

    const reports = await this.reports();

    const now = BaseService.now();

    /*
     * Satu user hanya boleh melaporkan satu post SEKALI
     * selama laporannya belum diproses (spec section 19).
     * Dijaga unique index { forumId, reporterId }.
     */
    try {
      const result = await reports.insertOne({
        forumId: _id,
        reporterId: new ObjectId(reporterId),
        forumOwnerId: post.userId,
        reason,
        description: description || "",
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        action: null,
        createdAt: now
      });

      return {
        id: result.insertedId.toString(),
        status: "pending"
      };
    } catch (error) {
      if (error?.code === 11000) {
        throw AppError.conflict(
          "Kamu sudah melaporkan post ini",
          "ALREADY_REPORTED"
        );
      }

      throw error;
    }
  }


  // ====================================================
  // ADMIN MODERATION (spec section 20)
  // ====================================================

  async listReports({ status } = {}) {
    const reports = await this.reports();

    const filter = {};

    if (status && status !== "Semua") {
      filter.status = status;
    }

    return reports
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "forums",
            localField: "forumId",
            foreignField: "_id",
            as: "forumArr"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "reporterId",
            foreignField: "_id",
            as: "reporterArr"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "forumOwnerId",
            foreignField: "_id",
            as: "ownerArr"
          }
        },
        {
          /*
           * Admin BOLEH melihat pemilik post walaupun post-nya
           * anonim (spec section 17: "Admin tetap boleh
           * mengetahui pemilik forum untuk moderation").
           *
           * passwordHash tidak pernah ikut.
           */
          $project: {
            _id: 0,
            id: { $toString: "$_id" },
            reason: 1,
            description: 1,
            status: 1,
            action: 1,
            reviewedAt: 1,
            createdAt: 1,

            post: {
              id: {
                $toString: {
                  $arrayElemAt: ["$forumArr._id", 0]
                }
              },
              category: { $arrayElemAt: ["$forumArr.category", 0] },
              title: { $arrayElemAt: ["$forumArr.title", 0] },
              content: { $arrayElemAt: ["$forumArr.content", 0] },
              image: { $arrayElemAt: ["$forumArr.image", 0] },
              isAnonymous: {
                $arrayElemAt: ["$forumArr.isAnonymous", 0]
              },
              status: { $arrayElemAt: ["$forumArr.status", 0] }
            },

            reporter: {
              id: {
                $toString: {
                  $arrayElemAt: ["$reporterArr._id", 0]
                }
              },
              name: { $arrayElemAt: ["$reporterArr.name", 0] },
              email: { $arrayElemAt: ["$reporterArr.email", 0] }
            },

            owner: {
              id: {
                $toString: {
                  $arrayElemAt: ["$ownerArr._id", 0]
                }
              },
              name: { $arrayElemAt: ["$ownerArr.name", 0] },
              email: { $arrayElemAt: ["$ownerArr.email", 0] },
              forumBan: { $arrayElemAt: ["$ownerArr.forumBan", 0] }
            }
          }
        }
      ])
      .toArray();
  }


  /*
   * Memproses laporan.
   *
   * action:
   *   dismiss  -> laporan ditolak, post dibiarkan
   *   archive  -> post diarsipkan
   *   delete   -> post di-soft delete
   *
   * Ban dilakukan lewat method terpisah supaya satu aksi
   * tidak melakukan dua hal sekaligus secara implisit.
   */
  async reviewReport(adminId, reportId, { action, note } = {}) {
    const valid = Validator.oneOf(
      action,
      "Action",
      ["dismiss", "archive", "delete"],
      { required: true }
    );

    const reports = await this.reports();

    const _id = Validator.objectId(reportId, "ID laporan");

    const now = BaseService.now();

    const result = await reports.findOneAndUpdate(
      { _id, status: "pending" },
      {
        $set: {
          status: valid === "dismiss" ? "rejected" : "resolved",
          action: valid,
          note: Validator.string(note, "Catatan", { max: 1000 }) || "",
          reviewedBy: new ObjectId(adminId),
          reviewedAt: now
        }
      },
      { returnDocument: "after" }
    );

    const report = BaseService.unwrap(result);

    if (!report) {
      throw AppError.notFound(
        "Laporan tidak ditemukan atau sudah diproses",
        "REPORT_NOT_PENDING"
      );
    }

    if (valid !== "dismiss") {
      const forums = await this.forums();

      await forums.updateOne(
        { _id: report.forumId },
        {
          $set: {
            status: valid === "archive" ? "archived" : "deleted",
            moderatedBy: new ObjectId(adminId),
            moderatedAt: now,
            updatedAt: now
          }
        }
      );
    }

    await this.audit(adminId, {
      action: `forum_report_${valid}`,
      targetId: report.forumId,
      targetType: "forum",
      reason: report.reason
    });

    return {
      id: report._id.toString(),
      status: report.status,
      action: report.action
    };
  }


  // ====================================================
  // BAN (spec section 21)
  // ====================================================

  async banUser(adminId, targetUserId, { duration, reason } = {}) {
    const key = Validator.oneOf(
      duration,
      "Durasi",
      Object.keys(BAN_DURATIONS),
      { required: true }
    );

    const text = Validator.string(reason, "Alasan", {
      required: true,
      min: 3,
      max: 500
    });

    const days = BAN_DURATIONS[key];

    const now = BaseService.now();

    // permanent -> bannedUntil null, TAPI isBanned tetap true.
    const bannedUntil =
      days === null
        ? null
        : new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const users = await this.users();

    const _id = Validator.objectId(targetUserId, "User ID");

    const target = await users.findOne({ _id });

    if (!target) {
      throw AppError.notFound(
        "User tidak ditemukan",
        "USER_NOT_FOUND"
      );
    }

    // Admin tidak boleh di-ban dari forum.
    if (["admin", "super_admin"].includes(target.role)) {
      throw AppError.forbidden(
        "Akun admin tidak bisa di-ban",
        "CANNOT_BAN_ADMIN"
      );
    }

    await users.updateOne(
      { _id },
      {
        $set: {
          forumBan: {
            isBanned: true,
            bannedUntil,
            duration: key,
            reason: text,
            bannedBy: new ObjectId(adminId),
            bannedAt: now
          },
          updatedAt: now
        }
      }
    );

    await this.audit(adminId, {
      action: "forum_ban",
      targetId: _id,
      targetType: "user",
      reason: text
    });

    return { userId: _id.toString(), bannedUntil, duration: key };
  }


  async unbanUser(adminId, targetUserId) {
    const users = await this.users();

    const _id = Validator.objectId(targetUserId, "User ID");

    const result = await users.updateOne(
      { _id },
      {
        $set: {
          forumBan: {
            isBanned: false,
            bannedUntil: null,
            reason: null,
            bannedBy: null,
            unbannedBy: new ObjectId(adminId),
            unbannedAt: BaseService.now()
          },
          updatedAt: BaseService.now()
        }
      }
    );

    if (!result.matchedCount) {
      throw AppError.notFound(
        "User tidak ditemukan",
        "USER_NOT_FOUND"
      );
    }

    await this.audit(adminId, {
      action: "forum_unban",
      targetId: _id,
      targetType: "user"
    });

    return true;
  }


  async listBans() {
    const users = await this.users();

    const docs = await users
      .find(
        { "forumBan.isBanned": true },
        {
          projection: {
            name: 1,
            email: 1,
            forumBan: 1
          }
        }
      )
      .toArray();

    return docs.map((u) => ({
      userId: u._id.toString(),
      name: u.name,
      email: u.email,
      ...u.forumBan,
      // Ban kedaluwarsa ditandai, bukan dianggap aktif.
      active: ForumService.isBanActive(u.forumBan)
    }));
  }


  // Status ban user sendiri, supaya UI bisa menjelaskan
  // mengapa aksi forum ditolak.
  async myBanStatus(userId) {
    const users = await this.users();

    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { forumBan: 1 } }
    );

    const active = ForumService.isBanActive(user?.forumBan);

    return {
      banned: active,
      bannedUntil: active ? user.forumBan.bannedUntil : null,
      reason: active ? user.forumBan.reason : null
    };
  }


  // ====================================================
  // AUDIT LOG (spec section 31)
  // ====================================================
  //
  // Tidak pernah menyimpan password atau token.
  //
  // ====================================================

  async audit(adminId, { action, targetId, targetType, reason }) {
    try {
      const logs = await this.collection("audit_logs");

      await logs.insertOne({
        adminId: new ObjectId(adminId),
        action,
        targetId: targetId || null,
        targetType: targetType || null,
        reason: reason || null,
        createdAt: BaseService.now()
      });
    } catch (error) {
      // Audit gagal tidak boleh membatalkan aksi moderasi.
      console.error("Audit log error:", error?.message);
    }
  }
}

export const forumService = new ForumService();
