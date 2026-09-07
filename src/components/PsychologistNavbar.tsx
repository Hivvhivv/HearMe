import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, UserCircle, LogOut, Menu, X, MessageSquare, Clock, Lock, ShieldCheck } from "lucide-react";
import Logo from "./Logo";

function getPsychologistVerificationStatus(): "pending" | "approved" | "rejected" | "resubmission" | "none" {
  try {
    const verifications: { status: string; submittedBy?: string }[] = JSON.parse(
      localStorage.getItem("hearme_verifications") || "[]"
    );
    const user = JSON.parse(localStorage.getItem("hearme_user") || "{}");
    const mine = verifications.filter((v) => v.submittedBy === user.name || v.submittedBy === user.email);
    if (mine.length === 0) return "none";
    const last = mine[mine.length - 1];
    return (last.status as "pending" | "approved" | "rejected" | "resubmission") || "pending";
  } catch {
    return "none";
  }
}

const navLinks = [
  { label: "Dashboard", to: "/psychologist/dashboard", icon: LayoutDashboard, requiresVerification: false },
  { label: "Konsultasi", to: "/psychologist/consultations", icon: MessageSquare, requiresVerification: true },
  { label: "Jadwal Mendatang", to: "/psychologist/upcoming", icon: Clock, requiresVerification: true },
  { label: "Pasien", to: "/psychologist/patients", icon: Users, requiresVerification: true },
  { label: "Jadwal", to: "/psychologist/schedule", icon: Calendar, requiresVerification: true },
];

export default function PsychologistNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("hearme_user") || '{"name":"Psikolog"}');
  const name = user?.name || "Psikolog";
  const verificationStatus = getPsychologistVerificationStatus();
  const isApproved = verificationStatus === "approved";

  const logout = () => {
    localStorage.removeItem("hearme_auth");
    localStorage.removeItem("hearme_role");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-indigo-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/psychologist/dashboard" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Psikolog</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => {
            const Icon = l.icon;
            const locked = l.requiresVerification && !isApproved;
            const active = !locked && (loc.pathname === l.to || loc.pathname.startsWith(l.to + "/"));
            if (locked) {
              return (
                <span key={l.to} title="Tersedia setelah verifikasi disetujui"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-gray-300 cursor-not-allowed select-none">
                  <Icon size={15} /> {l.label} <Lock size={11} className="opacity-60" />
                </span>
              );
            }
            return (
              <Link key={l.to} to={l.to}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active ? "text-[#6F3FB5] bg-[#F5EEFC]" : "text-gray-600 hover:text-[#6F3FB5] hover:bg-[#F5EEFC]"
                }`}>
                <Icon size={15} /> {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {!isApproved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <ShieldCheck size={11} /> Belum Terverifikasi
            </span>
          )}
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#F5EEFC] transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-300 to-[#6F3FB5] flex items-center justify-center text-white text-xs font-bold">
                {name[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700">{name}</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden animate-scale-in">
                <Link to="/psychologist/profile" onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EEFC] transition-colors">
                  <UserCircle size={14} /> Profil Saya
                </Link>
                <Link to="/psychologist/verification" onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EEFC] transition-colors">
                  <ShieldCheck size={14} /> Verifikasi
                </Link>
                <button onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
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
          {navLinks.map((l) => {
            const Icon = l.icon;
            const locked = l.requiresVerification && !isApproved;
            if (locked) {
              return (
                <span key={l.to}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-300 cursor-not-allowed select-none">
                  <Icon size={15} /> {l.label} <Lock size={11} />
                </span>
              );
            }
            return (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  loc.pathname === l.to ? "text-[#6F3FB5] bg-[#F5EEFC]" : "text-gray-600 hover:text-[#6F3FB5]"
                }`}>
                <Icon size={15} /> {l.label}
              </Link>
            );
          })}
          <Link to="/psychologist/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600">
            <UserCircle size={15} /> Profil Saya
          </Link>
          <Link to="/psychologist/verification" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600">
            <ShieldCheck size={15} /> Verifikasi
          </Link>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-400">
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </header>
  );
}


