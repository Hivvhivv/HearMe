import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import Logo from "../components/Logo";
import { authAPI } from "../api/auth.api";

// Halaman tujuan tautan di email reset password:
// /reset-password?token=...
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengubah password. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-10 pr-10 py-3 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5] transition-colors";

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PublicNavbar />

      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 border border-purple-50 p-8">
            {done ? (
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <CheckCircle2 size={26} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mt-5">Password diubah</h1>

                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  Password barumu sudah aktif. Semua perangkat yang sebelumnya login
                  sudah dikeluarkan.
                </p>

                <Link
                  to="/sign-in"
                  className="mt-6 inline-block w-full bg-[#6F3FB5] hover:bg-purple-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Login sekarang
                </Link>
              </div>
            ) : !token ? (
              <div className="text-center">
                <Logo size={36} />

                <h1 className="text-2xl font-bold text-gray-900 mt-5">Tautan tidak lengkap</h1>

                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  Buka tautan dari email reset password, atau minta tautan baru.
                </p>

                <Link
                  to="/forgot-password"
                  className="mt-6 inline-block w-full bg-[#6F3FB5] hover:bg-purple-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Minta tautan baru
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <Logo size={36} />

                  <h1 className="text-2xl font-bold text-gray-900 mt-5">Buat password baru</h1>

                  <p className="text-gray-500 text-sm mt-1">Minimal 8 karakter.</p>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-fade-in">
                    {error}{" "}
                    {/kedaluwarsa|tidak valid/i.test(error) && (
                      <Link to="/forgot-password" className="font-semibold underline">
                        Minta tautan baru
                      </Link>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="reset-password"
                      className="block text-xs font-semibold text-gray-600 mb-1.5"
                    >
                      Password baru
                    </label>

                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        id="reset-password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        autoFocus
                        className={inputClass}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reset-confirm"
                      className="block text-xs font-semibold text-gray-600 mb-1.5"
                    >
                      Ulangi password baru
                    </label>

                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        id="reset-confirm"
                        type={showPw ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => {
                          setConfirm(e.target.value);
                          setError("");
                        }}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#6F3FB5] hover:bg-purple-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    {loading ? "Menyimpan..." : "Simpan password baru"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
