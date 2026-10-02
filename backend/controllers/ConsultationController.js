/*
 * ======================================================
 * CONSULTATION CONTROLLER
 * ======================================================
 *
 * Membalas bentuk LAMA ({ consultations }, { message })
 * karena src/api/consultation.api.ts sudah membacanya
 * begitu. Refactor ini tidak mengubah kontrak API.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { BaseController } from "../core/BaseController.js";
import { AppError } from "../core/AppError.js";
import { consultationService } from "../services/ConsultationService.js";

export class ConsultationController extends BaseController {
  constructor({ consultations = consultationService } = {}) {
    super();

    this.consultations = consultations;
  }


  /*
   * Id aktor SELALU dari JWT. Dipusatkan di sini supaya
   * tidak ada handler yang lupa memvalidasinya.
   */
  static actorId(req) {
    if (!ObjectId.isValid(req.user?.sub)) {
      throw AppError.badRequest(
        "Invalid user ID",
        "INVALID_USER_ID"
      );
    }

    return new ObjectId(req.user.sub);
  }


  // GET /api/consultations/mine
  async listMine(req, res) {
    const consultations = await this.consultations.listMine(
      ConsultationController.actorId(req),
      req.user.role
    );

    return this.legacy(res, { consultations });
  }


  // POST /api/consultations
  async book(req, res) {
    const consultation = await this.consultations.book(
      ConsultationController.actorId(req),
      req.body || {}
    );

    return this.legacy(res, { consultation }, 201);
  }


  // PATCH /api/consultations/:id/status
  async updateStatus(req, res) {
    const { status, reason } = req.body || {};

    const next = await this.consultations.updateStatus(
      req.params.id,
      ConsultationController.actorId(req),
      req.user.role,
      status,
      reason
    );

    return this.legacy(res, {
      message: "Consultation updated",
      status: next
    });
  }


  // POST /api/consultations/:id/reschedule
  async reschedule(req, res) {
    const { date, time } = await this.consultations.reschedule(
      req.params.id,
      ConsultationController.actorId(req),
      req.body || {}
    );

    return this.legacy(res, {
      message: "Consultation rescheduled",
      date,
      time,
      status: "rescheduled"
    });
  }


  // GET /api/consultations/schedules/mine
  async listOwnSchedules(req, res) {
    const schedules =
      await this.consultations.listOwnSchedules(
        ConsultationController.actorId(req)
      );

    return this.legacy(res, { schedules });
  }


  // GET /api/consultations/schedules/:psychologistId
  async listOpenSchedules(req, res) {
    const schedules =
      await this.consultations.listOpenSchedules(
        req.params.psychologistId
      );

    return this.legacy(res, { schedules });
  }


  // GET /api/consultations/schedules/weekly
  async getWeeklyTemplate(req, res) {
    const weeklySchedule =
      await this.consultations.getWeeklyTemplate(
        ConsultationController.actorId(req)
      );

    return this.legacy(res, { weeklySchedule });
  }


  // PUT /api/consultations/schedules/weekly
  //
  // Menerjemahkan template mingguan menjadi slot konkret.
  // Slot yang sudah di-booking tidak pernah dihapus.
  async applyWeeklyTemplate(req, res) {
    const result =
      await this.consultations.applyWeeklyTemplate(
        ConsultationController.actorId(req),
        req.body?.weeklySchedule || req.body,
        { days: Number(req.body?.days) || 28 }
      );

    return this.legacy(res, {
      message: "Jadwal berhasil disimpan",
      ...result
    });
  }


  // POST /api/consultations/schedules/mine
  async createSchedule(req, res) {
    const schedule = await this.consultations.createSchedule(
      ConsultationController.actorId(req),
      req.body || {}
    );

    return this.legacy(res, { schedule }, 201);
  }


  // GET /api/consultations/:id/messages
  async listMessages(req, res) {
    const messages = await this.consultations.listMessages(
      req.params.id,
      ConsultationController.actorId(req),
      req.user.role
    );

    return this.legacy(res, { messages });
  }


  // POST /api/consultations/:id/messages
  async sendMessage(req, res) {
    const message = await this.consultations.sendMessage(
      req.params.id,
      ConsultationController.actorId(req),
      req.user.role,
      req.body?.content
    );

    return this.legacy(res, { message }, 201);
  }
}

export const consultationController =
  new ConsultationController();
