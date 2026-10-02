// ======================================================
// SERVICES
// ======================================================
//
// Yang MASIH di sini:
//
//   authService              -> backend + MongoDB
//   consultationService      -> backend + MongoDB
//   chatService              -> AI Listener (localStorage, Phase 4)
//   consultationChatService  -> chat konsultasi (localStorage, Phase 4)
//
// Yang DIHAPUS karena tidak dipakai halaman mana pun dan
// hanya mengembalikan mock data:
//
//   psychologistService  -> digantikan api/psychologist.api.ts
//   journalService       -> Phase 5
//   articleService       -> Phase 7
//   forumService         -> digantikan api/forum.api.ts
//   moodService          -> digantikan api/dailyMood.api.ts
//
// Membiarkannya hidup berarti menyisakan jalur penyimpanan
// kedua yang bisa dipakai tanpa sadar.
//
// ======================================================

import { consultationAPI } from "../api/consultation.api";
import { api, refreshAccessToken } from "../api/client";

import {
  broadcastAuth,
  clearAuth,
  getStoredRole,
  getStoredUser,
  getToken,
  hasToken,
  saveAuth,
  saveUser,
} from "../lib/authStorage";


// ======================================================
// TYPES
// ======================================================

// super_admin dipakai backend (authorize("admin","super_admin"))
// tapi sebelumnya tidak ada di tipe frontend, sehingga guard
// admin tidak bisa mengenalinya.
export type AppRole =
  | "user"
  | "psychologist"
  | "admin"
  | "super_admin";


// ======================================================
// AUTH SERVICE
// ======================================================

export const authService = {

  // ----------------------------------------------------
  // LOGIN
  // ----------------------------------------------------

  login: async (
    email: string,
    password: string,
    _role?: AppRole
  ) => {

    try {

      // skipAuth: belum ada token, dan 401 di sini berarti
      // "password salah" -- bukan "session berakhir".
      // Tanpa ini, login gagal akan memicu refresh.
      const data = await api.post<{
        token: string;
        user: Record<string, unknown> & {
          email: string;
          role: AppRole;
        };
      }>(
        "/auth/login",
        { email, password },
        { skipAuth: true }
      );


      const user = data.user;


      // ------------------------------------------------
      // SAVE AUTH DATA
      //
      // Access token masuk MEMORI, bukan localStorage.
      // Refresh token sudah dipasang backend sebagai
      // cookie httpOnly.
      // ------------------------------------------------

      saveAuth(
        data.token,
        user
      );

      // Beri tahu tab lain supaya ikut masuk.
      broadcastAuth("login");


      return {

        email: user.email,

        role: user.role as AppRole,

        user,

        token: data.token,

      };

    } catch (error) {

      console.error(
        "Login error:",
        error
      );


      throw new Error(

        error instanceof Error
          ? error.message
          : "Login gagal"

      );

    }

  },


  // ----------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------

  logout: async () => {

    // Revoke session device INI di server.
    // Device lain milik user yang sama tetap login.
    try {

      await api.post("/auth/logout");

    } catch {

      // Offline atau backend mati: state lokal TETAP
      // dibersihkan. Logout tidak boleh gagal hanya
      // karena jaringan bermasalah.

    } finally {

      clearAuth();

      broadcastAuth("logout");

    }

  },


  // ----------------------------------------------------
  // LOGOUT DARI SEMUA DEVICE
  // ----------------------------------------------------

  logoutAll: async () => {

    try {

      await api.post("/auth/logout-all");

    } catch {

      // Sama seperti logout biasa.

    } finally {

      clearAuth();

      broadcastAuth("logout");

    }

  },


  // ----------------------------------------------------
  // DAFTAR DEVICE AKTIF
  // ----------------------------------------------------

  getSessions: async () => {

    const data = await api.get<{
      sessions: {
        id: string;
        userAgent: string;
        ip: string;
        createdAt: string;
        lastUsedAt: string;
        expiresAt: string;
        current: boolean;
      }[];
    }>("/auth/sessions");

    return data.sessions;

  },


  // ----------------------------------------------------
  // AKHIRI SATU DEVICE
  // ----------------------------------------------------

  revokeSession: async (sessionId: string) => {

    await api.delete(`/auth/sessions/${sessionId}`);

  },


  // ----------------------------------------------------
  // BOOTSTRAP SAAT APP DIBUKA / DI-REFRESH
  // ----------------------------------------------------
  //
  // Access token hanya ada di memori, jadi setelah
  // refresh halaman token itu hilang. Satu-satunya cara
  // masuk kembali adalah cookie refresh token -- dan
  // cookie itu sudah di-revoke server kalau user logout.
  //
  // Inilah yang membuat "logout lalu refresh" benar-benar
  // mengharuskan login ulang.
  //
  // ----------------------------------------------------

  bootstrap: async () => {

    const token = await refreshAccessToken();

    if (!token) {

      clearAuth();

      return null;

    }


    // Ambil data user terbaru dari server.
    try {

      const data = await api.get<{
        user: Record<string, unknown> & { role?: string };
      }>("/auth/me");

      saveUser(data.user);

      return data.user;

    } catch {

      // Token baru didapat tapi /me gagal: pakai cache
      // profil supaya UI tetap jalan.
      return getStoredUser();

    }

  },


  // ----------------------------------------------------
  // CHECK AUTHENTICATION
  // ----------------------------------------------------

  isAuthenticated: () => {

    return hasToken();

  },


  // ----------------------------------------------------
  // GET ROLE
  // ----------------------------------------------------

  getRole: (): AppRole => {

    return (
      (getStoredRole() as AppRole) ||
      "user"
    );

  },


  // ----------------------------------------------------
  // CHECK ROLE
  // ----------------------------------------------------

  isRole: (
    role: AppRole
  ) => {

    return (
      authService.getRole() === role
    );

  },


  // ----------------------------------------------------
  // GET USER
  // ----------------------------------------------------

  getUser: () => {

    return getStoredUser();

  },


  // ----------------------------------------------------
  // GET JWT TOKEN
  // ----------------------------------------------------

  getToken: () => {

    return getToken();

  },


  // ----------------------------------------------------
  // UPDATE LOCAL USER
  // ----------------------------------------------------

  updateUser: (
    data: Record<string, string>
  ) => {

    const current =
      authService.getUser();


    const updated = {

      ...current,

      ...data,

    };


    saveUser(updated);

  },

};


// ======================================================
// CONSULTATION SERVICE
// ======================================================

export const consultationService = {

  // ----------------------------------------------------
  // GET USER CONSULTATIONS
  // ----------------------------------------------------

  getAll: async () => {

    return consultationAPI
      .getMyConsultations();

  },


  // ----------------------------------------------------
  // BOOK CONSULTATION
  // ----------------------------------------------------

  book: async (data: {

    psychologistId: string;

    date: string;

    time: string;

    psychologistName?: string;

    psychologistAvatar?: string;

    fee?: number;

  }) => {

    return consultationAPI
      .createConsultation({

        psychologistId:
          data.psychologistId,

        date:
          data.date,

        time:
          data.time,

      });

  },


  // ----------------------------------------------------
  // CANCEL CONSULTATION
  // ----------------------------------------------------

  cancel: async (
    id: string
  ) => {

    await consultationAPI.cancel(id);

  },


  // ----------------------------------------------------
  // PSYCHOLOGIST CONSULTATIONS
  // ----------------------------------------------------

  getPsychologistConsultations:
    async (
      psychologistId = "p1"
    ) => {

      const raw =
        localStorage.getItem(
          "hearme_consultations_v2"
        );


      const all: {
        psychologistId: string;
      }[] = raw
        ? JSON.parse(raw)
        : [];


      return all.filter(
        (c) =>
          c.psychologistId ===
          psychologistId
      );

    },


  // ----------------------------------------------------
  // APPROVE
  // ----------------------------------------------------

  approve: async (
    id: string
  ) => {

    const raw =
      localStorage.getItem(
        "hearme_consultations_v2"
      );


    const all: {
      id: string;
      status: string;
    }[] = raw
      ? JSON.parse(raw)
      : [];


    const updated =
      all.map((c) =>

        c.id === id

          ? {
              ...c,
              status: "approved",
            }

          : c

      );


    localStorage.setItem(

      "hearme_consultations_v2",

      JSON.stringify(updated)

    );

  },


  // ----------------------------------------------------
  // REJECT
  // ----------------------------------------------------

  reject: async (
    id: string,
    reason?: string
  ) => {

    const raw =
      localStorage.getItem(
        "hearme_consultations_v2"
      );


    const all: {
      id: string;
      status: string;
      rejectionReason?: string;
    }[] = raw
      ? JSON.parse(raw)
      : [];


    const updated =
      all.map((c) =>

        c.id === id

          ? {

              ...c,

              status: "rejected",

              rejectionReason:
                reason || "",

            }

          : c

      );


    localStorage.setItem(

      "hearme_consultations_v2",

      JSON.stringify(updated)

    );

  },


  // ----------------------------------------------------
  // RESCHEDULE
  // ----------------------------------------------------

  reschedule: async (
    id: string,
    date: string,
    time: string
  ) => {

    const raw =
      localStorage.getItem(
        "hearme_consultations_v2"
      );


    const all: {
      id: string;
      date: string;
      time: string;
    }[] = raw
      ? JSON.parse(raw)
      : [];


    const updated =
      all.map((c) =>

        c.id === id

          ? {

              ...c,

              date,

              time,

            }

          : c

      );


    localStorage.setItem(

      "hearme_consultations_v2",

      JSON.stringify(updated)

    );

  },

};


// ======================================================
// MOOD SERVICE -- DIHAPUS
// ======================================================
//
// moodService dulu menyimpan mood di localStorage
// ("hearme_mood_logs"). Itu bertentangan dengan aturan
// bahwa Daily Mood adalah data persistent dan harus
// berasal dari MongoDB.
//
// Sumber tunggalnya sekarang:
//
//   src/api/dailyMood.api.ts  ->  /api/daily-moods
//
// Tidak ada halaman yang masih memakainya, jadi service
// ini dihapus seluruhnya daripada dibiarkan sebagai
// jalur penyimpanan kedua yang bisa dipakai tanpa sadar.
// ======================================================
// CHAT SERVICE — AI LISTENER
// ======================================================

export const chatService = {

  getHistory: () => {

    const saved =
      localStorage.getItem(
        "hearme_ai_chat"
      );


    return saved
      ? JSON.parse(saved)
      : [];

  },


  saveHistory: (
    messages: unknown[]
  ) => {

    localStorage.setItem(

      "hearme_ai_chat",

      JSON.stringify(messages)

    );

  },

};


// ======================================================
// CONSULTATION CHAT SERVICE
// ======================================================

export const consultationChatService = {

  getMessages: (
    consultationId: string
  ) => {

    const saved =
      localStorage.getItem(
        `hearme_chat_${consultationId}`
      );


    return saved
      ? JSON.parse(saved)
      : [];

  },


  saveMessage: (
    consultationId: string,
    msg: unknown
  ) => {

    const msgs =
      consultationChatService
        .getMessages(
          consultationId
        );


    localStorage.setItem(

      `hearme_chat_${consultationId}`,

      JSON.stringify([
        ...msgs,
        msg,
      ])

    );

  },

};