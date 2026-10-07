/*
 * ======================================================
 * ROUTES
 * ======================================================
 *
 * SATU tempat yang memetakan URL -> controller.
 *
 * File route sengaja dibuat TIPIS: tidak ada logika bisnis
 * dan tidak ada query MongoDB di sini. Dengan begitu
 * jawaban atas "endpoint ini mengerjakan apa?" selalu ada
 * di satu tempat (controller -> service), bukan tersebar
 * di dalam handler.
 *
 * Alur:
 *
 *   routes -> controller -> service -> MongoDB
 *
 * ======================================================
 */

import express from "express";

import {
  authenticate,
  authorize,
  requireVerifiedPsychologist
} from "../middleware/AuthMiddleware.js";

import { authController } from "../controllers/AuthController.js";
import { userController } from "../controllers/UserController.js";
import { psychologistController } from "../controllers/PsychologistController.js";
import { consultationController } from "../controllers/ConsultationController.js";
import { dailyMoodController } from "../controllers/DailyMoodController.js";
import { adminController } from "../controllers/AdminController.js";
import { verificationController } from "../controllers/VerificationController.js";
import { mindHubController } from "../controllers/MindHubController.js";
import { journalController } from "../controllers/JournalController.js";
import { forumController } from "../controllers/ForumController.js";
import { Security } from "../middleware/Security.js";

const ADMIN = authorize("admin", "super_admin");
const PSYCHOLOGIST = authorize("psychologist");
const USER = authorize("user");


// ======================================================
// AUTH  /api/auth
// ======================================================

export function authRoutes() {
  const r = express.Router();
  const c = authController;

  // Rate limit ketat HANYA di sini (anti brute force).
  // Kuncinya IP + email, bukan IP saja, supaya menyerang
  // satu akun tidak memblokir seluruh jaringan.
  r.post("/register", Security.auth(), c.handle(c.register));
  r.post("/login", Security.auth(), c.handle(c.login));

  // Tanpa authenticate: access token bisa saja sudah
  // kedaluwarsa, tapi refresh & logout harus tetap bisa.
  r.post("/refresh", c.handle(c.refresh));
  r.post("/logout", c.handle(c.logout));

  r.post("/logout-all", authenticate, c.handle(c.logoutAll));
  r.get("/sessions", authenticate, c.handle(c.listSessions));
  r.delete("/sessions/:id", authenticate, c.handle(c.revokeSession));
  r.get("/me", authenticate, c.handle(c.me));

  return r;
}


// ======================================================
// USERS  /api/users
// ======================================================

export function userRoutes() {
  const r = express.Router();
  const c = userController;

  r.get("/me", authenticate, c.handle(c.getMe));
  r.patch("/me", authenticate, c.handle(c.updateMe));
  r.put("/me/avatar", authenticate, Security.upload(), c.handle(c.updateAvatar));
  r.patch("/me/password", authenticate, c.handle(c.changePassword));

  r.patch(
    "/me/psychologist-profile",
    authenticate,
    PSYCHOLOGIST,
    c.handle(c.updatePsychologistProfile)
  );

  return r;
}


// ======================================================
// PSYCHOLOGISTS  /api/psychologists
// ======================================================

export function psychologistRoutes() {
  const r = express.Router();
  const c = psychologistController;

  // PENTING: /top harus SEBELUM /:id, kalau tidak "top"
  // akan tertangkap sebagai parameter id.
  r.get("/top", authenticate, c.handle(c.top));
  r.get("/", authenticate, c.handle(c.list));

  r.get("/:id", authenticate, c.handle(c.detail));
  r.get("/:id/availability", authenticate, c.handle(c.availability));
  r.get("/:id/ratings", authenticate, c.handle(c.listRatings));
  r.post("/:id/ratings", authenticate, c.handle(c.rate));

  return r;
}


// ======================================================
// CONSULTATIONS  /api/consultations
// ======================================================

export function consultationRoutes() {
  const r = express.Router();
  const c = consultationController;

  // PENTING: /schedules/mine harus SEBELUM
  // /schedules/:psychologistId.
  //
  // Sebelumnya urutannya terbalik, sehingga route "mine"
  // menjadi dead code dan ditangani lewat workaround
  // if (params === "mine") di dalam route ber-parameter.
  // Template jadwal mingguan -> slot konkret.
  // Didaftarkan sebelum /schedules/:psychologistId juga.
  r.get(
    "/schedules/weekly",
    authenticate,
    PSYCHOLOGIST,
    c.handle(c.getWeeklyTemplate)
  );

  r.put(
    "/schedules/weekly",
    authenticate,
    PSYCHOLOGIST,
    c.handle(c.applyWeeklyTemplate)
  );

  r.get(
    "/schedules/mine",
    authenticate,
    PSYCHOLOGIST,
    c.handle(c.listOwnSchedules)
  );

  r.post(
    "/schedules/mine",
    authenticate,
    PSYCHOLOGIST,
    c.handle(c.createSchedule)
  );

  r.get(
    "/schedules/:psychologistId",
    authenticate,
    c.handle(c.listOpenSchedules)
  );

  r.get("/mine", authenticate, c.handle(c.listMine));

  r.post("/", authenticate, USER, c.handle(c.book));

  r.patch("/:id/status", authenticate, c.handle(c.updateStatus));

  r.post(
    "/:id/reschedule",
    authenticate,
    PSYCHOLOGIST,
    c.handle(c.reschedule)
  );

  r.get("/:id/messages", authenticate, c.handle(c.listMessages));
  r.post("/:id/messages", authenticate, c.handle(c.sendMessage));

  return r;
}


// ======================================================
// DAILY MOODS  /api/daily-moods
// ======================================================

export function dailyMoodRoutes() {
  const r = express.Router();
  const c = dailyMoodController;

  r.get("/today", authenticate, c.handle(c.today));
  r.get("/history", authenticate, c.handle(c.history));
  r.get("/", authenticate, c.handle(c.byDate));
  r.put("/today", authenticate, c.handle(c.upsertToday));
  r.delete("/:date", authenticate, c.handle(c.remove));

  return r;
}


// ======================================================
// VERIFICATION  /api/verification
// ======================================================

export function verificationRoutes() {
  const r = express.Router();
  const c = verificationController;

  r.post("/", authenticate, PSYCHOLOGIST, c.handle(c.submit));
  r.get("/status", authenticate, PSYCHOLOGIST, c.handle(c.status));
  r.get("/mine", authenticate, PSYCHOLOGIST, c.handle(c.mine));

  r.get("/", authenticate, ADMIN, c.handle(c.listAll));
  r.patch("/:id/review", authenticate, ADMIN, c.handle(c.review));

  return r;
}


// ======================================================
// MIND HUB  /api/mind-hub   (publik, hanya published)
// ======================================================

export function mindHubRoutes() {
  const r = express.Router();
  const c = mindHubController;

  r.get("/", authenticate, c.handle(c.list));
  r.get("/:id", authenticate, c.handle(c.detail));
  r.get("/:id/related", authenticate, c.handle(c.related));

  return r;
}


// ======================================================
// JOURNALS  /api/journals   (privat per user)
// ======================================================

export function journalRoutes() {
  const r = express.Router();
  const c = journalController;

  // /mood-summary sebelum /:id agar tidak tertangkap param.
  r.get("/mood-summary", authenticate, c.handle(c.moodSummary));
  r.get("/", authenticate, c.handle(c.list));
  r.get("/:id", authenticate, c.handle(c.detail));

  // Endpoint yang menerima gambar dibatasi lebih ketat.
  r.post("/", authenticate, Security.upload(), c.handle(c.create));
  r.patch("/:id", authenticate, Security.upload(), c.handle(c.update));
  r.delete("/:id", authenticate, c.handle(c.remove));

  return r;
}


// ======================================================
// FORUMS  /api/forums
// ======================================================

export function forumRoutes() {
  const r = express.Router();
  const c = forumController;

  // Rute statis sebelum /:id.
  r.get("/mine", authenticate, c.handle(c.listMine));
  r.get("/ban-status", authenticate, c.handle(c.banStatus));

  r.get("/", authenticate, c.handle(c.list));
  r.post("/", authenticate, Security.upload(), c.handle(c.create));

  r.get("/:id", authenticate, c.handle(c.detail));

  r.patch("/:id/archive", authenticate, c.handle(c.archive));
  r.patch("/:id/restore", authenticate, c.handle(c.restore));
  r.delete("/:id", authenticate, c.handle(c.remove));

  r.post("/:id/like", authenticate, c.handle(c.toggleLike));
  r.post("/:id/save", authenticate, c.handle(c.toggleSave));

  r.get("/:id/replies", authenticate, c.handle(c.listReplies));
  r.post("/:id/replies", authenticate, c.handle(c.reply));

  r.post("/:id/reports", authenticate, c.handle(c.report));

  return r;
}


// ======================================================
// ADMIN  /api/admin
// ======================================================
//
// /register dan /login TIDAK ada di sini.
//
// Keduanya dulu menduplikasi auth.routes dengan payload
// JWT berbeda dan TANPA sid, sehingga token yang
// diterbitkannya langsung ditolak auth middleware.
//
// Semua login -- termasuk admin -- lewat
// POST /api/auth/login, dan status admin ditentukan oleh
// ROLE DI DATABASE.
//
// ======================================================

export function adminRoutes() {
  const r = express.Router();
  const c = adminController;

  r.get("/me", authenticate, c.handle(c.me));

  r.patch(
    "/psychologists/:id/verification",
    authenticate,
    ADMIN,
    c.handle(c.setVerification)
  );

  r.patch(
    "/users/:id/status",
    authenticate,
    ADMIN,
    c.handle(c.setUserStatus)
  );

  r.get(
    "/psychologists",
    authenticate,
    ADMIN,
    c.handle(c.listPsychologists)
  );


  // -------- MIND HUB (admin) --------
  //
  // Semua konten termasuk draft. Route publik /api/mind-hub
  // hanya menyajikan yang published.

  const mh = mindHubController;

  r.get("/mind-hub", authenticate, ADMIN, mh.handle(mh.adminList));
  r.get("/mind-hub/:id", authenticate, ADMIN, mh.handle(mh.adminDetail));
  r.post("/mind-hub", authenticate, ADMIN, Security.upload(), mh.handle(mh.create));
  r.patch("/mind-hub/:id", authenticate, ADMIN, Security.upload(), mh.handle(mh.update));
  r.patch("/mind-hub/:id/publish", authenticate, ADMIN, mh.handle(mh.setStatus));
  r.delete("/mind-hub/:id", authenticate, ADMIN, mh.handle(mh.remove));


  // -------- FORUM MODERATION (admin) --------

  const fc = forumController;

  r.get("/forum-reports", authenticate, ADMIN, fc.handle(fc.adminListReports));
  r.patch("/forum-reports/:id/review", authenticate, ADMIN, fc.handle(fc.adminReviewReport));

  r.get("/forum-bans", authenticate, ADMIN, fc.handle(fc.adminListBans));
  r.post("/forum-bans/:userId", authenticate, ADMIN, fc.handle(fc.adminBan));
  r.delete("/forum-bans/:userId", authenticate, ADMIN, fc.handle(fc.adminUnban));

  return r;
}


// ======================================================
// REGISTER SEMUA ROUTE
// ======================================================
//
// Menambah domain baru = tambah satu baris di sini.
//
// ======================================================

export function registerRoutes(app) {
  app.use("/api/auth", authRoutes());
  app.use("/api/users", userRoutes());
  app.use("/api/psychologists", psychologistRoutes());
  app.use("/api/consultations", consultationRoutes());
  app.use("/api/daily-moods", dailyMoodRoutes());
  app.use("/api/journals", journalRoutes());
  app.use("/api/forums", forumRoutes());
  app.use("/api/mind-hub", mindHubRoutes());
  app.use("/api/verification", verificationRoutes());
  app.use("/api/admin", adminRoutes());
}


// Diekspor untuk dipakai route lain yang mungkin
// membutuhkannya (mis. guard psikolog terverifikasi).
export { requireVerifiedPsychologist };
