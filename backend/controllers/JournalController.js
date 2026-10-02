/*
 * ======================================================
 * JOURNAL CONTROLLER
 * ======================================================
 *
 * Semua method meneruskan req.user.sub ke service, dan
 * service SELALU memfilter dengan userId itu -- jadi tidak
 * ada jalur yang bisa mengambil jurnal user lain.
 *
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { journalService } from "../services/JournalService.js";

export class JournalController extends BaseController {
  constructor({ journals = journalService } = {}) {
    super();

    this.journals = journals;
  }

  // GET /api/journals
  async list(req, res) {
    const result = await this.journals.list(
      req.user.sub,
      req.query
    );

    return this.ok(res, result);
  }

  // GET /api/journals/mood-summary
  async moodSummary(req, res) {
    const summary = await this.journals.moodSummary(
      req.user.sub,
      Number(req.query.days) || 30
    );

    return this.ok(res, { summary });
  }

  // GET /api/journals/:id
  async detail(req, res) {
    const journal = await this.journals.getById(
      req.user.sub,
      req.params.id
    );

    return this.ok(res, { journal });
  }

  // POST /api/journals
  async create(req, res) {
    const journal = await this.journals.create(
      req.user.sub,
      req.body || {}
    );

    return this.ok(res, { journal }, 201);
  }

  // PATCH /api/journals/:id
  async update(req, res) {
    const journal = await this.journals.update(
      req.user.sub,
      req.params.id,
      req.body || {}
    );

    return this.ok(res, { journal });
  }

  // DELETE /api/journals/:id
  async remove(req, res) {
    await this.journals.remove(req.user.sub, req.params.id);

    return this.ok(res, { message: "Jurnal dihapus" });
  }
}

export const journalController = new JournalController();
