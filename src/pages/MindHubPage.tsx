import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowRight, Search } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import {
  mindHubAPI,
  type MindHubItem,
  type MindHubCategory,
} from "../api/mindhub.api";

// ======================================================
// MIND HUB — DARI BACKEND + MONGODB
// ======================================================
//
// Sebelumnya halaman ini menggabungkan DUA sumber:
// mockData.ts dan localStorage "hearme_mindhub_admin".
// Artinya konten yang dibuat admin hanya terlihat di
// browser admin itu sendiri.
//
// Sekarang GET /api/mind-hub. Backend HANYA mengirim
// konten berstatus published, jadi draft admin tidak
// mungkin tampil di sini.
//
// Pencarian dan filter kategori dikerjakan DATABASE.
//
// ======================================================

export default function MindHubPage() {
  const [tab, setTab] = useState<MindHubCategory>("Mind and Balance");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<MindHubItem[]>([]);
  const [counts, setCounts] = useState({ balance: 0, selfCare: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Jumlah per kategori untuk badge di hero. Diambil sekali;
  // tidak ikut berubah saat user mengetik pencarian.
  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const [balance, selfCare] = await Promise.all([
          mindHubAPI.list({
            category: "Mind and Balance",
            limit: 1,
          }),
          mindHubAPI.list({
            category: "Self-Care Corner",
            limit: 1,
          }),
        ]);

        if (!cancelled) {
          setCounts({
            balance: balance.pagination.total,
            selfCare: selfCare.pagination.total,
          });
        }
      } catch {
        // Badge jumlah bukan hal kritis.
      }
    };

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Daftar konten; pencarian di-debounce.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const result = await mindHubAPI.list({
          category: tab,
          search: search.trim() || undefined,
          limit: 60,
        });

        if (!cancelled) setItems(result.contents);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil konten Mind Hub"
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tab, search]);

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-[#6F3FB5] to-[#8B5CF6] rounded-3xl p-8 mb-8 text-white overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-full opacity-20 pointer-events-none">
            <svg viewBox="0 0 200 300" fill="none"><circle cx="200" cy="100" r="150" fill="white" /><circle cx="150" cy="250" r="100" fill="white" /></svg>
          </div>
          <p className="text-purple-200 text-sm mb-1">Konten self-care untuk kamu</p>
          <h1 className="text-2xl font-bold mb-2">Mind Hub</h1>
          <p className="text-purple-200 text-sm mb-5 max-w-lg">Setiap langkah kecil menuju kesehatan mental yang lebih baik adalah pencapaian yang luar biasa.</p>
          <div className="flex gap-3">
            <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
              {counts.balance} Materi Mind & Balance
            </span>
            <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
              {counts.selfCare} Materi Self-Care
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {(["Mind and Balance", "Self-Care Corner"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-[#6F3FB5] text-white shadow-sm shadow-purple-200" : "bg-white text-gray-600 border border-purple-100 hover:border-purple-300"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari materi..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
            />
          </div>
        </div>

        {/* Category description */}
        <div className="mb-6 bg-white rounded-2xl p-4 border border-purple-50">
          {tab === "Mind and Balance" ? (
            <div className="flex items-start gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <div className="font-bold text-gray-900 text-sm mb-1">Mind and Balance</div>
                <div className="text-xs text-gray-500 leading-relaxed">Fokus pada manajemen stres, produktivitas, keseimbangan hidup, time management, self-discipline, dan mindset growth untuk kehidupan yang lebih seimbang.</div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="text-2xl">💆</div>
              <div>
                <div className="font-bold text-gray-900 text-sm mb-1">Self-Care Corner</div>
                <div className="text-xs text-gray-500 leading-relaxed">Fokus pada self-love, relaksasi, healing, breathing exercise, sleep improvement, dan kesadaran emosional untuk perawatan diri yang holistik.</div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-purple-50 animate-pulse">
                <div className="h-44 bg-purple-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-purple-50 rounded w-1/3" />
                  <div className="h-4 bg-purple-100 rounded w-3/4" />
                  <div className="h-3 bg-purple-50 rounded w-full" />
                  <div className="h-3 bg-purple-50 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {!loading && !error && items.map((item) => (
            <Link
              key={item.id}
              to={`/mind-hub/${item.id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-purple-50 hover:border-purple-200 hover:shadow-xl transition-all"
            >
              <div className="h-44 overflow-hidden bg-purple-100">
                <img src={item.image || undefined} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tab === "Mind and Balance" ? "bg-[#F5EEFC] text-[#6F3FB5]" : "bg-pink-50 text-pink-600"}`}>
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={10} /> {item.duration}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2 leading-snug">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">{item.excerpt}</p>
                <div className="flex items-center gap-1 text-[#6F3FB5] text-xs font-semibold group-hover:gap-2 transition-all">
                  Mulai Baca <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold">Materi tidak ditemukan</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
