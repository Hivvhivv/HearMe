/*
 * ======================================================
 * DAILY MOOD CONTROLLER
 * ======================================================
 *
 * Endpoint ini sudah memakai format { success, ... } sejak
 * awal, jadi bentuknya dipertahankan apa adanya agar
 * src/api/dailyMood.api.ts tidak perlu diubah.
 *
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { dailyMoodService } from "../services/DailyMoodService.js";

export class DailyMoodController extends BaseController {
  constructor({ moods = dailyMoodService } = {}) {
    super();

    this.moods = moods;
  }

  // GET /api/daily-moods/today
  async today(req, res) {
    const { date, mood } = await this.moods.getByDate(
      req.user.sub,
      req.query.date
    );

    return this.legacy(res, { success: true, date, mood });
  }

  // GET /api/daily-moods/history
  async history(req, res) {
    const data = await this.moods.history(
      req.user.sub,
      req.query.limit
    );

    return this.legacy(res, { success: true, data });
  }

  // GET /api/daily-moods?date=YYYY-MM-DD
  async byDate(req, res) {
    if (!req.query.date) {
      return this.legacy(
        res,
        { success: false, message: "Date is required" },
        400
      );
    }

    const { mood } = await this.moods.getByDate(
      req.user.sub,
      req.query.date
    );

    return this.legacy(res, { success: true, data: mood });
  }

  // PUT /api/daily-moods/today
  async upsertToday(req, res) {
    const { mood, date } = req.body || {};

    const saved = await this.moods.setForDate(
      req.user.sub,
      mood,
      date
    );

    return this.legacy(res, { success: true, data: saved });
  }

  // DELETE /api/daily-moods/:date
  async remove(req, res) {
    const deleted = await this.moods.remove(
      req.user.sub,
      req.params.date
    );

    return this.legacy(res, { success: true, deleted });
  }
}

export const dailyMoodController = new DailyMoodController();
