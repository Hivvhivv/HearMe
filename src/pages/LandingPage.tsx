import { useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Smile, BookOpen, Users, Headphones, Library, Phone, Star, ArrowRight, Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";

const features = [
  { icon: Headphones, title: "AI Listener", desc: "Curhat kapan saja dengan AI yang memahami perasaanmu.", color: "#8B5CF6" },
  { icon: Smile, title: "Mood Tracking", desc: "Pantau suasana hati harianmu dan temukan pola emosi.", color: "#EC4899" },
  { icon: BookOpen, title: "Journaling", desc: "Tuangkan pikiran dan perasaan dalam jurnal pribadi yang aman.", color: "#3B82F6" },
  { icon: Users, title: "Konsultasi Psikolog", desc: "Terhubung dengan psikolog berpengalaman dan tersertifikasi.", color: "#10B981" },
  { icon: Brain, title: "Forum Komunitas", desc: "Bergabung dengan komunitas yang saling mendukung.", color: "#F59E0B" },
  { icon: Library, title: "Mind Hub", desc: "Akses konten perawatan diri, meditasi, dan tips kesehatan mental.", color: "#6F3FB5" },
  { icon: Phone, title: "Emergency Call", desc: "Akses cepat ke hotline krisis 24 jam ketika kamu butuh bantuan segera.", color: "#EF4444" },
];

const steps = [
  { step: "01", title: "Daftar & Buat Profil", desc: "Buat akun gratis dan ceritakan sedikit tentang dirimu." },
  { step: "02", title: "Mulai Ekspresi", desc: "Catat mood, tulis jurnal, atau chat dengan AI Listener." },
  { step: "03", title: "Dapatkan Dukungan", desc: "Konsultasi dengan psikolog atau gabung forum komunitas." },
  { step: "04", title: "Tumbuh Bersama", desc: "Pantau perkembanganmu dan jadikan kesehatan mental prioritas." },
];

const contactInfo = [
  { icon: Mail, label: "Email", value: "support@hearme.com", href: "mailto:support@hearme.com" },
  { icon: Phone, label: "Telepon", value: "+62 812 3456 7890", href: "tel:+6281234567890" },
  { icon: MapPin, label: "Lokasi", value: "Jakarta, Indonesia", href: null },
  { icon: Clock, label: "Jam Operasional", value: "Senin–Jumat, 08:00–17:00 WIB", href: null },
];

export default function LandingPage() {
  const [contact, setContact] = useState({ name: "", email: "", subject: "", message: "" });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [contactSent, setContactSent] = useState(false);

  const setC = (k: string, v: string) => setContact((c) => ({ ...c, [k]: v }));

  const sendContact = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!contact.name) errs.name = "Nama wajib diisi";
    if (!contact.email || !/\S+@\S+\.\S+/.test(contact.email)) errs.email = "Email tidak valid";
    if (!contact.subject) errs.subject = "Subjek wajib diisi";
    if (!contact.message) errs.message = "Pesan wajib diisi";
    setContactErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setContactSent(true);
    setContact({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setContactSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PublicNavbar />

      {/* HERO */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-0 right-0 w-1/2 h-full opacity-25" viewBox="0 0 600 600" fill="none">
            <circle cx="500" cy="100" r="300" fill="#C9A9E9" />
            <circle cx="400" cy="400" r="200" fill="#6F3FB5" fillOpacity={0.2} />
          </svg>
          <svg className="absolute bottom-0 left-0 w-64 h-64 opacity-20" viewBox="0 0 200 200" fill="none">
            <circle cx="0" cy="200" r="180" fill="#C9A9E9" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-[#F5EEFC] text-[#6F3FB5] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star size={12} fill="currentColor" /> Kesehatan Mental untuk Semua
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Teman Bicara di<br />
              <span className="text-[#6F3FB5]">GENGGAMANMU</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Curhat tanpa takut dihakimi,<br />kapan pun dan di mana pun.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/choose-role" className="inline-flex items-center gap-2 bg-[#6F3FB5] hover:bg-purple-800 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5">
                Get Started <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 bg-white hover:bg-[#F5EEFC] text-[#6F3FB5] font-semibold px-6 py-3 rounded-2xl border border-purple-200 transition-colors"
              >
                See How It Works
              </button>
            </div>
            <div className="flex items-center gap-6 mt-10">
              {[["50k+", "Pengguna Aktif"], ["100+", "Psikolog Terverifikasi"], ["4.9★", "Rating App"]].map(([v, l]) => (
                <div key={l} className="text-center">
                  <div className="text-2xl font-bold text-[#6F3FB5]">{v}</div>
                  <div className="text-xs text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center animate-float">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F5EEFC] to-[#C9A9E9] opacity-60" />
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=500&fit=crop&auto=format"
                alt="Dua orang berbicara dengan hangat"
                className="relative w-full h-full object-cover rounded-3xl shadow-2xl shadow-purple-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <img
              src="https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=600&h=400&fit=crop&auto=format"
              alt="Suasana tenang dan damai"
              className="rounded-3xl shadow-xl shadow-purple-100 w-full h-72 object-cover"
            />
            <div>
              <div className="inline-block bg-[#F5EEFC] text-[#6F3FB5] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">Tentang HearMe</div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Apa itu HearMe?</h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                HearMe adalah platform kesehatan mental digital yang hadir untuk mendampingi perjalanan emosionalmu. Kami memahami bahwa tidak semua orang bisa langsung berkonsultasi dengan profesional — itulah mengapa kami hadir 24/7.
              </p>
              <p className="text-gray-500 leading-relaxed mb-6">
                HearMe adalah aplikasi yang mendukung pengguna dalam mengelola kesehatan mental melalui pelacak suasana hati, jurnal digital, dan perpustakaan konten perawatan diri — sebuah langkah strategis untuk masyarakat Indonesia yang lebih sehat secara mental.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[["💜", "Empati"], ["🔒", "Aman & Privat"], ["🌱", "Berbasis Bukti"]].map(([e, t]) => (
                  <div key={t} className="bg-[#FAF8FD] rounded-2xl p-3 text-center border border-purple-50">
                    <div className="text-2xl mb-1">{e}</div>
                    <div className="text-xs font-semibold text-gray-700">{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-[#FAF8FD]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#F5EEFC] text-[#6F3FB5] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">Cara Kerja</div>
            <h2 className="text-4xl font-bold text-gray-900">Bagaimana HearMe Bekerja?</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-purple-50">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-200 to-transparent z-10" style={{ width: "calc(100% - 1.5rem)", left: "calc(100% - 1.5rem)" }} />
                )}
                <div className="text-4xl font-black text-[#F5EEFC] mb-3" style={{ WebkitTextStroke: "1px #C9A9E9" }}>{s.step}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#F5EEFC] text-[#6F3FB5] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">Fitur Unggulan</div>
            <h2 className="text-4xl font-bold text-gray-900">Semua yang Kamu Butuhkan</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">Satu platform lengkap untuk perjalanan kesehatan mentalmu</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group bg-[#FAF8FD] hover:bg-white rounded-2xl p-6 border border-purple-50 hover:border-purple-200 hover:shadow-lg transition-all cursor-pointer">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: f.color + "20" }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY HEARME */}
      <section className="py-20 bg-[#FAF8FD]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Mengapa Pilih HearMe?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "🔐", title: "Privasi Terjaga", desc: "Data dan ceritamu sepenuhnya aman. Kami tidak pernah menjual data pribadi pengguna." },
              { emoji: "🤝", title: "Psikolog Terverifikasi", desc: "Semua psikolog melalui proses verifikasi ketat dan memiliki lisensi resmi dari pemerintah." },
              { emoji: "💡", title: "Berbasis Sains", desc: "Metode dan konten kami dikembangkan berdasarkan penelitian psikologi terkini." },
              { emoji: "🌙", title: "Tersedia 24/7", desc: "AI Listener dan konten Mind Hub tersedia kapan pun kamu membutuhkan dukungan." },
              { emoji: "💰", title: "Terjangkau", desc: "Mulai dari gratis. Konsultasi dengan psikolog dengan harga yang dapat dijangkau semua kalangan." },
              { emoji: "🇮🇩", title: "Untuk Indonesia", desc: "Dibangun khusus untuk memahami konteks budaya dan kebutuhan masyarakat Indonesia." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-purple-50 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#F5EEFC] text-[#6F3FB5] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">Kontak</div>
            <h2 className="text-4xl font-bold text-gray-900">Hubungi Kami</h2>
            <p className="text-gray-500 mt-2">Punya pertanyaan? Kami siap membantu.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Informasi Kontak</h3>
              <div className="space-y-4 mb-8">
                {contactInfo.map((c) => (
                  <div key={c.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F5EEFC] flex items-center justify-center flex-shrink-0">
                      <c.icon size={18} className="text-[#6F3FB5]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{c.label}</div>
                      {c.href ? (
                        <a href={c.href} className="text-sm font-semibold text-gray-800 hover:text-[#6F3FB5] transition-colors">{c.value}</a>
                      ) : (
                        <div className="text-sm font-semibold text-gray-800">{c.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-br from-[#6F3FB5] to-[#8B5CF6] rounded-2xl p-6 text-white">
                <h4 className="font-bold mb-2">Hotline Kesehatan Mental</h4>
                <p className="text-purple-200 text-sm mb-3">Jika kamu dalam krisis atau butuh bantuan segera:</p>
                <div className="text-2xl font-bold">119 ext 8</div>
                <div className="text-purple-200 text-xs mt-1">Tersedia 24 jam / 7 hari</div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Kirim Pesan</h3>
              {contactSent ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center animate-scale-in">
                  <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                  <h4 className="font-bold text-gray-900">Pesan Terkirim!</h4>
                  <p className="text-sm text-gray-500 mt-1">Tim kami akan menghubungimu dalam 1-2 hari kerja.</p>
                </div>
              ) : (
                <form onSubmit={sendContact} className="space-y-4">
                  {[
                    { label: "Full Name", k: "name", placeholder: "Nama lengkap kamu" },
                    { label: "Email", k: "email", placeholder: "email@contoh.com", type: "email" },
                    { label: "Subject", k: "subject", placeholder: "Tentang apa?" },
                  ].map(({ label, k, placeholder, type = "text" }) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                      <input
                        type={type}
                        value={contact[k as keyof typeof contact]}
                        onChange={(e) => setC(k, e.target.value)}
                        placeholder={placeholder}
                        className={`w-full px-4 py-3 bg-[#FAF8FD] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/20 transition-colors ${contactErrors[k] ? "border-red-300" : "border-purple-100 focus:border-[#6F3FB5]"}`}
                      />
                      {contactErrors[k] && <p className="text-xs text-red-500 mt-1">{contactErrors[k]}</p>}
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
                    <textarea
                      value={contact.message}
                      onChange={(e) => setC("message", e.target.value)}
                      placeholder="Tulis pesanmu di sini..."
                      rows={4}
                      className={`w-full px-4 py-3 bg-[#FAF8FD] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/20 resize-none transition-colors ${contactErrors.message ? "border-red-300" : "border-purple-100 focus:border-[#6F3FB5]"}`}
                    />
                    {contactErrors.message && <p className="text-xs text-red-500 mt-1">{contactErrors.message}</p>}
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#6F3FB5] hover:bg-purple-800 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-purple-200">
                    <Send size={16} /> Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-[#6F3FB5] to-[#8B5CF6]">
        <div className="max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Mulai Perjalananmu Hari Ini</h2>
          <p className="text-purple-200 mb-8 text-lg">Bergabung dengan ribuan pengguna yang telah merasakan manfaat HearMe.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/choose-role" className="bg-white text-[#6F3FB5] font-bold px-8 py-3 rounded-2xl hover:bg-purple-50 transition-colors shadow-lg">
              Daftar Gratis
            </Link>
            <Link to="/sign-in" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-2xl border border-white/30 transition-colors">
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
