import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getDb, setupIndexes } from "./db.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.json({ ok: true, database: "hearme" });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

setupIndexes()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`HearMe backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize MongoDB:", err);
    process.exit(1);
  });
