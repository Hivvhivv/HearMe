import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { mindHubContents } from "../data/mockData";

export default function MindHubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = mindHubContents.find((c) => c.id === id);
  const related = mindHubContents.filter((c) => c.category === item?.category && c.id !== id).slice(0, 3);

  if (!item) return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Materi tidak ditemukan.</div>
    </div>
  );

  const paragraphs = item.content.split("\n\n");

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6F3FB5] mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali ke Mind Hub
        </button>

        {/* Header image */}
        <div className="relative h-64 rounded-3xl overflow-hidden mb-6 bg-purple-100 shadow-lg shadow-purple-100">
          <img src={item.image || undefined} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mb-2 inline-block ${item.category === "Mind and Balance" ? "bg-[#6F3FB5]" : "bg-pink-500"}`}>
              {item.category}
            </span>
            <h1 className="text-2xl font-bold mt-1">{item.title}</h1>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-[#6F3FB5]" />
            {item.duration} baca
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#6F3FB5]" />
            Materi praktis
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-purple-50 shadow-sm mb-8">
          <div className="prose prose-gray max-w-none">
            {paragraphs.map((para, i) => {
              if (para.startsWith("## ")) {
                return <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3">{para.replace("## ", "")}</h2>;
              }
              if (para.startsWith("**") && para.endsWith("**")) {
                return <p key={i} className="font-bold text-gray-800 mb-2">{para.replace(/\*\*/g, "")}</p>;
              }
              if (para.startsWith("- ")) {
                const items = para.split("\n").filter(l => l.startsWith("- "));
                return (
                  <ul key={i} className="space-y-1.5 mb-4">
                    {items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A9E9] mt-2 flex-shrink-0" />
                        {item.replace("- ", "").replace(/\*\*/g, "")}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (para.startsWith("1. ") || para.startsWith("2. ")) {
                const lines = para.split("\n");
                return (
                  <ol key={i} className="space-y-1.5 mb-4 list-decimal list-inside">
                    {lines.map((line, j) => (
                      <li key={j} className="text-sm text-gray-600">{line.replace(/^\d+\. /, "").replace(/\*\*/g, "")}</li>
                    ))}
                  </ol>
                );
              }
              return <p key={i} className="text-sm text-gray-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-purple-50 bg-[#F5EEFC] rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2">💡 Praktikkan Hari Ini</h3>
            <p className="text-sm text-gray-600">{item.excerpt} Mulai dengan langkah terkecil yang bisa kamu lakukan dalam 5 menit ke depan.</p>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Materi Terkait</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} to={`/mind-hub/${r.id}`} className="group bg-white rounded-2xl overflow-hidden border border-purple-50 hover:border-purple-200 hover:shadow-md transition-all">
                  <img src={r.image || undefined} alt={r.title} className="w-full h-28 object-cover bg-purple-100" />
                  <div className="p-3">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <Clock size={9} /> {r.duration}
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 leading-snug">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
