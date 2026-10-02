/*
 * ======================================================
 * USER CONTROLLER
 * ======================================================
 *
 * Resource-nya SELALU "me". Tidak ada endpoint di sini
 * yang menerima userId dari klien, sehingga tidak mungkin
 * seorang user mengubah profil user lain.
 *
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { userService } from "../services/UserService.js";

export class UserController extends BaseController {
  constructor({ users = userService } = {}) {
    super();

    this.users = users;
  }

  // GET /api/users/me
  async getMe(req, res) {
    const user = await this.users.getProfile(req.user.sub);

    return this.ok(res, { user });
  }

  // PATCH /api/users/me
  async updateMe(req, res) {
    const user = await this.users.updateProfile(
      req.user.sub,
      req.body || {}
    );

    return this.ok(res, { user });
  }

  // PATCH /api/users/me/password
  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body || {};

    await this.users.changePassword(
      req.user.sub,
      currentPassword,
      newPassword
    );

    return this.ok(res, {
      message: "Password berhasil diperbarui"
    });
  }

  // PATCH /api/users/me/psychologist-profile
  async updatePsychologistProfile(req, res) {
    const psychologistProfile =
      await this.users.updatePsychologistProfile(
        req.user.sub,
        req.body || {}
      );

    return this.ok(res, { psychologistProfile });
  }
}

export const userController = new UserController();
