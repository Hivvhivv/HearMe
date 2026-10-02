import express from "express";
import { ObjectId } from "mongodb";

import { getDb } from "./db.js";
import { authenticate } from "./auth.middleware.js";

import {
  fail,
  handleValidation,
  isObjectId,
  ok,
  str,
  ValidationError
} from "./http.js";

const router = express.Router();


// ======================================================
// PSYCHOLOGIST (PUBLIC / USER)
// ======================================================
//
// SUMBER KEBENARAN:
//
//   users         -> identitas + role + verificationStatus
//   psychologists -> profil profesional (userId -> users)
//
// Hanya psikolog dengan:
//
//   role                = "psychologist"
//   verificationStatus  = "approved"
//   isActive            != false
//
// yang boleh tampil ke user. Dijamin di tahap $match
// pertama aggregation, bukan difilter di frontend.
//
// Sebelumnya halaman psikolog membaca src/data/mockData.ts
// dan status approve dibaca dari localStorage, sehingga
// bisa dimanipulasi dari browser.
//
// ======================================================


// Pipeline dasar: user approved + profilnya.
function basePipeline() {
  return [
    {
      $match: {
        role: "psychologist",
        verificationStatus: "approved",
        isActive: { $ne: false }
      }
    },
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
          $ifNull: [
            { $arrayElemAt: ["$profileArr", 0] },
            {}
          ]
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


// Bentuk response publik.
//
// passwordHash, email, dan field internal TIDAK ikut.
// Email psikolog bukan informasi publik.
function publicProjection() {
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
      ratingCount: {
        $ifNull: ["$profile.ratingCount", 0]
      },
      available: {
        $ifNull: ["$profile.available", true]
      }
    }
  };
}


// ======================================================
// GET /api/psychologists
// ======================================================
//
// Filter dikerjakan di DATABASE (spec section 10), bukan
// di frontend, supaya tetap benar saat datanya banyak.
//
// Query:
//   search, specialization, minRating, maxPrice,
//   availableOnly, sort, page, limit
//
// ======================================================

router.get("/", authenticate, async (req, res) => {
  try {
    const db = await getDb();

    const {
      search,
      specialization,
      minRating,
      maxPrice,
      availableOnly,
      sort
    } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 24, 1),
      100
    );

    const pipeline = basePipeline();

    const postMatch = {};

    if (
      typeof specialization === "string" &&
      specialization.trim() &&
      specialization !== "Semua"
    ) {
      postMatch["profile.specialization"] =
        specialization.trim();
    }

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      // Escape supaya input user tidak dianggap regex.
      const safe = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

    if (minRating !== undefined && minRating !== "") {
      const value = Number(minRating);

      if (Number.isNaN(value) || value < 0 || value > 5) {
        throw new ValidationError(
          "minRating harus angka 0-5",
          "minRating"
        );
      }

      postMatch["profile.rating"] = { $gte: value };
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const value = Number(maxPrice);

      if (Number.isNaN(value) || value < 0) {
        throw new ValidationError(
          "maxPrice harus angka positif",
          "maxPrice"
        );
      }

      postMatch.priceValue = { $lte: value, $ne: null };
    }

    if (availableOnly === "true") {
      postMatch["profile.available"] = { $ne: false };
    }

    if (Object.keys(postMatch).length > 0) {
      pipeline.push({ $match: postMatch });
    }


    // ----------------------------------------------------
    // SORT
    // ----------------------------------------------------

    const sortMap = {
      rating: { "profile.rating": -1, "profile.ratingCount": -1 },
      "price-asc": { priceValue: 1 },
      "price-desc": { priceValue: -1 },
      name: { name: 1 },
      newest: { createdAt: -1 }
    };

    pipeline.push({
      $sort:
        sortMap[sort] || {
          "profile.rating": -1,
          "profile.ratingCount": -1,
          name: 1
        }
    });


    // ----------------------------------------------------
    // PAGINATION + TOTAL dalam satu round trip
    // ----------------------------------------------------

    pipeline.push({
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          publicProjection()
        ],
        total: [{ $count: "count" }]
      }
    });

    const [result] = await db
      .collection("users")
      .aggregate(pipeline)
      .toArray();

    const total = result?.total?.[0]?.count || 0;

    return ok(res, {
      psychologists: result?.items || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });

  } catch (error) {
    return handleValidation(
      res,
      error,
      "List psychologists error"
    );
  }
});


// ======================================================
// GET /api/psychologists/top
// ======================================================
//
// Spec section 6: urut rating DESC lalu ratingCount DESC,
// hanya yang approved.
//
// ======================================================

router.get("/top", authenticate, async (req, res) => {
  try {
    const db = await getDb();

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 4, 1),
      20
    );

    const pipeline = [
      ...basePipeline(),
      {
        $sort: {
          "profile.rating": -1,
          "profile.ratingCount": -1,
          name: 1
        }
      },
      { $limit: limit },
      publicProjection()
    ];

    const psychologists = await db
      .collection("users")
      .aggregate(pipeline)
      .toArray();

    return ok(res, { psychologists });

  } catch (error) {
    return handleValidation(
      res,
      error,
      "Top psychologists error"
    );
  }
});


// ======================================================
// GET /api/psychologists/:id
// ======================================================

router.get("/:id", authenticate, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return fail(
        res,
        400,
        "ID psikolog tidak valid",
        "INVALID_ID"
      );
    }

    const db = await getDb();

    const pipeline = [
      {
        $match: {
          _id: new ObjectId(req.params.id),
          role: "psychologist",
          verificationStatus: "approved",
          isActive: { $ne: false }
        }
      },
      ...basePipeline().slice(1),
      publicProjection()
    ];

    const [psychologist] = await db
      .collection("users")
      .aggregate(pipeline)
      .toArray();

    if (!psychologist) {
      // 404 yang sama untuk "tidak ada" dan "belum
      // approved": jangan membocorkan keberadaan akun
      // yang belum diverifikasi.
      return fail(
        res,
        404,
        "Psikolog tidak ditemukan",
        "NOT_FOUND"
      );
    }

    return ok(res, { psychologist });

  } catch (error) {
    return handleValidation(
      res,
      error,
      "Get psychologist error"
    );
  }
});


// ======================================================
// GET /api/psychologists/:id/availability
// ======================================================
//
// Spec section 12: slot tersedia HARUS dari backend.
//
// Slot yang dikembalikan adalah schedule milik psikolog
// yang isAvailable dan belum lewat. Frontend tidak boleh
// menentukan sendiri.
//
// ======================================================

router.get(
  "/:id/availability",
  authenticate,
  async (req, res) => {
    try {
      if (!isObjectId(req.params.id)) {
        return fail(
          res,
          400,
          "ID psikolog tidak valid",
          "INVALID_ID"
        );
      }

      const db = await getDb();

      const psychId = new ObjectId(req.params.id);

      // Psikolog harus ada DAN approved, kalau tidak
      // jangan bocorkan jadwalnya.
      const psychologist = await db
        .collection("users")
        .findOne({
          _id: psychId,
          role: "psychologist",
          verificationStatus: "approved",
          isActive: { $ne: false }
        });

      if (!psychologist) {
        return fail(
          res,
          404,
          "Psikolog tidak ditemukan",
          "NOT_FOUND"
        );
      }

      const filter = {
        psychologistId: psychId,
        isAvailable: true
      };

      const date = str(req.query.date, "Tanggal", {
        max: 10
      });

      if (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return fail(
            res,
            400,
            "Tanggal harus berformat YYYY-MM-DD",
            "VALIDATION_ERROR"
          );
        }

        filter.date = date;
      } else {
        // Default: dari hari ini ke depan.
        filter.date = {
          $gte: new Date().toISOString().slice(0, 10)
        };
      }

      const schedules = await db
        .collection("schedules")
        .find(filter)
        .sort({ date: 1, time: 1 })
        .toArray();

      return ok(res, {
        slots: schedules.map((s) => ({
          id: s._id.toString(),
          date: s.date,
          time: s.time,
          duration: s.duration || 60
        }))
      });

    } catch (error) {
      return handleValidation(
        res,
        error,
        "Get availability error"
      );
    }
  }
);


// ======================================================
// GET /api/psychologists/:id/ratings
// ======================================================

router.get(
  "/:id/ratings",
  authenticate,
  async (req, res) => {
    try {
      if (!isObjectId(req.params.id)) {
        return fail(
          res,
          400,
          "ID psikolog tidak valid",
          "INVALID_ID"
        );
      }

      const db = await getDb();

      const limit = Math.min(
        Math.max(Number(req.query.limit) || 20, 1),
        100
      );

      const ratings = await db
        .collection("psychologist_ratings")
        .aggregate([
          {
            $match: {
              psychologistId: new ObjectId(req.params.id)
            }
          },
          { $sort: { createdAt: -1 } },
          { $limit: limit },
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
              // Hanya nama penulis review yang publik.
              userName: {
                $ifNull: [
                  {
                    $arrayElemAt: ["$userArr.name", 0]
                  },
                  "Pengguna"
                ]
              }
            }
          }
        ])
        .toArray();

      return ok(res, { ratings });

    } catch (error) {
      return handleValidation(
        res,
        error,
        "Get ratings error"
      );
    }
  }
);


// ======================================================
// POST /api/psychologists/:id/ratings
// ======================================================
//
// Aturan (spec section 6):
//
//   - hanya user yang PERNAH menyelesaikan consultation
//     dengan psikolog ini yang boleh memberi rating
//   - satu rating per consultation (unique index)
//   - rating/ratingCount pada profil dihitung ULANG dari
//     collection ratings, tidak pernah dikirim client
//
// ======================================================

router.post(
  "/:id/ratings",
  authenticate,
  async (req, res) => {
    try {
      if (!isObjectId(req.params.id)) {
        return fail(
          res,
          400,
          "ID psikolog tidak valid",
          "INVALID_ID"
        );
      }

      const { rating, review, consultationId } =
        req.body || {};

      const value = Number(rating);

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      ) {
        return fail(
          res,
          400,
          "Rating harus angka bulat 1-5",
          "VALIDATION_ERROR"
        );
      }

      if (!isObjectId(consultationId)) {
        return fail(
          res,
          400,
          "consultationId tidak valid",
          "VALIDATION_ERROR"
        );
      }

      const reviewText = str(review, "Review", {
        max: 1000
      });

      const db = await getDb();

      const userId = new ObjectId(req.user.sub);
      const psychId = new ObjectId(req.params.id);


      // ----------------------------------------------
      // OWNERSHIP: consultation harus MILIK user ini
      // dan dengan psikolog ini, serta sudah selesai.
      //
      // consultationId dari body TIDAK dipercaya tanpa
      // pemeriksaan ini.
      // ----------------------------------------------

      const consultation = await db
        .collection("consultations")
        .findOne({
          _id: new ObjectId(consultationId),
          userId,
          psychologistId: psychId
        });

      if (!consultation) {
        return fail(
          res,
          404,
          "Konsultasi tidak ditemukan",
          "NOT_FOUND"
        );
      }

      if (consultation.status !== "completed") {
        return fail(
          res,
          403,
          "Rating hanya bisa diberikan setelah konsultasi selesai",
          "CONSULTATION_NOT_COMPLETED"
        );
      }

      const now = new Date();

      await db
        .collection("psychologist_ratings")
        .updateOne(
          {
            consultationId: consultation._id
          },
          {
            $set: {
              rating: value,
              review: reviewText || "",
              updatedAt: now
            },
            $setOnInsert: {
              consultationId: consultation._id,
              psychologistId: psychId,
              userId,
              createdAt: now
            }
          },
          { upsert: true }
        );


      // ----------------------------------------------
      // HITUNG ULANG agregat dari database.
      // ----------------------------------------------

      const [agg] = await db
        .collection("psychologist_ratings")
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

      await db.collection("psychologists").updateOne(
        { userId: psychId },
        {
          $set: {
            rating: average,
            ratingCount: agg?.count || 0,
            updatedAt: now
          },
          $setOnInsert: {
            userId: psychId,
            createdAt: now
          }
        },
        { upsert: true }
      );

      return ok(
        res,
        {
          rating: value,
          psychologistRating: average,
          ratingCount: agg?.count || 0
        },
        201
      );

    } catch (error) {
      if (error?.code === 11000) {
        return fail(
          res,
          409,
          "Konsultasi ini sudah diberi rating",
          "ALREADY_RATED"
        );
      }

      return handleValidation(
        res,
        error,
        "Create rating error"
      );
    }
  }
);


export default router;
