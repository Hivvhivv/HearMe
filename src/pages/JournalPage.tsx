import { useState, useRef } from "react";
import { Plus, X, BookOpen, Smile, ArrowLeft, Image, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  images: string[];
  date: string;
}

const moodOptions = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "anxious", emoji: "😰", label: "Anxious" },
  { id: "grateful", emoji: "🙏", label: "Grateful" },
  { id: "angry", emoji: "😤", label: "Angry" },
];

const defaultEntries: JournalEntry[] = [
  { id: "j1", title: "Hari yang melelahkan", content: "Hari ini sangat berat tapi aku berhasil melewatinya. Senang bisa sampai malam dengan selamat.", mood: "okay", images: [], date: new Date(Date.now() - 86400000).toISOString() },
  { id: "j2", title: "Bersyukur untuk hal kecil", content: "Pagi ini matahari bersinar cerah dan secangkir kopi terasa sempurna. Kadang hal kecil inilah yang membuat segalanya lebih baik.", mood: "grateful", images: [], date: new Date(Date.now() - 86400000 * 3).toISOString() },
];

const MAX_IMAGES = 5;

export default function JournalPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem("hearme_journals");
    return saved ? JSON.parse(saved) : defaultEntries;
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", mood: "happy", images: [] as string[] });
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);

  const save = () => {
    if (!form.title || !form.content) return;
    const entry: JournalEntry = { id: `j${Date.now()}`, ...form, date: new Date().toISOString() };
    const updated = [entry, ...entries];
    setEntries(updated);
    localStorage.setItem("hearme_journals", JSON.stringify(updated));
    setForm({ title: "", content: "", mood: "happy", images: [] });
    setShowForm(false);
  };

  const deleteEntry = (id: string) => {
    if (!window.confirm("Hapus jurnal ini?")) return;
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem("hearme_journals", JSON.stringify(updated));
    if (viewEntry?.id === id) setViewEntry(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (form.images.length + files.length > MAX_IMAGES) {
      alert(`Maksimal ${MAX_IMAGES} foto`);
      return;
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((f) => ({ ...f, images: [...f.images, ev.target?.result as string] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const getMoodEmoji = (id: string) => moodOptions.find((m) => m.id === id)?.emoji || "😊";

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-purple-100 text-gray-500 hover:text-[#6F3FB5] hover:border-purple-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Jurnal Perasaan</h1>
            <p className="text-sm text-gray-500">Tuangkan isi hatimu dengan bebas</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#6F3FB5] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-800 transition-colors"
          >
            <Plus size={16} /> Tulis Jurnal
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">Belum ada jurnal</p>
            <p className="text-sm mt-1">Mulai tulis perasaanmu hari ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-2xl p-5 border border-purple-50 hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setViewEntry(e)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getMoodEmoji(e.mood)}</span>
                    <h3 className="font-bold text-gray-900">{e.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                    </span>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); deleteEntry(e.id); }}
                      className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{e.content}</p>
                {e.images && e.images.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {e.images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover bg-purple-100" />
                    ))}
                    {e.images.length > 3 && (
                      <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center text-xs text-[#6F3FB5] font-bold">
                        +{e.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Entry Modal */}
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMoodEmoji(viewEntry.mood)}</span>
                <h2 className="text-lg font-bold text-gray-900">{viewEntry.title}</h2>
              </div>
              <button onClick={() => setViewEntry(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {new Date(viewEntry.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{viewEntry.content}</p>
            {viewEntry.images && viewEntry.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {viewEntry.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-full h-32 rounded-xl object-cover bg-purple-100" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={18} className="text-[#6F3FB5]" /> Jurnal Baru
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                  <Smile size={12} /> Suasana hati saat ini
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {moodOptions.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setForm((f) => ({ ...f, mood: m.id }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${form.mood === m.id ? "border-[#6F3FB5] bg-[#F5EEFC]" : "border-gray-100 hover:border-purple-200"}`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-xs text-gray-600">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Judul</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Judul jurnal hari ini..."
                  className="w-full px-4 py-3 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ceritakan perasaanmu</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Tulis apa yang ada di pikiranmu hari ini..."
                  rows={6}
                  className="w-full px-4 py-3 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                  <Image size={12} /> Foto ({form.images.length}/{MAX_IMAGES})
                </label>
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover bg-purple-100" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {form.images.length < MAX_IMAGES && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-purple-200 rounded-xl text-xs text-[#6F3FB5] font-medium hover:border-purple-400 hover:bg-[#F5EEFC] transition-colors"
                    >
                      <Image size={14} /> Tambah Foto
                    </button>
                  </>
                )}
              </div>

              <button onClick={save} className="w-full bg-[#6F3FB5] text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors">
                Simpan Jurnal
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
