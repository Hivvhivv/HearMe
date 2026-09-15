// ======================================================
// DAILY MOOD API
// ======================================================

import { authService } from "../services";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


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

  // Ambil token dari authService
  const token = authService.getToken();

  if (!token) {
    throw new Error(
      "Authentication required"
    );
  }


  // Gabungkan header
  const headers = new Headers(
    options.headers
  );

  headers.set(
    "Content-Type",
    "application/json"
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );


  let response: Response;

  try {

    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

  } catch (error) {

    console.error(
      "Daily Mood API network error:",
      error
    );

    throw new Error(
      "Failed to connect to HearMe server"
    );

  }


  // ====================================================
  // READ RESPONSE
  // ====================================================

  let data: any = null;

  try {

    data = await response.json();

  } catch {

    data = null;

  }


  // ====================================================
  // ERROR
  // ====================================================

  if (!response.ok) {

    console.error(
      "Daily Mood API error:",
      {
        status: response.status,
        endpoint,
        response: data,
      }
    );

    throw new Error(
      data?.message ||
      `Request failed with status ${response.status}`
    );

  }


  return data as T;
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