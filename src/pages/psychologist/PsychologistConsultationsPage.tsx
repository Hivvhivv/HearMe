import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MessageCircle, Video, CheckCircle, XCircle, User } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";
import { consultationAPI } from "../../api/consultation.api";
import { scheduleAPI, type ScheduleSlot } from "../../api/schedule.api";
import type { Consultation as ApiConsultation } from "../../types";

// ======================================================
// KONSULTASI PSIKOLOG — DARI BACKEND + MONGODB
// ======================================================
//
// Sebelumnya halaman ini membaca localStorage dan memfilter
// dengan PSYCH_ID = "p1" yang DI-HARDCODE -- jadi ia hanya
// pernah menampilkan mock data, dan psikolog yang login
// tidak pernah melihat booking sungguhan.
//
// Sekarang:
//
//   GET   /api/consultations/mine
//   PATCH /api/consultations/:id/status      (setujui/tolak/selesai)
//   POST  /api/consultations/:id/reschedule  (jadwalkan ulang)
//
// Backend sudah memfilter berdasarkan psikolog yang login
// dan memverifikasi kepemilikan tiap aksi, jadi tidak ada
// lagi id yang perlu dikirim frontend.
//
// ======================================================

type Consultation = ApiConsultation;

type Tab = "upcoming" | "active" | "completed" | "cancelled";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: string) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

// fee bisa berupa angka, string tampilan ("Rp 150.000"),
// atau tidak ada sama sekali pada data lama.
function formatCurrency(value?: number | string) {
  if (value === undefined || value === null) return "-";

  const n =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^0-9]/g, ""));

  if (!Number.isFinite(n) || n === 0) return "-";

  return formatIDR(n);
}

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

const tabConfig: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Mendatang" },
  { id: "active", label: "Aktif" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
];

// Mencakup SEMUA status yang bisa dikirim backend.
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rescheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rescheduled: "Dijadwalkan Ulang",
  upcoming: "Mendatang",
  active: "Aktif",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};

function statusBadge(status: Consultation["status"]) {
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_STYLE[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function PsychologistConsultationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Dialog tolak & jadwalkan ulang.
  const [rejectTarget, setRejectTarget] = useState<Consultation | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState<Consultation | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [pickedSlot, setPickedSlot] = useState("");

  // ====================================================
  // MUAT DATA
  // ====================================================
  //
  // Backend sudah memfilter berdasarkan psikolog yang login,
  // jadi tidak ada filter psychologistId di sini.
  //
  // ====================================================

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const all = await consultationAPI.getMyConsultations();

      setConsultations(all);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data konsultasi"
      );
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filterByTab = (c: Consultation): boolean => {
    if (tab === "upcoming")
      return (
        ["approved", "rescheduled", "upcoming"].includes(c.status) &&
        (c.date || "") >= getTodayStr()
      );
    if (tab === "active") return c.status === "pending";
    if (tab === "completed") return c.status === "completed";
    if (tab === "cancelled")
      return ["rejected", "cancelled"].includes(c.status);
    return false;
  };

  const filtered = consultations.filter(filterByTab);

  // ====================================================
  // AKSI
  // ====================================================

  const runAction = async (id: string, action: () => Promise<void>) => {
    try {
      setBusyId(id);
      setError("");

      await action();
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Aksi gagal"
      );
    } finally {
      setBusyId("");
    }
  };

  const handleApprove = (id: string) =>
    runAction(id, () =>
      consultationAPI.updateConsultationStatus(id, "approved")
    );

  const handleComplete = (id: string) =>
    runAction(id, () =>
      consultationAPI.updateConsultationStatus(id, "completed")
    );

  const submitReject = async () => {
    if (!rejectTarget) return;

    const target = rejectTarget;

    setRejectTarget(null);

    await runAction(target.id, () =>
      consultationAPI.updateConsultationStatus(
        target.id,
        "rejected",
        rejectReason.trim()
      )
    );

    setRejectReason("");
  };

  // Slot untuk jadwalkan ulang diambil dari backend --
  // psikolog tidak bisa memilih jam yang tidak dibukanya.
  const openReschedule = async (c: Consultation) => {
    setRescheduleTarget(c);
    setPickedSlot("");
    setSlots([]);

    try {
      const mine = await scheduleAPI.listMine();

      setSlots(
        mine.filter(
          (s) => s.isAvailable && s.date >= getTodayStr()
        )
      );
    } catch {
      setSlots([]);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget || !pickedSlot) return;

    const target = rescheduleTarget;
    const [date, time] = pickedSlot.split(" ");

    setRescheduleTarget(null);

    await runAction(target.id, () =>
      consultationAPI.reschedule(target.id, date, time)
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PsychologistNavbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Konsultasi
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola seluruh sesi konsultasi Anda</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id ? "bg-[#6F3FB5] text-white" : "bg-white text-gray-600 border border-purple-100 hover:border-purple-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(["upcoming", "active", "completed", "cancelled"] as Tab[]).map((t) => {
            // Hitungan memakai filterByTab yang sama dengan
            // daftarnya, supaya angka di tab tidak pernah
            // berbeda dari isi yang ditampilkan.
            const counts = {
              upcoming: consultations.filter(
                (c) =>
                  ["approved", "rescheduled", "upcoming"].includes(c.status) &&
                  (c.date || "") >= getTodayStr()
              ).length,
              active: consultations.filter((c) => c.status === "pending").length,
              completed: consultations.filter((c) => c.status === "completed").length,
              cancelled: consultations.filter((c) =>
                ["rejected", "cancelled"].includes(c.status)
              ).length,
            };
            const labels = { upcoming: "Mendatang", active: "Menunggu", completed: "Selesai", cancelled: "Ditolak" };
            const colors = {
              upcoming: "text-green-600 bg-green-50",
              active: "text-amber-600 bg-amber-50",
              completed: "text-blue-600 bg-blue-50",
              cancelled: "text-red-500 bg-red-50",
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`p-3 rounded-xl text-center transition-all border ${tab === t ? "border-[#6F3FB5] bg-[#F5EEFC]" : "border-purple-100 bg-white hover:shadow-sm"}`}
              >
                <p className={`text-xl font-bold ${colors[t].split(" ")[0]}`}>{counts[t]}</p>
                <p className="text-xs text-gray-500 mt-0.5">{labels[t]}</p>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-purple-100 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-purple-100 rounded w-1/3" />
                    <div className="h-3 bg-purple-50 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-3 bg-purple-50 rounded w-1/2 mb-4" />
                <div className="h-8 bg-purple-50 rounded-xl w-40" />
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {!loading && filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F5EEFC] flex items-center justify-center mb-3">
              <MessageCircle size={28} className="text-[#C9A9E9]" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Tidak ada konsultasi</p>
            <p className="text-xs text-gray-400 mt-1">Belum ada konsultasi pada kategori ini</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c, idx) => (
              <div key={c.id} className="bg-white rounded-2xl border border-purple-100 p-5 hover:shadow-md transition-all animate-fade-in"
                style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.userName || `Pasien #${idx + 1}`}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(c.fee)}</p>
                    </div>
                  </div>
                  {statusBadge(c.status)}
                </div>

                <div className="flex items-center gap-5 text-xs text-gray-500 mb-4 ml-13 pl-0">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatDate(c.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {c.time}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {["approved", "rescheduled", "upcoming", "active"].includes(c.status) && (
                    <>
                      <button onClick={() => navigate(`/consultation/${c.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#6F3FB5] text-white rounded-xl hover:bg-[#5c32a0] transition-colors">
                        <MessageCircle size={13} /> Buka Sesi
                      </button>
                      <button onClick={() => navigate(`/video-call/${c.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#F5EEFC] text-[#6F3FB5] border border-[#C9A9E9] rounded-xl hover:bg-[#ede0fa] transition-colors">
                        <Video size={13} /> Video Call
                      </button>
                    </>
                  )}
                  {c.status === "pending" && (
                    <>
                      <button onClick={() => handleApprove(c.id)} disabled={busyId === c.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 disabled:opacity-50 transition-colors">
                        <CheckCircle size={13} /> {busyId === c.id ? "Memproses..." : "Setujui"}
                      </button>
                      <button onClick={() => { setRejectTarget(c); setRejectReason(""); }} disabled={busyId === c.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors">
                        <XCircle size={13} /> Tolak
                      </button>
                      <button onClick={() => openReschedule(c)} disabled={busyId === c.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
                        <Calendar size={13} /> Jadwalkan Ulang
                      </button>
                    </>
                  )}

                  {["approved", "rescheduled", "upcoming", "active"].includes(c.status) && (
                    <>
                      <button onClick={() => openReschedule(c)} disabled={busyId === c.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
                        <Calendar size={13} /> Jadwalkan Ulang
                      </button>
                      <button onClick={() => handleComplete(c.id)} disabled={busyId === c.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors">
                        <CheckCircle size={13} /> Tandai Selesai
                      </button>
                    </>
                  )}
                  {c.rejectionReason && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle size={12} /> {c.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ================================================
          DIALOG TOLAK
          Alasan WAJIB -- backend juga menolak tanpa alasan,
          jadi disabled di sini hanya mencegah request sia-sia.
      ================================================ */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Tolak Konsultasi</h3>
            <p className="text-sm text-gray-500 mb-4">
              {rejectTarget.userName || "Pasien"} · {formatDate(rejectTarget.date)} {rejectTarget.time}
            </p>

            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Alasan penolakan
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Jelaskan alasannya agar pasien bisa menyesuaikan..."
              className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors resize-none"
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={submitReject}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-500 disabled:bg-red-200 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
              >
                Tolak Konsultasi
              </button>
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 border border-purple-100 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================
          DIALOG JADWALKAN ULANG
          Slot berasal dari jadwal praktik psikolog sendiri
          (backend), bukan daftar jam bebas.
      ================================================ */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Jadwalkan Ulang</h3>
            <p className="text-sm text-gray-500 mb-4">
              Saat ini: {formatDate(rescheduleTarget.date)} {rescheduleTarget.time}
            </p>

            {slots.length === 0 ? (
              <div className="bg-[#FAF8FD] border border-purple-100 rounded-2xl p-6 text-center">
                <Clock size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">Tidak ada slot kosong</p>
                <p className="text-xs text-gray-400 mt-1">
                  Tambahkan jadwal praktik lebih dulu di menu Jadwal.
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto grid grid-cols-2 gap-2">
                {slots.map((s) => {
                  const key = `${s.date} ${s.time}`;
                  return (
                    <button
                      key={s._id}
                      onClick={() => setPickedSlot(key)}
                      className={`px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left ${
                        pickedSlot === key
                          ? "border-[#6F3FB5] bg-[#F5EEFC] text-[#6F3FB5]"
                          : "border-gray-100 hover:border-purple-200 text-gray-700"
                      }`}
                    >
                      <span className="block">{s.date}</span>
                      <span className="text-gray-400">{s.time}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={submitReschedule}
                disabled={!pickedSlot}
                className="flex-1 bg-[#6F3FB5] disabled:bg-purple-200 text-white font-semibold py-2.5 rounded-xl hover:bg-purple-800 transition-colors text-sm"
              >
                Pindahkan
              </button>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 border border-purple-100 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
