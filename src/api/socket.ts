// ======================================================
// SOCKET CLIENT (REALTIME CHAT)
// ======================================================
//
// Satu koneksi Socket.IO untuk seluruh aplikasi.
//
// Beberapa hal yang dijaga di sini:
//
// 1. TOKEN DIAMBIL SAAT CONNECT, BUKAN DISIMPAN
//    Access token hanya ada di memori dan dirotasi setiap
//    refresh. Jadi token dibaca tepat saat handshake.
//
// 2. SATU KONEKSI, BANYAK RUANG
//    Backend memakai room (user:<id>, consultation:<id>),
//    jadi tidak perlu koneksi terpisah per percakapan.
//    Dan karena backend tidak menyimpan "satu socket per
//    user", membuka app di beberapa device tetap membuat
//    semuanya menerima pesan.
//
// 3. SESSION DI-REVOKE -> KONEKSI DITOLAK
//    Backend memverifikasi sid pada handshake. Setelah
//    logout, connect gagal dan tidak dicoba terus-menerus.
//
// ======================================================

import { io, type Socket } from "socket.io-client";

import { socketOrigin } from "./config";
import { getToken } from "../lib/authStorage";
import { refreshAccessToken } from "./client";

/*
 * Socket menempel pada HOST backend, bukan path /api.
 *
 * Kalau API dipakai relatif ("/api"), origin halaman yang
 * dipakai — dan di dev, proxy Vite meneruskan /socket.io ke
 * backend dengan ws: true.
 */
function socketUrl(): string {
  return socketOrigin();
}

export type ChatMessage = {
  _id: string;
  consultationId: string;
  senderId: string;
  senderRole: "user" | "psychologist";
  content: string;
  readAt: string | null;
  createdAt: string;
};

type JoinResult =
  | { ok: true; consultationId: string; messages: ChatMessage[] }
  | { ok: false; code?: string; message?: string };

type SendResult =
  | { ok: true; message: ChatMessage }
  | { ok: false; code?: string; message?: string };


class ChatSocket {
  private socket: Socket | null = null;
  private connecting: Promise<Socket | null> | null = null;

  get connected(): boolean {
    return Boolean(this.socket?.connected);
  }

  /*
   * Membuka koneksi (single-flight: beberapa pemanggil
   * bersamaan berbagi satu proses connect).
   */
  async connect(): Promise<Socket | null> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = (async () => {
      let token = getToken();

      // Belum ada token di memori (mis. halaman baru
      // di-refresh): coba dapatkan lewat refresh token.
      if (!token) {
        token = await refreshAccessToken();
      }

      if (!token) {
        this.connecting = null;
        return null;
      }

      return new Promise<Socket | null>((resolve) => {
        const socket = io(socketUrl(), {
          path: "/socket.io",
          auth: { token },
          transports: ["websocket", "polling"],

          // Jangan mencoba selamanya: kalau session sudah
          // di-revoke, percobaan ulang tidak akan berhasil.
          reconnectionAttempts: 3,
          timeout: 8000,
        });

        const done = (value: Socket | null) => {
          this.connecting = null;
          resolve(value);
        };

        socket.on("ready", () => {
          this.socket = socket;
          done(socket);
        });

        socket.on("connect_error", (error) => {
          console.warn("Socket connect error:", error?.message);

          socket.close();
          this.socket = null;
          done(null);
        });
      });
    })();

    return this.connecting;
  }


  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.connecting = null;
  }


  // ====================================================
  // RUANG KONSULTASI
  // ====================================================

  async join(consultationId: string): Promise<JoinResult> {
    const socket = await this.connect();

    if (!socket) {
      return { ok: false, code: "NO_CONNECTION" };
    }

    return new Promise((resolve) => {
      socket.emit(
        "consultation:join",
        { consultationId },
        (result: JoinResult) =>
          resolve(result || { ok: false, code: "NO_ACK" })
      );

      setTimeout(
        () => resolve({ ok: false, code: "TIMEOUT" }),
        8000
      );
    });
  }


  leave(consultationId: string) {
    this.socket?.emit("consultation:leave", { consultationId });
  }


  async send(
    consultationId: string,
    content: string
  ): Promise<SendResult> {
    const socket = await this.connect();

    if (!socket) {
      return { ok: false, code: "NO_CONNECTION" };
    }

    return new Promise((resolve) => {
      socket.emit(
        "consultation:message",
        { consultationId, content },
        (result: SendResult) =>
          resolve(result || { ok: false, code: "NO_ACK" })
      );

      setTimeout(
        () => resolve({ ok: false, code: "TIMEOUT" }),
        8000
      );
    });
  }


  typing(consultationId: string, typing: boolean) {
    this.socket?.emit("consultation:typing", {
      consultationId,
      typing,
    });
  }


  markRead(consultationId: string) {
    this.socket?.emit("consultation:read", { consultationId });
  }


  // ====================================================
  // LISTENER
  // ====================================================
  //
  // Mengembalikan fungsi untuk melepas listener, supaya
  // komponen bisa membersihkannya saat unmount.
  //
  // ====================================================

  onMessage(
    handler: (payload: {
      consultationId: string;
      message: ChatMessage;
    }) => void
  ): () => void {
    this.socket?.on("consultation:message", handler);

    return () => {
      this.socket?.off("consultation:message", handler);
    };
  }

  onTyping(
    handler: (payload: {
      consultationId: string;
      from: string;
      typing: boolean;
    }) => void
  ): () => void {
    this.socket?.on("consultation:typing", handler);

    return () => {
      this.socket?.off("consultation:typing", handler);
    };
  }
}

export const chatSocket = new ChatSocket();
