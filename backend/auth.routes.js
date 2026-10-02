import express from "express";
import bcrypt from "bcryptjs";
import { getDb } from "./db.js";
import { ObjectId } from "mongodb";
import { authenticate, authorize, requireVerifiedPsychologist } from "./auth.middleware.js";

import { signAccessToken } from "./token.service.js";

import {
  createSession,
  getActiveSession,
  listSessions,
  revokeAllSessions,
  revokeSession,
  revokeSessionByRefreshToken,
  rotateSession
} from "./session.service.js";

import {
  clearRefreshCookie,
  getRefreshTokenFromRequest,
  setRefreshCookie
} from "./cookies.js";

const router = express.Router();


// ======================================================
// HELPERS
// ======================================================

// Response yang memuat data user tidak boleh di-cache,
// supaya data user lama tidak muncul kembali setelah
// logout (termasuk dari back/forward cache browser).
function noStore(res) {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
}


function clientInfo(req) {
  return {
    userAgent: req.headers["user-agent"] || "unknown",
    ip:
      (req.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim() ||
      req.socket?.remoteAddress ||
      "unknown"
  };
}


function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    gender: user.gender,
    birthDate: user.birthDate,
    phoneNumber: user.phoneNumber,
    role: user.role,
    verificationStatus: user.verificationStatus
  };
}

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


    // ----------------------------------------------------
    // Buat session BARU untuk device ini.
    //
    // Tidak ada field session tunggal di dokumen user yang
    // ditimpa, jadi login di device B TIDAK membatalkan
    // session device A.
    // ----------------------------------------------------

    const { userAgent, ip } = clientInfo(req);

    const session = await createSession({
      userId: user._id,
      userAgent,
      ip
    });

    const token = signAccessToken({
      userId: user._id,
      role: user.role,
      verificationStatus: user.verificationStatus,
      sessionId: session.sessionId
    });

    setRefreshCookie(
      res,
      session.refreshToken,
      session.expiresAt
    );

    noStore(res);

    return res.json({
      message: "Login successful",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({ message: "Internal server error" });
  }
});


// ======================================================
// REFRESH
// ======================================================
//
// Rotasi refresh token, HANYA untuk session (device)
// yang mengirim token tersebut.
//
// Beberapa tab yang refresh bersamaan ditangani lewat
// tenggang waktu: pemenang rotasi mengirim cookie baru,
// yang lain tetap mendapat access token baru TANPA
// mengubah cookie -- sehingga tidak ada yang ter-logout.
//
// ======================================================

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token missing",
        code: "NO_REFRESH_TOKEN"
      });
    }

    const { userAgent, ip } = clientInfo(req);

    const result = await rotateSession(refreshToken, {
      userAgent,
      ip
    });

    if (
      result.status === "invalid" ||
      result.status === "reused"
    ) {
      clearRefreshCookie(res);

      return res.status(401).json({
        message:
          result.status === "reused"
            ? "Refresh token already used"
            : "Invalid refresh token",
        code:
          result.status === "reused"
            ? "REFRESH_REUSED"
            : "REFRESH_INVALID"
      });
    }

    const db = await getDb();

    const user = await db.collection("users").findOne(
      {
        _id: result.session.userId
      },
      {
        projection: { passwordHash: 0 }
      }
    );

    if (!user || user.isActive === false) {
      await revokeSession(result.session._id.toString());

      clearRefreshCookie(res);

      return res.status(401).json({
        message: "Account is not active",
        code: "ACCOUNT_INACTIVE"
      });
    }

    const token = signAccessToken({
      userId: user._id,
      role: user.role,
      verificationStatus: user.verificationStatus,
      sessionId: result.session._id.toString()
    });

    // Cookie HANYA diperbarui oleh pemenang rotasi.
    // Pada jalur "grace", cookie dibiarkan apa adanya.
    if (result.status === "rotated") {
      setRefreshCookie(
        res,
        result.refreshToken,
        result.session.expiresAt
      );
    }

    noStore(res);

    return res.json({
      message: "Token refreshed",
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Refresh error:", error);

    return res.status(500).json({
      message: "Failed to refresh token"
    });
  }
});


// ======================================================
// LOGOUT (DEVICE INI SAJA)
// ======================================================
//
// Session device ini di-revoke di SERVER, lalu cookie
// dihapus dengan opsi yang sama seperti saat dibuat.
//
// Device lain milik user yang sama tetap login.
//
// Sengaja TIDAK memakai middleware authenticate: access
// token bisa saja sudah kedaluwarsa, tapi user tetap
// harus bisa logout. Cookie refresh token sudah cukup
// untuk menentukan session mana yang diakhiri.
//
// ======================================================

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);

    if (refreshToken) {
      await revokeSessionByRefreshToken(refreshToken);
    }

    clearRefreshCookie(res);

    noStore(res);

    return res.json({
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout error:", error);

    // Tetap hapus cookie walaupun revoke gagal.
    clearRefreshCookie(res);

    return res.json({
      message: "Logout completed with errors"
    });
  }
});


// ======================================================
// LOGOUT DARI SEMUA DEVICE
// ======================================================

router.post("/logout-all", authenticate, async (req, res) => {
  try {
    const count = await revokeAllSessions(req.user.sub);

    clearRefreshCookie(res);

    noStore(res);

    return res.json({
      message: "Logged out from all devices",
      revokedSessions: count
    });

  } catch (error) {
    console.error("Logout all error:", error);

    return res.status(500).json({
      message: "Failed to logout from all devices"
    });
  }
});


// ======================================================
// DAFTAR DEVICE AKTIF
// ======================================================

router.get("/sessions", authenticate, async (req, res) => {
  try {
    const sessions = await listSessions(req.user.sub);

    noStore(res);

    return res.json({
      sessions: sessions.map((session) => ({
        ...session,
        // Tandai device yang sedang dipakai sekarang.
        current: session.id === req.user.sid
      }))
    });

  } catch (error) {
    console.error("List sessions error:", error);

    return res.status(500).json({
      message: "Failed to list sessions"
    });
  }
});


// ======================================================
// AKHIRI SATU DEVICE TERTENTU
// ======================================================

router.delete(
  "/sessions/:id",
  authenticate,
  async (req, res) => {
    try {
      const session = await getActiveSession(req.params.id);

      // Hanya boleh mengakhiri session MILIK SENDIRI.
      if (
        !session ||
        session.userId.toString() !== req.user.sub
      ) {
        return res.status(404).json({
          message: "Session not found"
        });
      }

      await revokeSession(req.params.id);

      // Kalau yang diakhiri adalah device ini sendiri,
      // cookie-nya juga harus dibersihkan.
      if (req.params.id === req.user.sid) {
        clearRefreshCookie(res);
      }

      noStore(res);

      return res.json({
        message: "Session ended"
      });

    } catch (error) {
      console.error("Revoke session error:", error);

      return res.status(500).json({
        message: "Failed to end session"
      });
    }
  }
);

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

    noStore(res);

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


// ======================================================
// CATATAN: route admin DIPINDAH, tidak diduplikasi.
//
// PATCH /users/:id/status dan
// PATCH /psychologists/:id/verification
//
// sebelumnya ADA DI DUA TEMPAT: di sini dan di
// admin.routes.js, dengan isi yang sama.
//
// Yang dipertahankan hanya versi di admin.routes.js:
//
//   PATCH /api/admin/users/:id/status
//   PATCH /api/admin/psychologists/:id/verification
//
// supaya semua aksi admin berada di satu namespace.
// ======================================================

export default router;
