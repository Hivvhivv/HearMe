/*
 * ======================================================
 * USER SERVICE
 * ======================================================
 *
 * Identitas user SELALU berasal dari id yang sudah
 * diverifikasi (JWT), tidak pernah dari body request.
 * Tidak ada method di sini yang menerima "userId" dari
 * sisi klien tanpa diverifikasi lebih dulu oleh caller.
 *
 * ======================================================
 */

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";
import { AppError } from "../core/AppError.js";
import { Validator } from "../core/Validator.js";

const BCRYPT_ROUNDS = 12;


/*
 * Field yang BOLEH diubah user lewat endpoint profil.
 *
 * Yang sengaja TIDAK ada di sini:
 *
 *   role                -> hanya admin
 *   verificationStatus  -> hanya admin/sistem verifikasi
 *   isActive / forumBan -> hanya admin
 *   passwordHash        -> endpoint ganti password sendiri
 *   createdAt / _id     -> internal
 */
const EDITABLE_FIELDS = [
  "name",
  "username",
  "email",
  "gender",
  "birthDate",
  "phoneNumber"
];

const GENDERS = [
  "laki-laki",
  "perempuan",
  "male",
  "female",
  "other",
  "lainnya"
];

// Field profesional psikolog (collection `psychologists`).
const PSYCHOLOGIST_FIELDS = [
  "specialization",
  "experience",
  "price",
  "bio",
  "avatar"
];


export class UserService extends BaseService {

  async users() {
    return this.collection("users");
  }

  async profiles() {
    return this.collection("psychologists");
  }


  // ====================================================
  // BENTUK PUBLIK
  // ====================================================

  static toPublic(user, psychologistProfile = null) {
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


  // Bentuk ringkas untuk response login/register, menjaga
  // kontrak lama (`id` berupa ObjectId, bukan string).
  static toAuthPayload(user) {
    return {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      gender: user.gender,
      birthDate: user.birthDate,
      phoneNumber: user.phoneNumber,
      role: user.role,
      verificationStatus: user.verificationStatus
    };
  }


  // ====================================================
  // READ
  // ====================================================

  async findById(userId, { withPassword = false } = {}) {
    const users = await this.users();

    return users.findOne(
      { _id: new ObjectId(userId) },
      withPassword
        ? undefined
        : { projection: { passwordHash: 0 } }
    );
  }

  async findByEmail(email) {
    const users = await this.users();

    return users.findOne({ email });
  }

  async findPsychologistProfile(userId) {
    const profiles = await this.profiles();

    return profiles.findOne(
      { userId: new ObjectId(userId) },
      { projection: { userId: 0 } }
    );
  }


  async getProfile(userId) {
    const user = await this.findById(userId);

    if (!user) {
      throw AppError.notFound(
        "User tidak ditemukan",
        "USER_NOT_FOUND"
      );
    }

    const profile =
      user.role === "psychologist"
        ? await this.findPsychologistProfile(userId)
        : null;

    return UserService.toPublic(user, profile);
  }


  // ====================================================
  // REGISTER
  // ====================================================

  async register(input) {
    const users = await this.users();

    const email = Validator.email(input.email, "Email", {
      required: true
    });

    const username = Validator.string(
      input.username || input.name,
      "Username",
      { required: true, min: 1, max: 40 }
    );

    const password = Validator.string(
      input.password,
      "Password",
      { required: true, min: 8, max: 200 }
    );

    // Registrasi publik HANYA boleh membuat user atau
    // psychologist. Role admin tidak bisa dibuat dari sini.
    const role = Validator.oneOf(
      input.role || "user",
      "Role",
      ["user", "psychologist"]
    );

    if (!role) {
      throw AppError.forbidden(
        "Invalid registration role",
        "INVALID_ROLE"
      );
    }

    if (
      input.confirmPassword !== undefined &&
      input.password !== input.confirmPassword
    ) {
      throw AppError.badRequest(
        "Passwords do not match",
        "PASSWORD_MISMATCH"
      );
    }

    const birthDate = input.birthDate || input.birthday;
    const phoneNumber = input.phoneNumber || input.contact;

    if (role === "psychologist") {
      if (!input.gender || !birthDate || !phoneNumber) {
        throw AppError.badRequest(
          "Gender, birth date, and phone number are required for psychologists",
          "MISSING_PSYCHOLOGIST_FIELDS"
        );
      }

      Validator.dateString(birthDate, "Birth date", {
        required: true
      });
    }

    if (await this.findByEmail(email)) {
      throw AppError.conflict(
        "Email already registered",
        "EMAIL_TAKEN"
      );
    }

    if (await users.findOne({ username })) {
      throw AppError.conflict(
        "Username already registered",
        "USERNAME_TAKEN"
      );
    }

    const now = BaseService.now();

    const user = {
      name: username,
      username,
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      role,

      // Status verifikasi ditentukan SERVER, bukan request.
      verificationStatus:
        role === "psychologist"
          ? "unverified"
          : "not_required",

      ...(role === "psychologist"
        ? {
            gender: input.gender,
            birthDate,
            phoneNumber
          }
        : {}),

      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const result = await users.insertOne(user);

    return UserService.toAuthPayload({
      ...user,
      _id: result.insertedId
    });
  }


  // ====================================================
  // LOGIN (verifikasi kredensial saja)
  // ====================================================

  async verifyCredentials(email, password) {
    if (!email || !password) {
      throw AppError.badRequest(
        "Email and password are required",
        "MISSING_CREDENTIALS"
      );
    }

    const user = await this.findByEmail(
      String(email).trim().toLowerCase()
    );

    // Pesan yang SAMA untuk email tidak ada dan password
    // salah, supaya tidak bisa dipakai menebak email mana
    // yang terdaftar.
    const invalid = AppError.unauthorized(
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );

    if (!user || !user.isActive) {
      throw invalid;
    }

    const valid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!valid) {
      throw invalid;
    }

    return user;
  }


  // ====================================================
  // UPDATE PROFIL SENDIRI
  // ====================================================

  async updateProfile(userId, body) {
    const raw = Validator.pickAllowed(body, EDITABLE_FIELDS);

    const update = Validator.pickDefined({
      name: Validator.string(raw.name, "Nama", {
        min: 2,
        max: 80
      }),

      username: Validator.string(raw.username, "Username", {
        min: 3,
        max: 40
      }),

      email: Validator.email(raw.email, "Email"),

      gender: Validator.oneOf(
        raw.gender === "" ? undefined : raw.gender,
        "Jenis kelamin",
        GENDERS
      ),

      birthDate: Validator.dateString(
        raw.birthDate,
        "Tanggal lahir"
      ),

      phoneNumber: Validator.phone(
        raw.phoneNumber,
        "Nomor telepon"
      )
    });

    if (Object.keys(update).length === 0) {
      throw AppError.badRequest(
        "Tidak ada field yang bisa diperbarui",
        "NO_VALID_FIELDS"
      );
    }

    const users = await this.users();

    const _id = new ObjectId(userId);


    // Email dan username harus unique. Dicek lebih dulu
    // agar pesannya jelas; unique index tetap menjaga dari
    // race condition.
    if (update.email) {
      const taken = await users.findOne({
        email: update.email,
        _id: { $ne: _id }
      });

      if (taken) {
        throw AppError.conflict(
          "Email sudah digunakan akun lain",
          "EMAIL_TAKEN"
        );
      }
    }

    if (update.username) {
      const taken = await users.findOne({
        username: update.username,
        _id: { $ne: _id }
      });

      if (taken) {
        throw AppError.conflict(
          "Username sudah digunakan akun lain",
          "USERNAME_TAKEN"
        );
      }
    }

    const result = await users.findOneAndUpdate(
      { _id },
      { $set: { ...update, updatedAt: BaseService.now() } },
      {
        returnDocument: "after",
        projection: { passwordHash: 0 }
      }
    );

    const user = BaseService.unwrap(result);

    if (!user) {
      throw AppError.notFound(
        "User tidak ditemukan",
        "USER_NOT_FOUND"
      );
    }

    const profile =
      user.role === "psychologist"
        ? await this.findPsychologistProfile(userId)
        : null;

    return UserService.toPublic(user, profile);
  }


  // ====================================================
  // GANTI PASSWORD
  // ====================================================
  //
  // Dipisahkan dari endpoint profil (spec section 4) dan
  // WAJIB memverifikasi password lama.
  //
  // ====================================================

  async changePassword(userId, currentPassword, newPassword) {
    const current = Validator.string(
      currentPassword,
      "Password saat ini",
      { required: true, max: 200 }
    );

    const next = Validator.string(
      newPassword,
      "Password baru",
      { required: true, min: 8, max: 200 }
    );

    if (current === next) {
      throw AppError.badRequest(
        "Password baru harus berbeda dari password saat ini",
        "SAME_PASSWORD"
      );
    }

    const user = await this.findById(userId, {
      withPassword: true
    });

    if (!user) {
      throw AppError.notFound(
        "User tidak ditemukan",
        "USER_NOT_FOUND"
      );
    }

    const valid = await bcrypt.compare(
      current,
      user.passwordHash
    );

    if (!valid) {
      throw AppError.badRequest(
        "Password saat ini salah",
        "WRONG_PASSWORD"
      );
    }

    const users = await this.users();

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          passwordHash: await bcrypt.hash(next, BCRYPT_ROUNDS),
          updatedAt: BaseService.now()
        }
      }
    );
  }


  // ====================================================
  // PROFIL PROFESIONAL PSIKOLOG
  // ====================================================
  //
  // Disimpan di collection `psychologists`, direferensikan
  // lewat userId -- BUKAN di dokumen users.
  //
  // rating / ratingCount TIDAK bisa diubah dari sini:
  // keduanya field turunan yang dihitung dari review.
  //
  // ====================================================

  async updatePsychologistProfile(userId, body) {
    const raw = Validator.pickAllowed(
      body,
      PSYCHOLOGIST_FIELDS
    );

    const update = Validator.pickDefined({
      specialization: Validator.string(
        raw.specialization,
        "Spesialisasi",
        { max: 120 }
      ),
      experience: Validator.string(
        raw.experience,
        "Pengalaman",
        { max: 120 }
      ),
      price: Validator.string(raw.price, "Harga", {
        max: 60
      }),
      bio: Validator.string(raw.bio, "Bio", { max: 2000 }),
      avatar: Validator.string(raw.avatar, "Avatar", {
        max: 2000
      })
    });

    if (Object.keys(update).length === 0) {
      throw AppError.badRequest(
        "Tidak ada field yang bisa diperbarui",
        "NO_VALID_FIELDS"
      );
    }

    // Harga disimpan juga sebagai angka supaya filter dan
    // sort harga bisa dikerjakan database dengan index.
    if (update.price !== undefined) {
      update.priceValue = Validator.parsePrice(update.price);
    }

    const profiles = await this.profiles();

    const _id = new ObjectId(userId);
    const now = BaseService.now();

    const result = await profiles.findOneAndUpdate(
      { userId: _id },
      {
        $set: { ...update, updatedAt: now },
        $setOnInsert: { userId: _id, createdAt: now }
      },
      {
        upsert: true,
        returnDocument: "after",
        projection: { userId: 0 }
      }
    );

    return BaseService.unwrap(result);
  }


  // ====================================================
  // ADMIN
  // ====================================================

  async setActive(targetUserId, isActive) {
    if (typeof isActive !== "boolean") {
      throw AppError.badRequest(
        "isActive must be boolean",
        "VALIDATION_ERROR"
      );
    }

    const users = await this.users();

    const result = await users.updateOne(
      { _id: Validator.objectId(targetUserId, "User ID") },
      { $set: { isActive, updatedAt: BaseService.now() } }
    );

    if (!result.matchedCount) {
      throw AppError.notFound(
        "User not found",
        "USER_NOT_FOUND"
      );
    }
  }


  async setVerificationStatus(targetUserId, status) {
    const valid = Validator.oneOf(
      status,
      "Verification status",
      ["approved", "rejected", "pending"],
      { required: true }
    );

    const users = await this.users();

    const result = await users.updateOne(
      {
        _id: Validator.objectId(targetUserId, "User ID"),
        role: "psychologist"
      },
      {
        $set: {
          verificationStatus: valid,
          updatedAt: BaseService.now()
        }
      }
    );

    if (!result.matchedCount) {
      throw AppError.notFound(
        "Psychologist account not found",
        "PSYCHOLOGIST_NOT_FOUND"
      );
    }

    return valid;
  }


  async listPsychologists() {
    const users = await this.users();

    return users
      .find(
        { role: "psychologist" },
        { projection: { passwordHash: 0 } }
      )
      .sort({ createdAt: -1 })
      .toArray();
  }
}

export const userService = new UserService();
