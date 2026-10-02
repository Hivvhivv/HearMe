// ======================================================
// HTTP RESPONSE & VALIDATION HELPER
// ======================================================
//
// Spec section 24 meminta format response yang konsisten:
//
//   sukses -> { success: true,  data: ... }
//   error  -> { success: false, message, code }
//
// Dipakai oleh endpoint BARU. Route lama masih memakai
// format { message, ... } dan akan diseragamkan di
// Phase 8 bersama frontend-nya, supaya tidak ada yang
// rusak di tengah jalan.
//
// Tidak ada library validasi di project ini, jadi helper
// validasi ditulis di sini -- satu tempat, bukan dicek
// manual di tiap route.
//
// ======================================================

import { ObjectId } from "mongodb";


// ======================================================
// RESPONSE
// ======================================================

// Data user tidak boleh di-cache browser.
export function noStore(res) {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
}


export function ok(res, data, status = 200) {
  noStore(res);

  return res.status(status).json({
    success: true,
    data
  });
}


export function fail(res, status, message, code) {
  noStore(res);

  return res.status(status).json({
    success: false,
    message,
    ...(code ? { code } : {})
  });
}


// Error tak terduga. Stack trace HANYA ke log server,
// tidak pernah dikirim ke frontend (spec section 24).
export function serverError(res, label, error) {
  console.error(`${label}:`, error);

  return fail(
    res,
    500,
    "Terjadi kesalahan pada server",
    "INTERNAL_ERROR"
  );
}


// ======================================================
// VALIDATION
// ======================================================

export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}


export function isObjectId(value) {
  return (
    typeof value === "string" &&
    ObjectId.isValid(value) &&
    String(new ObjectId(value)) === value
  );
}


// Membersihkan string: pangkas spasi, batasi panjang.
export function str(
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


export function email(value, field = "Email", { required = false } = {}) {
  const parsed = str(value, field, {
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


export function oneOf(value, field, allowed, { required = false } = {}) {
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


// Tanggal format YYYY-MM-DD.
export function dateString(value, field, { required = false } = {}) {
  const parsed = str(value, field, {
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

  const date = new Date(`${parsed}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(
      `${field} bukan tanggal yang valid`,
      field
    );
  }

  return parsed;
}


export function phone(value, field = "Nomor telepon", { required = false } = {}) {
  const parsed = str(value, field, {
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


// ======================================================
// HARGA
// ======================================================
//
// Harga di data existing berupa string tampilan seperti
// "Rp 150.000". Untuk filter dan sort dibutuhkan angka.
//
// Angkanya dihitung SEKALI saat menulis dan disimpan
// sebagai priceValue, bukan diturunkan di dalam
// aggregation. Alasannya:
//
//   - bisa diberi index (filter harga jadi cepat)
//   - tidak bergantung operator aggregation yang rapuh
//     ($split menolak separator kosong, $replaceAll tidak
//      mendukung regex)
//
// ======================================================

export function parsePriceToNumber(price) {
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


// ======================================================
// WHITELIST
// ======================================================
//
// Spec section 2: update HARUS memakai whitelist field.
//
// Field yang tidak ada di daftar DIABAIKAN, bukan
// diteruskan ke MongoDB. Ini yang mencegah privilege
// escalation lewat body seperti:
//
//   { "name": "x", "role": "admin" }
//
// ======================================================

export function pickDefined(source) {
  const out = {};

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }

  return out;
}


// Dipakai di catch block route: ValidationError -> 400.
export function handleValidation(res, error, label) {
  if (error instanceof ValidationError) {
    return fail(
      res,
      400,
      error.message,
      "VALIDATION_ERROR"
    );
  }

  return serverError(res, label, error);
}
