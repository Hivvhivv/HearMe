/*
 * ======================================================
 * VALIDATOR
 * ======================================================
 *
 * Satu tempat untuk semua validasi input. Project ini
 * tidak memakai library validasi (zod/joi), jadi kelas
 * ini yang menggantikannya.
 *
 * Semua method bersifat static dan MELEMPAR
 * ValidationError bila tidak valid -- jadi controller
 * cukup membungkus dengan satu try/catch, bukan memeriksa
 * nilai kembalian satu per satu.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { ValidationError } from "./AppError.js";

export class Validator {

  // ====================================================
  // OBJECT ID
  // ====================================================

  static isObjectId(value) {
    return (
      typeof value === "string" &&
      ObjectId.isValid(value) &&
      String(new ObjectId(value)) === value
    );
  }


  static objectId(value, field = "ID") {
    if (!Validator.isObjectId(value)) {
      throw new ValidationError(
        `${field} tidak valid`,
        field
      );
    }

    return new ObjectId(value);
  }


  // ====================================================
  // STRING
  // ====================================================

  static string(
    value,
    field,
    { required = false, min = 0, max = 500 } = {}
  ) {
    if (value === undefined || value === null) {
      if (required) {
        throw new ValidationError(
          `${field} wajib diisi`,
          field
        );
      }
      return undefined;
    }

    if (typeof value !== "string") {
      throw new ValidationError(
        `${field} harus berupa teks`,
        field
      );
    }

    const trimmed = value.trim();

    if (required && !trimmed) {
      throw new ValidationError(
        `${field} wajib diisi`,
        field
      );
    }

    if (trimmed && trimmed.length < min) {
      throw new ValidationError(
        `${field} minimal ${min} karakter`,
        field
      );
    }

    if (trimmed.length > max) {
      throw new ValidationError(
        `${field} maksimal ${max} karakter`,
        field
      );
    }

    return trimmed;
  }


  // ====================================================
  // EMAIL
  // ====================================================

  static email(value, field = "Email", { required = false } = {}) {
    const parsed = Validator.string(value, field, {
      required,
      max: 254
    });

    if (parsed === undefined || parsed === "") {
      return parsed;
    }

    const normalized = parsed.toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
      throw new ValidationError(
        "Format email tidak valid",
        field
      );
    }

    return normalized;
  }


  // ====================================================
  // ENUM
  // ====================================================

  static oneOf(value, field, allowed, { required = false } = {}) {
    if (value === undefined || value === null || value === "") {
      if (required) {
        throw new ValidationError(
          `${field} wajib diisi`,
          field
        );
      }
      return undefined;
    }

    if (!allowed.includes(value)) {
      throw new ValidationError(
        `${field} harus salah satu dari: ${allowed.join(", ")}`,
        field
      );
    }

    return value;
  }


  // ====================================================
  // TANGGAL & WAKTU
  // ====================================================

  static dateString(value, field, { required = false } = {}) {
    const parsed = Validator.string(value, field, {
      required,
      max: 10
    });

    if (parsed === undefined || parsed === "") {
      return parsed;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      throw new ValidationError(
        `${field} harus berformat YYYY-MM-DD`,
        field
      );
    }

    if (Number.isNaN(new Date(`${parsed}T00:00:00Z`).getTime())) {
      throw new ValidationError(
        `${field} bukan tanggal yang valid`,
        field
      );
    }

    return parsed;
  }


  static timeString(value, field, { required = false } = {}) {
    const parsed = Validator.string(value, field, {
      required,
      max: 5
    });

    if (parsed === undefined || parsed === "") {
      return parsed;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(parsed)) {
      throw new ValidationError(
        `${field} harus berformat HH:MM`,
        field
      );
    }

    return parsed;
  }


  // ====================================================
  // ANGKA
  // ====================================================

  static integer(
    value,
    field,
    { required = false, min, max } = {}
  ) {
    if (value === undefined || value === null || value === "") {
      if (required) {
        throw new ValidationError(
          `${field} wajib diisi`,
          field
        );
      }
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
      throw new ValidationError(
        `${field} harus angka bulat`,
        field
      );
    }

    if (min !== undefined && parsed < min) {
      throw new ValidationError(
        `${field} minimal ${min}`,
        field
      );
    }

    if (max !== undefined && parsed > max) {
      throw new ValidationError(
        `${field} maksimal ${max}`,
        field
      );
    }

    return parsed;
  }


  static number(
    value,
    field,
    { required = false, min, max } = {}
  ) {
    if (value === undefined || value === null || value === "") {
      if (required) {
        throw new ValidationError(
          `${field} wajib diisi`,
          field
        );
      }
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      throw new ValidationError(
        `${field} harus berupa angka`,
        field
      );
    }

    if (min !== undefined && parsed < min) {
      throw new ValidationError(
        `${field} minimal ${min}`,
        field
      );
    }

    if (max !== undefined && parsed > max) {
      throw new ValidationError(
        `${field} maksimal ${max}`,
        field
      );
    }

    return parsed;
  }


  // Batas halaman/limit, selalu dalam rentang aman.
  static clampLimit(value, fallback, max) {
    const parsed = Number(value) || fallback;

    return Math.min(Math.max(parsed, 1), max);
  }


  // ====================================================
  // TELEPON
  // ====================================================

  static phone(
    value,
    field = "Nomor telepon",
    { required = false } = {}
  ) {
    const parsed = Validator.string(value, field, {
      required,
      max: 32
    });

    if (parsed === undefined || parsed === "") {
      return parsed;
    }

    if (!/^[+0-9()\s-]{6,32}$/.test(parsed)) {
      throw new ValidationError(
        `${field} tidak valid`,
        field
      );
    }

    return parsed;
  }


  // ====================================================
  // HELPER
  // ====================================================

  // Buang key yang bernilai undefined, supaya $set tidak
  // menulis field kosong ke MongoDB.
  static pickDefined(source) {
    const out = {};

    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined) {
        out[key] = value;
      }
    }

    return out;
  }


  /*
   * WHITELIST
   *
   * Hanya field yang didaftarkan yang dibaca dari body.
   * Inilah yang mencegah privilege escalation seperti:
   *
   *   { "name": "x", "role": "admin" }
   *
   * Field di luar daftar DIABAIKAN, bukan diteruskan ke
   * database.
   */
  static pickAllowed(body, allowedFields) {
    const out = {};

    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        out[key] = body[key];
      }
    }

    return out;
  }


  // Escape input user sebelum dipakai sebagai regex,
  // supaya tidak bisa menyuntikkan pola.
  static escapeRegex(value) {
    return String(value).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }


  // Harga tampilan ("Rp 150.000") -> angka, untuk filter
  // dan sort yang bisa di-index.
  static parsePrice(price) {
    if (typeof price !== "string") {
      return null;
    }

    const digits = price.replace(/[^0-9]/g, "");

    if (!digits) {
      return null;
    }

    const value = Number(digits);

    return Number.isFinite(value) ? value : null;
  }


  static today() {
    return new Date().toISOString().slice(0, 10);
  }
}
