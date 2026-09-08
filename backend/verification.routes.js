import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";
import {
  authenticate,
  authorize
} from "./auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PSYCHOLOGIST - SUBMIT VERIFICATION
|--------------------------------------------------------------------------
|
| Status akun:
|
| unverified -> boleh submit
| pending    -> tidak boleh submit
| rejected   -> boleh submit ulang
| approved   -> tidak boleh submit lagi
|
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  authorize("psychologist"),
  async (req, res) => {
    try {
      const { documents } = req.body || {};

      // ------------------------------------------------------
      // VALIDASI DOCUMENTS
      // ------------------------------------------------------

      if (
        !Array.isArray(documents) ||
        documents.length === 0
      ) {
        return res.status(400).json({
          message: "Documents are required"
        });
      }

      const db = await getDb();

      // ------------------------------------------------------
      // CARI AKUN PSIKOLOG BERDASARKAN TOKEN
      // ------------------------------------------------------

      if (!ObjectId.isValid(req.user.sub)) {
        return res.status(400).json({
          message: "Invalid user ID"
        });
      }

      const psychologist =
        await db.collection("users").findOne({
          _id: new ObjectId(req.user.sub),
          role: "psychologist"
        });

      if (!psychologist) {
        return res.status(404).json({
          message: "Psychologist account not found"
        });
      }

      // ------------------------------------------------------
      // CEK STATUS AKUN LANGSUNG DARI MONGODB
      // ------------------------------------------------------

      const currentVerificationStatus =
        psychologist.verificationStatus || "unverified";

      // Sudah terverifikasi
      if (
        currentVerificationStatus === "approved"
      ) {
        return res.status(400).json({
          message:
            "Akun psikolog sudah terverifikasi dan tidak dapat mengirim verifikasi lagi."
        });
      }

      if (
        currentVerificationStatus === "pending"
      ) {
        return res.status(400).json({
          message:
            "Verifikasi sedang dalam proses review."
        });
      }

      // ------------------------------------------------------
      // VALIDASI DOCUMENT
      // ------------------------------------------------------

      const validDocumentTypes = [
        "ktp",
        "str",
        "sip",
        "sertifikat"
      ];

      const cleanedDocuments =
        documents
          .filter(
            (document) =>
              document &&
              typeof document === "object"
          )
          .map((document) => ({
            type: document.type,
            fileName: document.fileName,
            fileUrl: document.fileUrl
          }));

      if (cleanedDocuments.length === 0) {
        return res.status(400).json({
          message:
            "At least one valid document is required"
        });
      }

      for (const document of cleanedDocuments) {
        if (
          !validDocumentTypes.includes(
            document.type
          )
        ) {
          return res.status(400).json({
            message:
              `Invalid document type: ${document.type}`
          });
        }

        if (
          !document.fileName ||
          !document.fileUrl
        ) {
          return res.status(400).json({
            message:
              "Each document must have fileName and fileUrl"
          });
        }
      }

      // ------------------------------------------------------
      // AMBIL SUBMISSION TERAKHIR
      // ------------------------------------------------------

      const lastSubmission =
        await db
          .collection("verification_submissions")
          .findOne(
            {
              psychologistId:
                psychologist._id
            },
            {
              sort: {
                submissionNumber: -1
              }
            }
          );

      // Submission baru tidak boleh dibuat selama submission terakhir
      // masih menunggu keputusan admin. Kepemilikan selalu dari JWT.
      if (lastSubmission?.status === "pending") {
        return res.status(400).json({
          message: "Verification is already pending"
        });
      }

      // ------------------------------------------------------
      // TENTUKAN NOMOR SUBMISSION
      // ------------------------------------------------------

      const submissionNumber =
        lastSubmission
          ? (lastSubmission.submissionNumber || 0) + 1
          : 1;

      const now = new Date();

      // ------------------------------------------------------
      // BUAT SUBMISSION BARU
      // ------------------------------------------------------

      const submission = {
        psychologistId:
          psychologist._id,

        submissionNumber,

        status: "pending",

        reason: null,

        documents:
          cleanedDocuments,

        submittedAt: now,

        reviewedBy: null,

        reviewedAt: null
      };

      const result =
        await db
          .collection(
            "verification_submissions"
          )
          .insertOne(submission);

      // ------------------------------------------------------
      // UPDATE STATUS USER
      // ------------------------------------------------------

      await db
        .collection("users")
        .updateOne(
          {
            _id: psychologist._id,
            role: "psychologist"
          },
          {
            $set: {
              verificationStatus:
                "pending",

              updatedAt: now
            }
          }
        );

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      return res.status(201).json({
        message:
          "Verification submitted successfully",

        submission: {
          _id: result.insertedId,

          psychologistId:
            psychologist._id,

          submissionNumber,

          status: "pending",

          reason: null,

          documents:
            cleanedDocuments,

          submittedAt: now,

          reviewedBy: null,

          reviewedAt: null
        }
      });

    } catch (error) {
      console.error(
        "Submit verification error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to submit verification"
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| PSYCHOLOGIST - GET OWN VERIFICATION
|--------------------------------------------------------------------------
|
| Endpoint:
|
| GET /api/verification/mine
|
| Response:
|
| {
|   verificationStatus: "approved",
|   submissions: [...]
| }
|
|--------------------------------------------------------------------------
*/

router.get(
  "/status",
  authenticate,
  authorize("psychologist"),
  async (req, res) => {
    try {
      if (!ObjectId.isValid(req.user.sub)) {
        return res.status(400).json({
          message: "Invalid user ID"
        });
      }

      const db = await getDb();
      const psychologistId = new ObjectId(req.user.sub);
      const psychologist = await db.collection("users").findOne({
        _id: psychologistId,
        role: "psychologist"
      });

      if (!psychologist) {
        return res.status(404).json({
          message: "Psychologist account not found"
        });
      }

      const latestSubmission = await db
        .collection("verification_submissions")
        .findOne(
          { psychologistId },
          { sort: { submissionNumber: -1, submittedAt: -1 } }
        );

      return res.json({
        user: {
          id: psychologist._id,
          name: psychologist.name,
          email: psychologist.email,
          role: psychologist.role,
          verificationStatus:
            psychologist.verificationStatus ?? null
        },
        latestSubmission: latestSubmission || null
      });
    } catch (error) {
      console.error("Get verification status error:", error);
      return res.status(500).json({
        message: "Failed to get verification status"
      });
    }
  }
);

router.get(
  "/mine",
  authenticate,
  authorize("psychologist"),
  async (req, res) => {
    try {
      const db = await getDb();

      // ------------------------------------------------------
      // VALIDASI USER ID
      // ------------------------------------------------------

      if (!ObjectId.isValid(req.user.sub)) {
        return res.status(400).json({
          message: "Invalid user ID"
        });
      }

      const psychologistId =
        new ObjectId(req.user.sub);

      // ------------------------------------------------------
      // AMBIL USER DARI MONGODB
      // ------------------------------------------------------

      const psychologist =
        await db.collection("users").findOne({
          _id: psychologistId,
          role: "psychologist"
        });

      if (!psychologist) {
        return res.status(404).json({
          message:
            "Psychologist account not found"
        });
      }

      // ------------------------------------------------------
      // AMBIL SEMUA SUBMISSION
      // ------------------------------------------------------

      const submissions =
        await db
          .collection(
            "verification_submissions"
          )
          .find({
            psychologistId
          })
          .sort({
            submissionNumber: -1
          })
          .toArray();

      // ------------------------------------------------------
      // STATUS VERIFIKASI DARI USERS
      // ------------------------------------------------------

      const verificationStatus =
        psychologist.verificationStatus ||
        "unverified";

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      return res.json({
        verificationStatus,

        submissions
      });

    } catch (error) {
      console.error(
        "Get verification submissions error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to get verification submissions"
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| ADMIN - GET ALL VERIFICATION SUBMISSIONS
|--------------------------------------------------------------------------
|
| GET /api/verification
|
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  async (req, res) => {
    try {
      const db = await getDb();

      const submissions =
        await db
          .collection(
            "verification_submissions"
          )
          .aggregate([
            {
              $sort: {
                submittedAt: -1
              }
            },

            {
              $lookup: {
                from: "users",

                localField:
                  "psychologistId",

                foreignField: "_id",

                as: "psychologist"
              }
            },

            {
              $unwind: {
                path: "$psychologist",

                preserveNullAndEmptyArrays:
                  true
              }
            },

            {
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

      return res.json({
        submissions
      });

    } catch (error) {
      console.error(
        "Get verification submissions error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to get verification submissions"
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| ADMIN - REVIEW VERIFICATION
|--------------------------------------------------------------------------
|
| PATCH /api/verification/:id/review
|
| status:
| - approved
| - rejected
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/review",
  authenticate,
  authorize("admin", "super_admin"),
  async (req, res) => {
    try {
      const {
        status,
        reason
      } = req.body;

      // ------------------------------------------------------
      // VALIDASI STATUS
      // ------------------------------------------------------

      if (
        !["approved", "rejected"]
          .includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be approved or rejected"
        });
      }

      // ------------------------------------------------------
      // REASON WAJIB JIKA REJECTED
      // ------------------------------------------------------

      if (
        status === "rejected" &&
        (!reason ||
          !reason.trim())
      ) {
        return res.status(400).json({
          message:
            "Reason is required when rejecting verification"
        });
      }

      // ------------------------------------------------------
      // VALIDASI SUBMISSION ID
      // ------------------------------------------------------

      if (
        !ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid submission ID"
        });
      }

      // ------------------------------------------------------
      // VALIDASI ADMIN ID
      // ------------------------------------------------------

      if (
        !ObjectId.isValid(
          req.user.sub
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid reviewer ID"
        });
      }

      const db = await getDb();

      const submission =
        await db
          .collection(
            "verification_submissions"
          )
          .findOneAndUpdate(
            {
              _id: new ObjectId(
                req.params.id
              ),

              status: "pending"
            },
            {
              $set: {
                status,

                reason:
                  status === "rejected"
                    ? reason.trim()
                    : null,

                reviewedBy:
                  new ObjectId(
                    req.user.sub
                  ),

                reviewedAt:
                  new Date()
              }
            },
            {
              returnDocument: "after"
            }
          );

      if (!submission) {
        return res.status(404).json({
          message:
            "Verification is not pending or was not found"
          });
      }

      const now = new Date();

      // ------------------------------------------------------
      // UPDATE STATUS USER
      // ------------------------------------------------------

      await db
        .collection("users")
        .updateOne(
          {
            _id:
              submission.psychologistId,

            role:
              "psychologist"
          },
          {
            $set: {
              verificationStatus:
                status,

              updatedAt:
                now
            }
          }
        );

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      return res.json({
        message:
          status === "approved"
            ? "Verification approved"
            : "Verification rejected",

        submissionId:
          submission._id,

        submissionNumber:
          submission.submissionNumber ||
          null,

        status,

        reason:
          status === "rejected"
            ? reason.trim()
            : null
      });

    } catch (error) {
      console.error(
        "Review verification error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to review verification"
      });
    }
  }
);


export default router;
