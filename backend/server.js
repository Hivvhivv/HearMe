import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { pingDb, setupIndexes } from "./db.js";

import authRoutes from "./auth.routes.js";
import userRoutes from "./users.routes.js";
import psychologistRoutes from "./psychologists.routes.js";
import adminRoutes from "./admin.routes.js";
import verificationRoutes from "./verification.routes.js";
import consultationRoutes from "./consultation.routes.js";
import dailyMoodRoutes from "./dailyMood.routes.js";

dotenv.config();

const app = express();


// ======================================================
// CORS
// ======================================================
//
// CORS_ORIGINS di .env, dipisah koma. Contoh:
//
//   CORS_ORIGINS=http://localhost:8443,http://192.168.1.5:8443
//
// Kalau tidak diisi, semua origin diizinkan (mode dev).
// Jangan dibiarkan kosong saat production.
//
// ======================================================

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin:
      allowedOrigins.length > 0
        ? allowedOrigins
        : true,
    credentials: true
  })
);


// ======================================================
// BODY PARSER
// ======================================================

app.use(
  express.json({
    limit: "10mb"
  })
);


// ======================================================
// HEALTH CHECK
// ======================================================
//
// Membalas 503 (bukan 500) ketika database tidak bisa
// dihubungi, supaya jelas bedanya antara "backend mati"
// (fetch gagal total) dan "backend hidup, database
// bermasalah" (dapat JSON 503).
//
// ======================================================

app.get(
  "/api/health",
  async (_req, res) => {
    const result = await pingDb();

    if (!result.ok) {
      console.error(
        "Health check failed:",
        result.message
      );

      return res.status(503).json({
        ok: false,
        database: "hearme",
        message: result.message
      });
    }

    return res.json({
      ok: true,
      database: "hearme"
    });
  }
);


// ======================================================
// ROUTES
// ======================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/psychologists",
  psychologistRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/verification",
  verificationRoutes
);

app.use(
  "/api/consultations",
  consultationRoutes
);


// ======================================================
// DAILY MOOD
// ======================================================

app.use(
  "/api/daily-moods",
  dailyMoodRoutes
);


// ======================================================
// VERCEL EXPORT
// ======================================================

export default app;


// ======================================================
// LOCAL SERVER
// ======================================================
//
// Bagian ini hanya dijalankan ketika backend
// dijalankan secara lokal.
//
// Saat di-deploy ke Vercel, Vercel akan menggunakan
// export default app di atas.
//
// ======================================================

if (process.env.NODE_ENV !== "production") {

  const PORT =
    process.env.PORT || 5000;


  // ====================================================
  // Server HARUS tetap listen walaupun setup index
  // gagal (misalnya Atlas sedang lambat, IP belum
  // masuk allowlist, atau internet mati sebentar).
  //
  // Sebelumnya proses di-exit, sehingga gangguan
  // sesaat pada database membuat backend mati total
  // dan frontend hanya melihat "Failed to fetch".
  //
  // Sekarang: backend hidup, /api/health membalas 503
  // dengan alasan yang jelas.
  // ====================================================

  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        `HearMe backend running on port ${PORT}`
      );

      setupIndexes()
        .catch((error) => {

          console.error(
            "MongoDB index setup failed (server tetap jalan):",
            error?.message || error
          );

        });

    }
  );
}
