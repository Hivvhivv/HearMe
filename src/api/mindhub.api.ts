// ======================================================
// MIND HUB API — BACKEND + MONGODB
// ======================================================
//
// Sebelumnya file ini menyimpan konten di localStorage
// ("hearme_mindhub_admin") dan menyeminya dari mockData.
//
// Sekarang semuanya dari backend:
//
//   user  -> GET /api/mind-hub           (hanya published)
//   admin -> /api/admin/mind-hub/*       (termasuk draft)
//
// Pemisahan published/draft dijaga BACKEND, jadi frontend
// tidak bisa (dan tidak perlu) memutuskannya.
//
// ======================================================

import { api } from "./client";

export type MindHubStatus = "draft" | "published" | "archived";

export type MindHubCategory =
  | "Mind and Balance"
  | "Self-Care Corner";

export type MindHubItem = {
  id: string;
  legacyId: string | null;
  category: MindHubCategory;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  duration: string;
  status: MindHubStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Envelope<T> = { success: boolean; data: T };

export type MindHubInput = {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: MindHubCategory;
  duration?: string;

  // Boleh data URL base64 (akan diunggah & divalidasi
  // backend) atau URL yang sudah tersimpan.
  image?: string;

  status?: MindHubStatus;
};


export const mindHubAPI = {

  // ====================================================
  // USER
  // ====================================================

  list: async (params: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    contents: MindHubItem[];
    pagination: Pagination;
  }> => {
    const qs = new URLSearchParams();

    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }

    const res = await api.get<
      Envelope<{
        contents: MindHubItem[];
        pagination: Pagination;
      }>
    >(`/mind-hub${qs.toString() ? `?${qs}` : ""}`);

    return res.data;
  },


  getById: async (id: string): Promise<MindHubItem> => {
    const res = await api.get<
      Envelope<{ content: MindHubItem }>
    >(`/mind-hub/${id}`);

    return res.data.content;
  },


  /*
   * MATERI TERKAIT (spec section 9).
   *
   * Dihitung backend lewat query: kategori sama, dan
   * artikel yang sedang dibuka DIKECUALIKAN. Tidak
   * di-hardcode di frontend.
   */
  getRelated: async (
    id: string,
    limit = 3
  ): Promise<MindHubItem[]> => {
    const res = await api.get<
      Envelope<{ contents: MindHubItem[] }>
    >(`/mind-hub/${id}/related?limit=${limit}`);

    return res.data.contents;
  },


  // ====================================================
  // ADMIN
  // ====================================================

  adminList: async (params: {
    category?: string;
    status?: string;
    search?: string;
  } = {}): Promise<MindHubItem[]> => {
    const qs = new URLSearchParams();

    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }

    const res = await api.get<
      Envelope<{ contents: MindHubItem[] }>
    >(`/admin/mind-hub${qs.toString() ? `?${qs}` : ""}`);

    return res.data.contents;
  },


  adminGetById: async (id: string): Promise<MindHubItem> => {
    const res = await api.get<
      Envelope<{ content: MindHubItem }>
    >(`/admin/mind-hub/${id}`);

    return res.data.content;
  },


  create: async (
    input: MindHubInput
  ): Promise<MindHubItem> => {
    const res = await api.post<
      Envelope<{ content: MindHubItem }>
    >("/admin/mind-hub", input);

    return res.data.content;
  },


  update: async (
    id: string,
    input: MindHubInput
  ): Promise<MindHubItem> => {
    const res = await api.patch<
      Envelope<{ content: MindHubItem }>
    >(`/admin/mind-hub/${id}`, input);

    return res.data.content;
  },


  setStatus: async (
    id: string,
    status: MindHubStatus
  ): Promise<MindHubItem> => {
    const res = await api.patch<
      Envelope<{ content: MindHubItem }>
    >(`/admin/mind-hub/${id}/publish`, { status });

    return res.data.content;
  },


  // Pintasan yang dipakai UI admin lama.
  togglePublish: async (
    id: string,
    currentStatus: MindHubStatus
  ): Promise<MindHubItem> =>
    mindHubAPI.setStatus(
      id,
      currentStatus === "published" ? "draft" : "published"
    ),


  delete: async (id: string): Promise<void> => {
    await api.delete<Envelope<{ message: string }>>(
      `/admin/mind-hub/${id}`
    );
  },
};
