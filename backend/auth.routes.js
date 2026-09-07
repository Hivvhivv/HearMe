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

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Public registration should never be allowed to create admin/super_admin.
    if (role !== "user") {
      return res.status(403).json({ message: "Public registration can only create user accounts" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const db = await getDb();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db.collection("users").findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
      verificationStatus: "not_required",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("users").insertOne(user);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: result.insertedId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: "Internal server error" });
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

export default router;
