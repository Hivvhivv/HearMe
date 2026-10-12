import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import Logo from "../components/Logo";
import { authAPI } from "../api/auth.api";

// Minta tautan reset password. Dipakai semua role
// (user, psikolog, admin).
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Mohon isi email kamu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengirim permintaan. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PublicNavbar />

      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 border border-purple-50 p-8">
            {sent ? (
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#F5EEFC] text-[#6F3FB5] flex items-center justify-center">
                  <MailCheck size={26} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mt-5">Cek email kamu</h1>

                {/* Sengaja tidak memastikan emailnya terdaftar:
                    backend membalas sama untuk keduanya. */}
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  Kalau <span className="font-semibold text-gray-700">{email.trim()}</span> terdaftar
                  di HearMe, kami sudah mengirim tautan untuk membuat password baru.
                  Tautannya berlaku 30 menit.
                </p>

                <p className="text-gray-400 text-xs mt-4">
                  Belum masuk? Cek folder spam, atau coba lagi setelah 1 menit.
                </p>

                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-6 text-sm font-semibold text-[#6F3FB5] hover:underline"
                >
                  Pakai email lain
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <Logo size={36} />

                  <h1 className="text-2xl font-bold text-gray-900 mt-5">Lupa password?</h1>

                  <p className="text-gray-500 text-sm mt-1">
                    Masukkan email akunmu. Kami akan mengirim tautan untuk membuat password baru.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-fade-in">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-semibold text-gray-600 mb-1.5"
                    >
                      Email
                    </label>

                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="email@contoh.com"
                        autoComplete="email"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#6F3FB5] hover:bg-purple-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    {loading ? "Mengirim..." : "Kirim tautan reset"}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#6F3FB5] transition-colors"
              >
                <ArrowLeft size={14} /> Kembali ke login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
