import express from "express";
import { getDb } from "./db.js";
import { authenticate } from "./auth.middleware.js";

const router = express.Router();


// ======================================================
// GET TODAY MOOD
// GET /api/daily-moods/today
// ======================================================

router.get("/today", authenticate, async (req, res) => {
  try {
    const db = await getDb();

    const userId = req.user.sub;

    const date =
      req.query.date ||
      new Date().toISOString().slice(0, 10);

    const mood = await db
      .collection("daily_moods")
      .findOne({
        userId,
        date,
      });

    return res.json({
      success: true,
      date,
      mood: mood || null,
    });

  } catch (error) {

    console.error(
      "GET today mood error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get today's mood",
    });

  }
});


// ======================================================
// GET MOOD HISTORY
// GET /api/daily-moods/history
// ======================================================

router.get(
  "/history",
  authenticate,
  async (req, res) => {

    try {

      const db = await getDb();

      const userId = req.user.sub;

      const limit = Math.min(
        Math.max(
          Number(req.query.limit) || 30,
          1
        ),
        365
      );

      const moods = await db
        .collection("daily_moods")
        .find({
          userId,
        })
        .sort({
          date: -1,
        })
        .limit(limit)
        .toArray();

      return res.json({
        success: true,
        data: moods,
      });

    } catch (error) {

      console.error(
        "GET mood history error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to get mood history",
      });

    }

  }
);


// ======================================================
// GET MOOD BY DATE
// GET /api/daily-moods?date=YYYY-MM-DD
// ======================================================

router.get(
  "/",
  authenticate,
  async (req, res) => {

    try {

      const db = await getDb();

      const userId = req.user.sub;

      const date = req.query.date;

      if (!date) {

        return res.status(400).json({
          success: false,
          message: "Date is required",
        });

      }

      const mood = await db
        .collection("daily_moods")
        .findOne({
          userId,
          date,
        });

      return res.json({
        success: true,
        data: mood || null,
      });

    } catch (error) {

      console.error(
        "GET mood by date error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to get mood",
      });

    }

  }
);


// ======================================================
// PUT / UPDATE TODAY MOOD
// PUT /api/daily-moods/today
// ======================================================

router.put(
  "/today",
  authenticate,
  async (req, res) => {

    try {

      const db = await getDb();

      // -----------------------------------------------
      // USER ID DIAMBIL DARI JWT
      // -----------------------------------------------

      const userId = req.user.sub;


      // -----------------------------------------------
      // GET REQUEST BODY
      // -----------------------------------------------

      const {
        mood,
        date,
      } = req.body || {};


      // -----------------------------------------------
      // VALIDATE MOOD
      // -----------------------------------------------

      if (
        typeof mood !== "string" ||
        !mood.trim()
      ) {

        return res.status(400).json({
          success: false,
          message: "Mood is required",
        });

      }


      // -----------------------------------------------
      // DATE
      // -----------------------------------------------

      const moodDate =
        typeof date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(date)

          ? date

          : new Date()
              .toISOString()
              .slice(0, 10);


      // -----------------------------------------------
      // SAVE / UPDATE
      // -----------------------------------------------

      const result = await db
        .collection("daily_moods")
        .findOneAndUpdate(

          {
            userId,
            date: moodDate,
          },

          {
            $set: {
              mood: mood.trim(),
              updatedAt: new Date(),
            },

            $setOnInsert: {
              userId,
              date: moodDate,
              createdAt: new Date(),
            },
          },

          {
            upsert: true,
            returnDocument: "after",
          }

        );


      // -----------------------------------------------
      // GET UPDATED DOCUMENT
      // -----------------------------------------------

      const savedMood =
        result?.value || result;


      if (!savedMood) {

        return res.status(500).json({
          success: false,
          message:
            "Failed to save daily mood",
        });

      }


      return res.json({

        success: true,

        data: savedMood,

      });

    } catch (error) {

      console.error(
        "PUT daily mood error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to save daily mood",

      });

    }

  }
);


// ======================================================
// DELETE MOOD
// DELETE /api/daily-moods/:date
// ======================================================

router.delete(
  "/:date",
  authenticate,
  async (req, res) => {

    try {

      const db = await getDb();

      const userId = req.user.sub;

      const { date } = req.params;


      const result = await db
        .collection("daily_moods")
        .deleteOne({
          userId,
          date,
        });


      return res.json({

        success: true,

        deleted:
          result.deletedCount > 0,

      });

    } catch (error) {

      console.error(
        "DELETE mood error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to delete mood",

      });

    }

  }
);


export default router;