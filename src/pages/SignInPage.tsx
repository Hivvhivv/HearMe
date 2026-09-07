import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";
import Logo from "../components/Logo";
import { authService } from "../services";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in based on role
  if (authService.isAuthenticated()) {
    const role = authService.getRole();
    if (role === "psychologist") return <Navigate to="/psychologist/dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Mohon isi semua kolom."); return; }
    setLoading(true);
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // LOGIN FLOW: Check user credentials from database.
    // const user = await database.users.findOne({ email, password });
    // ======================================================
    const result = await authService.login(email, password);
    setLoading(false);
    if (result.role === "psychologist") navigate("/psychologist/dashboard");
    else if (result.role === "admin") navigate("/admin/dashboard");
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PublicNavbar />
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 border border-purple-50 p-8">
            <div className="text-center mb-8">
              <Logo size={36} />
              <h1 className="text-2xl font-bold text-gray-900 mt-5">Welcome Back!</h1>
              <p className="text-gray-500 text-sm mt-1">Nice to see you again.</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email atau Username</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5] transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-right mt-1">
                  <button type="button" className="text-xs text-[#6F3FB5] hover:underline">Forgot Password?</button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6F3FB5] hover:bg-purple-800 disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-purple-200"
              >
                {loading ? "Masuk..." : "Sign In"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-purple-100" />
              <span className="text-xs text-gray-400">atau</span>
              <div className="flex-1 h-px bg-purple-100" />
            </div>

            <button className="w-full flex items-center justify-center gap-3 border border-purple-100 hover:bg-[#FAF8FD] py-3 rounded-xl text-sm font-medium text-gray-700 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <Link to="/choose-role" className="text-[#6F3FB5] font-semibold hover:underline">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
