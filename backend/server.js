import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { getDb, setupIndexes } from "./db.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import verificationRoutes from "./verification.routes.js";
import consultationRoutes from "./consultation.routes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "10mb",
  })
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", async (_req, res) => {
  try {
    const db = await getDb();

    await db.command({
      ping: 1,
    });

    res.json({
      ok: true,
      database: "hearme",
    });
  } catch (error) {
    console.error("Health check error:", error);

    res.status(500).json({
      ok: false,
      message: "Database connection failed",
    });
  }
});

// ======================================================
// ROUTES
// ======================================================

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use(
  "/api/verification",
  verificationRoutes
);

app.use("/api/consultations", consultationRoutes);

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

setupIndexes()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `HearMe backend running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "Failed to initialize MongoDB:",
      error
    );

    process.exit(1);
  });
