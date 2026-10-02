/*
 * ======================================================
 * BASE CONTROLLER
 * ======================================================
 *
 * Induk semua controller (lapisan HTTP).
 *
 * Tanggung jawabnya hanya tiga:
 *
 *   1. membaca request
 *   2. memanggil service
 *   3. membentuk response
 *
 * Tidak ada query MongoDB di controller.
 *
 * `handle()` membungkus setiap method agar:
 *
 *   - AppError  -> status + kode dari error itu
 *   - error lain -> 500 generik, stack trace HANYA ke log
 *     server (spec section 24: jangan kirim stack trace
 *     atau detail database ke frontend)
 *   - `this` tetap terikat ke instance controller
 *
 * ======================================================
 */

import { AppError } from "./AppError.js";

export class BaseController {

  // ====================================================
  // RESPONSE
  // ====================================================
  //
  // Format konsisten (spec section 24):
  //
  //   sukses -> { success: true,  data }
  //   gagal  -> { success: false, message, code }
  //
  // ====================================================

  // Data user tidak boleh di-cache browser, supaya data
  // lama tidak muncul lagi setelah logout (termasuk dari
  // back/forward cache).
  noStore(res) {
    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");
  }

  ok(res, data, status = 200) {
    this.noStore(res);

    return res.status(status).json({
      success: true,
      data
    });
  }

  fail(res, status, message, code) {
    this.noStore(res);

    return res.status(status).json({
      success: false,
      message,
      ...(code ? { code } : {})
    });
  }


  /*
   * LEGACY RESPONSE
   *
   * Sebagian endpoint lama membalas { message, ... } tanpa
   * pembungkus `success`, dan frontend-nya membaca bentuk
   * itu. Dipertahankan apa adanya supaya refactor ini
   * tidak mengubah kontrak API.
   */
  legacy(res, body, status = 200) {
    this.noStore(res);

    return res.status(status).json(body);
  }


  // ====================================================
  // HANDLE
  // ====================================================

  handle(method) {
    return async (req, res, next) => {
      try {
        await method.call(this, req, res, next);
      } catch (error) {
        this.onError(res, error, method.name);
      }
    };
  }


  onError(res, error, label = "Request") {
    // Duplicate key MongoDB -> 409, bukan 500.
    if (error?.code === 11000) {
      return this.fail(
        res,
        409,
        "Data sudah ada",
        "DUPLICATE_KEY"
      );
    }

    if (error instanceof AppError) {
      return this.fail(
        res,
        error.status,
        error.message,
        error.code
      );
    }

    console.error(`${label} error:`, error);

    return this.fail(
      res,
      500,
      "Terjadi kesalahan pada server",
      "INTERNAL_ERROR"
    );
  }
}
