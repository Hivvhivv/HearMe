// ======================================================
// JOURNAL API — BACKEND + MONGODB
// ======================================================
//
// Jurnal adalah data PRIVAT. Backend selalu memfilter
// dengan userId dari JWT, jadi tidak ada parameter userId
// di service ini — dan tidak bisa dipakai membaca jurnal
// orang lain.
//
// Gambar dikirim sebagai data URL base64; backend
// memvalidasi (MIME, ukuran, magic bytes), menyimpannya
// sebagai berkas, lalu MongoDB hanya menyimpan URL-nya.
//
// ======================================================

import { api } from "./client";

export type JournalEntry = {
  id: string;
  mood: string;
  title: string;
  content: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Envelope<T> = { success: boolean; data: T };

export type JournalInput = {
  mood?: string;
  title?: string;
  content?: string;

  // Boleh campuran: data URL (gambar baru) dan URL yang
  // sudah tersimpan (gambar lama yang dipertahankan).
  images?: string[];
};

// Maksimal 5 gambar — dijaga backend juga.
export const MAX_JOURNAL_IMAGES = 5;


export const journalAPI = {

  list: async (params: {
    search?: string;
    mood?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    journals: JournalEntry[];
    pagination: Pagination;
  }> => {
    const qs = new URLSearchParams();

    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }

    const res = await api.get<
      Envelope<{
        journals: JournalEntry[];
        pagination: Pagination;
      }>
    >(`/journals${qs.toString() ? `?${qs}` : ""}`);

    return res.data;
  },


  getById: async (id: string): Promise<JournalEntry> => {
    const res = await api.get<
      Envelope<{ journal: JournalEntry }>
    >(`/journals/${id}`);

    return res.data.journal;
  },


  create: async (
    input: JournalInput
  ): Promise<JournalEntry> => {
    const res = await api.post<
      Envelope<{ journal: JournalEntry }>
    >("/journals", input);

    return res.data.journal;
  },


  update: async (
    id: string,
    input: JournalInput
  ): Promise<JournalEntry> => {
    const res = await api.patch<
      Envelope<{ journal: JournalEntry }>
    >(`/journals/${id}`, input);

    return res.data.journal;
  },


  delete: async (id: string): Promise<void> => {
    await api.delete<Envelope<{ message: string }>>(
      `/journals/${id}`
    );
  },


  // Ringkasan mood untuk grafik.
  moodSummary: async (
    days = 30
  ): Promise<{ mood: string; count: number }[]> => {
    const res = await api.get<
      Envelope<{ summary: { mood: string; count: number }[] }>
    >(`/journals/mood-summary?days=${days}`);

    return res.data.summary;
  },
};
