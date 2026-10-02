import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, Filter, ShieldCheck } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import {
  psychologistAPI,
  type ApiPsychologist,
} from "../api/psychologist.api";

// ======================================================
// PSIKOLOG — DARI BACKEND + MONGODB
// ======================================================
//
// Sebelumnya halaman ini membaca src/data/mockData.ts dan
// menentukan "terverifikasi" dari localStorage
// ("hearme_verifications") -- yang bisa diubah siapa pun
// dari console browser.
//
// Sekarang:
//
//   - data dari GET /api/psychologists
//   - backend HANYA mengirim psikolog approved, jadi semua
//     yang tampil di sini sudah pasti terverifikasi
//   - search / specialization / availability disaring
//     DATABASE, bukan di frontend
//
// ======================================================

const specializations = ["Semua", "Psikolog Umum", "Psikoterapis", "Psikiater Anak", "Psikolog Klinis", "Konselor"];

export default function PsychologistsPage() {
  const [search, setSearch] = useState("");
  const [spec, setSpec] = useState("Semua");
  const [availableOnly, setAvailableOnly] = useState(false);

  const [items, setItems] = useState<ApiPsychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ====================================================
  // AMBIL DATA (filter dikirim ke backend)
  // ====================================================
  //
  // Pencarian di-debounce supaya tidak memanggil API pada
  // setiap ketikan.
  //
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const result = await psychologistAPI.list({
          search: search.trim() || undefined,
          specialization: spec !== "Semua" ? spec : undefined,
          availableOnly: availableOnly || undefined,
          limit: 60,
        });

        if (cancelled) return;

        setItems(result.psychologists);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data psikolog"
        );
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, spec, availableOnly]);

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Psikolog</h1>
          <p className="text-gray-500 text-sm">Temukan psikolog yang tepat untukmu</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau spesialisasi..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/20 focus:border-[#6F3FB5] transition-colors"
            />
          </div>
          <label className="flex items-center gap-2 bg-white border border-purple-100 rounded-xl px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F5EEFC] transition-colors">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="accent-[#6F3FB5]" />
            <Filter size={14} className="text-gray-400" />
            Tersedia
          </label>
        </div>

        {/* Specialization tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {specializations.map((s) => (
            <button
              key={s}
              onClick={() => setSpec(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${spec === s ? "bg-[#6F3FB5] text-white" : "bg-white text-gray-600 border border-purple-100 hover:border-purple-300"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-purple-50 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 bg-purple-100 rounded w-3/4" />
                    <div className="h-3 bg-purple-50 rounded w-1/2" />
                    <div className="h-3 bg-purple-50 rounded w-1/3" />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <div className="h-5 bg-purple-50 rounded-full w-16" />
                  <div className="h-5 bg-purple-50 rounded-full w-20" />
                </div>
                <div className="mt-3 pt-3 border-t border-purple-50 h-5 bg-purple-50 rounded w-24" />
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="text-center py-16">
            <div className="inline-block bg-white rounded-3xl border border-red-100 px-8 py-8 max-w-md">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-semibold text-red-500">Gagal mengambil data psikolog</p>
              <p className="text-sm text-gray-500 mt-1 mb-5">{error}</p>
              <button
                onClick={() => setSearch((s) => s)}
                className="bg-[#6F3FB5] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-purple-800 transition-colors text-sm"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {/* DATA */}
        {!loading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <Link
                key={p.id}
                to={`/psychologists/${p.id}`}
                className="group bg-white rounded-2xl p-5 border border-purple-50 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img src={p.avatar || undefined} alt={p.name} className="w-16 h-16 rounded-2xl object-cover bg-purple-100" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${p.available ? "bg-green-400" : "bg-gray-300"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                      {/* Backend hanya mengirim yang approved,
                          jadi badge ini selalu benar. */}
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                        <ShieldCheck size={9} /> Terverifikasi
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{p.specialization}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} fill="#F59E0B" className="text-yellow-400" />
                      {/* rating bisa null kalau belum ada ulasan */}
                      <span className="text-xs font-semibold text-gray-700">
                        {p.rating ?? "Baru"}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({p.ratingCount > 0 ? `${p.ratingCount} ulasan` : p.consultations || "belum ada ulasan"})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.tags.map((t) => (
                    <span key={t} className="text-xs bg-[#F5EEFC] text-[#6F3FB5] px-2 py-0.5 rounded-full font-medium">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-50">
                  <span className="text-sm font-bold text-[#6F3FB5]">{p.price}</span>
                  <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${p.available ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"}`}>
                    {p.available ? "Tersedia" : "Tidak Tersedia"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold">Psikolog tidak ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
