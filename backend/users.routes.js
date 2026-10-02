import express from "express";
import { ObjectId } from "mongodb";

import { getDb } from "./db.js";
import { authenticate, authorize } from "./auth.middleware.js";

import {
  dateString,
  email as validateEmail,
  fail,
  handleValidation,
  ok,
  oneOf,
  parsePriceToNumber,
  phone,
  pickDefined,
  str
} from "./http.js";

const router = express.Router();


// ======================================================
// USER PROFILE
// ======================================================
//
// Spec section 4.
//
// Identitas user SELALU diambil dari req.user.sub (JWT),
// tidak pernah dari body. Tidak ada endpoint untuk
// mengubah profil user lain -- resource-nya selalu "me".
//
// ======================================================


// Field yang BOLEH diubah user lewat endpoint ini.
// Semua field lain diabaikan (lihat buildUserUpdate).
//
// Yang sengaja TIDAK ada di sini:
//
//   role                 -> hanya admin
//   verificationStatus   -> hanya admin/sistem verifikasi
//   isActive / forumBan  -> hanya admin
//   passwordHash         -> endpoint ganti password sendiri
//   createdAt / _id      -> internal
//
const EDITABLE_FIELDS = [
  "name",
  "username",
  "email",
  "gender",
  "birthDate",
  "phoneNumber"
];


function publicUser(user, psychologistProfile = null) {
  return {
    id: user._id.toString(),
    name: user.name || "",
    username: user.username || "",
    email: user.email,
    gender: user.gender || "",
    birthDate: user.birthDate || "",
    phoneNumber: user.phoneNumber || "",
    role: user.role,
    verificationStatus: user.verificationStatus,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,

    ...(psychologistProfile
      ? { psychologistProfile }
      : {})
  };
}


async function findPsychologistProfile(db, userId) {
  return db.collection("psychologists").findOne(
    { userId },
    { projection: { userId: 0 } }
  );
}


// ======================================================
// GET /api/users/me
// ======================================================

router.get("/me", authenticate, async (req, res) => {
  try {
    const db = await getDb();

    const userId = new ObjectId(req.user.sub);

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return fail(res, 404, "User tidak ditemukan", "USER_NOT_FOUND");
    }

    const profile =
      user.role === "psychologist"
        ? await findPsychologistProfile(db, userId)
        : null;

    return ok(res, { user: publicUser(user, profile) });

  } catch (error) {
    return handleValidation(res, error, "Get own profile error");
  }
});


// ======================================================
// PATCH /api/users/me
// ======================================================

function buildUserUpdate(body) {
  // Hanya field di EDITABLE_FIELDS yang dibaca.
  const raw = {};

  for (const key of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      raw[key] = body[key];
    }
  }

  const update = pickDefined({
    name: str(raw.name, "Nama", { min: 2, max: 80 }),

    username: str(raw.username, "Username", {
      min: 3,
      max: 40
    }),

    email: validateEmail(raw.email, "Email"),

    gender: oneOf(
      raw.gender === "" ? undefined : raw.gender,
      "Jenis kelamin",
      [
        "laki-laki",
        "perempuan",
        "male",
        "female",
        "other",
        "lainnya"
      ]
    ),

    birthDate: dateString(raw.birthDate, "Tanggal lahir"),

    phoneNumber: phone(raw.phoneNumber, "Nomor telepon")
  });

  return update;
}


router.patch("/me", authenticate, async (req, res) => {
  try {
    const body = req.body || {};

    const update = buildUserUpdate(body);

    if (Object.keys(update).length === 0) {
      return fail(
        res,
        400,
        "Tidak ada field yang bisa diperbarui",
        "NO_VALID_FIELDS"
      );
    }

    const db = await getDb();

    const userId = new ObjectId(req.user.sub);


    // ------------------------------------------------
    // EMAIL HARUS UNIQUE
    //
    // Dicek lebih dulu agar pesannya jelas, dan tetap
    // ditangkap sebagai 409 dari unique index kalau ada
    // race condition.
    // ------------------------------------------------

    if (update.email) {
      const taken = await db.collection("users").findOne({
        email: update.email,
        _id: { $ne: userId }
      });

      if (taken) {
        return fail(
          res,
          409,
          "Email sudah digunakan akun lain",
          "EMAIL_TAKEN"
        );
      }
    }

    if (update.username) {
      const taken = await db.collection("users").findOne({
        username: update.username,
        _id: { $ne: userId }
      });

      if (taken) {
        return fail(
          res,
          409,
          "Username sudah digunakan akun lain",
          "USERNAME_TAKEN"
        );
      }
    }

    const result = await db.collection("users").findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          ...update,
          updatedAt: new Date()
        }
      },
      {
        returnDocument: "after",
        projection: { passwordHash: 0 }
      }
    );

    const user = result?.value || result;

    if (!user) {
      return fail(res, 404, "User tidak ditemukan", "USER_NOT_FOUND");
    }

    const profile =
      user.role === "psychologist"
        ? await findPsychologistProfile(db, userId)
        : null;

    return ok(res, { user: publicUser(user, profile) });

  } catch (error) {
    if (error?.code === 11000) {
      return fail(
        res,
        409,
        "Email atau username sudah digunakan",
        "DUPLICATE_KEY"
      );
    }

    return handleValidation(res, error, "Update own profile error");
  }
});


// ======================================================
// PATCH /api/users/me/password
// ======================================================
//
// Ganti password dipisahkan dari endpoint profil
// (spec section 4: password tidak boleh lewat endpoint
// profil biasa) dan WAJIB memverifikasi password lama.
//
// ======================================================

router.patch(
  "/me/password",
  authenticate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body || {};

      const current = str(currentPassword, "Password saat ini", {
        required: true,
        max: 200
      });

      const next = str(newPassword, "Password baru", {
        required: true,
        min: 8,
        max: 200
      });

      if (current === next) {
        return fail(
          res,
          400,
          "Password baru harus berbeda dari password saat ini",
          "SAME_PASSWORD"
        );
      }

      const bcrypt = await import("bcryptjs");

      const db = await getDb();

      const userId = new ObjectId(req.user.sub);

      const user = await db
        .collection("users")
        .findOne({ _id: userId });

      if (!user) {
        return fail(res, 404, "User tidak ditemukan", "USER_NOT_FOUND");
      }

      const valid = await bcrypt.default.compare(
        current,
        user.passwordHash
      );

      if (!valid) {
        return fail(
          res,
          400,
          "Password saat ini salah",
          "WRONG_PASSWORD"
        );
      }

      await db.collection("users").updateOne(
        { _id: userId },
        {
          $set: {
            passwordHash: await bcrypt.default.hash(next, 12),
            updatedAt: new Date()
          }
        }
      );

      return ok(res, {
        message: "Password berhasil diperbarui"
      });

    } catch (error) {
      return handleValidation(res, error, "Change password error");
    }
  }
);


// ======================================================
// PATCH /api/users/me/psychologist-profile
// ======================================================
//
// Field profesional psikolog (spesialisasi, harga, bio)
// disimpan di collection `psychologists`, direferensikan
// lewat userId -- BUKAN di dokumen users.
//
// Ini memperbaiki bug nyata: PsychologistProfilePage
// memanggil PATCH /api/psychologists/me yang tidak pernah
// ada di backend, sehingga simpan profil selalu 404.
//
// Field rating/verificationStatus TIDAK boleh diubah dari
// sini -- rating dihitung dari review, status hanya oleh
// admin.
//
// ======================================================

const PSYCHOLOGIST_FIELDS = [
  "specialization",
  "experience",
  "price",
  "bio",
  "avatar"
];


router.patch(
  "/me/psychologist-profile",
  authenticate,
  authorize("psychologist"),
  async (req, res) => {
    try {
      const body = req.body || {};

      const raw = {};

      for (const key of PSYCHOLOGIST_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          raw[key] = body[key];
        }
      }

      const update = pickDefined({
        specialization: str(raw.specialization, "Spesialisasi", {
          max: 120
        }),

        experience: str(raw.experience, "Pengalaman", {
          max: 120
        }),

        price: str(raw.price, "Harga", { max: 60 }),

        bio: str(raw.bio, "Bio", { max: 2000 }),

        avatar: str(raw.avatar, "Avatar", { max: 2000 })
      });

      if (Object.keys(update).length === 0) {
        return fail(
          res,
          400,
          "Tidak ada field yang bisa diperbarui",
          "NO_VALID_FIELDS"
        );
      }

      // Simpan juga harga sebagai angka, supaya filter dan
      // sort harga bisa dikerjakan database dengan index.
      if (update.price !== undefined) {
        update.priceValue = parsePriceToNumber(update.price);
      }

      const db = await getDb();

      const userId = new ObjectId(req.user.sub);

      const now = new Date();

      const result = await db
        .collection("psychologists")
        .findOneAndUpdate(
          { userId },
          {
            $set: {
              ...update,
              updatedAt: now
            },
            $setOnInsert: {
              userId,
              createdAt: now
            }
          },
          {
            upsert: true,
            returnDocument: "after",
            projection: { userId: 0 }
          }
        );

      return ok(res, {
        psychologistProfile: result?.value || result
      });

    } catch (error) {
      if (error?.code === 11000) {
        return fail(
          res,
          409,
          "Profil psikolog sudah ada",
          "DUPLICATE_KEY"
        );
      }

      return handleValidation(
        res,
        error,
        "Update psychologist profile error"
      );
    }
  }
);


export default router;
