/*
 * ======================================================
 * PASSWORD RESET SERVICE
 * ======================================================
 *
 * Lupa password lewat tautan yang dikirim ke email.
 * Berlaku untuk semua role (user, psikolog, admin).
 *
 * Yang dijaga:
 *
 *   - Balasan request() SAMA untuk email terdaftar maupun
 *     tidak, supaya endpoint ini tidak bisa dipakai
 *     memeriksa siapa saja yang punya akun.
 *   - Token 256-bit acak, sekali pakai, berlaku 30 menit.
 *     Database hanya menyimpan HASH-nya: isi collection
 *     ini bocor pun tidak bisa dipakai mereset akun.
 *   - Tautan dibentuk dari APP_URL, bukan dari header Host
 *     request -- header itu dikendalikan pengirim, dan
 *     memakainya berarti penyerang bisa membuat korban
 *     menerima tautan ke domain miliknya.
 *   - Setelah reset, SEMUA session user dicabut.
 *
 * ======================================================
 */

import crypto from "node:crypto";

import { BaseService } from "../core/BaseService.js";
import { AppError } from "../core/AppError.js";
import { Validator } from "../core/Validator.js";
import { userService } from "./UserService.js";
import { sessionService } from "./SessionService.js";
import { mailService } from "./MailService.js";

const TOKEN_TTL_MINUTES = 30;

// Jeda minimal antar email ke akun yang sama, supaya
// endpoint ini tidak bisa dipakai membanjiri inbox orang.
const RESEND_COOLDOWN_SECONDS = 60;

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[ch]
  );
}


export class PasswordResetService extends BaseService {
  constructor(
    db,
    {
      users = userService,
      sessions = sessionService,
      mail = mailService
    } = {}
  ) {
    super(db);

    this.users = users;
    this.sessions = sessions;
    this.mail = mail;
  }

  async resets() {
    return this.collection("password_resets");
  }


  static hash(token) {
    return crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
  }

  /*
   * Alamat frontend untuk tautan di email.
   *
   * VERCEL_PROJECT_PRODUCTION_URL diisi otomatis oleh
   * Vercel, jadi di sana APP_URL hanya perlu diisi kalau
   * memakai domain sendiri.
   */
  static appUrl() {
    const explicit = (process.env.APP_URL || "").trim();

    if (explicit) {
      return explicit.replace(/\/+$/, "");
    }

    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }

    return "http://localhost:8443";
  }


  // ====================================================
  // MINTA TAUTAN RESET
  // ====================================================
  //
  // Tidak mengembalikan apa pun, dan tidak melempar error
  // yang membedakan "email tidak terdaftar" dari "email
  // terkirim".
  //
  // ====================================================

  async request(rawEmail) {
    const email = Validator.email(rawEmail, "Email", {
      required: true
    });

    this.mail.assertConfigured();

    const user = await this.users.findByEmail(email);

    if (!user || user.isActive === false) {
      return;
    }

    const resets = await this.resets();
    const now = BaseService.now();

    const recent = await resets.findOne({
      userId: user._id,
      createdAt: {
        $gt: new Date(
          now.getTime() - RESEND_COOLDOWN_SECONDS * 1000
        )
      }
    });

    if (recent) {
      return;
    }

    // Tautan lama tidak berlaku lagi begitu yang baru dibuat.
    await resets.deleteMany({ userId: user._id });

    const token = crypto.randomBytes(32).toString("hex");

    await resets.insertOne({
      userId: user._id,
      tokenHash: PasswordResetService.hash(token),
      createdAt: now,
      expiresAt: new Date(
        now.getTime() + TOKEN_TTL_MINUTES * 60 * 1000
      ),
      usedAt: null
    });

    const link =
      `${PasswordResetService.appUrl()}` +
      `/reset-password?token=${token}`;

    const name = user.name || user.username || "";

    try {
      await this.mail.send({
        to: user.email,
        subject: "Reset password HearMe",
        text:
          `Halo${name ? ` ${name}` : ""},\n\n` +
          "Kami menerima permintaan untuk mereset password akun HearMe kamu. " +
          "Buka tautan berikut untuk membuat password baru:\n\n" +
          `${link}\n\n` +
          `Tautan ini berlaku ${TOKEN_TTL_MINUTES} menit dan hanya bisa dipakai sekali.\n\n` +
          "Kalau kamu tidak meminta reset password, abaikan email ini. " +
          "Password kamu tidak berubah.\n\n" +
          "HearMe",
        html:
          '<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">' +
          '<h2 style="color:#6F3FB5;margin:0 0 16px">HearMe</h2>' +
          `<p>Halo${name ? ` ${escapeHtml(name)}` : ""},</p>` +
          "<p>Kami menerima permintaan untuk mereset password akun HearMe kamu. " +
          "Klik tombol di bawah untuk membuat password baru.</p>" +
          `<p style="margin:24px 0"><a href="${link}" ` +
          'style="background:#6F3FB5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:bold;display:inline-block">' +
          "Buat password baru</a></p>" +
          `<p style="font-size:13px;color:#6b7280">Tautan ini berlaku ${TOKEN_TTL_MINUTES} menit dan hanya bisa dipakai sekali. ` +
          "Kalau tombolnya tidak bisa diklik, salin alamat ini ke browser:</p>" +
          `<p style="font-size:13px;word-break:break-all"><a href="${link}" style="color:#6F3FB5">${link}</a></p>` +
          '<p style="font-size:13px;color:#6b7280">Kalau kamu tidak meminta reset password, abaikan email ini. ' +
          "Password kamu tidak berubah.</p>" +
          "</div>"
      });
    } catch (error) {
      // Tidak diteruskan ke klien: gagal kirim hanya terjadi
      // untuk email yang terdaftar, jadi membalas error di
      // sini sama dengan membocorkan bahwa akunnya ada.
      console.error(
        "Gagal mengirim email reset password:",
        error?.message || error
      );

      // Token yang tidak pernah terkirim dibuang, supaya
      // jeda kirim ulang tidak menghalangi percobaan berikutnya.
      await resets.deleteMany({ userId: user._id });
    }
  }


  // ====================================================
  // PAKAI TAUTAN RESET
  // ====================================================

  async reset(rawToken, rawPassword) {
    const password = Validator.string(
      rawPassword,
      "Password baru",
      { required: true, min: 8, max: 200 }
    );

    const invalid = () =>
      AppError.badRequest(
        "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
        "RESET_TOKEN_INVALID"
      );

    if (
      typeof rawToken !== "string" ||
      !/^[a-f0-9]{64}$/.test(rawToken)
    ) {
      throw invalid();
    }

    const resets = await this.resets();
    const now = BaseService.now();

    // Atomik: dua request bersamaan dengan token yang sama
    // tidak bisa sama-sama lolos.
    const claimed = BaseService.unwrap(
      await resets.findOneAndUpdate(
        {
          tokenHash: PasswordResetService.hash(rawToken),
          usedAt: null,
          expiresAt: { $gt: now }
        },
        { $set: { usedAt: now } }
      )
    );

    if (!claimed) {
      throw invalid();
    }

    await this.users.setPassword(claimed.userId, password);

    // Siapa pun yang sedang login dengan password lama
    // (termasuk pihak yang tidak berhak) ikut keluar.
    await this.sessions.revokeAll(claimed.userId.toString());
  }
}

export const passwordResetService = new PasswordResetService();
