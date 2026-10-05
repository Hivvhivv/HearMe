/*
 * ======================================================
 * JOURNAL SERVICE
 * ======================================================
 *
 * Spec section 7.
 *
 * Jurnal adalah data PRIVAT. Aturannya tegas:
 *
 *   setiap query SELALU menyertakan userId dari JWT.
 *
 * Tidak ada method di sini yang bisa mengambil jurnal tanpa
 * userId, jadi tidak mungkin ada endpoint yang lupa
 * memfilternya dan membocorkan jurnal user lain.
 *
 * Gambar disimpan sebagai berkas lewat UploadService;
 * MongoDB hanya menyimpan URL-nya.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";
import { AppError } from "../core/AppError.js";
import { Validator } from "../core/Validator.js";
import { uploadService } from "./UploadService.js";

const MAX_IMAGES = 5;

/*
 * Daftar ini harus mencakup nilai yang DIKIRIM UI.
 *
 * JournalPage memakai: happy, sad, okay, anxious,
 * grateful, angry. Padanan bahasa Indonesia ikut diterima
 * supaya data lama / halaman lain tetap valid.
 */
const MOODS = [
  // dipakai JournalPage
  "happy",
  "sad",
  "okay",
  "anxious",
  "grateful",
  "angry",

  // varian lain yang diterima
  "neutral",
  "tired",
  "confused",
  "senang",
  "sedih",
  "marah",
  "cemas",
  "biasa",
  "lelah",
  "bersyukur",
  "bingung"
];


export class JournalService extends BaseService {
  constructor(db, uploads = uploadService) {
    super(db);

    this.uploads = uploads;
  }

  async journals() {
    return this.collection("journals");
  }


  static toPublic(doc) {
    return {
      id: doc._id.toString(),
      mood: doc.mood || "",
      title: doc.title || "",
      content: doc.content || "",
      images: doc.images || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }


  // Semua query memakai ini: userId tidak pernah opsional.
  static ownerFilter(userId, journalId) {
    const filter = { userId: new ObjectId(userId) };

    if (journalId !== undefined) {
      filter._id = Validator.objectId(journalId, "ID jurnal");
    }

    return filter;
  }


  async buildPayload(body, { requireAll = false } = {}) {
    const raw = Validator.pickAllowed(body, [
      "mood",
      "title",
      "content",
      "images"
    ]);

    const payload = Validator.pickDefined({
      mood: Validator.oneOf(raw.mood, "Mood", MOODS, {
        required: requireAll
      }),

      title: Validator.string(raw.title, "Judul", {
        required: requireAll,
        min: 1,
        max: 200
      }),

      content: Validator.string(raw.content, "Isi jurnal", {
        required: requireAll,
        min: 1,
        max: 20000
      })
    });

    if (raw.images !== undefined) {
      if (!Array.isArray(raw.images)) {
        throw AppError.badRequest(
          "Gambar harus berupa daftar",
          "INVALID_IMAGES"
        );
      }

      // Validasi MIME, ukuran, dan magic bytes ada di
      // UploadService. Gambar yang sudah tersimpan (URL)
      // tidak diunggah ulang.
      const saved = await this.uploads.saveMany(raw.images, {
        folder: "journal",
        max: MAX_IMAGES
      });

      payload.images = saved.map((s) => s.url);
    }

    return payload;
  }


  // ====================================================
  // LIST
  // ====================================================

  async list(userId, { search, mood, page, limit } = {}) {
    const journals = await this.journals();

    const filter = JournalService.ownerFilter(userId);

    if (mood) {
      filter.mood = mood;
    }

    if (typeof search === "string" && search.trim()) {
      const safe = Validator.escapeRegex(search.trim());

      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { content: { $regex: safe, $options: "i" } }
      ];
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const size = Validator.clampLimit(limit, 30, 100);

    const [items, total] = await Promise.all([
      journals
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * size)
        .limit(size)
        .toArray(),
      journals.countDocuments(filter)
    ]);

    return {
      journals: items.map(JournalService.toPublic),
      pagination: {
        page: currentPage,
        limit: size,
        total,
        totalPages: Math.ceil(total / size) || 1
      }
    };
  }


  async getById(userId, journalId) {
    const journals = await this.journals();

    const doc = await journals.findOne(
      JournalService.ownerFilter(userId, journalId)
    );

    if (!doc) {
      // 404, bukan 403: jurnal user lain tidak boleh
      // terkonfirmasi keberadaannya.
      throw AppError.notFound(
        "Jurnal tidak ditemukan",
        "NOT_FOUND"
      );
    }

    return JournalService.toPublic(doc);
  }


  // ====================================================
  // CREATE / UPDATE / DELETE
  // ====================================================

  async create(userId, body) {
    const payload = await this.buildPayload(body, {
      requireAll: true
    });

    const now = BaseService.now();

    const doc = {
      userId: new ObjectId(userId),
      mood: payload.mood,
      title: payload.title,
      content: payload.content,
      images: payload.images || [],
      createdAt: now,
      updatedAt: now
    };

    const journals = await this.journals();

    const result = await journals.insertOne(doc);

    return JournalService.toPublic({
      ...doc,
      _id: result.insertedId
    });
  }


  async update(userId, journalId, body) {
    const payload = await this.buildPayload(body);

    if (Object.keys(payload).length === 0) {
      throw AppError.badRequest(
        "Tidak ada field yang bisa diperbarui",
        "NO_VALID_FIELDS"
      );
    }

    const journals = await this.journals();

    const filter = JournalService.ownerFilter(
      userId,
      journalId
    );

    // Gambar lama yang dibuang dihapus dari disk, supaya
    // berkas tidak menumpuk.
    const existing = await journals.findOne(filter);

    if (!existing) {
      throw AppError.notFound(
        "Jurnal tidak ditemukan",
        "NOT_FOUND"
      );
    }

    const result = await journals.findOneAndUpdate(
      filter,
      { $set: { ...payload, updatedAt: BaseService.now() } },
      { returnDocument: "after" }
    );

    const doc = BaseService.unwrap(result);

    if (payload.images) {
      const kept = new Set(payload.images);

      for (const url of existing.images || []) {
        if (!kept.has(url)) {
          await this.uploads.remove(url);
        }
      }
    }

    return JournalService.toPublic(doc);
  }


  async remove(userId, journalId) {
    const journals = await this.journals();

    const filter = JournalService.ownerFilter(
      userId,
      journalId
    );

    const doc = await journals.findOne(filter);

    if (!doc) {
      throw AppError.notFound(
        "Jurnal tidak ditemukan",
        "NOT_FOUND"
      );
    }

    await journals.deleteOne({ _id: doc._id });

    for (const url of doc.images || []) {
      await this.uploads.remove(url);
    }

    return true;
  }


  // Ringkasan mood untuk grafik di halaman jurnal.
  async moodSummary(userId, days = 30) {
    const journals = await this.journals();

    const since = new Date();
    since.setDate(since.getDate() - Math.min(days, 365));

    return journals
      .aggregate([
        {
          $match: {
            ...JournalService.ownerFilter(userId),
            createdAt: { $gte: since }
          }
        },
        { $group: { _id: "$mood", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, mood: "$_id", count: 1 } }
      ])
      .toArray();
  }
}

export const journalService = new JournalService();
