import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Send, BookOpen, ArrowRight, Star, Clock, ChevronRight } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import MoodModal from "../components/MoodModal";
import Footer from "../components/Footer";
import { psychologists, articles } from "../data/mockData";
import { moodService, authService } from "../services";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// mood_logs table: id, user_id, mood, note, created_at
// SELECT * FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 7
// ======================================================

const moodConfig: Record<string, { emoji: string; color: string; label: string }> = {
  happy: { emoji: "😊", color: "#10B981", label: "Happy" },
  sad: { emoji: "😢", color: "#3B82F6", label: "Sad" },
  amazing: { emoji: "🤩", color: "#F59E0B", label: "Amazing" },
  okay: { emoji: "😐", color: "#6B7280", label: "Okay" },
  stressed: { emoji: "😤", color: "#F97316", label: "Stressed" },
  overwhelmed: { emoji: "😰", color: "#8B5CF6", label: "Overwhelmed" },
  angry: { emoji: "😡", color: "#EF4444", label: "Angry" },
  fear: { emoji: "😨", color: "#6B7280", label: "Fear" },
  surprised: { emoji: "😮", color: "#8B5CF6", label: "Surprised" },
  disgust: { emoji: "🤢", color: "#10B981", label: "Disgust" },
};

function getLast7Days(): { key: string; label: string; dayNum: number }[] {
  const days = [];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ key, label: dayNames[d.getDay()], dayNum: d.getDate() });
  }
  return days;
}

export default function DashboardPage() {
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodLogs, setMoodLogs] = useState<Record<string, string>>(moodService.getLogs);
  const [reflection, setReflection] = useState("");
  const [reflectionSent, setReflectionSent] = useState(false);

  const user = authService.getUser();
  const name = user?.name || "Inof";
  const last7 = getLast7Days();
  const todayKey = new Date().toISOString().split("T")[0];

  const handleSaveMood = (mood: string) => {
    const updated = { ...moodLogs, [todayKey]: mood };
    setMoodLogs(updated);
    moodService.saveMood(todayKey, mood);
    setShowMoodModal(false);
  };

  const sendReflection = () => {
    if (!reflection.trim()) return;
    setReflectionSent(true);
    setTimeout(() => { setReflectionSent(false); setReflection(""); }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-[#6F3FB5] to-[#8B5CF6] rounded-3xl p-8 overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none">
            <svg viewBox="0 0 200 200" fill="none"><circle cx="150" cy="50" r="120" fill="white" /><circle cx="180" cy="100" r="80" fill="white" /></svg>
          </div>
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-purple-200 text-sm mb-1">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h1 className="text-3xl font-bold mb-2">Hi {name},<br />Nice to meet you again!</h1>
              <p className="text-purple-200 text-sm mb-6">Tell us about your emotions today,<br />we're ready to listen!</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="How are you feeling today?"
                  onKeyDown={(e) => e.key === "Enter" && sendReflection()}
                  className="flex-1 bg-white/20 backdrop-blur placeholder-purple-200 text-white text-sm px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:border-white/60 transition-colors"
                />
                <button onClick={sendReflection} className="bg-white text-[#6F3FB5] p-3 rounded-xl hover:bg-purple-50 transition-colors">
                  <Send size={18} />
                </button>
              </div>
              {reflectionSent && (
                <div className="mt-3 bg-white/20 text-white text-sm px-4 py-2 rounded-xl animate-fade-in">
                  ✨ Terima kasih sudah berbagi! Kami selalu di sini untukmu.
                </div>
              )}
            </div>
            <div className="hidden md:flex justify-end">
              <img
                src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300&h=300&fit=crop&auto=format"
                alt="Seseorang yang tenang"
                className="w-48 h-48 object-cover rounded-3xl opacity-90 shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Daily Mood Log - Date Based */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Daily Mood Log</h2>
            <span className="text-xs text-gray-400">7 hari terakhir</span>
          </div>
          <div className="grid grid-cols-8 gap-2 overflow-x-auto">
            {last7.map((day) => {
              const mood = moodLogs[day.key];
              const isToday = day.key === todayKey;
              const cfg = mood ? moodConfig[mood] : null;
              return (
                <div
                  key={day.key}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 min-w-[56px] transition-all ${
                    isToday ? "bg-[#F5EEFC] border-2 border-[#C9A9E9]" : "bg-[#FAF8FD] border border-purple-50"
                  }`}
                >
                  <span className="text-xs font-semibold text-gray-500">{day.label}</span>
                  <span className="text-xs text-gray-400">{day.dayNum}</span>
                  {cfg ? (
                    <span className="text-2xl" title={cfg.label}>{cfg.emoji}</span>
                  ) : (
                    <div className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center ${isToday ? "border-[#6F3FB5]" : "border-gray-200"}`}>
                      {isToday && <span className="text-[#6F3FB5] text-xs">?</span>}
                    </div>
                  )}
                  {isToday && <span className="text-xs font-bold text-[#6F3FB5]">Today</span>}
                </div>
              );
            })}

            <button
              onClick={() => setShowMoodModal(true)}
              className="flex flex-col items-center justify-center gap-1 bg-[#F5EEFC] hover:bg-purple-200 rounded-2xl px-2 py-3 border-2 border-dashed border-[#C9A9E9] transition-colors min-w-[56px] group"
            >
              <Plus size={20} className="text-[#6F3FB5] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-[#6F3FB5]">Add</span>
            </button>
          </div>

          {moodLogs[todayKey] && (
            <div className="mt-4 pt-4 border-t border-purple-50 flex items-center gap-3">
              <span className="text-2xl">{moodConfig[moodLogs[todayKey]]?.emoji}</span>
              <div>
                <div className="text-xs text-gray-400">Mood hari ini</div>
                <div className="text-sm font-bold" style={{ color: moodConfig[moodLogs[todayKey]]?.color }}>
                  {moodConfig[moodLogs[todayKey]]?.label}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Top Psychologists */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Top Psychologist</h2>
            <Link to="/psychologists" className="text-sm text-[#6F3FB5] font-semibold hover:underline flex items-center gap-1">
              Lihat semua <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {psychologists.slice(0, 4).map((p) => (
              <Link key={p.id} to={`/psychologists/${p.id}`} className="group bg-white rounded-2xl p-4 border border-purple-50 hover:border-purple-200 hover:shadow-lg transition-all">
                <img src={p.avatar || undefined} alt={p.name} className="w-14 h-14 rounded-2xl object-cover mb-3 bg-purple-100" />
                <h3 className="font-bold text-gray-900 text-sm leading-tight">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{p.specialization}</p>
                <div className="flex items-center gap-1 text-xs">
                  <Star size={11} fill="#F59E0B" className="text-yellow-400" />
                  <span className="font-semibold text-gray-700">{p.rating}</span>
                  <span className="text-gray-400 ml-1">{p.consultations}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Journaling */}
        <section className="bg-gradient-to-br from-[#F5EEFC] to-white rounded-3xl p-6 border border-purple-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={20} className="text-[#6F3FB5]" />
                <h2 className="text-lg font-bold text-gray-900">Journaling Feelings</h2>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                Write down what's on your heart,<br />so you can feel relieved before going to sleep.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
                <Clock size={12} /> Reminder: 8:00 PM
              </div>
              <Link to="/journal" className="inline-flex items-center gap-2 bg-[#6F3FB5] hover:bg-purple-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm shadow-purple-200">
                Write now <ArrowRight size={14} />
              </Link>
            </div>
            <img
              src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&h=200&fit=crop&auto=format"
              alt="Jurnal dan pena"
              className="w-24 h-24 object-cover rounded-2xl ml-4 hidden sm:block bg-purple-100"
            />
          </div>
        </section>

        {/* Mind Hub */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Mind Hub</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Mind and Balance", items: ["Mengatur stres", "Rutinitas sehat", "Motivasi harian"], img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&auto=format", color: "from-[#6F3FB5] to-[#8B5CF6]" },
              { title: "Self-Care Corner", items: ["Relaksasi terpandu", "Latihan napas 5 menit", "Tenangkan pikiran"], img: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=200&fit=crop&auto=format", color: "from-[#EC4899] to-[#F97316]" },
            ].map((hub) => (
              <Link key={hub.title} to="/mind-hub" className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                <img src={hub.img || undefined} alt={hub.title} className="w-full h-48 object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-t ${hub.color} opacity-80`} />
                <div className="absolute inset-0 p-6 text-white flex flex-col justify-end">
                  <h3 className="text-lg font-bold mb-2">{hub.title}</h3>
                  <ul className="space-y-1 mb-4">
                    {hub.items.map((item) => (
                      <li key={item} className="text-xs text-white/80 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-white/60 inline-block" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button className="self-start bg-white text-[#6F3FB5] text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                    Start your journey
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Based on your current state</h2>
          <p className="text-sm text-gray-500 mb-4">Artikel yang dipersonalisasi untukmu</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {articles.map((a) => (
              <Link key={a.id} to={`/article/${a.id}`} className="group bg-white rounded-2xl overflow-hidden border border-purple-50 hover:border-purple-200 hover:shadow-lg transition-all">
                <div className="h-36 overflow-hidden bg-purple-100">
                  <img src={a.image || undefined} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <span className="text-xs text-[#6F3FB5] font-semibold">{a.category}</span>
                  <h3 className="text-sm font-bold text-gray-900 mt-1 mb-2 leading-snug">{a.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} /> {a.readTime} read
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {showMoodModal && <MoodModal onClose={() => setShowMoodModal(false)} onSave={handleSaveMood} />}
      <Footer />
    </div>
  );
}
