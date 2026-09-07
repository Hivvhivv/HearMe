import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, User, Settings, LogOut, Menu, X, Phone } from "lucide-react";
import Logo from "./Logo";

const navLinks = [
  { label: "Home", to: "/dashboard" },
  { label: "Psikolog", to: "/psychologists" },
  { label: "Konsultasi", to: "/consultations" },
  { label: "Forum", to: "/forum" },
  { label: "Mind Hub", to: "/mind-hub" },
  { label: "AI Listener", to: "/ai-listener" },
];

export default function DashboardNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("hearme_user") || '{"name":"Inof"}');
  const name = user?.name || "Inof";

  const logout = () => {
    localStorage.removeItem("hearme_auth");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/dashboard">
          <Logo size={28} />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                loc.pathname === l.to
                  ? "text-[#6F3FB5] bg-[#F5EEFC]"
                  : "text-gray-600 hover:text-[#6F3FB5] hover:bg-[#F5EEFC]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/emergency-call"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors"
          >
            <Phone size={13} />
            Emergency
          </Link>

          <button className="relative p-2 text-gray-500 hover:text-[#6F3FB5] hover:bg-[#F5EEFC] rounded-lg transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#6F3FB5] rounded-full" />
          </button>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#F5EEFC] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center text-white text-xs font-bold">
                {name[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700">{name}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden animate-scale-in">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EEFC] transition-colors"
                >
                  <User size={14} /> Profile
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EEFC] transition-colors"
                >
                  <Settings size={14} /> Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <button className="lg:hidden p-2 text-[#6F3FB5]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-purple-100 px-4 py-4 flex flex-col gap-1 animate-fade-in">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                loc.pathname === l.to
                  ? "text-[#6F3FB5] bg-[#F5EEFC]"
                  : "text-gray-600 hover:text-[#6F3FB5]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/emergency-call" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-500">
            <Phone size={14} /> Emergency Call
          </Link>
          <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600">
            <User size={14} /> Profile
          </Link>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-400">
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </header>
  );
}
