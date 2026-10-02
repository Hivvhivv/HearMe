import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";
import { authenticate, authorize } from "./auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CATATAN: /register dan /login DIHAPUS dari file ini.
|
| Keduanya menduplikasi auth.routes.js dengan payload JWT
| berbeda ({ userId, ... }) dan TANPA sid, sehingga token yang
| diterbitkannya langsung ditolak auth middleware.
|
| Semua login -- termasuk admin -- sekarang melalui:
|
|   POST /api/auth/login
|
| yang membuat session per device dan cookie refresh token.
| Otorisasi admin ditentukan oleh role di database.
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

router.get("/me", authenticate, async (req, res) => {
  try {
    const db = await getDb();

    const user = await db.collection("users").findOne(
      {
        // Payload JWT memakai "sub", bukan "userId".
        // Sebelumnya ObjectId(undefined) membuat
        // endpoint ini selalu balas 500.
        _id: new ObjectId(req.user.sub)
      },
      {
        projection: {
          passwordHash: 0
        }
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.json({
      user
    });

  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Failed to get user"
    });
  }
});


/*
|--------------------------------------------------------------------------
| ADMIN - PSYCHOLOGIST VERIFICATION
|--------------------------------------------------------------------------
*/

router.patch(
  "/psychologists/:id/verification",
  authenticate,
  authorize("admin", "super_admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({
          message: "Invalid verification status"
        });
      }

      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid user ID"
        });
      }

      const db = await getDb();

      const result = await db.collection("users").updateOne(
        {
          _id: new ObjectId(req.params.id),
          role: "psychologist"
        },
        {
          $set: {
            verificationStatus: status,
            updatedAt: new Date()
          }
        }
      );

      if (!result.matchedCount) {
        return res.status(404).json({
          message: "Psychologist account not found"
        });
      }

      return res.json({
        message: `Psychologist ${status}`
      });

    } catch (error) {
      console.error("Verification error:", error);

      return res.status(500).json({
        message: "Failed to update verification"
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| ADMIN - USER STATUS
|--------------------------------------------------------------------------
*/

router.patch(
  "/users/:id/status",
  authenticate,
  authorize("admin", "super_admin"),
  async (req, res) => {
    try {
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive must be boolean"
        });
      }

      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid user ID"
        });
      }

      const db = await getDb();

      const result = await db.collection("users").updateOne(
        {
          _id: new ObjectId(req.params.id)
        },
        {
          $set: {
            isActive,
            updatedAt: new Date()
          }
        }
      );

      if (!result.matchedCount) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      return res.json({
        message: "User status updated"
      });

    } catch (error) {
      console.error("User status error:", error);

      return res.status(500).json({
        message: "Failed to update user status"
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN - GET PSYCHOLOGISTS
|--------------------------------------------------------------------------
*/

router.get(
  "/psychologists",
  authenticate,
  authorize("admin", "super_admin"),
  async (req, res) => {
    try {
      const db = await getDb();

      const psychologists = await db
        .collection("users")
        .find(
          { role: "psychologist" },
          {
            projection: {
              passwordHash: 0
            }
          }
        )
        .sort({ createdAt: -1 })
        .toArray();

      return res.json({
        psychologists
      });

    } catch (error) {
      console.error("Get psychologists error:", error);

      return res.status(500).json({
        message: "Failed to get psychologists"
      });
    }
  }
);

export default router;