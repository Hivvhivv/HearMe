/*
 * ======================================================
 * AUTH CONTROLLER
 * ======================================================
 *
 * Hanya lapisan HTTP: baca request -> panggil service ->
 * bentuk response. Tidak ada query MongoDB di sini.
 *
 * CATATAN KONTRAK:
 * Endpoint auth membalas bentuk LAMA ({ message, token,
 * user }) karena frontend sudah membacanya begitu.
 * Endpoint baru (users, psychologists) memakai format
 * { success, data }.
 *
 * ======================================================
 */

import { BaseController } from "../core/BaseController.js";
import { userService } from "../services/UserService.js";
import { sessionService } from "../services/SessionService.js";
import { tokenService } from "../services/TokenService.js";
import { cookieService } from "../http/CookieService.js";
import { UserService } from "../services/UserService.js";

export class AuthController extends BaseController {
  constructor({
    users = userService,
    sessions = sessionService,
    tokens = tokenService,
    cookies = cookieService
  } = {}) {
    super();

    this.users = users;
    this.sessions = sessions;
    this.tokens = tokens;
    this.cookies = cookies;
  }


  static clientInfo(req) {
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


  // ====================================================
  // POST /register
  // ====================================================

  async register(req, res) {
    const user = await this.users.register(req.body || {});

    return this.legacy(
      res,
      {
        message:
          user.role === "psychologist"
            ? "Psychologist registration successful"
            : "Registration successful",
        user
      },
      201
    );
  }


  // ====================================================
  // POST /login
  // ====================================================

  async login(req, res) {
    const { email, password } = req.body || {};

    const user = await this.users.verifyCredentials(
      email,
      password
    );

    /*
     * Session BARU untuk device ini.
     *
     * Tidak ada field session tunggal di dokumen user yang
     * ditimpa, jadi login di device B TIDAK membatalkan
     * session device A.
     */
    const { userAgent, ip } = AuthController.clientInfo(req);

    const session = await this.sessions.create({
      userId: user._id,
      userAgent,
      ip
    });

    const token = this.tokens.signAccessToken({
      userId: user._id,
      role: user.role,
      verificationStatus: user.verificationStatus,
      sessionId: session.sessionId
    });

    this.cookies.set(
      res,
      session.refreshToken,
      session.expiresAt
    );

    return this.legacy(res, {
      message: "Login successful",
      token,
      user: UserService.toAuthPayload(user)
    });
  }


  // ====================================================
  // POST /refresh
  // ====================================================
  //
  // Rotasi refresh token HANYA untuk session (device) yang
  // mengirim token tersebut.
  //
  // Beberapa tab yang refresh bersamaan ditangani lewat
  // tenggang waktu: pemenang rotasi mengirim cookie baru,
  // yang lain tetap mendapat access token baru TANPA
  // mengubah cookie -- sehingga tidak ada yang ter-logout.
  //
  // ====================================================

  async refresh(req, res) {
    const refreshToken = this.cookies.getRefreshToken(req);

    if (!refreshToken) {
      return this.legacy(
        res,
        {
          message: "Refresh token missing",
          code: "NO_REFRESH_TOKEN"
        },
        401
      );
    }

    const { userAgent, ip } = AuthController.clientInfo(req);

    const result = await this.sessions.rotate(refreshToken, {
      userAgent,
      ip
    });

    if (result.status === "invalid" || result.status === "reused") {
      this.cookies.clear(res);

      return this.legacy(
        res,
        {
          message:
            result.status === "reused"
              ? "Refresh token already used"
              : "Invalid refresh token",
          code:
            result.status === "reused"
              ? "REFRESH_REUSED"
              : "REFRESH_INVALID"
        },
        401
      );
    }

    const user = await this.users.findById(
      result.session.userId
    );

    if (!user || user.isActive === false) {
      await this.sessions.revoke(
        result.session._id.toString()
      );

      this.cookies.clear(res);

      return this.legacy(
        res,
        {
          message: "Account is not active",
          code: "ACCOUNT_INACTIVE"
        },
        401
      );
    }

    const token = this.tokens.signAccessToken({
      userId: user._id,
      role: user.role,
      verificationStatus: user.verificationStatus,
      sessionId: result.session._id.toString()
    });

    // Cookie HANYA diperbarui oleh pemenang rotasi.
    // Pada jalur "grace", cookie dibiarkan apa adanya.
    if (result.status === "rotated") {
      this.cookies.set(
        res,
        result.refreshToken,
        result.session.expiresAt
      );
    }

    return this.legacy(res, {
      message: "Token refreshed",
      token,
      user: UserService.toAuthPayload(user)
    });
  }


  // ====================================================
  // POST /logout
  // ====================================================
  //
  // Session device ini di-revoke di SERVER, lalu cookie
  // dihapus dengan opsi yang sama seperti saat dibuat.
  // Device lain milik user yang sama tetap login.
  //
  // Sengaja TIDAK memakai middleware authenticate: access
  // token bisa saja sudah kedaluwarsa, tapi user tetap
  // harus bisa logout. Cookie refresh token sudah cukup
  // untuk menentukan session mana yang diakhiri.
  //
  // ====================================================

  async logout(req, res) {
    try {
      const refreshToken = this.cookies.getRefreshToken(req);

      let revoked = false;

      if (refreshToken) {
        revoked = await this.sessions.revokeByRefreshToken(
          refreshToken
        );
      }

      /*
       * Cadangan: kalau cookie tidak ada atau tidak cocok,
       * pakai `sid` dari access token.
       *
       * Ini penting untuk kasus nyata di mana cookie tidak
       * terkirim -- browser memblokir cookie, klien non-browser,
       * atau konfigurasi domain yang salah. Tanpa jalur ini,
       * logout "berhasil" tapi session di server tetap hidup,
       * sehingga refresh token yang masih dipegang orang lain
       * tetap bisa dipakai.
       *
       * Access token diverifikasi dulu; hanya sid yang sah
       * yang boleh me-revoke.
       */
      if (!revoked) {
        const header = req.headers.authorization;

        if (header?.startsWith("Bearer ")) {
          try {
            const payload = this.tokens.verifyAccessToken(
              header.substring(7)
            );

            if (payload?.sid) {
              await this.sessions.revoke(String(payload.sid));
            }
          } catch {
            // Access token kedaluwarsa/invalid: tidak apa-apa,
            // logout tetap dianggap selesai di sisi klien.
          }
        }
      }

      this.cookies.clear(res);

      return this.legacy(res, {
        message: "Logout successful"
      });
    } catch (error) {
      console.error("Logout error:", error);

      // Tetap hapus cookie walaupun revoke gagal.
      this.cookies.clear(res);

      return this.legacy(res, {
        message: "Logout completed with errors"
      });
    }
  }


  async logoutAll(req, res) {
    const count = await this.sessions.revokeAll(req.user.sub);

    this.cookies.clear(res);

    return this.legacy(res, {
      message: "Logged out from all devices",
      revokedSessions: count
    });
  }


  // ====================================================
  // SESSIONS (DAFTAR DEVICE)
  // ====================================================

  async listSessions(req, res) {
    const sessions = await this.sessions.list(req.user.sub);

    return this.legacy(res, {
      sessions: sessions.map((session) => ({
        ...session,
        // Tandai device yang sedang dipakai sekarang.
        current: session.id === req.user.sid
      }))
    });
  }


  async revokeSession(req, res) {
    const session = await this.sessions.getActive(
      req.params.id
    );

    // Hanya boleh mengakhiri session MILIK SENDIRI.
    if (
      !session ||
      session.userId.toString() !== req.user.sub
    ) {
      return this.legacy(
        res,
        { message: "Session not found" },
        404
      );
    }

    await this.sessions.revoke(req.params.id);

    // Kalau yang diakhiri adalah device ini sendiri,
    // cookie-nya juga harus dibersihkan.
    if (req.params.id === req.user.sid) {
      this.cookies.clear(res);
    }

    return this.legacy(res, { message: "Session ended" });
  }


  // ====================================================
  // GET /me
  // ====================================================

  async me(req, res) {
    const user = await this.users.findById(req.user.sub);

    if (!user) {
      return this.legacy(
        res,
        { message: "User not found" },
        404
      );
    }

    return this.legacy(res, { user });
  }
}

export const authController = new AuthController();
