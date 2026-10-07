import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bot,
  Clock,
  HeartHandshake,
  Lock,
  NotebookPen,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import Logo from "../components/Logo";
import AvatarPicker from "../components/AvatarPicker";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../api/user.api";
import { WELCOME_SKIP_KEY, type AvatarChoice } from "../lib/avatars";

// ======================================================
// WELCOME / ONBOARDING
// ======================================================
//
// Ditampilkan setelah login untuk user yang BELUM punya
// avatar (lihat SignInPage). Tiga langkah: kenalan dengan
// HearMe, alasan memilih HearMe, lalu memilih avatar.
//
// "Lewati" hanya menyembunyikan halaman ini selama sesi
// browser berjalan; login berikutnya akan muncul lagi
// sampai avatar dipilih.
//
// ======================================================

const FEATURES = [
  { icon: Bot, title: "AI Listener", desc: "Teman cerita yang siap mendengar kapan saja." },
  { icon: Stethoscope, title: "Konsultasi", desc: "Ngobrol langsung dengan psikolog profesional." },
  { icon: NotebookPen, title: "Mood Journal", desc: "Catat perasaanmu dan lihat polanya." },
  { icon: Users, title: "Forum", desc: "Berbagi cerita dengan komunitas, bisa anonim." },
];

const REASONS = [
  { icon: Lock, title: "Privasimu terjaga", desc: "Jurnal dan konsultasimu hanya untukmu. Di forum, kamu bisa tampil anonim." },
  { icon: BadgeCheck, title: "Psikolog terverifikasi", desc: "Setiap psikolog melewati verifikasi dokumen sebelum bisa membuka sesi." },
  { icon: Clock, title: "Ada kapan pun", desc: "AI Listener dan konten self-care bisa diakses 24 jam, tanpa antre." },
  { icon: HeartHandshake, title: "Tanpa menghakimi", desc: "Ruang aman untuk merasa apa pun, sekecil apa pun ceritamu." },
];

const STEPS = ["Apa itu HearMe?", "Kenapa HearMe?", "Atur profilmu"];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user, reload } = useAuth();

  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<AvatarChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const name = (user?.name as string) || (user?.username as string) || "";
  const firstName = name.split(" ")[0];

  const skip = () => {
    try {
      sessionStorage.setItem(WELCOME_SKIP_KEY, "1");
    } catch {
      // Storage diblokir: cukup lanjut ke dashboard.
    }
    navigate("/dashboard", { replace: true });
  };

  const finish = async () => {
    if (!choice) return;

    setSaving(true);
    setError("");

    try {
      await userAPI.updateAvatar(choice);
      // Perbarui state auth supaya navbar langsung memakai avatar baru.
      await reload();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan avatar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EEFC] via-white to-white flex flex-col">
      {/* Header */}
      <div className="max-w-3xl w-full mx-auto px-6 pt-6 flex items-center justify-between">
        <Logo />
        <button
          onClick={skip}
          className="text-sm font-medium text-gray-400 hover:text-[#6F3FB5] transition-colors"
        >
          Lewati
        </button>
      </div>

      {/* Progress */}
      <div className="max-w-3xl w-full mx-auto px-6 mt-8">
        <div className="flex gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= step ? "bg-[#6F3FB5]" : "bg-purple-100"
                }`}
              />
              <p
                className={`hidden sm:block mt-2 text-xs font-medium ${
                  i === step ? "text-[#6F3FB5]" : "text-gray-400"
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        {step === 0 && (
          <div key="what" className="animate-fade-in text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-100 text-xs font-semibold text-[#6F3FB5]">
              <Sparkles size={14} /> Selamat datang{firstName ? `, ${firstName}` : ""}!
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">
              Apa itu <span className="text-[#6F3FB5]">HearMe</span>?
            </h1>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto leading-relaxed">
              HearMe adalah teman bicara di genggamanmu: satu tempat untuk memahami
              perasaan, merawat diri, dan mendapat bantuan profesional saat kamu
              membutuhkannya.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#F5EEFC] text-[#6F3FB5] flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div key="why" className="animate-fade-in text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Kenapa memilih <span className="text-[#6F3FB5]">HearMe</span>?
            </h1>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto leading-relaxed">
              Kesehatan mental itu penting, dan kamu berhak mendapat ruang yang
              aman untuk merawatnya.
            </p>

            <div className="mt-10 space-y-3 text-left max-w-xl mx-auto">
              {REASONS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl border border-purple-50 shadow-sm p-5 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] text-white flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div key="setup" className="animate-fade-in text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Atur profilmu
            </h1>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto leading-relaxed">
              Pilih avatar yang paling menggambarkan dirimu, atau unggah fotomu
              sendiri. Kamu bisa menggantinya kapan saja di halaman Profil.
            </p>

            <div className="mt-8 bg-white rounded-3xl border border-purple-50 shadow-sm p-6 sm:p-8 max-w-md mx-auto">
              <AvatarPicker name={name} value={choice} onChange={setChoice} />
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="max-w-3xl w-full mx-auto px-6 pb-10 flex items-center justify-between gap-3">
        <button
          onClick={() => setStep((s) => s - 1)}
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-[#F5EEFC] transition-colors ${
            step === 0 ? "invisible" : ""
          }`}
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-2 bg-[#6F3FB5] text-white font-semibold px-6 py-3 rounded-xl hover:bg-purple-800 transition-colors text-sm"
          >
            Lanjut <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={!choice || saving}
            className="inline-flex items-center gap-2 bg-[#6F3FB5] text-white font-semibold px-6 py-3 rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Simpan & Mulai"}
            {!saving && <ArrowRight size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
