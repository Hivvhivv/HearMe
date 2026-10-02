import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, Brain } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

// ======================================================
// ADMIN LOGIN
// ======================================================
//
// Sebelumnya halaman ini mencocokkan email dan password
// HARDCODE di JavaScript frontend, lalu menulis
// localStorage "hearme_admin_session" sebagai tanda
// "sudah jadi admin".
//
// Dua masalah fatalnya:
//
//   1. Kredensial itu ikut ter-bundle ke dist/ dan bisa
//      dibaca siapa pun yang membuka source.
//   2. Tanpa backend sama sekali, cukup mengisi
//      localStorage sendiri untuk menjadi admin.
//
// Sekarang login admin memakai endpoint yang sama dengan
// login biasa (POST /api/auth/login), dan status admin
// ditentukan oleh ROLE DI DATABASE.
//
// ======================================================

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const {
    login,
    loading: authLoading,
    isAuthenticated,
    role,
    logout,
  } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Kalau sudah login sebagai admin, langsung masuk.
  useEffect(() => {
    if (authLoading) return;

    if (
      isAuthenticated &&
      (role === "admin" || role === "super_admin")
    ) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(username.trim(), password);

      // Role diverifikasi dari data server, bukan dari form.
      if (user.role !== "admin" && user.role !== "super_admin") {
        // Bukan admin: akhiri session supaya tidak ada
        // akun biasa yang "menggantung" di area admin.
        await logout();

        setError("Akun ini tidak memiliki akses admin.");
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Email atau password salah."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#FAF8FD" }}
    >
      <div className="w-full max-w-md px-4">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md"
            style={{ background: "#6F3FB5" }}
          >
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#6F3FB5" }}
          >
            HearMe
          </h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2
            className="text-xl font-semibold text-gray-800 mb-1"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Masuk sebagai Admin
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Akses terbatas untuk administrator resmi HearMe.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Admin
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="email@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = "0 0 0 2px #6F3FB540")
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = "0 0 0 2px #6F3FB540")
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#6F3FB5", fontFamily: "Inter, sans-serif" }}
            >
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          {/* Blok "Demo Credentials" DIHAPUS.
              Sebelumnya email dan password admin tercetak
              langsung di halaman dan ikut ter-bundle ke
              dist/, sehingga bisa dibaca siapa pun. */}
          <p
            className="mt-6 text-xs text-center"
            style={{
              color: "#6F3FB5",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Gunakan akun admin terdaftar. Akses ditentukan oleh
            role pada database.
          </p>
        </div>
      </div>
    </div>
  );
}
