import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";

interface DaySchedule {
  available: boolean;
  start: string;
  end: string;
}

interface Schedule {
  [day: string]: DaySchedule;
}

interface Consultation {
  id: string;
  date?: string;
  time?: string;
  userName?: string;
  status?: string;
  [key: string]: unknown;
}

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

// Map JS day index (0=Sun) to schedule key
const DAY_INDEX_MAP: Record<number, string> = {
  1: "senin", 2: "selasa", 3: "rabu", 4: "kamis", 5: "jumat", 6: "sabtu", 0: "minggu",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function PsychologistSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [toast, setToast] = useState(false);
  const [upcomingSlots, setUpcomingSlots] = useState<Consultation[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hearme_psych_schedule");
      if (saved) setSchedule(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const loadUpcoming = useCallback((sched: Schedule) => {
    try {
      const raw1 = JSON.parse(localStorage.getItem("hearme_consultations") || "[]") as Consultation[];
      const raw2 = JSON.parse(localStorage.getItem("hearme_consultations_v2") || "[]") as Consultation[];
      const all = [...raw1, ...raw2];
      const slots = all.filter((c) => {
        if (!c.date) return false;
        const dayKey = DAY_INDEX_MAP[new Date(c.date).getDay()];
        return sched[dayKey]?.available;
      });
      setUpcomingSlots(slots);
    } catch { setUpcomingSlots([]); }
  }, []);

  useEffect(() => { loadUpcoming(schedule); }, [schedule, loadUpcoming]);

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

  function save() {
    localStorage.setItem("hearme_psych_schedule", JSON.stringify(schedule));
    setToast(true);
    setTimeout(() => setToast(false), 3000);
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

        {/* Save Button */}
        <button
          onClick={save}
          className="w-full bg-[#6F3FB5] hover:bg-[#5c33a0] text-white font-semibold py-3 rounded-2xl transition-colors shadow-sm"
        >
          Simpan Jadwal
        </button>

        {/* Upcoming Slots */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#6F3FB5]" />
            Konsultasi Mendatang
          </h2>
          {upcomingSlots.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada konsultasi terjadwal pada hari-hari yang tersedia.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSlots.map((c) => (
                <div key={c.id} className="bg-white rounded-xl px-5 py-4 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{c.userName || "Pasien"}</p>
                    <p className="text-sm text-gray-500">{formatDate(c.date!)} · {c.time || "-"}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    c.status === "upcoming"
                      ? "bg-blue-100 text-blue-700"
                      : c.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {c.status === "upcoming" ? "Mendatang" : c.status === "cancelled" ? "Dibatalkan" : "Selesai"}
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
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Jadwal berhasil disimpan</span>
        </div>
      )}
    </div>
  );
}
