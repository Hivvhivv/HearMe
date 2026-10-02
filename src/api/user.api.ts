// ======================================================
// USER API
// ======================================================
//
// Profil user dari backend + MongoDB.
//
// Endpoint ini memakai format response baru:
//
//   { success: true, data: { user } }
//
// Service ini membuka bungkusnya, jadi halaman cukup
// menerima objek user biasa.
//
// ======================================================

import { api } from "./client";
import { saveUser } from "../lib/authStorage";

export type PsychologistProfile = {
  specialization?: string;
  experience?: string;
  price?: string;
  bio?: string;
  avatar?: string;
  rating?: number;
  ratingCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProfileUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  gender: string;
  birthDate: string;
  phoneNumber: string;
  role: string;
  verificationStatus?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  psychologistProfile?: PsychologistProfile | null;
};

type Envelope<T> = {
  success: boolean;
  data: T;
};


// Field yang boleh dikirim ke backend. Backend juga
// punya whitelist sendiri -- ini hanya agar frontend
// tidak mengirim field yang pasti ditolak.
export type ProfileUpdate = {
  name?: string;
  username?: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  phoneNumber?: string;
};


export const userAPI = {

  // ====================================================
  // GET PROFIL SENDIRI
  // ====================================================

  getMe: async (): Promise<ProfileUser> => {
    const res = await api.get<Envelope<{ user: ProfileUser }>>(
      "/users/me"
    );

    // Segarkan cache profil supaya navbar ikut terbarui.
    saveUser(res.data.user as unknown as Record<string, unknown>);

    return res.data.user;
  },


  // ====================================================
  // UPDATE PROFIL SENDIRI
  // ====================================================

  updateMe: async (
    update: ProfileUpdate
  ): Promise<ProfileUser> => {
    const res = await api.patch<Envelope<{ user: ProfileUser }>>(
      "/users/me",
      update
    );

    saveUser(res.data.user as unknown as Record<string, unknown>);

    return res.data.user;
  },


  // ====================================================
  // GANTI PASSWORD
  // ====================================================

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    await api.patch<Envelope<{ message: string }>>(
      "/users/me/password",
      { currentPassword, newPassword }
    );
  },


  // ====================================================
  // UPDATE PROFIL PROFESIONAL PSIKOLOG
  // ====================================================
  //
  // Field profesional (spesialisasi, harga, bio) ada di
  // collection `psychologists`, bukan di dokumen users.
  //
  // ====================================================

  updatePsychologistProfile: async (
    update: Pick<
      PsychologistProfile,
      "specialization" | "experience" | "price" | "bio" | "avatar"
    >
  ): Promise<PsychologistProfile> => {
    const res = await api.patch<
      Envelope<{ psychologistProfile: PsychologistProfile }>
    >("/users/me/psychologist-profile", update);

    return res.data.psychologistProfile;
  },
};
