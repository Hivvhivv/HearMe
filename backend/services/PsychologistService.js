/*
 * ======================================================
 * PSYCHOLOGIST SERVICE
 * ======================================================
 *
 * SUMBER KEBENARAN:
 *
 *   users         -> identitas + role + verificationStatus
 *   psychologists -> profil profesional (userId -> users)
 *
 * Hanya psikolog dengan role "psychologist",
 * verificationStatus "approved", dan isActive yang boleh
 * tampil ke user. Itu dijamin di tahap $match PERTAMA
 * aggregation -- bukan disaring di frontend.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";
import { AppError } from "../core/AppError.js";
import { Validator } from "../core/Validator.js";

const SORT_MAP = {
  rating: { "profile.rating": -1, "profile.ratingCount": -1 },
  "price-asc": { priceValue: 1 },
  "price-desc": { priceValue: -1 },
  name: { name: 1 },
  newest: { createdAt: -1 }
};

const DEFAULT_SORT = {
  "profile.rating": -1,
  "profile.ratingCount": -1,
  name: 1
};


export class PsychologistService extends BaseService {

  async users() {
    return this.collection("users");
  }

  async profiles() {
    return this.collection("psychologists");
  }

  async ratings() {
    return this.collection("psychologist_ratings");
  }

  async schedules() {
    return this.collection("schedules");
  }

  async consultations() {
    return this.collection("consultations");
  }


  // ====================================================
  // PIPELINE
  // ====================================================

  static approvedMatch() {
    return {
      role: "psychologist",
      verificationStatus: "approved",
      isActive: { $ne: false }
    };
  }

  static joinProfile() {
    return [
      {
        $lookup: {
          from: "psychologists",
          localField: "_id",
          foreignField: "userId",
          as: "profileArr"
        }
      },
      {
        $addFields: {
          profile: {
            $ifNull: [{ $arrayElemAt: ["$profileArr", 0] }, {}]
          }
        }
      },
      {
        // priceValue sudah tersimpan di dokumen profil
        // (dihitung saat menulis), jadi di sini cukup
        // diangkat ke level atas untuk sort/filter.
        $addFields: {
          priceValue: {
            $ifNull: ["$profile.priceValue", null]
          }
        }
      }
    ];
  }


  /*
   * Bentuk response publik.
   *
   * passwordHash dan EMAIL psikolog TIDAK ikut -- email
   * bukan informasi publik.
   */
  static publicProjection() {
    return {
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
        name: 1,
        specialization: {
          $ifNull: ["$profile.specialization", ""]
        },
        experience: { $ifNull: ["$profile.experience", ""] },
        price: { $ifNull: ["$profile.price", ""] },
        priceValue: 1,
        bio: { $ifNull: ["$profile.bio", ""] },
        avatar: { $ifNull: ["$profile.avatar", ""] },
        tags: { $ifNull: ["$profile.tags", []] },
        schedule: { $ifNull: ["$profile.schedule", []] },
        consultations: {
          $ifNull: ["$profile.consultations", ""]
        },
        rating: { $ifNull: ["$profile.rating", null] },
        ratingCount: { $ifNull: ["$profile.ratingCount", 0] },
        available: { $ifNull: ["$profile.available", true] }
      }
    };
  }


  // ====================================================
  // LIST
  // ====================================================
  //
  // Filter dikerjakan DATABASE (spec section 10), supaya
  // tetap benar saat datanya banyak.
  //
  // ====================================================

  async list(query = {}) {
    const users = await this.users();

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Validator.clampLimit(query.limit, 24, 100);

    const pipeline = [
      { $match: PsychologistService.approvedMatch() },
      ...PsychologistService.joinProfile()
    ];

    const postMatch = {};

    if (
      typeof query.specialization === "string" &&
      query.specialization.trim() &&
      query.specialization !== "Semua"
    ) {
      postMatch["profile.specialization"] =
        query.specialization.trim();
    }

    if (typeof query.search === "string" && query.search.trim()) {
      // Escape supaya input user tidak dianggap regex.
      const safe = Validator.escapeRegex(query.search.trim());

      postMatch.$or = [
        { name: { $regex: safe, $options: "i" } },
        {
          "profile.specialization": {
            $regex: safe,
            $options: "i"
          }
        },
        {
          "profile.tags": {
            $elemMatch: { $regex: safe, $options: "i" }
          }
        }
      ];
    }

    if (query.minRating !== undefined && query.minRating !== "") {
      postMatch["profile.rating"] = {
        $gte: Validator.number(query.minRating, "minRating", {
          min: 0,
          max: 5
        })
      };
    }

    if (query.maxPrice !== undefined && query.maxPrice !== "") {
      postMatch.priceValue = {
        $lte: Validator.number(query.maxPrice, "maxPrice", {
          min: 0
        }),
        $ne: null
      };
    }

    if (query.availableOnly === "true" || query.availableOnly === true) {
      postMatch["profile.available"] = { $ne: false };
    }

    if (Object.keys(postMatch).length > 0) {
      pipeline.push({ $match: postMatch });
    }

    pipeline.push({
      $sort: SORT_MAP[query.sort] || DEFAULT_SORT
    });

    // Pagination + total dalam satu round trip.
    pipeline.push({
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          PsychologistService.publicProjection()
        ],
        total: [{ $count: "count" }]
      }
    });

    const [result] = await users.aggregate(pipeline).toArray();

    const total = result?.total?.[0]?.count || 0;

    return {
      psychologists: result?.items || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }


  // ====================================================
  // TOP
  // ====================================================
  //
  // Spec section 6: rating DESC lalu ratingCount DESC,
  // hanya yang approved.
  //
  // ====================================================

  async top(limit) {
    const users = await this.users();

    const size = Validator.clampLimit(limit, 4, 20);

    return users
      .aggregate([
        { $match: PsychologistService.approvedMatch() },
        ...PsychologistService.joinProfile(),
        { $sort: DEFAULT_SORT },
        { $limit: size },
        PsychologistService.publicProjection()
      ])
      .toArray();
  }


  // ====================================================
  // DETAIL
  // ====================================================

  async getById(id) {
    const _id = Validator.objectId(id, "ID psikolog");

    const users = await this.users();

    const [psychologist] = await users
      .aggregate([
        {
          $match: {
            _id,
            ...PsychologistService.approvedMatch()
          }
        },
        ...PsychologistService.joinProfile(),
        PsychologistService.publicProjection()
      ])
      .toArray();

    if (!psychologist) {
      // 404 yang SAMA untuk "tidak ada" dan "belum
      // approved": jangan membocorkan keberadaan akun yang
      // belum diverifikasi.
      throw AppError.notFound(
        "Psikolog tidak ditemukan",
        "NOT_FOUND"
      );
    }

    return psychologist;
  }


  // Memastikan psikolog ada DAN approved. Dipakai sebelum
  // membuka jadwal atau menerima booking.
  async requireApproved(id) {
    const _id = Validator.objectId(id, "ID psikolog");

    const users = await this.users();

    const psychologist = await users.findOne({
      _id,
      ...PsychologistService.approvedMatch()
    });

    if (!psychologist) {
      throw AppError.notFound(
        "Psikolog tidak ditemukan",
        "NOT_FOUND"
      );
    }

    return psychologist;
  }


  // ====================================================
  // AVAILABILITY
  // ====================================================
  //
  // Spec section 12: slot tersedia HARUS dari backend.
  // Frontend tidak boleh menentukan sendiri.
  //
  // ====================================================

  async availability(id, date) {
    const psychologist = await this.requireApproved(id);

    const filter = {
      psychologistId: psychologist._id,
      isAvailable: true
    };

    const parsed = Validator.dateString(date, "Tanggal");

    if (parsed) {
      filter.date = parsed;
    } else {
      // Default: dari hari ini ke depan.
      filter.date = { $gte: Validator.today() };
    }

    const schedules = await this.schedules();

    const docs = await schedules
      .find(filter)
      .sort({ date: 1, time: 1 })
      .toArray();

    return docs.map((s) => ({
      id: s._id.toString(),
      date: s.date,
      time: s.time,
      duration: s.duration || 60
    }));
  }


  // ====================================================
  // RATING
  // ====================================================

  async listRatings(id, limit) {
    const psychologistId = Validator.objectId(
      id,
      "ID psikolog"
    );

    const size = Validator.clampLimit(limit, 20, 100);

    const ratings = await this.ratings();

    return ratings
      .aggregate([
        { $match: { psychologistId } },
        { $sort: { createdAt: -1 } },
        { $limit: size },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userArr"
          }
        },
        {
          $project: {
            _id: 0,
            id: { $toString: "$_id" },
            rating: 1,
            review: 1,
            createdAt: 1,
            // Hanya NAMA penulis review yang publik.
            userName: {
              $ifNull: [
                { $arrayElemAt: ["$userArr.name", 0] },
                "Pengguna"
              ]
            }
          }
        }
      ])
      .toArray();
  }


  /*
   * Aturan (spec section 6):
   *
   *   - hanya user yang PERNAH menyelesaikan consultation
   *     dengan psikolog ini yang boleh memberi rating
   *   - satu rating per consultation (unique index)
   *   - rating/ratingCount pada profil DIHITUNG ULANG dari
   *     collection ratings, tidak pernah dikirim client
   */
  async rate(psychologistId, userId, input) {
    const psychId = Validator.objectId(
      psychologistId,
      "ID psikolog"
    );

    const value = Validator.integer(input.rating, "Rating", {
      required: true,
      min: 1,
      max: 5
    });

    const consultationId = Validator.objectId(
      input.consultationId,
      "consultationId"
    );

    const review =
      Validator.string(input.review, "Review", { max: 1000 }) || "";

    const consultations = await this.consultations();


    /*
     * OWNERSHIP: consultation harus MILIK user ini dan
     * dengan psikolog ini.
     *
     * consultationId dari body TIDAK dipercaya tanpa
     * pemeriksaan ini.
     */
    const consultation = await consultations.findOne({
      _id: consultationId,
      userId: new ObjectId(userId),
      psychologistId: psychId
    });

    if (!consultation) {
      throw AppError.notFound(
        "Konsultasi tidak ditemukan",
        "NOT_FOUND"
      );
    }

    if (consultation.status !== "completed") {
      throw AppError.forbidden(
        "Rating hanya bisa diberikan setelah konsultasi selesai",
        "CONSULTATION_NOT_COMPLETED"
      );
    }

    const ratings = await this.ratings();
    const now = BaseService.now();

    await ratings.updateOne(
      { consultationId: consultation._id },
      {
        $set: { rating: value, review, updatedAt: now },
        $setOnInsert: {
          consultationId: consultation._id,
          psychologistId: psychId,
          userId: new ObjectId(userId),
          createdAt: now
        }
      },
      { upsert: true }
    );

    const aggregate = await this.recalculateRating(psychId);

    return { rating: value, ...aggregate };
  }


  /*
   * Hitung ulang agregat rating DARI DATABASE lalu simpan
   * ke profil sebagai field turunan.
   *
   * Dipisah sebagai method sendiri supaya bisa dipanggil
   * ulang (misal setelah rating dihapus) tanpa menyalin
   * logikanya.
   */
  async recalculateRating(psychologistId) {
    const psychId =
      psychologistId instanceof ObjectId
        ? psychologistId
        : new ObjectId(psychologistId);

    const ratings = await this.ratings();

    const [agg] = await ratings
      .aggregate([
        { $match: { psychologistId: psychId } },
        {
          $group: {
            _id: null,
            avg: { $avg: "$rating" },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    const average = agg
      ? Math.round(agg.avg * 10) / 10
      : null;

    const count = agg?.count || 0;

    const profiles = await this.profiles();
    const now = BaseService.now();

    await profiles.updateOne(
      { userId: psychId },
      {
        $set: {
          rating: average,
          ratingCount: count,
          updatedAt: now
        },
        $setOnInsert: { userId: psychId, createdAt: now }
      },
      { upsert: true }
    );

    return {
      psychologistRating: average,
      ratingCount: count
    };
  }
}

export const psychologistService = new PsychologistService();
