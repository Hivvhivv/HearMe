/*
 * ======================================================
 * CHAT GATEWAY (SOCKET.IO)
 * ======================================================
 *
 * Spec section 15, dan section 36 poin 5.
 *
 * KEADAAN SEBELUMNYA:
 *
 * Tidak ada realtime sama sekali. Kedua halaman chat
 * menyimpan pesan di localStorage, dan sisi psikolog
 * mem-polling localStorage setiap 2 detik -- yang tentu
 * tidak akan pernah menerima pesan dari device lain.
 *
 * DUA KEPUTUSAN PENTING DI SINI:
 *
 * 1. BANYAK SOCKET PER USER, BUKAN SATU
 *
 *    Spec section 36 memperingatkan pola `Map<userId,
 *    socketId>`: koneksi device baru menimpa device lama,
 *    sehingga chat hanya sampai ke satu device.
 *
 *    Karena itu di sini TIDAK ada map seperti itu. Yang
 *    dipakai adalah ROOM:
 *
 *      user:<userId>                 -> semua device user
 *      consultation:<consultationId> -> kedua partisipan
 *
 *    Emit selalu ke room, jadi semua device yang online
 *    menerima pesan yang sama.
 *
 * 2. AUTENTIKASI SOCKET MEMAKAI RANTAI YANG SAMA
 *    DENGAN HTTP
 *
 *    JWT valid -> ada sid -> session belum di-revoke ->
 *    user aktif. Jadi logout benar-benar memutus socket,
 *    bukan hanya menutup akses HTTP.
 *
 * ======================================================
 */

import { Server as SocketServer } from "socket.io";

import { tokenService } from "../services/TokenService.js";
import { sessionService } from "../services/SessionService.js";
import { userService } from "../services/UserService.js";
import { consultationService } from "../services/ConsultationService.js";

export class ChatGateway {
  constructor({
    tokens = tokenService,
    sessions = sessionService,
    users = userService,
    consultations = consultationService
  } = {}) {
    this.tokens = tokens;
    this.sessions = sessions;
    this.users = users;
    this.consultations = consultations;

    this.io = null;
  }


  static userRoom(userId) {
    return `user:${userId}`;
  }

  static consultationRoom(consultationId) {
    return `consultation:${consultationId}`;
  }


  // ====================================================
  // ATTACH
  // ====================================================

  /*
   * `origin` memakai bentuk yang sama dengan cors(): daftar
   * origin, atau boolean. Nilainya ditentukan satu kali di
   * server.js (corsOrigin()) supaya HTTP dan realtime tidak
   * pernah punya kebijakan yang berbeda.
   */
  attach(httpServer, { origin = false } = {}) {
    this.io = new SocketServer(httpServer, {
      path: "/socket.io",

      cors: {
        origin,
        credentials: true
      }
    });

    this.io.use((socket, next) =>
      this.authenticate(socket, next)
    );

    this.io.on("connection", (socket) =>
      this.onConnection(socket)
    );

    console.log("Socket.IO chat gateway siap di /socket.io");

    return this.io;
  }


  // ====================================================
  // AUTENTIKASI HANDSHAKE
  // ====================================================

  async authenticate(socket, next) {
    try {
      const raw =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(
          /^Bearer\s+/i,
          ""
        );

      if (!raw) {
        return next(new Error("UNAUTHENTICATED"));
      }

      let payload;

      try {
        payload = this.tokens.verifyAccessToken(raw);
      } catch {
        return next(new Error("INVALID_TOKEN"));
      }

      // Token tanpa sid tidak bisa di-revoke -> tolak.
      if (!payload?.sid) {
        return next(new Error("SESSION_REQUIRED"));
      }

      const session = await this.sessions.getActive(payload.sid);

      if (!session) {
        return next(new Error("SESSION_REVOKED"));
      }

      if (session.userId?.toString() !== String(payload.sub)) {
        return next(new Error("SESSION_MISMATCH"));
      }

      const user = await this.users.findById(payload.sub);

      if (!user || user.isActive === false) {
        return next(new Error("ACCOUNT_INACTIVE"));
      }

      socket.data.user = {
        sub: user._id.toString(),
        sid: payload.sid,
        role: user.role,
        name: user.name
      };

      return next();
    } catch (error) {
      console.error("Socket auth error:", error?.message);

      return next(new Error("AUTH_ERROR"));
    }
  }


  // ====================================================
  // CONNECTION
  // ====================================================

  onConnection(socket) {
    const { sub: userId, role } = socket.data.user;

    /*
     * Room per USER, bukan map socketId.
     *
     * Satu user bisa punya banyak socket (laptop + HP +
     * beberapa tab) dan semuanya masuk room yang sama,
     * sehingga notifikasi sampai ke seluruh device.
     */
    socket.join(ChatGateway.userRoom(userId));

    socket.emit("ready", { userId, role });


    socket.on("consultation:join", (payload, ack) =>
      this.onJoin(socket, payload, ack)
    );

    socket.on("consultation:leave", (payload, ack) =>
      this.onLeave(socket, payload, ack)
    );

    socket.on("consultation:message", (payload, ack) =>
      this.onMessage(socket, payload, ack)
    );

    socket.on("consultation:typing", (payload) =>
      this.onTyping(socket, payload)
    );

    socket.on("consultation:read", (payload, ack) =>
      this.onRead(socket, payload, ack)
    );
  }


  static respond(ack, data) {
    if (typeof ack === "function") {
      ack(data);
    }
  }


  /*
   * Memastikan socket ini memang PARTISIPAN consultation.
   *
   * Dipakai sebelum join maupun sebelum kirim pesan --
   * tidak cukup hanya saat join, karena klien bisa saja
   * mengirim event message tanpa pernah join.
   */
  async requireParticipant(socket, consultationId) {
    const { sub: userId, role } = socket.data.user;

    const { ObjectId } = await import("mongodb");

    if (!ObjectId.isValid(String(consultationId || ""))) {
      return null;
    }

    return this.consultations.findOwned(
      consultationId,
      new ObjectId(userId),
      role
    );
  }


  // ====================================================
  // JOIN / LEAVE
  // ====================================================

  async onJoin(socket, payload, ack) {
    try {
      const consultationId = payload?.consultationId;

      const consultation = await this.requireParticipant(
        socket,
        consultationId
      );

      // Bukan partisipan -> TIDAK boleh masuk room.
      if (!consultation) {
        return ChatGateway.respond(ack, {
          ok: false,
          code: "FORBIDDEN",
          message: "Bukan peserta konsultasi ini"
        });
      }

      socket.join(
        ChatGateway.consultationRoom(consultationId)
      );

      // Riwayat dikirim sekali saat join, supaya klien tidak
      // perlu memanggil REST terpisah.
      const messages = await this.consultations.listMessages(
        consultationId,
        consultation.userId &&
          String(consultation.userId) === socket.data.user.sub
          ? consultation.userId
          : consultation.psychologistId,
        socket.data.user.role
      );

      return ChatGateway.respond(ack, {
        ok: true,
        consultationId,
        messages
      });
    } catch (error) {
      console.error("Socket join error:", error?.message);

      return ChatGateway.respond(ack, {
        ok: false,
        code: "JOIN_FAILED",
        message: "Gagal masuk ruang konsultasi"
      });
    }
  }


  onLeave(socket, payload, ack) {
    const consultationId = payload?.consultationId;

    if (consultationId) {
      socket.leave(
        ChatGateway.consultationRoom(consultationId)
      );
    }

    return ChatGateway.respond(ack, { ok: true });
  }


  // ====================================================
  // MESSAGE
  // ====================================================

  async onMessage(socket, payload, ack) {
    try {
      const consultationId = payload?.consultationId;

      const consultation = await this.requireParticipant(
        socket,
        consultationId
      );

      if (!consultation) {
        return ChatGateway.respond(ack, {
          ok: false,
          code: "FORBIDDEN",
          message: "Bukan peserta konsultasi ini"
        });
      }

      const { ObjectId } = await import("mongodb");

      /*
       * senderId diambil dari SOCKET (hasil autentikasi),
       * bukan dari payload klien.
       */
      const message = await this.consultations.sendMessage(
        consultationId,
        new ObjectId(socket.data.user.sub),
        socket.data.user.role,
        payload?.content
      );

      const room = ChatGateway.consultationRoom(consultationId);

      // Emit ke ROOM: semua device kedua partisipan yang
      // sedang membuka percakapan ini menerimanya.
      this.io.to(room).emit("consultation:message", {
        consultationId,
        message
      });

      /*
       * Selain itu, kirim notifikasi ke room USER lawan
       * bicara -- supaya device yang sedang TIDAK membuka
       * percakapan ini tetap tahu ada pesan masuk.
       */
      const counterpartId =
        String(consultation.userId) === socket.data.user.sub
          ? consultation.psychologistId
          : consultation.userId;

      if (counterpartId) {
        this.io
          .to(ChatGateway.userRoom(String(counterpartId)))
          .emit("notification:message", {
            consultationId,
            preview: String(payload?.content || "").slice(0, 80),
            from: socket.data.user.name
          });
      }

      return ChatGateway.respond(ack, { ok: true, message });
    } catch (error) {
      // Error validasi dari service (pesan kosong, dll).
      return ChatGateway.respond(ack, {
        ok: false,
        code: error?.code || "SEND_FAILED",
        message: error?.message || "Gagal mengirim pesan"
      });
    }
  }


  // ====================================================
  // TYPING
  // ====================================================
  //
  // Tidak menyentuh database. Dikirim ke room KECUALI
  // pengirimnya sendiri.
  //
  // ====================================================

  onTyping(socket, payload) {
    const consultationId = payload?.consultationId;

    if (!consultationId) {
      return;
    }

    socket
      .to(ChatGateway.consultationRoom(consultationId))
      .emit("consultation:typing", {
        consultationId,
        from: socket.data.user.name,
        typing: payload?.typing !== false
      });
  }


  // ====================================================
  // READ RECEIPT
  // ====================================================

  async onRead(socket, payload, ack) {
    try {
      const consultationId = payload?.consultationId;

      const consultation = await this.requireParticipant(
        socket,
        consultationId
      );

      if (!consultation) {
        return ChatGateway.respond(ack, {
          ok: false,
          code: "FORBIDDEN"
        });
      }

      const { ObjectId } = await import("mongodb");

      const messages = await this.consultations.messages();

      // Tandai terbaca hanya pesan dari LAWAN bicara.
      await messages.updateMany(
        {
          consultationId: consultation._id,
          senderId: { $ne: new ObjectId(socket.data.user.sub) },
          readAt: null
        },
        { $set: { readAt: new Date() } }
      );

      socket
        .to(ChatGateway.consultationRoom(consultationId))
        .emit("consultation:read", { consultationId });

      return ChatGateway.respond(ack, { ok: true });
    } catch (error) {
      console.error("Socket read error:", error?.message);

      return ChatGateway.respond(ack, {
        ok: false,
        code: "READ_FAILED"
      });
    }
  }
}

export const chatGateway = new ChatGateway();
