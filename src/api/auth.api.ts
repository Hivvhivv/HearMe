import type { User, UserRole } from "../types";

import { api } from "./client";

import {
  broadcastAuth,
  clearAuth,
  getStoredUser,
  getToken,
  hasToken,
  saveAuth,
  saveUser,
} from "../lib/authStorage";

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username?: string;
  gender?: string;
  birthDate?: string;
  phoneNumber?: string;
  verificationStatus?: "pending" | "approved" | "rejected" | "unverified" | "not_required";
};

type LoginResponse = {
  message: string;
  token: string;
  user: BackendUser;
};

function convertUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    gender: user.gender,
    birthDate: user.birthDate,
    phoneNumber: user.phoneNumber,
    role: user.role,
    verificationStatus: user.verificationStatus,
    createdAt: new Date().toISOString(),
  } as User;
}

export const authAPI = {

  // ====================================================
  // LOGIN
  // ====================================================

  login: async (
    email: string,
    password: string
  ): Promise<{
    user: User;
    token: string;
  } | null> => {

    // skipAuth: 401 di sini berarti password salah,
    // bukan session berakhir -- jadi jangan memicu refresh.
    const result = await api.post<LoginResponse>(
      "/auth/login",
      { email, password },
      { skipAuth: true }
    );

    const user =
      convertUser(result.user);

    saveAuth(
      result.token,
      user as unknown as Record<string, unknown>
    );

    broadcastAuth("login");

    return {
      user,
      token: result.token,
    };
  },


  // ====================================================
  // REGISTER
  // ====================================================

  register: async (data: {
    username: string;
    gender: string;
    birthDate: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    role: "user" | "psychologist";
  }): Promise<User> => {

    const result = await api.post<{
      user: BackendUser;
    }>(
      "/auth/register",
      {
        name: data.username,
        username: data.username,
        gender: data.gender,
        birthDate: data.birthDate,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phoneNumber: data.phoneNumber,
        role: data.role,
      },
      { skipAuth: true }
    );

    const user =
      convertUser(result.user);

    return user;
  },


  // ====================================================
  // LOGOUT
  // ====================================================
  //
  // Menghapus SEMUA key auth lewat helper bersama.
  // Sebelumnya fungsi ini melewatkan "hearme_token",
  // yaitu justru key yang dibaca route guard.
  //
  // ====================================================

  logout: async (): Promise<void> => {
    try {
      // Revoke session device ini di SERVER.
      await api.post("/auth/logout");
    } catch {
      // Offline: state lokal tetap dibersihkan.
    } finally {
      clearAuth();
      broadcastAuth("logout");
    }
  },


  // ====================================================
  // GET SESSION
  // ====================================================
  //
  // CATATAN: tidak ada lagi pengecekan expiry memakai
  // jam device. Jam device bisa berbeda dari server
  // (clock skew), sehingga token yang masih valid bisa
  // dianggap kedaluwarsa.
  //
  // Yang menentukan token masih berlaku atau tidak
  // adalah backend, lewat response 401.
  //
  // ====================================================

  getSession: (): {
    user: User;
    token: string;
  } | null => {

    const token = getToken();
    const user = getStoredUser<User>();

    if (!token || !user) {
      return null;
    }

    return {
      user,
      token,
    };
  },


  // ====================================================
  // AUTHENTICATED?
  // ====================================================

  isAuthenticated: (): boolean => {
    return hasToken();
  },


  // ====================================================
  // CURRENT USER
  // ====================================================

  getCurrentUser: (): User | null => {
    return getStoredUser<User>();
  },


  // ====================================================
  // CURRENT ROLE
  // ====================================================

  getCurrentRole: (): UserRole => {

    const user =
      authAPI.getCurrentUser();

    return user?.role || "user";
  },


  // ====================================================
  // GET CURRENT USER FROM BACKEND
  // ====================================================

  refreshCurrentUser: async (): Promise<User> => {

    // Tidak perlu memeriksa token lebih dulu: kalau access
    // token kedaluwarsa, api client akan me-refresh dan
    // mengulang request ini. Kalau refresh juga gagal,
    // client membersihkan state auth lalu melempar 401.
    const result = await api.get<{ user: BackendUser }>(
      "/auth/me"
    );

    const user =
      convertUser(result.user);

    saveUser(
      user as unknown as Record<string, unknown>
    );

    return user;
  },


  // ====================================================
  // UPDATE PROFILE
  // ====================================================

  updateProfile: async (
    data: Partial<User>
  ): Promise<User> => {

    /*
     * Backend kamu saat ini belum mempunyai
     * endpoint update profile.
     *
     * Jadi untuk sementara kita hanya
     * memperbarui session frontend.
     *
     * Nanti bisa dibuat:
     * PATCH /api/auth/me
     */

    const current =
      authAPI.getCurrentUser();

    if (!current) {
      throw new Error(
        "User not authenticated"
      );
    }

    const updated = {
      ...current,
      ...data,
    };

    saveUser(
      updated as unknown as Record<string, unknown>
    );

    return updated;
  },
};
