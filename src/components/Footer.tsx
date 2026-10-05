import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Logo from "./Logo";

export default function Footer() {
  const navigate = useNavigate();

  // Dari context, bukan membaca localStorage langsung.
  // Pembacaan langsung tidak reaktif: status login
  // dipastikan ke backend secara asinkron, jadi nilainya
  // belum siap pada render pertama.
  const { isAuthenticated: authed, role } = useAuth();

  /*
   * Pintasan admin.
   *
   * Kalau yang membuka memang admin, langsung ke dashboard.
   * Kalau bukan, ke halaman login admin -- dan halaman itu
   * sendiri sudah memindahkan admin yang sudah login ke
   * dashboard, jadi tidak ada jalan buntu dari arah mana pun.
   *
   * Ini murni pintasan tampilan. Yang menentukan boleh atau
   * tidaknya tetap AdminRoute (role dari /api/users/me) dan
   * authorize("admin","super_admin") di backend. Jadi link
   * ini terlihat oleh siapa saja tanpa membuka apa pun:
   * menekannya sebagai non-admin hanya berujung di form
   * login yang akan menolak.
   */
  const isAdmin = role === "admin" || role === "super_admin";

  const adminTo = isAdmin ? "/admin/dashboard" : "/admin/login";
  const adminLabel = isAdmin ? "Dashboard Admin" : "Login Admin";

  const featureLinks: { label: string; to: string }[] = [
    { label: "AI Listener", to: "/ai-listener" },
    { label: "Consultation", to: "/consultations" },
    { label: "Mood Journal", to: "/journal" },
    { label: "Mind Hub", to: "/mind-hub" },
    { label: "Forum", to: "/forum" },
  ];

  const handleFeature = (to: string) => {
    if (!authed) {
      alert("Silakan login terlebih dahulu untuk mengakses fitur ini.");
      navigate("/sign-in");
      return;
    }
    navigate(to);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else navigate(`/#${id}`);
  };

  return (
    <footer className="bg-white border-t border-purple-100 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Teman bicara di genggamanmu, kapan pun dan di mana pun.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Produk</h4>
            <ul className="space-y-2">
              {featureLinks.map((l) => (
                <li key={l.to}>
                  <button
                    onClick={() => handleFeature(l.to)}
                    className="text-sm text-gray-500 hover:text-[#6F3FB5] transition-colors text-left"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Perusahaan</h4>
            <ul className="space-y-2">
              <li><button onClick={() => scrollTo("about")} className="text-sm text-gray-500 hover:text-[#6F3FB5] transition-colors">About</button></li>
              <li><button onClick={() => scrollTo("contact")} className="text-sm text-gray-500 hover:text-[#6F3FB5] transition-colors">Contact</button></li>
              <li><Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-[#6F3FB5] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-500 hover:text-[#6F3FB5] transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Dukungan</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Hotline Krisis: <span className="font-semibold text-gray-700">119 ext 8</span></li>
              <li>
                <a href="mailto:support@hearme.com" className="hover:text-[#6F3FB5] transition-colors">
                  support@hearme.com
                </a>
              </li>
              <li>
                <a href="tel:+6281234567890" className="hover:text-[#6F3FB5] transition-colors">
                  +62 812 3456 7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-purple-50 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            © 2025 HearMe. Semua hak dilindungi. Dibuat dengan ❤️ untuk kesehatan mental Indonesia.
          </p>

          <Link
            to={adminTo}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#6F3FB5] transition-colors shrink-0"
            title={
              isAdmin
                ? "Buka dashboard admin"
                : "Masuk sebagai admin HearMe"
            }
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {adminLabel}
          </Link>
        </div>
      </div>
    </footer>
  );
}
