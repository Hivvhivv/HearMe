/*
 * ======================================================
 * MAIL SERVICE
 * ======================================================
 *
 * Satu-satunya tempat yang tahu cara mengirim email.
 * Service lain cukup memanggil send().
 *
 * Memakai SMTP. Default-nya Gmail:
 *
 *   SMTP_USER  alamat Gmail pengirim
 *   SMTP_PASS  App Password 16 karakter (BUKAN password
 *              akun Gmail; butuh verifikasi 2 langkah)
 *
 * SMTP_HOST / SMTP_PORT hanya perlu diisi kalau pindah ke
 * penyedia lain.
 *
 * ======================================================
 */

import nodemailer from "nodemailer";

import { AppError } from "../core/AppError.js";

export class MailService {
  constructor() {
    this.transport = null;
  }


  // Dibaca saat dipanggil, bukan saat modul dimuat:
  // dotenv.config() di server.js jalan SETELAH import ini.
  get isConfigured() {
    return Boolean(
      process.env.SMTP_USER && process.env.SMTP_PASS
    );
  }

  get from() {
    return (
      process.env.MAIL_FROM ||
      `HearMe <${process.env.SMTP_USER}>`
    );
  }


  /*
   * Dipanggil SEBELUM mencari user, supaya balasan 503
   * tidak bergantung pada terdaftar atau tidaknya email
   * yang diminta.
   */
  assertConfigured() {
    if (!this.isConfigured) {
      console.error(
        "Email belum dikonfigurasi: isi SMTP_USER dan SMTP_PASS."
      );

      throw new AppError(
        "Pengiriman email belum tersedia di server ini.",
        503,
        "MAIL_UNAVAILABLE"
      );
    }
  }


  getTransport() {
    if (!this.transport) {
      const port = Number(process.env.SMTP_PORT || 465);

      this.transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          // App Password Gmail ditampilkan berspasi
          // ("abcd efgh ijkl mnop"); spasinya bukan bagian
          // dari password.
          pass: String(process.env.SMTP_PASS).replace(/\s+/g, "")
        }
      });
    }

    return this.transport;
  }


  async send({ to, subject, text, html }) {
    this.assertConfigured();

    await this.getTransport().sendMail({
      from: this.from,
      to,
      subject,
      text,
      html
    });
  }
}

export const mailService = new MailService();
