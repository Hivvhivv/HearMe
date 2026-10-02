/*
 * ======================================================
 * ADMIN CONTROLLER
 * ======================================================
 *
 * Semua aksi admin ada di SATU namespace (/api/admin).
 *
 * Sebelumnya /register dan /login diduplikasi di sini
 * dengan payload JWT berbeda (tanpa sid), sehingga token
 * yang diterbitkannya langsung ditolak auth middleware.
 * Keduanya dihapus -- semua login termasuk admin memakai
 * POST /api/auth/login, dan otorisasi admin ditentukan
 * oleh role di DATABASE.
 *
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { userService } from "../services/UserService.js";

export class AdminController extends BaseController {
  constructor({ users = userService } = {}) {
    super();

    this.users = users;
  }

  // GET /api/admin/me
  async me(req, res) {
    // Payload JWT memakai "sub", bukan "userId".
    // Sebelumnya ObjectId(undefined) membuat endpoint ini
    // selalu membalas 500.
    const user = await this.users.findById(req.user.sub);

    if (!user) {
      return this.legacy(
        res,
        { message: "User not found" },
        404
      );
    }

    return this.legacy(res, { user });
  }

  // PATCH /api/admin/psychologists/:id/verification
  async setVerification(req, res) {
    const status = await this.users.setVerificationStatus(
      req.params.id,
      req.body?.status
    );

    return this.legacy(res, {
      message: `Psychologist ${status}`
    });
  }

  // PATCH /api/admin/users/:id/status
  async setUserStatus(req, res) {
    await this.users.setActive(
      req.params.id,
      req.body?.isActive
    );

    return this.legacy(res, {
      message: "User status updated"
    });
  }

  // GET /api/admin/psychologists
  async listPsychologists(req, res) {
    const psychologists =
      await this.users.listPsychologists();

    return this.legacy(res, { psychologists });
  }
}

export const adminController = new AdminController();
