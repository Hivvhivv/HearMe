import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, Filter, ShieldCheck } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { psychologists } from "../data/mockData";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// psychologists: id, name, specialization, experience, rating, verification_status
// verification_status: 'Approved' | 'Pending' | 'Rejected'
// SELECT * FROM psychologists WHERE verification_status = 'Approved'
// ======================================================

const specializations = ["Semua", "Psikolog Umum", "Psikoterapis", "Psikiater Anak", "Psikolog Klinis", "Konselor"];

function getApprovedPsychologistIds(): Set<string> {
  try {
    const raw = localStorage.getItem("hearme_verifications");
    if (!raw) return new Set(psychologists.map((p) => p.id));
    const verifications: { psychologistId: string; status: string }[] = JSON.parse(raw);
    const approved = new Set(verifications.filter((v) => v.status === "approved").map((v) => v.psychologistId));
    if (approved.size === 0) return new Set(psychologists.map((p) => p.id));
    return approved;
  } catch { return new Set(psychologists.map((p) => p.id)); }
}

export default function PsychologistsPage() {
  const [search, setSearch] = useState("");
  const [spec, setSpec] = useState("Semua");
  const [availableOnly, setAvailableOnly] = useState(false);

  const approvedIds = getApprovedPsychologistIds();

  const filtered = psychologists.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.specialization.toLowerCase().includes(search.toLowerCase());
    const matchSpec = spec === "Semua" || p.specialization === spec;
    const matchAvail = !availableOnly || p.available;
    return matchSearch && matchSpec && matchAvail;
  });

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
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
                    {approvedIds.has(p.id) && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                        <ShieldCheck size={9} /> Terverifikasi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{p.specialization}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={11} fill="#F59E0B" className="text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-700">{p.rating}</span>
                    <span className="text-xs text-gray-400">({p.consultations})</span>
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

        {filtered.length === 0 && (
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
