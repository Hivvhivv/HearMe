import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MessageCircle, Video, RefreshCw, X, User } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";
import { consultationAPI } from "../../api/consultation.api";
import type { Consultation as ApiConsultation } from "../../types";

// ======================================================
// KONSULTASI MENDATANG — DARI BACKEND + MONGODB
// ======================================================
//
// Sebelumnya membaca localStorage dan memfilter dengan
// PSYCH_ID = "p1" yang di-hardcode.
//
// Sekarang GET /api/consultations/mine — backend sudah
// memfilter berdasarkan psikolog yang login, dan tiap aksi
// (reschedule / tolak) diverifikasi kepemilikannya.
// ======================================================

type Consultation = ApiConsultation;

function getTodayStr() { return new Date().toISOString().split("T")[0]; }
function formatDate(d: string) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
// fee bisa berupa angka, string tampilan ("Rp 150.000"),
// atau tidak ada pada data lama.
function formatCurrency(value?: number | string) {
  if (value === undefined || value === null) return "-";

  const n =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^0-9]/g, ""));

  if (!Number.isFinite(n) || n === 0) return "-";

  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function RescheduleModal({ consultation, onSave, onCancel }: {
  consultation: Consultation;
  onSave: (date: string, time: string) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(consultation.date);
  const [time, setTime] = useState(consultation.time);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Jadwalkan Ulang</h3>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tanggal Baru</label>
            <input type="date" value={date} min={getTodayStr()} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Waktu Baru</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5]" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(date, time)} disabled={!date || !time}
            className="flex-1 py-2.5 text-sm font-semibold bg-[#6F3FB5] text-white rounded-xl hover:bg-[#5c32a0] transition-colors disabled:opacity-50">
            Simpan
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 animate-scale-in">
        <h3 className="font-semibold text-gray-900 mb-2">Batalkan Sesi?</h3>
        <p className="text-sm text-gray-500 mb-5">Tindakan ini akan membatalkan sesi konsultasi. Pasien akan mendapat notifikasi.</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
            Batalkan Sesi
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Tidak
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PsychologistUpcomingPage() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [rescheduleTarget, setRescheduleTarget] = useState<Consultation | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const all = await consultationAPI.getMyConsultations();

      const upcoming = all
        .filter(
          (c) =>
            ["approved", "rescheduled", "upcoming", "active"].includes(c.status) &&
            (c.date || "") >= getTodayStr()
        )
        .sort((a, b) =>
          ((a.date || "") + (a.time || "")).localeCompare(
            (b.date || "") + (b.time || "")
          )
        );

      setConsultations(upcoming);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil konsultasi"
      );
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleReschedule = async (id: string, date: string, time: string) => {
    setRescheduleTarget(null);

    try {
      // Backend memverifikasi slot ini memang milik psikolog
      // ini dan masih kosong, lalu mengambilnya atomic.
      await consultationAPI.reschedule(id, date, time);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menjadwalkan ulang"
      );
    }
  };

  const handleCancel = async (id: string) => {
    setCancelTarget(null);

    try {
      await consultationAPI.updateConsultationStatus(
        id,
        "rejected",
        "Dibatalkan oleh psikolog"
      );
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membatalkan konsultasi"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PsychologistNavbar />

      {rescheduleTarget && (
        <RescheduleModal
          consultation={rescheduleTarget}
          onSave={(date, time) => handleReschedule(rescheduleTarget.id, date, time)}
          onCancel={() => setRescheduleTarget(null)}
        />
      )}
      {cancelTarget && (
        <CancelModal
          onConfirm={() => handleCancel(cancelTarget)}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Jadwal Mendatang
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sesi yang sudah dikonfirmasi dan akan segera berlangsung</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-purple-100 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-purple-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-purple-100 rounded w-1/3" />
                    <div className="h-3 bg-purple-50 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-8 bg-purple-50 rounded-xl w-48" />
              </div>
            ))}
          </div>
        )}

        {!loading && consultations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-14 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F5EEFC] flex items-center justify-center mb-3">
              <Calendar size={28} className="text-[#C9A9E9]" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Tidak ada jadwal mendatang</p>
            <p className="text-xs text-gray-400 mt-1">Konsultasi yang sudah disetujui akan tampil di sini</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {consultations.map((c, idx) => (
              <div key={c.id}
                className="bg-white rounded-2xl border border-purple-100 p-5 hover:shadow-md transition-all animate-fade-in"
                style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6F3FB5] to-[#C9A9E9] flex items-center justify-center text-white flex-shrink-0">
                    <User size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.userName || `Pasien #${idx + 1}`}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(c.fee)}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200 flex-shrink-0">
                        Dikonfirmasi
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {formatDate(c.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {c.time}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <button onClick={() => navigate(`/consultation/${c.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#6F3FB5] text-white rounded-xl hover:bg-[#5c32a0] transition-colors">
                        <MessageCircle size={12} /> Buka Sesi
                      </button>
                      <button onClick={() => navigate(`/video-call/${c.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F5EEFC] text-[#6F3FB5] border border-[#C9A9E9] rounded-xl hover:bg-[#ede0fa] transition-colors">
                        <Video size={12} /> Video Call
                      </button>
                      <button onClick={() => setRescheduleTarget(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                        <RefreshCw size={12} /> Reschedule
                      </button>
                      <button onClick={() => setCancelTarget(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-500 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                        <X size={12} /> Batalkan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
