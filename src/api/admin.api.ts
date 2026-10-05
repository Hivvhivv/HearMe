// ======================================================
// ADMIN API
// ======================================================
//
// Endpoint khusus admin yang belum punya service sendiri.
// Semuanya dilindungi role guard di backend, jadi user
// biasa yang memanggilnya langsung tetap dibalas 403.
//
// ======================================================

import { api } from "./client";

export type AdminPsychologist = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  verificationStatus?: string;
  isActive?: boolean;
  createdAt?: string;
};


export const adminAPI = {

  // GET /api/admin/psychologists
  //
  // Semua akun psikolog, apa pun status verifikasinya —
  // berbeda dari /api/psychologists yang hanya mengirim
  // yang approved ke user.
  listPsychologists: async (): Promise<AdminPsychologist[]> => {
    const res = await api.get<{ psychologists: AdminPsychologist[] }>(
      "/admin/psychologists"
    );

    return res.psychologists || [];
  },


  // PATCH /api/admin/users/:id/status
  setUserActive: async (
    userId: string,
    isActive: boolean
  ): Promise<void> => {
    await api.patch(`/admin/users/${userId}/status`, { isActive });
  },


  // PATCH /api/admin/psychologists/:id/verification
  //
  // Jalur cepat untuk mengubah status verifikasi tanpa
  // lewat alur pengajuan. Alur normalnya tetap
  // PATCH /api/verification/:id/review.
  setVerificationStatus: async (
    psychologistId: string,
    status: "approved" | "rejected" | "pending"
  ): Promise<void> => {
    await api.patch(
      `/admin/psychologists/${psychologistId}/verification`,
      { status }
    );
  },
};
