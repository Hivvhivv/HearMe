/*
 * ======================================================
 * MIND HUB CONTROLLER
 * ======================================================
 *
 * Dua kelompok endpoint:
 *
 *   publik (user)  -> hanya konten published
 *   admin          -> semua konten + CRUD
 *
 * Pemisahan itu ada di ROUTE (role guard) dan di SERVICE
 * (filter published), bukan hanya di salah satunya.
 *
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { mindHubService } from "../services/MindHubService.js";

export class MindHubController extends BaseController {
  constructor({ mindHub = mindHubService } = {}) {
    super();

    this.mindHub = mindHub;
  }


  // ====================================================
  // PUBLIK
  // ====================================================

  // GET /api/mind-hub
  async list(req, res) {
    const result = await this.mindHub.listPublished(req.query);

    return this.ok(res, result);
  }

  // GET /api/mind-hub/:id
  async detail(req, res) {
    const content = await this.mindHub.getPublished(
      req.params.id
    );

    return this.ok(res, { content });
  }

  // GET /api/mind-hub/:id/related
  async related(req, res) {
    const contents = await this.mindHub.related(
      req.params.id,
      req.query.limit
    );

    return this.ok(res, { contents });
  }


  // ====================================================
  // ADMIN
  // ====================================================

  // GET /api/admin/mind-hub
  async adminList(req, res) {
    const contents = await this.mindHub.listAll(req.query);

    return this.ok(res, { contents });
  }

  // GET /api/admin/mind-hub/:id
  async adminDetail(req, res) {
    const content = await this.mindHub.getAny(req.params.id);

    return this.ok(res, { content });
  }

  // POST /api/admin/mind-hub
  async create(req, res) {
    const content = await this.mindHub.create(
      req.user.sub,
      req.body || {}
    );

    return this.ok(res, { content }, 201);
  }

  // PATCH /api/admin/mind-hub/:id
  async update(req, res) {
    const content = await this.mindHub.update(
      req.params.id,
      req.body || {}
    );

    return this.ok(res, { content });
  }

  // PATCH /api/admin/mind-hub/:id/publish
  async setStatus(req, res) {
    const content = await this.mindHub.setStatus(
      req.params.id,
      req.body?.status
    );

    return this.ok(res, { content });
  }

  // DELETE /api/admin/mind-hub/:id
  async remove(req, res) {
    await this.mindHub.remove(req.params.id);

    return this.ok(res, { message: "Konten dihapus" });
  }
}

export const mindHubController = new MindHubController();
