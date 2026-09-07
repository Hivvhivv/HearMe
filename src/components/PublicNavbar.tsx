import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const sections = [
  { label: "Home", id: "hero" },
  { label: "About", id: "about" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "Contact", id: "contact" },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const isHome = loc.pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      for (const s of [...sections].reverse()) {
        const el = document.getElementById(s.id);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveId(s.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const scrollTo = (id: string) => {
    setOpen(false);
    if (!isHome) {
      navigate(`/#${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={`sticky top-0 z-50 transition-all ${scrolled || !isHome ? "bg-white/95 backdrop-blur shadow-sm border-b border-purple-50" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => scrollTo("hero")}>
          <Logo />
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isHome && activeId === s.id
                  ? "text-[#6F3FB5] bg-[#F5EEFC]"
                  : "text-gray-600 hover:text-[#6F3FB5] hover:bg-[#F5EEFC]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/sign-in"
            className="text-sm font-semibold text-[#6F3FB5] hover:text-purple-800 px-4 py-2 rounded-xl hover:bg-[#F5EEFC] transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/choose-role"
            className="text-sm font-semibold text-white bg-[#6F3FB5] hover:bg-purple-800 px-5 py-2 rounded-xl shadow-sm shadow-purple-200 transition-colors"
          >
            Get Started
          </Link>
        </div>

        <button className="md:hidden p-2 text-[#6F3FB5]" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-purple-100 px-6 py-4 flex flex-col gap-1 animate-fade-in">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="text-left text-sm font-medium text-gray-700 hover:text-[#6F3FB5] py-2.5 px-2 rounded-lg hover:bg-[#F5EEFC] transition-colors"
            >
              {s.label}
            </button>
          ))}
          <div className="flex gap-3 pt-3 border-t border-purple-50 mt-1">
            <Link to="/sign-in" onClick={() => setOpen(false)} className="flex-1 text-center text-sm font-semibold text-[#6F3FB5] border border-[#6F3FB5] rounded-xl py-2">
              Sign In
            </Link>
            <Link to="/choose-role" onClick={() => setOpen(false)} className="flex-1 text-center text-sm font-semibold text-white bg-[#6F3FB5] rounded-xl py-2">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
