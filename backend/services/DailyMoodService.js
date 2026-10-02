/*
 * ======================================================
 * DAILY MOOD SERVICE
 * ======================================================
 *
 * Spec section 5:
 *
 *   SATU user hanya boleh punya SATU mood per tanggal.
 *
 * Dijamin dua lapis:
 *
 *   1. unique compound index { userId, date }
 *   2. upsert (findOneAndUpdate) -- memilih mood lain di
 *      hari yang sama MENGUBAH record itu, bukan membuat
 *      record baru
 *
 * userId disimpan sebagai ObjectId, konsisten dengan
 * collection lain (consultations, verification_submissions)
 * supaya $lookup/aggregation nanti tetap jalan.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";
import { Validator } from "../core/Validator.js";

export class DailyMoodService extends BaseService {

  async moods() {
    return this.collection("daily_moods");
  }

  static toObjectId(userId) {
    return userId instanceof ObjectId
      ? userId
      : new ObjectId(userId);
  }

  static resolveDate(date) {
    return typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : Validator.today();
  }


  // ====================================================
  // READ
  // ====================================================

  async getByDate(userId, date) {
    const moods = await this.moods();

    const resolved = DailyMoodService.resolveDate(date);

    const mood = await moods.findOne({
      userId: DailyMoodService.toObjectId(userId),
      date: resolved
    });

    return { date: resolved, mood: mood || null };
  }


  async history(userId, limit) {
    const moods = await this.moods();

    return moods
      .find({ userId: DailyMoodService.toObjectId(userId) })
      .sort({ date: -1 })
      .limit(Validator.clampLimit(limit, 30, 365))
      .toArray();
  }


  // ====================================================
  // UPSERT
  // ====================================================

  async setForDate(userId, mood, date) {
    const value = Validator.string(mood, "Mood", {
      required: true,
      max: 40
    });

    const moods = await this.moods();

    const resolved = DailyMoodService.resolveDate(date);
    const now = BaseService.now();

    const result = await moods.findOneAndUpdate(
      {
        userId: DailyMoodService.toObjectId(userId),
        date: resolved
      },
      {
        $set: { mood: value, updatedAt: now },
        $setOnInsert: {
          userId: DailyMoodService.toObjectId(userId),
          date: resolved,
          createdAt: now
        }
      },
      { upsert: true, returnDocument: "after" }
    );

    return BaseService.unwrap(result);
  }


  // ====================================================
  // DELETE
  // ====================================================

  async remove(userId, date) {
    const moods = await this.moods();

    const result = await moods.deleteOne({
      userId: DailyMoodService.toObjectId(userId),
      date
    });

    return result.deletedCount > 0;
  }
}

export const dailyMoodService = new DailyMoodService();
