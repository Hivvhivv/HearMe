import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, Brain } from "lucide-react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("hearme_admin_session");
    if (session) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    if (username === "admin@hearme.id" && password === "admin123") {
      localStorage.setItem(
        "hearme_admin_session",
        JSON.stringify({ role: "admin", name: "Admin HearMe" })
      );
      navigate("/admin/dashboard");
    } else {
      setError("Username atau password salah.");
    }
    setLoading(false);
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
                  placeholder="admin@hearme.id"
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

          {/* Demo credentials */}
          <div
            className="mt-6 p-3 rounded-lg border text-xs"
            style={{
              background: "#FAF8FD",
              borderColor: "#C9A9E9",
              color: "#6F3FB5",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>Email: admin@hearme.id</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
