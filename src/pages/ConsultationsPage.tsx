import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, Plus, MessageCircle } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { consultationService } from "../services";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// consultations table: id, user_id, psychologist_id, consultation_date, consultation_time, status
// SELECT * FROM consultations WHERE user_id = ? ORDER BY consultation_date DESC
// ======================================================

type Status = "upcoming" | "completed" | "cancelled" | "active";
const statusConfig: Record<Status, { label: string; class: string }> = {
  upcoming: { label: "Mendatang", class: "bg-blue-50 text-blue-600" },
  active: { label: "Aktif", class: "bg-green-50 text-green-600" },
  completed: { label: "Selesai", class: "bg-gray-50 text-gray-600" },
  cancelled: { label: "Dibatalkan", class: "bg-red-50 text-red-500" },
};

export default function ConsultationsPage() {
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [consultations, setConsultations] = useState<{ id: string; psychologistName: string; specialization: string; date: string; time: string; status: Status; avatar: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    consultationService.getAll().then((all) => setConsultations(all));
  }, []);

  const shown = consultations.filter((c) =>
    tab === "upcoming" ? c.status === "upcoming" || c.status === "active" : c.status === "completed" || c.status === "cancelled"
  );

  const handleCancel = async (id: string) => {
    if (!confirm("Batalkan konsultasi ini?")) return;
    await consultationService.cancel(id);
    setConsultations((prev) => prev.map((c) => c.id === id ? { ...c, status: "cancelled" as Status } : c));
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Konsultasi</h1>
            <p className="text-sm text-gray-500">Kelola jadwal konsultasimu</p>
          </div>
          <Link to="/psychologists" className="flex items-center gap-2 bg-[#6F3FB5] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-800 transition-colors">
            <Plus size={16} /> Book Konsultasi
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {(["upcoming", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? "bg-[#6F3FB5] text-white" : "bg-white text-gray-600 border border-purple-100 hover:border-purple-300"}`}>
              {t === "upcoming" ? "Mendatang" : "Riwayat"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {shown.map((c) => {
            const sc = statusConfig[c.status];
            const isActive = c.status === "upcoming" || c.status === "active";
            return (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-purple-50 hover:border-purple-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <img src={c.avatar || undefined} alt={c.psychologistName} className="w-14 h-14 rounded-2xl object-cover bg-purple-100" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{c.psychologistName}</h3>
                    <p className="text-sm text-gray-500">{c.specialization}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(c.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={11} /> {c.time} WIB
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sc.class}`}>{sc.label}</span>
                </div>
                {isActive && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-purple-50">
                    <button
                      onClick={() => navigate(`/consultation/${c.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#6F3FB5] hover:bg-purple-800 py-2.5 rounded-xl transition-colors"
                    >
                      <MessageCircle size={14} /> Masuk Konsultasi
                    </button>
                    <button
                      onClick={() => handleCancel(c.id)}
                      className="px-4 py-2 text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      Batalkan
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {shown.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">{tab === "upcoming" ? "Belum ada jadwal konsultasi" : "Belum ada riwayat"}</p>
              <Link to="/psychologists" className="inline-block mt-4 text-[#6F3FB5] text-sm font-semibold hover:underline">
                Cari Psikolog →
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
