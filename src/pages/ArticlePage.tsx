import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, User, Calendar, BookOpen } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { articles } from "../data/mockData";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// articles table: id, title, content, author, thumbnail, reading_time, publish_date
// SELECT * FROM articles WHERE id = ?
// ======================================================

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const article = articles.find((a) => a.id === id);
  const related = articles.filter((a) => a.id !== id).slice(0, 3);

  if (!article) return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Artikel tidak ditemukan.</div>
    </div>
  );

  const paragraphs = article.content.split("\n\n");

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6F3FB5] mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali
        </button>

        {/* Thumbnail */}
        <div className="relative h-64 rounded-3xl overflow-hidden mb-6 bg-purple-100 shadow-lg shadow-purple-100">
          <img src={article.image || undefined} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <span className="text-xs font-semibold bg-[#6F3FB5] px-2.5 py-1 rounded-full mb-2 inline-block">
              {article.category}
            </span>
            <h1 className="text-2xl font-bold mt-1">{article.title}</h1>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-[#6F3FB5]" />
            {article.author}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[#6F3FB5]" />
            {article.publishDate}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-[#6F3FB5]" />
            {article.readTime} baca
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-purple-50 shadow-sm mb-8">
          <p className="text-base text-gray-700 leading-relaxed mb-6 font-medium border-l-4 border-[#C9A9E9] pl-4 italic">
            {article.excerpt}
          </p>

          {paragraphs.map((para, i) => {
            if (para.startsWith("## ")) {
              return <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3">{para.replace("## ", "")}</h2>;
            }
            if (para.startsWith("**") && para.endsWith("**")) {
              return <p key={i} className="font-bold text-gray-800 mt-4 mb-2">{para.replace(/\*\*/g, "")}</p>;
            }
            if (para.startsWith("- ")) {
              const items = para.split("\n").filter(l => l.startsWith("- "));
              return (
                <ul key={i} className="space-y-2 mb-4">
                  {items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A9E9] mt-2 flex-shrink-0" />
                      <span dangerouslySetInnerHTML={{ __html: item.replace("- ", "").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-sm text-gray-600 leading-relaxed mb-4"
                dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
            );
          })}

          <div className="mt-8 pt-6 border-t border-purple-50">
            <div className="bg-[#F5EEFC] rounded-2xl p-4 flex items-start gap-3">
              <BookOpen size={18} className="text-[#6F3FB5] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#6F3FB5] mb-1">Butuh bantuan lebih lanjut?</div>
                <p className="text-xs text-gray-600">Jika kamu merasa membutuhkan dukungan profesional, konsultasi dengan psikolog HearMe yang tersertifikasi.</p>
                <Link to="/psychologists" className="inline-block mt-2 text-xs font-semibold text-[#6F3FB5] hover:underline">
                  Temukan Psikolog →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Artikel Terkait</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} to={`/article/${r.id}`} className="group bg-white rounded-2xl overflow-hidden border border-purple-50 hover:border-purple-200 hover:shadow-md transition-all">
                  <img src={r.image || undefined} alt={r.title} className="w-full h-28 object-cover bg-purple-100 group-hover:scale-105 transition-transform duration-300" style={{ display: 'block' }} />
                  <div className="p-3">
                    <span className="text-xs text-[#6F3FB5] font-semibold">{r.category}</span>
                    <h3 className="text-xs font-bold text-gray-900 mt-1 leading-snug">{r.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Clock size={9} /> {r.readTime}
                    </div>
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
