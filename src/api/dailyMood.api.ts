// ======================================================
// DAILY MOOD API
// ======================================================

import { apiFetch } from "./client";


// ======================================================
// TYPES
// ======================================================

export interface DailyMood {
  _id?: string;
  userId: string;
  mood: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DailyMoodResponse {
  success: boolean;
  data?: DailyMood | null;
  mood?: DailyMood | null;
  date?: string;
  message?: string;
}

interface DailyMoodHistoryResponse {
  success: boolean;
  data?: DailyMood[];
  message?: string;
}


// ======================================================
// REQUEST HELPER
// ======================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  // Semua request lewat apiFetch:
  //
  //   - token diambil dari memori, tidak localStorage
  //   - cookie refresh token ikut terkirim
  //   - 401 memicu single-flight refresh, lalu request
  //     ini diulang otomatis
  //
  // Dulu fungsi ini melempar "Authentication required"
  // kalau token belum ada. Itu tidak cocok lagi: access
  // token hanya di memori dan baru terisi setelah
  // bootstrap selesai, jadi pengecekan itu akan gagal
  // tepat setelah halaman di-refresh.

  try {

    return await apiFetch<T>(endpoint, options);

  } catch (error) {

    console.error(
      "Daily Mood API error:",
      {
        endpoint,
        error,
      }
    );

    throw error;

  }
}


// ======================================================
// GET TODAY'S MOOD
// GET /api/daily-moods/today
// ======================================================

export async function getTodayMood(
  date?: string
): Promise<DailyMood | null> {

  const query = date
    ? `?date=${encodeURIComponent(date)}`
    : "";

  const response =
    await request<DailyMoodResponse>(
      `/daily-moods/today${query}`
    );

  return response.mood || null;
}


// ======================================================
// GET MOOD HISTORY
// GET /api/daily-moods/history
// ======================================================

export async function getMoodHistory(
  limit = 30
): Promise<DailyMood[]> {

  const response =
    await request<DailyMoodHistoryResponse>(
      `/daily-moods/history?limit=${limit}`
    );

  return response.data || [];
}


// ======================================================
// GET MOOD BY DATE
// GET /api/daily-moods?date=YYYY-MM-DD
// ======================================================

export async function getMoodByDate(
  date: string
): Promise<DailyMood | null> {

  const response =
    await request<DailyMoodResponse>(
      `/daily-moods?date=${encodeURIComponent(date)}`
    );

  return response.data || null;
}


// ======================================================
// SAVE / UPDATE TODAY'S MOOD
// PUT /api/daily-moods/today
// ======================================================

export async function saveTodayMood(
  mood: string,
  date?: string
): Promise<DailyMood> {

  if (
    typeof mood !== "string" ||
    !mood.trim()
  ) {

    throw new Error(
      "Mood is required"
    );

  }


  const response =
    await request<DailyMoodResponse>(
      "/daily-moods/today",
      {
        method: "PUT",

        body: JSON.stringify({

          mood: mood.trim(),

          ...(date
            ? { date }
            : {}),

        }),

      }
    );


  if (!response.data) {

    throw new Error(
      "Daily mood was not returned by server"
    );

  }


  return response.data;
}


// ======================================================
// DELETE MOOD
// DELETE /api/daily-moods/YYYY-MM-DD
// ======================================================

export async function deleteMood(
  date: string
): Promise<void> {

  await request(
    `/daily-moods/${encodeURIComponent(date)}`,
    {
      method: "DELETE",
    }
  );

}


// ======================================================
// API OBJECT
// ======================================================

export const dailyMoodApi = {

  getTodayMood,

  getMoodHistory,

  getMoodByDate,

  saveTodayMood,

  deleteMood,

};


export default dailyMoodApi;