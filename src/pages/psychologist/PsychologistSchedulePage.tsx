import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";
import { scheduleAPI, type WeeklySchedule } from "../../api/schedule.api";
import { consultationAPI } from "../../api/consultation.api";
import type { Consultation as ApiConsultation } from "../../types";

// ======================================================
// JADWAL PRAKTIK — DARI BACKEND + MONGODB
// ======================================================
//
// Sebelumnya template jadwal hanya disimpan di localStorage
// ("hearme_psych_schedule"), jadi tidak ada slot nyata yang
// bisa di-booking user: collection `schedules` selalu kosong.
//
// Sekarang:
//
//   PUT /api/consultations/schedules/weekly
//
// Backend menerjemahkan template mingguan ini menjadi slot
// konkret untuk 4 minggu ke depan, dan TIDAK menghapus slot
// yang sudah di-booking.
//
// ======================================================

interface DaySchedule {
  available: boolean;
  start: string;
  end: string;
}

type Schedule = WeeklySchedule;

const DAYS = [
  { key: "senin", label: "Senin", short: "Sen" },
  { key: "selasa", label: "Selasa", short: "Sel" },
  { key: "rabu", label: "Rabu", short: "Rab" },
  { key: "kamis", label: "Kamis", short: "Kam" },
  { key: "jumat", label: "Jumat", short: "Jum" },
  { key: "sabtu", label: "Sabtu", short: "Sab" },
  { key: "minggu", label: "Minggu", short: "Min" },
];

const TIME_OPTIONS = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00",
];

const DEFAULT_SCHEDULE: Schedule = {
  senin:   { available: true,  start: "09:00", end: "17:00" },
  selasa:  { available: true,  start: "09:00", end: "17:00" },
  rabu:    { available: true,  start: "09:00", end: "17:00" },
  kamis:   { available: true,  start: "09:00", end: "17:00" },
  jumat:   { available: true,  start: "09:00", end: "15:00" },
  sabtu:   { available: false, start: "09:00", end: "17:00" },
  minggu:  { available: false, start: "09:00", end: "17:00" },
};

// Label & warna untuk SEMUA status yang bisa dikirim backend.
// Daftar sebelumnya hanya mengenali 3 status, sehingga
// konsultasi "pending" tampil sebagai "Selesai".
const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Konfirmasi",
  approved: "Disetujui",
  rescheduled: "Dijadwalkan Ulang",
  upcoming: "Mendatang",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rescheduled: "bg-indigo-100 text-indigo-700",
  upcoming: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function PsychologistSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [toast, setToast] = useState("");
  const [upcomingSlots, setUpcomingSlots] = useState<ApiConsultation[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slotCount, setSlotCount] = useState(0);

  // ====================================================
  // MUAT TEMPLATE + KONSULTASI DARI BACKEND
  // ====================================================

  const loadUpcoming = useCallback(async () => {
    try {
      const [consultations, slots] = await Promise.all([
        consultationAPI.getMyConsultations(),
        scheduleAPI.listMine(),
      ]);

      // Hanya konsultasi yang belum selesai.
      setUpcomingSlots(
        consultations.filter(
          (c) => !["completed", "cancelled", "rejected"].includes(c.status)
        )
      );

      setSlotCount(slots.filter((s) => s.isAvailable).length);
    } catch {
      setUpcomingSlots([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const saved = await scheduleAPI.getWeekly();

        if (cancelled) return;

        // Belum pernah menyimpan: pakai default sebagai saran.
        if (saved) setSchedule(saved);

        await loadUpcoming();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil jadwal"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [loadUpcoming]);

  function toggleDay(key: string) {
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], available: !prev[key].available },
    }));
  }

  function setTime(key: string, field: "start" | "end", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  // ====================================================
  // SIMPAN KE BACKEND
  // ====================================================

  async function save() {
    try {
      setSaving(true);
      setError("");

      const result = await scheduleAPI.saveWeekly(schedule);

      // Beri tahu apa yang sebenarnya terjadi, bukan hanya
      // "berhasil disimpan" -- psikolog perlu tahu kalau ada
      // slot terbooking yang kini di luar jadwalnya.
      const parts = [`${result.totalSlots} slot tersedia`];

      if (result.bookedOutsideTemplate > 0) {
        parts.push(
          `${result.bookedOutsideTemplate} konsultasi di luar jadwal baru tetap dipertahankan`
        );
      }

      setToast(parts.join(" · "));
      setTimeout(() => setToast(""), 5000);

      await loadUpcoming();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan jadwal"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />
        <main className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-100 border-t-[#6F3FB5] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat jadwal...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PsychologistNavbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Praktik</h1>
          <p className="text-gray-500 mt-1">Atur ketersediaan waktu konsultasimu</p>
        </div>

        {/* Day Cards */}
        <div className="space-y-3 mb-8">
          {DAYS.map(({ key, label }) => {
            const day = schedule[key];
            return (
              <div
                key={key}
                className={`bg-white rounded-2xl px-5 py-4 shadow-sm border transition-colors ${day.available ? "border-[#6F3FB5]/20" : "border-gray-100"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className={`font-semibold w-20 ${day.available ? "text-gray-900" : "text-gray-400"}`}>{label}</span>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleDay(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${day.available ? "bg-[#6F3FB5]" : "bg-gray-200"}`}
                    aria-label={`Toggle ${label}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${day.available ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>

                  {day.available ? (
                    <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
                      <select
                        value={day.start}
                        onChange={(e) => setTime(key, "start", e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5]"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 text-sm">—</span>
                      <select
                        value={day.end}
                        onChange={(e) => setTime(key, "end", e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5]"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 flex-1 text-right">Tidak Tersedia</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-3">
            {error}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-[#6F3FB5] hover:bg-[#5c33a0] disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-colors shadow-sm"
        >
          {saving ? "Menyimpan..." : "Simpan Jadwal"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          Jadwal dibuat untuk 4 minggu ke depan. Slot yang sudah
          di-booking tidak akan terhapus.
          {slotCount > 0 && ` Saat ini ${slotCount} slot terbuka.`}
        </p>

        {/* Upcoming Slots */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#6F3FB5]" />
            Konsultasi Mendatang
          </h2>
          {upcomingSlots.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada konsultasi terjadwal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSlots.map((c) => (
                <div key={c.id} className="bg-white rounded-xl px-5 py-4 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{c.userName || "Pasien"}</p>
                    <p className="text-sm text-gray-500">{c.date ? formatDate(c.date) : "-"} · {c.time || "-"}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[c.status] || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[c.status] || c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
