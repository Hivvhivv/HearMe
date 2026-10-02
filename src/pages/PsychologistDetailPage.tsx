import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Star, Calendar, Clock, MessageCircle } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import {
  psychologistAPI,
  type ApiPsychologist,
} from "../api/psychologist.api";

// ======================================================
// DETAIL PSIKOLOG — DARI MONGODB
// ======================================================
//
// GET /api/psychologists/:id
//
// Backend membalas 404 baik untuk psikolog yang tidak ada
// MAUPUN yang belum approved -- supaya keberadaan akun
// yang belum diverifikasi tidak bocor.
//
// ======================================================

export default function PsychologistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [psych, setPsych] = useState<ApiPsychologist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError("");

        const data = await psychologistAPI.getById(id);

        if (!cancelled) setPsych(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data psikolog"
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
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-[#6F3FB5] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Memuat data psikolog...</p>
      </div>
    </div>
  );

  if (!psych) return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-purple-50 p-8">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold text-gray-700">Psikolog tidak ditemukan</p>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {error || "Psikolog ini mungkin belum terverifikasi."}
          </p>
          <Link to="/psychologists" className="inline-block bg-[#6F3FB5] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-purple-800 transition-colors text-sm">
            Lihat psikolog lain
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6F3FB5] mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
          <div className="bg-gradient-to-r from-[#F5EEFC] to-[#E9D5FF] p-8">
            <div className="flex items-start gap-6">
              <img src={psych.avatar || undefined} alt={psych.name} className="w-24 h-24 rounded-3xl object-cover shadow-lg bg-purple-100" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{psych.name}</h1>
                <p className="text-[#6F3FB5] font-semibold text-sm mt-1">{psych.specialization}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star size={14} fill="#F59E0B" className="text-yellow-400" />
                    <span className="font-bold text-gray-800">{psych.rating}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{psych.consultations} konsultasi</span>
                  <span className="text-gray-400 text-sm">{psych.experience} pengalaman</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {psych.tags.map((t) => (
                    <span key={t} className="text-xs bg-white text-[#6F3FB5] px-2 py-0.5 rounded-full font-medium border border-purple-200">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-2">Tentang</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{psych.bio}</p>
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">Jadwal Konsultasi</h2>
              <div className="space-y-2">
                {psych.schedule.map((s) => (
                  <div key={s} className="flex items-center gap-3 bg-[#FAF8FD] rounded-xl px-4 py-3">
                    <Calendar size={14} className="text-[#6F3FB5]" />
                    <span className="text-sm text-gray-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F5EEFC] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Biaya Konsultasi</div>
                <div className="text-xl font-bold text-[#6F3FB5]">{psych.price} <span className="text-sm font-normal text-gray-400">/ sesi</span></div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} /> 50 menit / sesi
              </div>
            </div>

            <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg font-semibold ${psych.available ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"}`}>
              <div className={`w-2 h-2 rounded-full ${psych.available ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
              {psych.available ? "Tersedia untuk konsultasi" : "Sedang tidak tersedia"}
            </div>

            <div className="flex gap-3">
              <Link
                to={`/booking/${psych.id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-[#6F3FB5] hover:bg-purple-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm shadow-purple-200"
              >
                <Calendar size={16} /> Jadwalkan Konsultasi
              </Link>
              <Link
                to="/ai-listener"
                className="flex items-center justify-center gap-2 bg-[#F5EEFC] hover:bg-purple-200 text-[#6F3FB5] font-semibold px-4 py-3 rounded-xl text-sm transition-colors"
              >
                <MessageCircle size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
