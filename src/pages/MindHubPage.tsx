import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowRight, Search } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { mindHubContents } from "../data/mockData";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// mind_hub_contents: id, category, title, content, image, duration
// mind_hub_articles: id, title, category, thumbnail, short_description, content, tags, status, created_by, created_at
// SELECT * FROM mind_hub_contents WHERE category = ?
// UNION SELECT id, title, category, thumbnail AS image, short_description AS excerpt, content, duration, 'published' AS status FROM mind_hub_articles WHERE status = 'published' AND category = ?
// ======================================================

function getAdminArticles() {
  try {
    const raw = localStorage.getItem("hearme_mindhub_admin");
    if (!raw) return [];
    const items: { id: string; title: string; category: string; image: string; excerpt: string; content: string; duration: string; published: boolean }[] = JSON.parse(raw);
    return items.filter((i) => i.published).map((i) => ({
      id: i.id,
      category: i.category as "Mind and Balance" | "Self-Care Corner",
      title: i.title,
      duration: i.duration || "5 menit",
      image: i.image || "",
      excerpt: i.excerpt,
      content: i.content,
    }));
  } catch { return []; }
}

export default function MindHubPage() {
  const [tab, setTab] = useState<"Mind and Balance" | "Self-Care Corner">("Mind and Balance");
  const [search, setSearch] = useState("");

  const adminArticles = getAdminArticles();
  const allContents = [...mindHubContents, ...adminArticles];

  const items = allContents.filter(
    (c) => c.category === tab && c.title.toLowerCase().includes(search.toLowerCase())
  );

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
              {allContents.filter(c => c.category === "Mind and Balance").length} Materi Mind & Balance
            </span>
            <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
              {allContents.filter(c => c.category === "Self-Care Corner").length} Materi Self-Care
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
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

        {items.length === 0 && (
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
