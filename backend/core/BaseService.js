/*
 * ======================================================
 * BASE SERVICE
 * ======================================================
 *
 * Induk semua service (logika bisnis).
 *
 * Aturan yang dipegang semua turunannya:
 *
 *   - TIDAK pernah menyentuh `req` atau `res`
 *   - menerima data biasa, mengembalikan data biasa
 *   - kalau gagal, MELEMPAR AppError
 *
 * Dengan begitu service bisa dipakai dari controller,
 * script migrasi, atau test tanpa Express sama sekali.
 *
 * ======================================================
 */

import { database } from "./Database.js";

export class BaseService {
  constructor(db = database) {
    this.database = db;
  }

  // Shortcut akses collection.
  collection(name) {
    return this.database.collection(name);
  }

  async getDb() {
    return this.database.getDb();
  }

  /*
   * findOneAndUpdate mengembalikan bentuk yang berbeda
   * antar versi driver MongoDB: ada yang { value },
   * ada yang dokumennya langsung.
   *
   * Dinormalkan di satu tempat supaya tiap service tidak
   * mengulang `result?.value || result`.
   */
  static unwrap(result) {
    if (!result) {
      return null;
    }

    return result.value !== undefined ? result.value : result;
  }

  static now() {
    return new Date();
  }
}
