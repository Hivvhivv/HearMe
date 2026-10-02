/*
 * ======================================================
 * FORUM CONTROLLER
 * ======================================================
 *
 * Catatan penting: controller TIDAK pernah menentukan siapa
 * pemilik atau apakah user di-ban. Keduanya diputuskan
 * service, yang selalu memakai userId dari JWT.
 *
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { forumService } from "../services/ForumService.js";

export class ForumController extends BaseController {
  constructor({ forums = forumService } = {}) {
    super();

    this.forums = forums;
  }


  // ====================================================
  // PUBLIK / USER
  // ====================================================

  // GET /api/forums
  async list(req, res) {
    const result = await this.forums.list(
      req.user.sub,
      req.query
    );

    return this.ok(res, result);
  }

  // GET /api/forums/mine?tab=posts|replies|likes|saved|archived
  async listMine(req, res) {
    const items = await this.forums.listMine(
      req.user.sub,
      req.query.tab
    );

    return this.ok(res, { items });
  }

  // GET /api/forums/ban-status
  async banStatus(req, res) {
    const status = await this.forums.myBanStatus(req.user.sub);

    return this.ok(res, status);
  }

  // GET /api/forums/:id
  async detail(req, res) {
    const post = await this.forums.getById(
      req.user.sub,
      req.params.id
    );

    return this.ok(res, { post });
  }

  // POST /api/forums
  async create(req, res) {
    const post = await this.forums.create(
      req.user.sub,
      req.body || {}
    );

    return this.ok(res, { post }, 201);
  }

  // PATCH /api/forums/:id/archive
  async archive(req, res) {
    const post = await this.forums.setStatus(
      req.user.sub,
      req.params.id,
      "archived"
    );

    return this.ok(res, { post });
  }

  // PATCH /api/forums/:id/restore
  async restore(req, res) {
    const post = await this.forums.setStatus(
      req.user.sub,
      req.params.id,
      "active"
    );

    return this.ok(res, { post });
  }

  // DELETE /api/forums/:id
  async remove(req, res) {
    await this.forums.remove(req.user.sub, req.params.id);

    return this.ok(res, { message: "Post dihapus" });
  }

  // POST /api/forums/:id/like
  async toggleLike(req, res) {
    const result = await this.forums.toggleLike(
      req.user.sub,
      req.params.id
    );

    return this.ok(res, result);
  }

  // POST /api/forums/:id/save
  async toggleSave(req, res) {
    const result = await this.forums.toggleSave(
      req.user.sub,
      req.params.id
    );

    return this.ok(res, result);
  }

  // GET /api/forums/:id/replies
  async listReplies(req, res) {
    const replies = await this.forums.listReplies(
      req.user.sub,
      req.params.id
    );

    return this.ok(res, { replies });
  }

  // POST /api/forums/:id/replies
  async reply(req, res) {
    const reply = await this.forums.reply(
      req.user.sub,
      req.params.id,
      req.body || {}
    );

    return this.ok(res, { reply }, 201);
  }

  // POST /api/forums/:id/reports
  async report(req, res) {
    const report = await this.forums.report(
      req.user.sub,
      req.params.id,
      req.body || {}
    );

    return this.ok(res, { report }, 201);
  }


  // ====================================================
  // ADMIN
  // ====================================================

  // GET /api/admin/forum-reports
  async adminListReports(req, res) {
    const reports = await this.forums.listReports(req.query);

    return this.ok(res, { reports });
  }

  // PATCH /api/admin/forum-reports/:id/review
  async adminReviewReport(req, res) {
    const result = await this.forums.reviewReport(
      req.user.sub,
      req.params.id,
      req.body || {}
    );

    return this.ok(res, { report: result });
  }

  // GET /api/admin/forum-bans
  async adminListBans(req, res) {
    const bans = await this.forums.listBans();

    return this.ok(res, { bans });
  }

  // POST /api/admin/forum-bans/:userId
  async adminBan(req, res) {
    const result = await this.forums.banUser(
      req.user.sub,
      req.params.userId,
      req.body || {}
    );

    return this.ok(res, { ban: result }, 201);
  }

  // DELETE /api/admin/forum-bans/:userId
  async adminUnban(req, res) {
    await this.forums.unbanUser(
      req.user.sub,
      req.params.userId
    );

    return this.ok(res, { message: "Ban dicabut" });
  }
}

export const forumController = new ForumController();
