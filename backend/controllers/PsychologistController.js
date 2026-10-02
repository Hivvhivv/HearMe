/*
 * ======================================================
 * PSYCHOLOGIST CONTROLLER
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { psychologistService } from "../services/PsychologistService.js";

export class PsychologistController extends BaseController {
  constructor({ psychologists = psychologistService } = {}) {
    super();

    this.psychologists = psychologists;
  }

  // GET /api/psychologists
  async list(req, res) {
    const result = await this.psychologists.list(req.query);

    return this.ok(res, result);
  }

  // GET /api/psychologists/top
  async top(req, res) {
    const psychologists = await this.psychologists.top(
      req.query.limit
    );

    return this.ok(res, { psychologists });
  }

  // GET /api/psychologists/:id
  async detail(req, res) {
    const psychologist = await this.psychologists.getById(
      req.params.id
    );

    return this.ok(res, { psychologist });
  }

  // GET /api/psychologists/:id/availability
  async availability(req, res) {
    const slots = await this.psychologists.availability(
      req.params.id,
      req.query.date
    );

    return this.ok(res, { slots });
  }

  // GET /api/psychologists/:id/ratings
  async listRatings(req, res) {
    const ratings = await this.psychologists.listRatings(
      req.params.id,
      req.query.limit
    );

    return this.ok(res, { ratings });
  }

  // POST /api/psychologists/:id/ratings
  async rate(req, res) {
    const result = await this.psychologists.rate(
      req.params.id,
      req.user.sub,
      req.body || {}
    );

    return this.ok(res, result, 201);
  }
}

export const psychologistController =
  new PsychologistController();
