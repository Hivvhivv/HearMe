/*
 * ======================================================
 * APP ERROR
 * ======================================================
 *
 * Satu jenis error yang membawa status HTTP dan kode
 * mesin. Dengan ini service TIDAK perlu menyentuh objek
 * `res` -- ia cukup melempar error, dan controller yang
 * menerjemahkannya menjadi response.
 *
 * Itulah yang memisahkan logika bisnis dari lapisan HTTP:
 * service bisa dipakai ulang (job, script, test) tanpa
 * Express.
 *
 * ======================================================
 */

export class AppError extends Error {
  constructor(message, status = 500, code = undefined) {
    super(message);

    this.name = "AppError";
    this.status = status;
    this.code = code;

    // Ditandai agar controller yakin error ini aman
    // ditampilkan ke user (bukan error tak terduga).
    this.isOperational = true;
  }

  static badRequest(message, code = "VALIDATION_ERROR") {
    return new AppError(message, 400, code);
  }

  static unauthorized(
    message = "Authentication required",
    code = "UNAUTHENTICATED"
  ) {
    return new AppError(message, 401, code);
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new AppError(message, 403, code);
  }

  static notFound(message = "Data tidak ditemukan", code = "NOT_FOUND") {
    return new AppError(message, 404, code);
  }

  static conflict(message, code = "CONFLICT") {
    return new AppError(message, 409, code);
  }

  static unavailable(message, code = "SERVICE_UNAVAILABLE") {
    return new AppError(message, 503, code);
  }
}


/*
 * ValidationError dipisah agar Validator bisa melempar
 * tanpa tahu soal HTTP, dan controller tetap bisa
 * memetakannya ke 400 beserta nama field-nya.
 */
export class ValidationError extends AppError {
  constructor(message, field = undefined) {
    super(message, 400, "VALIDATION_ERROR");

    this.name = "ValidationError";
    this.field = field;
  }
}
