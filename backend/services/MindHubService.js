/*
 * ======================================================
 * MIND HUB SERVICE
 * ======================================================
 *
 * Spec section 8, 9, 22.
 *
 * Aturan akses:
 *
 *   user  -> HANYA konten status "published"
 *   admin -> semua konten, termasuk draft
 *
 * Draft tidak boleh bisa diambil lewat endpoint publik
 * walaupun id-nya diketahui.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";
import { AppError } from "../core/AppError.js";
import { Validator } from "../core/Validator.js";
import { uploadService } from "./UploadService.js";

const CATEGORIES = ["Mind and Balance", "Self-Care Corner"];
const STATUSES = ["draft", "published", "archived"];

// Field yang boleh dikirim admin. Di luar daftar diabaikan.
const EDITABLE = [
  "title",
  "excerpt",
  "content",
  "category",
  "duration",
  "image",
  "status"
];


export class MindHubService extends BaseService {
  constructor(db, uploads = uploadService) {
    super(db);

    this.uploads = uploads;
  }

  async contents() {
    return this.collection("mind_hub_contents");
  }


  // ====================================================
  // BENTUK PUBLIK
  // ====================================================

  static toPublic(doc) {
    return {
      id: doc._id.toString(),

      // `id` lama dari dump mockData dipertahankan supaya
      // tautan yang sudah ada tidak mati.
      legacyId: doc.id || null,

      category: doc.category,
      title: doc.title,
      excerpt: doc.excerpt || "",
      content: doc.content || "",
      image: doc.image || "",
      duration: doc.duration || "",
      status: doc.status || "published",
      publishedAt: doc.publishedAt || null,
      createdAt: doc.createdAt || null,
      updatedAt: doc.updatedAt || null
    };
  }


  /*
   * Dokumen hasil dump mockData tidak punya field `status`.
   * Semuanya memang dimaksudkan tampil, jadi yang tanpa
   * status dianggap published.
   */
  static publishedFilter() {
    return {
      $or: [
        { status: "published" },
        { status: { $exists: false } }
      ]
    };
  }


  // Menerima _id (ObjectId) ATAU legacy id ("mb6"), supaya
  // tautan lama tetap bisa dibuka.
  static idFilter(id) {
    const value = String(id || "");

    return Validator.isObjectId(value)
      ? { _id: new ObjectId(value) }
      : { id: value };
  }


  // ====================================================
  // PUBLIK
  // ====================================================

  async listPublished({ category, search, page, limit } = {}) {
    const contents = await this.contents();

    const filter = MindHubService.publishedFilter();

    if (
      typeof category === "string" &&
      category.trim() &&
      category !== "Semua"
    ) {
      filter.category = Validator.oneOf(
        category.trim(),
        "Kategori",
        CATEGORIES
      );
    }

    if (typeof search === "string" && search.trim()) {
      const safe = Validator.escapeRegex(search.trim());

      // $and dipakai karena $or sudah terpakai oleh
      // publishedFilter -- kalau ditimpa, draft bisa bocor.
      filter.$and = [
        {
          $or: [
            { title: { $regex: safe, $options: "i" } },
            { excerpt: { $regex: safe, $options: "i" } }
          ]
        }
      ];
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const size = Validator.clampLimit(limit, 50, 100);

    const [items, total] = await Promise.all([
      contents
        .find(filter)
        .sort({ publishedAt: -1, createdAt: -1, title: 1 })
        .skip((currentPage - 1) * size)
        .limit(size)
        .toArray(),
      contents.countDocuments(filter)
    ]);

    return {
      contents: items.map(MindHubService.toPublic),
      pagination: {
        page: currentPage,
        limit: size,
        total,
        totalPages: Math.ceil(total / size) || 1
      }
    };
  }


  async getPublished(id) {
    const contents = await this.contents();

    const doc = await contents.findOne({
      ...MindHubService.idFilter(id),
      ...MindHubService.publishedFilter()
    });

    if (!doc) {
      // 404 yang sama untuk draft dan tidak-ada, supaya
      // keberadaan draft tidak bocor.
      throw AppError.notFound(
        "Konten tidak ditemukan",
        "NOT_FOUND"
      );
    }

    return MindHubService.toPublic(doc);
  }


  /*
   * MATERI TERKAIT (spec section 9).
   *
   * Kategori sama, HARUS mengecualikan artikel yang sedang
   * dibuka, dan hanya yang published. Diambil lewat query,
   * tidak di-hardcode.
   */
  async related(id, limit = 3) {
    const contents = await this.contents();

    const current = await contents.findOne(
      MindHubService.idFilter(id)
    );

    if (!current) {
      return [];
    }

    const docs = await contents
      .find({
        category: current.category,
        _id: { $ne: current._id },
        ...MindHubService.publishedFilter()
      })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(Validator.clampLimit(limit, 3, 12))
      .toArray();

    return docs.map(MindHubService.toPublic);
  }


  // ====================================================
  // ADMIN
  // ====================================================

  async listAll({ category, status, search } = {}) {
    const contents = await this.contents();

    const filter = {};

    if (category && category !== "Semua") {
      filter.category = category;
    }

    if (status && status !== "Semua") {
      filter.status = status;
    }

    if (typeof search === "string" && search.trim()) {
      const safe = Validator.escapeRegex(search.trim());

      filter.title = { $regex: safe, $options: "i" };
    }

    const docs = await contents
      .find(filter)
      .sort({ createdAt: -1, title: 1 })
      .toArray();

    return docs.map(MindHubService.toPublic);
  }


  async getAny(id) {
    const contents = await this.contents();

    const doc = await contents.findOne(
      MindHubService.idFilter(id)
    );

    if (!doc) {
      throw AppError.notFound(
        "Konten tidak ditemukan",
        "NOT_FOUND"
      );
    }

    return MindHubService.toPublic(doc);
  }


  /*
   * Membersihkan input admin.
   *
   * `image` bisa berupa:
   *   - data URL base64  -> diunggah & divalidasi
   *   - URL yang sudah ada -> dipakai apa adanya
   */
  async buildPayload(body, { requireAll = false } = {}) {
    const raw = Validator.pickAllowed(body, EDITABLE);

    const payload = Validator.pickDefined({
      title: Validator.string(raw.title, "Judul", {
        required: requireAll,
        min: 3,
        max: 200
      }),

      excerpt: Validator.string(raw.excerpt, "Ringkasan", {
        max: 500
      }),

      content: Validator.string(raw.content, "Isi", {
        required: requireAll,
        min: 10,
        max: 50000
      }),

      category: Validator.oneOf(
        raw.category,
        "Kategori",
        CATEGORIES,
        { required: requireAll }
      ),

      duration: Validator.string(raw.duration, "Durasi", {
        max: 40
      }),

      status: Validator.oneOf(raw.status, "Status", STATUSES)
    });

    if (raw.image !== undefined) {
      const image = String(raw.image || "");

      if (!image) {
        payload.image = "";
      } else if (image.startsWith("data:")) {
        const saved = await this.uploads.saveDataUrl(image, {
          folder: "mindhub"
        });

        payload.image = saved.url;
      } else {
        // URL yang sudah tersimpan (atau URL eksternal pada
        // data seed) dibiarkan.
        payload.image = Validator.string(image, "Gambar", {
          max: 2000
        });
      }
    }

    return payload;
  }


  async create(adminId, body) {
    const payload = await this.buildPayload(body, {
      requireAll: true
    });

    const now = BaseService.now();

    const doc = {
      ...payload,
      status: payload.status || "draft",
      publishedAt:
        (payload.status || "draft") === "published" ? now : null,
      createdBy: new ObjectId(adminId),
      createdAt: now,
      updatedAt: now
    };

    const contents = await this.contents();

    const result = await contents.insertOne(doc);

    return MindHubService.toPublic({
      ...doc,
      _id: result.insertedId
    });
  }


  async update(id, body) {
    const payload = await this.buildPayload(body);

    if (Object.keys(payload).length === 0) {
      throw AppError.badRequest(
        "Tidak ada field yang bisa diperbarui",
        "NO_VALID_FIELDS"
      );
    }

    const now = BaseService.now();

    const set = { ...payload, updatedAt: now };

    // publishedAt diisi saat pertama kali dipublikasikan.
    if (payload.status === "published") {
      set.publishedAt = now;
    }

    const contents = await this.contents();

    const result = await contents.findOneAndUpdate(
      MindHubService.idFilter(id),
      { $set: set },
      { returnDocument: "after" }
    );

    const doc = BaseService.unwrap(result);

    if (!doc) {
      throw AppError.notFound(
        "Konten tidak ditemukan",
        "NOT_FOUND"
      );
    }

    return MindHubService.toPublic(doc);
  }


  async setStatus(id, status) {
    const valid = Validator.oneOf(
      status,
      "Status",
      STATUSES,
      { required: true }
    );

    return this.update(id, { status: valid });
  }


  async remove(id) {
    const contents = await this.contents();

    const doc = await contents.findOne(
      MindHubService.idFilter(id)
    );

    if (!doc) {
      throw AppError.notFound(
        "Konten tidak ditemukan",
        "NOT_FOUND"
      );
    }

    await contents.deleteOne({ _id: doc._id });

    // Berkas gambar ikut dibersihkan kalau memang milik kita.
    if (doc.image) {
      await this.uploads.remove(doc.image);
    }

    return true;
  }
}

export const mindHubService = new MindHubService();
