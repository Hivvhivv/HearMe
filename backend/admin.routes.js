import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";
import { authenticate, authorize } from "./auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user"
    } = req.body;

    // Validasi dasar
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const db = await getDb();

    const normalizedEmail = email.trim().toLowerCase();

    // Cek email
    const existingUser = await db.collection("users").findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    /*
    | User biasa hanya boleh register sebagai:
    | - user
    | - psychologist
    |
    | Admin/super_admin tidak boleh dibuat
    | melalui endpoint register.
    */

    if (!["user", "psychologist"].includes(role)) {
      return res.status(403).json({
        message: "Invalid registration role"
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const now = new Date();

    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,

      role,

      verificationStatus:
        role === "psychologist"
          ? "pending"
          : "not_required",

      isActive: true,

      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection("users").insertOne(newUser);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        verificationStatus: newUser.verificationStatus
      }
    });

  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Registration failed"
    });
  }
});


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const db = await getDb();

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.collection("users").findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Cek account aktif
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account has been disabled"
      });
    }

    // Cek password
    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    /*
    | Psikolog yang belum diverifikasi
    | tidak boleh masuk ke area psikolog.
    */

    if (
      user.role === "psychologist" &&
      user.verificationStatus !== "approved"
    ) {
      return res.status(403).json({
        message: "Psychologist account has not been approved yet",
        verificationStatus: user.verificationStatus
      });
    }

    // Buat JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    return res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed"
    });
  }
});


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
        _id: new ObjectId(req.user.userId)
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

export default router;