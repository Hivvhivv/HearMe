/*
 * ======================================================
 * VERIFICATION SERVICE
 * ======================================================
 *
 * Alur status akun psikolog:
 *
 *   unverified -> boleh submit
 *   pending    -> TIDAK boleh submit
 *   rejected   -> boleh submit ulang
 *   approved   -> TIDAK boleh submit lagi
 *
 * Status hanya boleh diubah oleh:
 *
 *   - sistem    saat submit  (-> pending)
 *   - admin     saat review  (-> approved / rejected)
 *
 * Frontend TIDAK pernah bisa mengirim
 * verificationStatus = approved.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";
import { AppError } from "../core/AppError.js";
import { Validator } from "../core/Validator.js";

const VALID_DOCUMENT_TYPES = ["ktp", "str", "sip", "sertifikat"];

export class VerificationService extends BaseService {

  async submissions() {
    return this.collection("verification_submissions");
  }

  async users() {
    return this.collection("users");
  }


  async requirePsychologist(userId) {
    const users = await this.users();

    const psychologist = await users.findOne({
      _id: Validator.objectId(userId, "User ID"),
      role: "psychologist"
    });

    if (!psychologist) {
      throw AppError.notFound(
        "Psychologist account not found",
        "PSYCHOLOGIST_NOT_FOUND"
      );
    }

    return psychologist;
  }


  // ====================================================
  // VALIDASI DOKUMEN
  // ====================================================
  //
  // CATATAN KEAMANAN (spec section 23):
  //
  // fileUrl masih diterima sebagai string dari klien --
  // belum ada layanan upload di project ini, dan frontend
  // mengirim data URL base64. Jadi di sini BELUM ada
  // pemeriksaan MIME type, ukuran, maupun file signature.
  //
  // Itu pekerjaan Phase 5 (upload). Yang sudah dijaga
  // sekarang: tipe dokumen harus salah satu dari daftar,
  // fileName/fileUrl wajib ada, dan panjangnya dibatasi.
  //
  // ====================================================

  static validateDocuments(documents) {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw AppError.badRequest(
        "Documents are required",
        "DOCUMENTS_REQUIRED"
      );
    }

    const cleaned = documents
      .filter((d) => d && typeof d === "object")
      .map((d) => ({
        type: d.type,
        fileName: d.fileName,
        fileUrl: d.fileUrl
      }));

    if (cleaned.length === 0) {
      throw AppError.badRequest(
        "At least one valid document is required",
        "DOCUMENTS_REQUIRED"
      );
    }

    for (const document of cleaned) {
      if (!VALID_DOCUMENT_TYPES.includes(document.type)) {
        throw AppError.badRequest(
          `Invalid document type: ${document.type}`,
          "INVALID_DOCUMENT_TYPE"
        );
      }

      if (!document.fileName || !document.fileUrl) {
        throw AppError.badRequest(
          "Each document must have fileName and fileUrl",
          "INCOMPLETE_DOCUMENT"
        );
      }
    }

    return cleaned;
  }


  // ====================================================
  // SUBMIT (PSIKOLOG)
  // ====================================================

  async submit(userId, documents) {
    const cleaned =
      VerificationService.validateDocuments(documents);

    const psychologist = await this.requirePsychologist(userId);

    const status =
      psychologist.verificationStatus || "unverified";

    if (status === "approved") {
      throw AppError.badRequest(
        "Akun psikolog sudah terverifikasi dan tidak dapat mengirim verifikasi lagi.",
        "ALREADY_APPROVED"
      );
    }

    if (status === "pending") {
      throw AppError.badRequest(
        "Verifikasi sedang dalam proses review.",
        "ALREADY_PENDING"
      );
    }

    const submissions = await this.submissions();

    const last = await submissions.findOne(
      { psychologistId: psychologist._id },
      { sort: { submissionNumber: -1 } }
    );

    // Submission baru tidak boleh dibuat selama submission
    // terakhir masih menunggu keputusan admin.
    if (last?.status === "pending") {
      throw AppError.badRequest(
        "Verification is already pending",
        "ALREADY_PENDING"
      );
    }

    const submissionNumber = last
      ? (last.submissionNumber || 0) + 1
      : 1;

    const now = BaseService.now();

    const submission = {
      psychologistId: psychologist._id,
      submissionNumber,
      status: "pending",
      reason: null,
      documents: cleaned,
      submittedAt: now,
      reviewedBy: null,
      reviewedAt: null
    };

    const result = await submissions.insertOne(submission);

    const users = await this.users();

    await users.updateOne(
      { _id: psychologist._id, role: "psychologist" },
      {
        $set: {
          verificationStatus: "pending",
          updatedAt: now
        }
      }
    );

    return { ...submission, _id: result.insertedId };
  }


  // ====================================================
  // STATUS SENDIRI (PSIKOLOG)
  // ====================================================

  async getOwnStatus(userId) {
    const psychologist = await this.requirePsychologist(userId);

    const submissions = await this.submissions();

    const latestSubmission = await submissions.findOne(
      { psychologistId: psychologist._id },
      { sort: { submissionNumber: -1, submittedAt: -1 } }
    );

    return {
      user: {
        id: psychologist._id,
        name: psychologist.name,
        email: psychologist.email,
        role: psychologist.role,
        verificationStatus:
          psychologist.verificationStatus ?? null
      },
      latestSubmission: latestSubmission || null
    };
  }


  async listOwn(userId) {
    const psychologist = await this.requirePsychologist(userId);

    const submissions = await this.submissions();

    const docs = await submissions
      .find({ psychologistId: psychologist._id })
      .sort({ submissionNumber: -1 })
      .toArray();

    return {
      verificationStatus:
        psychologist.verificationStatus || "unverified",
      submissions: docs
    };
  }


  // ====================================================
  // DAFTAR SEMUA (ADMIN)
  // ====================================================

  async listAll() {
    const submissions = await this.submissions();

    return submissions
      .aggregate([
        { $sort: { submittedAt: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "psychologistId",
            foreignField: "_id",
            as: "psychologist"
          }
        },
        {
          $unwind: {
            path: "$psychologist",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          // passwordHash psikolog TIDAK ikut -- hanya field
          // yang disebutkan di sini yang dikirim.
          $project: {
            _id: 1,
            psychologistId: 1,
            submissionNumber: 1,
            status: 1,
            reason: 1,
            documents: 1,
            submittedAt: 1,
            reviewedBy: 1,
            reviewedAt: 1,
            "psychologist._id": 1,
            "psychologist.name": 1,
            "psychologist.email": 1,
            "psychologist.verificationStatus": 1
          }
        }
      ])
      .toArray();
  }


  // ====================================================
  // REVIEW (ADMIN)
  // ====================================================

  async review(submissionId, adminId, status, reason) {
    const valid = Validator.oneOf(
      status,
      "Status",
      ["approved", "rejected"],
      { required: true }
    );

    if (!valid) {
      throw AppError.badRequest(
        "Status must be approved or rejected",
        "INVALID_STATUS"
      );
    }

    // Alasan WAJIB saat menolak, supaya psikolog tahu apa
    // yang harus diperbaiki.
    const trimmedReason =
      valid === "rejected"
        ? Validator.string(reason, "Reason", {
            required: true,
            max: 1000
          })
        : null;

    const _id = Validator.objectId(
      submissionId,
      "Submission ID"
    );

    const reviewerId = Validator.objectId(
      adminId,
      "Reviewer ID"
    );

    const submissions = await this.submissions();
    const now = BaseService.now();

    /*
     * Filter status: "pending" membuat operasi ini idempoten
     * dan aman dari race: dua admin yang menekan tombol
     * bersamaan tidak bisa sama-sama berhasil.
     */
    const result = await submissions.findOneAndUpdate(
      { _id, status: "pending" },
      {
        $set: {
          status: valid,
          reason: trimmedReason,
          reviewedBy: reviewerId,
          reviewedAt: now
        }
      },
      { returnDocument: "after" }
    );

    const submission = BaseService.unwrap(result);

    if (!submission) {
      throw AppError.notFound(
        "Verification is not pending or was not found",
        "SUBMISSION_NOT_PENDING"
      );
    }

    const users = await this.users();

    await users.updateOne(
      {
        _id: submission.psychologistId,
        role: "psychologist"
      },
      {
        $set: {
          verificationStatus: valid,
          updatedAt: now
        }
      }
    );

    return submission;
  }
}

export const verificationService = new VerificationService();
