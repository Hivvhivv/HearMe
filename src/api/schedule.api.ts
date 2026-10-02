// ======================================================
// SCHEDULE API
// ======================================================
//
// Jadwal praktik psikolog.
//
// UI mengatur TEMPLATE MINGGUAN (per hari: tersedia, jam
// mulai, jam selesai). Backend yang menerjemahkannya
// menjadi slot konkret bertanggal — satu request, dan
// slot yang sudah di-booking tidak pernah dihapus.
//
// ======================================================

import { api } from "./client";

export type DaySchedule = {
  available: boolean;
  start: string;
  end: string;
};

export type WeeklySchedule = Record<string, DaySchedule>;

export type ScheduleSlot = {
  _id: string;
  date: string;
  time: string;
  duration?: number;
  isAvailable: boolean;
};

export type ApplyResult = {
  message: string;
  weeklySchedule: WeeklySchedule;

  // Slot baru yang dibuat dari template.
  created: number;

  // Slot kosong yang dihapus karena tidak lagi di template.
  removed: number;

  // Slot yang SUDAH di-booking tapi kini di luar template.
  // Tetap dipertahankan — dilaporkan agar psikolog tahu.
  bookedOutsideTemplate: number;

  totalSlots: number;
};


export const scheduleAPI = {

  // ====================================================
  // TEMPLATE MINGGUAN
  // ====================================================

  getWeekly: async (): Promise<WeeklySchedule | null> => {
    const res = await api.get<{
      weeklySchedule: WeeklySchedule | null;
    }>("/consultations/schedules/weekly");

    return res.weeklySchedule;
  },

  saveWeekly: async (
    weeklySchedule: WeeklySchedule,
    days = 28
  ): Promise<ApplyResult> => {
    return api.put<ApplyResult>(
      "/consultations/schedules/weekly",
      { weeklySchedule, days }
    );
  },


  // ====================================================
  // SLOT KONKRET MILIK SENDIRI
  // ====================================================

  listMine: async (): Promise<ScheduleSlot[]> => {
    const res = await api.get<{ schedules: ScheduleSlot[] }>(
      "/consultations/schedules/mine"
    );

    return res.schedules;
  },
};
