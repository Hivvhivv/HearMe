// ======================================================
// PSYCHOLOGIST API
// ======================================================
//
// Menggantikan src/data/mockData.ts sebagai sumber data
// psikolog.
//
// Semua penyaringan (specialization, harga, rating,
// pencarian, urutan) dikerjakan DATABASE lewat query
// string -- bukan di frontend. Dengan begitu tetap benar
// ketika jumlah psikolog bertambah banyak.
//
// Backend hanya mengembalikan psikolog dengan
// verificationStatus "approved", jadi frontend tidak perlu
// (dan tidak boleh) memutuskan hal itu sendiri.
//
// ======================================================

import { api } from "./client";

export type ApiPsychologist = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  price: string;
  priceValue: number | null;
  bio: string;
  avatar: string;
  tags: string[];
  schedule: string[];
  consultations: string;
  rating: number | null;
  ratingCount: number;
  available: boolean;
};

export type AvailabilitySlot = {
  id: string;
  date: string;
  time: string;
  duration: number;
};

export type PsychologistRating = {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
  userName: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Envelope<T> = { success: boolean; data: T };

export type PsychologistQuery = {
  search?: string;
  specialization?: string;
  minRating?: number;
  maxPrice?: number;
  availableOnly?: boolean;
  sort?: "rating" | "price-asc" | "price-desc" | "name" | "newest";
  page?: number;
  limit?: number;
};


function toQueryString(query: PsychologistQuery): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === false
    ) {
      continue;
    }

    params.set(key, String(value));
  }

  const qs = params.toString();

  return qs ? `?${qs}` : "";
}


export const psychologistAPI = {

  // ====================================================
  // DAFTAR PSIKOLOG (dengan filter + pagination)
  // ====================================================

  list: async (
    query: PsychologistQuery = {}
  ): Promise<{
    psychologists: ApiPsychologist[];
    pagination: Pagination;
  }> => {
    const res = await api.get<
      Envelope<{
        psychologists: ApiPsychologist[];
        pagination: Pagination;
      }>
    >(`/psychologists${toQueryString(query)}`);

    return res.data;
  },


  // ====================================================
  // TOP PSYCHOLOGIST (Home Dashboard)
  // ====================================================
  //
  // Urutan rating DESC lalu ratingCount DESC ditentukan
  // backend, bukan di sini.
  //
  // ====================================================

  top: async (limit = 4): Promise<ApiPsychologist[]> => {
    const res = await api.get<
      Envelope<{ psychologists: ApiPsychologist[] }>
    >(`/psychologists/top?limit=${limit}`);

    return res.data.psychologists;
  },


  // ====================================================
  // DETAIL
  // ====================================================

  getById: async (
    id: string
  ): Promise<ApiPsychologist> => {
    const res = await api.get<
      Envelope<{ psychologist: ApiPsychologist }>
    >(`/psychologists/${id}`);

    return res.data.psychologist;
  },


  // ====================================================
  // SLOT TERSEDIA
  // ====================================================
  //
  // Ketersediaan SELALU dari backend. Frontend tidak
  // pernah menyimpulkan sendiri slot mana yang kosong.
  //
  // ====================================================

  availability: async (
    id: string,
    date?: string
  ): Promise<AvailabilitySlot[]> => {
    const qs = date
      ? `?date=${encodeURIComponent(date)}`
      : "";

    const res = await api.get<
      Envelope<{ slots: AvailabilitySlot[] }>
    >(`/psychologists/${id}/availability${qs}`);

    return res.data.slots;
  },


  // ====================================================
  // RATING / ULASAN
  // ====================================================

  getRatings: async (
    id: string,
    limit = 20
  ): Promise<PsychologistRating[]> => {
    const res = await api.get<
      Envelope<{ ratings: PsychologistRating[] }>
    >(`/psychologists/${id}/ratings?limit=${limit}`);

    return res.data.ratings;
  },


  // Rating hanya bisa diberikan untuk konsultasi milik
  // sendiri yang sudah selesai -- diperiksa backend.
  rate: async (
    id: string,
    input: {
      rating: number;
      consultationId: string;
      review?: string;
    }
  ): Promise<{
    psychologistRating: number | null;
    ratingCount: number;
  }> => {
    const res = await api.post<
      Envelope<{
        psychologistRating: number | null;
        ratingCount: number;
      }>
    >(`/psychologists/${id}/ratings`, input);

    return res.data;
  },
};
