// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// Replace localStorage/mock data with database query.
// Example: Firebase Firestore / Supabase / MySQL / PostgreSQL / MongoDB
// ======================================================

import {
  psychologists as mockPsychologists,
  forumPosts as mockForumPosts,
  articles as mockArticles,
  consultations as mockConsultations
} from "../data/mockData";
import { consultationAPI } from "../api/consultation.api";

export type AppRole = "user" | "psychologist" | "admin";

// ======================================================
// AUTH SERVICE
// ======================================================

export const authService = {
  login: async (email: string, password: string, role?: AppRole) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Email atau password salah"
        );
      }

      const user = data.user;

      localStorage.setItem("hearme_auth", "true");
      localStorage.setItem("hearme_role", user.role);
      localStorage.setItem("hearme_user", JSON.stringify(user));
      localStorage.setItem("hearme_token", data.token);

      return {
        email: user.email,
        role: user.role as AppRole,
        user,
        token: data.token,
      };

    } catch (error) {
      console.error("Login error:", error);

      throw new Error(
        error instanceof Error
          ? error.message
          : "Login gagal"
      );
    }
  },

  logout: () => {
    localStorage.removeItem("hearme_auth");
    localStorage.removeItem("hearme_role");
    localStorage.removeItem("hearme_user");
    localStorage.removeItem("hearme_token");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("hearme_auth");
  },

  getRole: (): AppRole => {
    return (
      (localStorage.getItem("hearme_role") as AppRole) ||
      "user"
    );
  },

  isRole: (role: AppRole) => {
    return authService.getRole() === role;
  },

  getUser: () => {
    const saved = localStorage.getItem("hearme_user");
    return saved ? JSON.parse(saved) : null;
  },

  getToken: () => {
    return localStorage.getItem("hearme_token");
  },

  updateUser: (data: Record<string, string>) => {
    const current = authService.getUser();

    const updated = {
      ...current,
      ...data,
    };

    localStorage.setItem(
      "hearme_user",
      JSON.stringify(updated)
    );
  },
};

// PSYCHOLOGIST SERVICE
export const psychologistService = {
  getAll: async () => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → SELECT * FROM psychologists WHERE verification_status = 'approved'
    return mockPsychologists;
  },
  getById: async (id: string) => {
    return mockPsychologists.find((p) => p.id === id) || null;
  },
};

// CONSULTATION SERVICE
export const consultationService = {
  getAll: async () => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → SELECT * FROM consultations WHERE user_id = ?
    return consultationAPI.getMyConsultations();
  },
  book: async (data: { psychologistId: string; date: string; time: string; psychologistName?: string; psychologistAvatar?: string; fee?: number }) => {
    return consultationAPI.createConsultation({ psychologistId: data.psychologistId, date: data.date, time: data.time });
  },
  cancel: async (id: string) => {
    await consultationAPI.cancel(id);
  },
  // ## DATABASE TEMPLATE IF CONNECTED ## → SELECT * FROM consultations WHERE psychologist_id = ?
  getPsychologistConsultations: async (psychologistId = "p1") => {
    const raw = localStorage.getItem("hearme_consultations_v2");
    const all: { psychologistId: string }[] = raw ? JSON.parse(raw) : [];
    return all.filter((c) => c.psychologistId === psychologistId);
  },
  approve: async (id: string) => {
    const raw = localStorage.getItem("hearme_consultations_v2");
    const all: { id: string; status: string }[] = raw ? JSON.parse(raw) : [];
    const updated = all.map((c) => c.id === id ? { ...c, status: "approved" } : c);
    localStorage.setItem("hearme_consultations_v2", JSON.stringify(updated));
  },
  reject: async (id: string, reason?: string) => {
    const raw = localStorage.getItem("hearme_consultations_v2");
    const all: { id: string; status: string; rejectionReason?: string }[] = raw ? JSON.parse(raw) : [];
    const updated = all.map((c) => c.id === id ? { ...c, status: "rejected", rejectionReason: reason || "" } : c);
    localStorage.setItem("hearme_consultations_v2", JSON.stringify(updated));
  },
  reschedule: async (id: string, date: string, time: string) => {
    const raw = localStorage.getItem("hearme_consultations_v2");
    const all: { id: string; date: string; time: string }[] = raw ? JSON.parse(raw) : [];
    const updated = all.map((c) => c.id === id ? { ...c, date, time } : c);
    localStorage.setItem("hearme_consultations_v2", JSON.stringify(updated));
  },
};

// MOOD SERVICE
export const moodService = {
  getLogs: (): Record<string, string> => {
    const saved = localStorage.getItem("hearme_mood_logs");
    return saved ? JSON.parse(saved) : {};
  },
  saveMood: (dateKey: string, mood: string) => {
    const logs = moodService.getLogs();
    logs[dateKey] = mood;
    localStorage.setItem("hearme_mood_logs", JSON.stringify(logs));
  },
};

// JOURNAL SERVICE
export const journalService = {
  getAll: () => {
    const saved = localStorage.getItem("hearme_journals");
    return saved ? JSON.parse(saved) : [];
  },
  save: (entry: { id: string; title: string; content: string; mood: string; date: string }) => {
    const all = journalService.getAll();
    localStorage.setItem("hearme_journals", JSON.stringify([entry, ...all]));
  },
};

// ARTICLE SERVICE
export const articleService = {
  getAll: async () => mockArticles,
  getById: async (id: string) => mockArticles.find((a) => a.id === id) || null,
};

// FORUM SERVICE
export const forumService = {
  getAll: () => {
    const saved = localStorage.getItem("hearme_forum");
    return saved ? JSON.parse(saved) : mockForumPosts;
  },
  save: (posts: typeof mockForumPosts) => {
    localStorage.setItem("hearme_forum", JSON.stringify(posts));
  },
};

// CHAT SERVICE (AI Listener)
export const chatService = {
  getHistory: () => {
    const saved = localStorage.getItem("hearme_ai_chat");
    return saved ? JSON.parse(saved) : [];
  },
  saveHistory: (messages: unknown[]) => {
    localStorage.setItem("hearme_ai_chat", JSON.stringify(messages));
  },
};

// CONSULTATION CHAT SERVICE
export const consultationChatService = {
  getMessages: (consultationId: string) => {
    const saved = localStorage.getItem(`hearme_chat_${consultationId}`);
    return saved ? JSON.parse(saved) : [];
  },
  saveMessage: (consultationId: string, msg: unknown) => {
    const msgs = consultationChatService.getMessages(consultationId);
    localStorage.setItem(`hearme_chat_${consultationId}`, JSON.stringify([...msgs, msg]));
  },
};
