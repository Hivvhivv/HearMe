import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "./db.js";
import { ObjectId } from "mongodb";
import { authenticate, authorize, requireVerifiedPsychologist } from "./auth.middleware.js";
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
    const {
      name,
      username,
      gender,
      birthDate,
      birthday,
      phoneNumber,
      contact,
      email,
      password,
      confirmPassword,
      role = "user"
    } = req.body || {};

    const normalizedEmail = typeof email === "string"
      ? email.trim().toLowerCase()
      : "";
    const normalizedUsername = typeof username === "string"
      ? username.trim()
      : typeof name === "string"
        ? name.trim()
        : "";
    const normalizedBirthDate = birthDate || birthday;
    const normalizedPhoneNumber = phoneNumber || contact;

    // Basic validation
    if (!normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required"
      });
    }

    // Public registration hanya boleh membuat user
    // atau psychologist.
    if (!["user", "psychologist"].includes(role)) {
      return res.status(403).json({
        message: "Invalid registration role"
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (role === "psychologist") {
      if (!gender || !normalizedBirthDate || !normalizedPhoneNumber) {
        return res.status(400).json({
          message: "Gender, birth date, and phone number are required for psychologists"
        });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedBirthDate)) {
        return res.status(400).json({ message: "Birth date must use YYYY-MM-DD format" });
      }
    }

    const db = await getDb();

    // Check duplicate email
    const existing = await db.collection("users").findOne({
      email: normalizedEmail
    });

    if (existing) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const existingUsername = await db.collection("users").findOne({
      username: normalizedUsername
    });

    if (existingUsername) {
      return res.status(409).json({ message: "Username already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Verification status ditentukan SERVER,
    // bukan dari request user.
    const verificationStatus =
      role === "psychologist"
        ? "unverified"
        : "not_required";

    const user = {
      name: normalizedUsername,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role,
      verificationStatus,
      ...(role === "psychologist" ? {
        gender,
        birthDate: normalizedBirthDate,
        phoneNumber: normalizedPhoneNumber
      } : {}),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("users").insertOne(user);

    return res.status(201).json({
      message:
        role === "psychologist"
          ? "Psychologist registration successful"
          : "Registration successful",

      user: {
        id: result.insertedId,
        name: user.name,
        username: user.username,
        email: user.email,
        gender: user.gender,
        birthDate: user.birthDate,
        phoneNumber: user.phoneNumber,
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
        username: user.username,
        email: user.email,
        gender: user.gender,
        birthDate: user.birthDate,
        phoneNumber: user.phoneNumber,
        role: user.role,
        verificationStatus: user.verificationStatus
      }
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

   // Verification user ini 
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


//Verification psychologist ini
router.get(
  "/psychologist-test",
  authenticate,
  requireVerifiedPsychologist,
  async (req, res) => {
    return res.json({
      ok: true,
      message: "Psychologist access granted",
      user: req.user
    });
  }
);

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
      console.error("Update psychologist verification error:", error);

      return res.status(500).json({
        message: "Failed to update psychologist verification"
      });
    }
  }
);

export default router;
