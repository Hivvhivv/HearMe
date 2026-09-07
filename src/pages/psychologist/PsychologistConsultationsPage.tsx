import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MessageCircle, Video, CheckCircle, XCircle, User } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// SELECT * FROM consultations WHERE psychologist_id = ? ORDER BY date DESC
// ======================================================

const PSYCH_ID = "p1";

interface Consultation {
  id: string;
  psychologistId: string;
  userId: string;
  userName?: string;
  date: string;
  time: string;
  fee: number;
  status: "pending" | "approved" | "rejected" | "completed";
  rejectionReason?: string;
}

type Tab = "upcoming" | "active" | "completed" | "cancelled";

function getConsultations(): Consultation[] {
  try {
    return JSON.parse(localStorage.getItem("hearme_consultations_v2") || "[]");
  } catch { return []; }
}

function saveConsultations(list: Consultation[]) {
  localStorage.setItem("hearme_consultations_v2", JSON.stringify(list));
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: string) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

const tabConfig: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Mendatang" },
  { id: "active", label: "Aktif" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
];

function statusBadge(status: Consultation["status"]) {
  const map = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const labels = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak", completed: "Selesai" };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function PsychologistConsultationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    const all = getConsultations().filter((c) => c.psychologistId === PSYCH_ID);
    setConsultations(all);
  }, []);

  const filterByTab = (c: Consultation): boolean => {
    if (tab === "upcoming") return c.status === "approved" && c.date >= getTodayStr();
    if (tab === "active") return c.status === "pending";
    if (tab === "completed") return c.status === "completed";
    if (tab === "cancelled") return c.status === "rejected";
    return false;
  };

  const filtered = consultations.filter(filterByTab);

  const handleApprove = (id: string) => {
    const all = getConsultations();
    const updated = all.map((c) => c.id === id ? { ...c, status: "approved" as const } : c);
    saveConsultations(updated);
    setConsultations(updated.filter((c) => c.psychologistId === PSYCH_ID));

    // ======================================================
    // ## API TEMPLATE IF CONNECTED ##
    // Notification Service — notify user that consultation was accepted
    // notificationService.send(c.userId, "Konsultasi Anda telah diterima oleh psikolog.")
    // ======================================================
    const notifs = JSON.parse(localStorage.getItem("hearme_notifications") || "[]");
    const con = consultations.find((c) => c.id === id);
    if (con) {
      notifs.unshift({
        id: `n${Date.now()}`,
        title: "Konsultasi Diterima",
        message: "Konsultasi Anda telah diterima oleh psikolog.",
        time: "Baru saja",
        read: false,
        type: "consultation",
      });
      localStorage.setItem("hearme_notifications", JSON.stringify(notifs));
    }
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
            const counts = {
              upcoming: consultations.filter((c) => c.status === "approved" && c.date >= getTodayStr()).length,
              active: consultations.filter((c) => c.status === "pending").length,
              completed: consultations.filter((c) => c.status === "completed").length,
              cancelled: consultations.filter((c) => c.status === "rejected").length,
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

        {/* List */}
        {filtered.length === 0 ? (
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
                  {c.status === "approved" && (
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
                    <button onClick={() => handleApprove(c.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
                      <CheckCircle size={13} /> Setujui
                    </button>
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
    </div>
  );
}
