/*
 * ======================================================
 * VERIFICATION CONTROLLER
 * ======================================================
 *
 * Membalas bentuk LAMA karena
 * src/api/verification.api.ts sudah membacanya begitu.
 *
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { verificationService } from "../services/VerificationService.js";

export class VerificationController extends BaseController {
  constructor({ verifications = verificationService } = {}) {
    super();

    this.verifications = verifications;
  }

  // POST /api/verification
  async submit(req, res) {
    const submission = await this.verifications.submit(
      req.user.sub,
      req.body?.documents
    );

    return this.legacy(
      res,
      {
        message: "Verification submitted successfully",
        submission
      },
      201
    );
  }

  // GET /api/verification/status
  async status(req, res) {
    const data = await this.verifications.getOwnStatus(
      req.user.sub
    );

    return this.legacy(res, data);
  }

  // GET /api/verification/mine
  async mine(req, res) {
    const data = await this.verifications.listOwn(
      req.user.sub
    );

    return this.legacy(res, data);
  }

  // GET /api/verification  (admin)
  async listAll(req, res) {
    const submissions = await this.verifications.listAll();

    return this.legacy(res, { submissions });
  }

  // PATCH /api/verification/:id/review  (admin)
  async review(req, res) {
    const { status, reason } = req.body || {};

    const submission = await this.verifications.review(
      req.params.id,
      req.user.sub,
      status,
      reason
    );

    return this.legacy(res, {
      message: `Verification ${submission.status}`,
      submission
    });
  }
}

export const verificationController =
  new VerificationController();
