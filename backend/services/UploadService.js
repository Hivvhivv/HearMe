/*
 * ======================================================
 * UPLOAD SERVICE
 * ======================================================
 *
 * Spec section 23.
 *
 * KEADAAN SEBELUMNYA:
 *
 * Frontend mengubah file menjadi data URL base64
 * (FileReader.readAsDataURL) lalu mengirim string itu, dan
 * backend menyimpannya langsung ke dokumen MongoDB tanpa
 * memeriksa apa pun. Tidak ada cek MIME, ukuran, maupun
 * signature file. Dokumen MongoDB dibatasi 16 MB, jadi
 * beberapa gambar besar bisa membuat dokumen gagal disimpan.
 *
 * PENDEKATAN SEKARANG:
 *
 * File disimpan sebagai berkas di disk, dan MongoDB hanya
 * menyimpan URL-nya (spec: "MongoDB menyimpan file URL /
 * reference, bukan file besar").
 *
 * Yang diperiksa SEBELUM menulis:
 *
 *   1. MIME type ada di allowlist
 *   2. ukuran dalam batas
 *   3. MAGIC BYTES cocok dengan MIME yang diklaim
 *      -> inilah yang mencegah file .exe/.svg berbahaya
 *         diberi label "image/png"
 *   4. nama file TIDAK dipakai sebagai path; nama baru
 *      dibuat dari id acak
 *
 * DUA TEMPAT PENYIMPANAN, satu bentuk URL:
 *
 *   - BLOB_READ_WRITE_TOKEN ada  -> Vercel Blob (private)
 *   - tidak ada                  -> disk lokal (uploads/)
 *
 * Di kedua mode, URL yang disimpan di MongoDB tetap
 * "/uploads/<folder>/<nama>". Store Blob-nya private, jadi
 * berkas tidak punya URL publik sendiri: server.js
 * menyajikannya lewat `read()` di path yang sama. Karena
 * itu frontend dan data lama tidak perlu tahu berkasnya
 * ada di mana.
 *
 * Blob dibutuhkan di Vercel: filesystem serverless
 * read-only, jadi mode disk tidak bisa dipakai di sana.
 *
 * ======================================================
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { put, get, del } from "@vercel/blob";

import { AppError } from "../core/AppError.js";

const MAX_BYTES = Number(
  process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024
);

/*
 * Allowlist MIME -> ekstensi + magic bytes.
 *
 * SVG TIDAK diizinkan: ia bisa memuat <script>, sehingga
 * jadi vektor XSS kalau disajikan langsung.
 */
const ALLOWED = {
  "image/jpeg": {
    ext: ".jpg",
    magic: [[0xff, 0xd8, 0xff]]
  },
  "image/png": {
    ext: ".png",
    magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]
  },
  "image/webp": {
    // RIFF....WEBP -> dicek terpisah karena ada offset.
    ext: ".webp",
    magic: [[0x52, 0x49, 0x46, 0x46]],
    extraCheck: (buf) =>
      buf.length > 12 &&
      buf.toString("ascii", 8, 12) === "WEBP"
  },
  "image/gif": {
    ext: ".gif",
    magic: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
    ]
  },
  "application/pdf": {
    ext: ".pdf",
    magic: [[0x25, 0x50, 0x44, 0x46]]
  }
};


export class UploadService {
  constructor({
    baseDir = process.env.UPLOAD_DIR ||
      path.join(process.cwd(), "uploads"),
    publicPath = "/uploads"
  } = {}) {
    this.baseDir = baseDir;
    this.publicPath = publicPath;
  }


  // Dibaca saat dipanggil, bukan saat modul dimuat:
  // dotenv.config() di server.js jalan SETELAH import ini.
  get useBlob() {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  }


  static get maxBytes() {
    return MAX_BYTES;
  }

  static get allowedTypes() {
    return Object.keys(ALLOWED);
  }


  // ====================================================
  // PARSE DATA URL
  // ====================================================
  //
  // Frontend mengirim "data:image/png;base64,AAAA...".
  // MIME di dalam string itu adalah KLAIM dari klien dan
  // tidak dipercaya -- hanya dipakai untuk memilih aturan,
  // lalu dicocokkan dengan magic bytes isi file.
  //
  // ====================================================

  static parseDataUrl(dataUrl) {
    if (typeof dataUrl !== "string") {
      throw AppError.badRequest(
        "File tidak valid",
        "INVALID_FILE"
      );
    }

    const match = /^data:([a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+);base64,(.+)$/i.exec(
      dataUrl.trim()
    );

    if (!match) {
      throw AppError.badRequest(
        "Format file harus data URL base64",
        "INVALID_DATA_URL"
      );
    }

    const claimedType = match[1].toLowerCase();
    const base64 = match[2];

    // Tolak lebih awal berdasarkan panjang base64, supaya
    // payload raksasa tidak perlu di-decode dulu.
    // base64 ~= 4/3 dari ukuran asli.
    const approxBytes = Math.floor((base64.length * 3) / 4);

    if (approxBytes > MAX_BYTES) {
      throw new AppError(
        `Ukuran file maksimal ${Math.floor(MAX_BYTES / 1024 / 1024)} MB`,
        413,
        "FILE_TOO_LARGE"
      );
    }

    let buffer;

    try {
      buffer = Buffer.from(base64, "base64");
    } catch {
      throw AppError.badRequest(
        "File tidak bisa dibaca",
        "INVALID_FILE"
      );
    }

    if (buffer.length === 0) {
      throw AppError.badRequest(
        "File kosong",
        "EMPTY_FILE"
      );
    }

    if (buffer.length > MAX_BYTES) {
      throw new AppError(
        `Ukuran file maksimal ${Math.floor(MAX_BYTES / 1024 / 1024)} MB`,
        413,
        "FILE_TOO_LARGE"
      );
    }

    return { claimedType, buffer };
  }


  // ====================================================
  // VALIDASI TIPE
  // ====================================================

  static validateType(claimedType, buffer) {
    const rule = ALLOWED[claimedType];

    if (!rule) {
      throw AppError.badRequest(
        `Tipe file tidak diizinkan: ${claimedType}. ` +
          `Gunakan: ${UploadService.allowedTypes.join(", ")}`,
        "FILE_TYPE_NOT_ALLOWED"
      );
    }

    // MAGIC BYTES: isi file harus cocok dengan tipe yang
    // diklaim. Tanpa ini, berkas apa pun bisa diberi label
    // "image/png".
    const matchesMagic = rule.magic.some((signature) =>
      signature.every((byte, i) => buffer[i] === byte)
    );

    if (!matchesMagic) {
      throw AppError.badRequest(
        "Isi file tidak sesuai dengan tipenya",
        "FILE_SIGNATURE_MISMATCH"
      );
    }

    if (rule.extraCheck && !rule.extraCheck(buffer)) {
      throw AppError.badRequest(
        "Isi file tidak sesuai dengan tipenya",
        "FILE_SIGNATURE_MISMATCH"
      );
    }

    return { ...rule, type: claimedType };
  }


  // ====================================================
  // SIMPAN
  // ====================================================
  //
  // Nama file dibuat dari id acak -- nama asli dari user
  // TIDAK pernah dipakai sebagai path (mencegah path
  // traversal seperti "../../server.js").
  //
  // ====================================================

  async persist(buffer, rule, folder) {
    const safeFolder = String(folder || "misc").replace(
      /[^a-z0-9_-]/gi,
      ""
    );

    const dir = path.join(this.baseDir, safeFolder);

    const name =
      crypto.randomBytes(16).toString("hex") + rule.ext;

    if (this.useBlob) {
      try {
        await put(`${safeFolder}/${name}`, buffer, {
          access: "private",
          contentType: rule.type,
          // Nama sudah acak; tanpa suffix supaya pathname
          // di Blob persis sama dengan URL yang disimpan.
          addRandomSuffix: false
        });
      } catch (error) {
        console.error(
          "Upload ke Vercel Blob gagal:",
          error?.message || error
        );

        throw new AppError(
          "Penyimpanan file sedang tidak tersedia.",
          503,
          "UPLOAD_STORAGE_UNAVAILABLE"
        );
      }

      return `${this.publicPath}/${safeFolder}/${name}`;
    }

    try {
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(path.join(dir, name), buffer);
    } catch (error) {
      /*
       * PENTING UNTUK DEPLOY SERVERLESS (Vercel, Lambda):
       *
       * Filesystem di sana READ-ONLY kecuali /tmp, dan /tmp
       * pun hilang setiap invocation — jadi menyimpan file
       * di disk TIDAK bisa dipakai di produksi.
       *
       * Tanpa penanganan ini, user hanya melihat 500 tanpa
       * penjelasan. Dengan ini pesannya langsung menunjuk
       * penyebab dan solusinya.
       */
      if (
        error?.code === "EROFS" ||
        error?.code === "EACCES" ||
        error?.code === "EPERM"
      ) {
        console.error(
          `Upload gagal: ${this.baseDir} tidak bisa ditulis (${error.code}). ` +
            "Di hosting serverless, gunakan object storage (S3/Cloudinary/" +
            "Vercel Blob) dan ganti UploadService.persist()."
        );

        throw new AppError(
          "Penyimpanan file belum tersedia di server ini.",
          503,
          "UPLOAD_STORAGE_UNAVAILABLE"
        );
      }

      throw error;
    }

    return `${this.publicPath}/${safeFolder}/${name}`;
  }


  /*
   * Titik masuk utama.
   *
   * Menerima data URL dari klien, mengembalikan URL publik
   * yang disimpan di MongoDB.
   */
  async saveDataUrl(dataUrl, { folder = "misc" } = {}) {
    const { claimedType, buffer } =
      UploadService.parseDataUrl(dataUrl);

    const rule = UploadService.validateType(
      claimedType,
      buffer
    );

    const url = await this.persist(buffer, rule, folder);

    return {
      url,
      mimeType: claimedType,
      size: buffer.length
    };
  }


  /*
   * Banyak file sekaligus, dengan batas jumlah.
   */
  async saveMany(
    dataUrls,
    { folder = "misc", max = 5 } = {}
  ) {
    if (!Array.isArray(dataUrls)) {
      throw AppError.badRequest(
        "Daftar file tidak valid",
        "INVALID_FILES"
      );
    }

    if (dataUrls.length > max) {
      throw AppError.badRequest(
        `Maksimal ${max} file`,
        "TOO_MANY_FILES"
      );
    }

    const saved = [];

    for (const dataUrl of dataUrls) {
      // URL yang sudah tersimpan sebelumnya (bukan data URL)
      // dibiarkan apa adanya, supaya edit tidak mengunggah
      // ulang gambar yang tidak berubah.
      if (
        typeof dataUrl === "string" &&
        dataUrl.startsWith(this.publicPath)
      ) {
        saved.push({ url: dataUrl, reused: true });
        continue;
      }

      saved.push(await this.saveDataUrl(dataUrl, { folder }));
    }

    return saved;
  }


  /*
   * Hapus file berdasarkan URL publiknya.
   *
   * URL diperiksa agar tetap berada di dalam baseDir --
   * tidak bisa dipakai menghapus berkas lain.
   */
  async remove(url) {
    if (
      typeof url !== "string" ||
      !url.startsWith(`${this.publicPath}/`)
    ) {
      return false;
    }

    const relative = url.slice(this.publicPath.length + 1);

    if (this.useBlob) {
      if (!UploadService.isSafePathname(relative)) {
        return false;
      }

      try {
        await del(relative);
        return true;
      } catch {
        return false;
      }
    }

    const target = path.resolve(this.baseDir, relative);

    if (!target.startsWith(path.resolve(this.baseDir))) {
      return false;
    }

    try {
      await fs.unlink(target);
      return true;
    } catch {
      return false;
    }
  }


  /*
   * Hanya "<folder>/<32 hex>.<ext>" -- persis bentuk yang
   * dibuat persist(). Mencegah path buatan klien dipakai
   * membaca atau menghapus blob lain di store.
   */
  static isSafePathname(pathname) {
    return /^[a-z0-9_-]+\/[a-f0-9]{32}\.(jpg|png|webp|gif|pdf)$/.test(
      pathname
    );
  }


  /*
   * Baca berkas dari Blob untuk disajikan di /uploads.
   *
   * Mengembalikan null kalau mode disk, path tidak sah,
   * atau berkasnya tidak ada -- pemanggil lalu meneruskan
   * ke express.static.
   */
  async read(pathname) {
    if (
      !this.useBlob ||
      !UploadService.isSafePathname(pathname)
    ) {
      return null;
    }

    const result = await get(pathname, { access: "private" });

    if (!result || !result.stream) {
      return null;
    }

    return {
      stream: result.stream,
      contentType: result.blob.contentType,
      size: result.blob.size
    };
  }
}

export const uploadService = new UploadService();
