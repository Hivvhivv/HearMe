import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services";
import Logo from "./Logo";

export default function Footer() {
  const navigate = useNavigate();
  const authed = authService.isAuthenticated();

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

        <div className="mt-8 pt-6 border-t border-purple-50 text-center text-xs text-gray-400">
          © 2025 HearMe. Semua hak dilindungi. Dibuat dengan ❤️ untuk kesehatan mental Indonesia.
        </div>
      </div>
    </footer>
  );
}
