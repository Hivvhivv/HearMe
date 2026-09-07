import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "./db.js";
import { ObjectId } from "mongodb";
import { authenticate, authorize } from "./auth.middleware.js";
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    ok: true,
    message: "auth.routes.js is connected"
  });
});

const allowedRoles = ["user", "psychologist", "admin", "super_admin"];

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    // Public registration hanya boleh membuat user
    // atau psychologist.
    if (!["user", "psychologist"].includes(role)) {
      return res.status(403).json({
        message: "Invalid registration role"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const db = await getDb();

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await db.collection("users").findOne({
      email: normalizedEmail
    });

    if (existing) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Verification status ditentukan SERVER,
    // bukan dari request user.
    const verificationStatus =
      role === "psychologist"
        ? "pending"
        : "not_required";

    const user = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      verificationStatus,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("users").insertOne(user);

    return res.status(201).json({
      message:
        role === "psychologist"
          ? "Psychologist registration submitted for verification"
          : "Registration successful",

      user: {
        id: result.insertedId,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (err) {
    console.error("Registration error:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({
      email: email.trim().toLowerCase()
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        verificationStatus: user.verificationStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
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
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const db = await getDb();

    const user = await db.collection("users").findOne(
      {
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
      console.error("Update user status error:", error);

      return res.status(500).json({
        message: "Failed to update user status"
      });
    }
  }
);

export default router;
