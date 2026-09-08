import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCircle,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Clock,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Logo from "./Logo";
import { verificationAPI } from "../api/verification.api";

type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "none";

const navLinks = [
  {
    label: "Dashboard",
    to: "/psychologist/dashboard",
    icon: LayoutDashboard,
    requiresVerification: false,
  },
  {
    label: "Konsultasi",
    to: "/psychologist/consultations",
    icon: MessageSquare,
    requiresVerification: true,
  },
  {
    label: "Jadwal Mendatang",
    to: "/psychologist/upcoming",
    icon: Clock,
    requiresVerification: true,
  },
  {
    label: "Pasien",
    to: "/psychologist/patients",
    icon: Users,
    requiresVerification: true,
  },
  {
    label: "Jadwal",
    to: "/psychologist/schedule",
    icon: Calendar,
    requiresVerification: true,
  },
];

export default function PsychologistNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("none");

  const loc = useLocation();
  const navigate = useNavigate();

  // ======================================================
  // USER
  // ======================================================

  const savedUser = localStorage.getItem("hearme_user");

  const user = savedUser
    ? JSON.parse(savedUser)
    : {
        name: "Psikolog",
      };

  const name = user?.name || "Psikolog";

  // ======================================================
  // LOAD VERIFICATION STATUS FROM BACKEND / MONGODB
  // ======================================================

  useEffect(() => {
  const loadVerification = async () => {
    try {
      const token =
        localStorage.getItem("hearme_token");

      if (!token) {
        setVerificationStatus("none");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Gagal mengambil status verifikasi"
        );
      }

      const status =
        data.user?.verificationStatus;

      console.log(
        "Verification status from backend:",
        status
      );

      if (
        status === "approved" ||
        status === "pending" ||
        status === "rejected"
      ) {
        setVerificationStatus(status);
      } else {
        setVerificationStatus("none");
      }

      // Update user di localStorage
      if (data.user) {
        localStorage.setItem(
          "hearme_user",
          JSON.stringify(data.user)
        );
      }
    } catch (error) {
      console.error(
        "Failed to load verification status:",
        error
      );

      setVerificationStatus("none");
    }
  };

  loadVerification();
}, []);

  const isApproved =
    verificationStatus === "approved";

  // ======================================================
  // LOGOUT
  // ======================================================

  const logout = () => {
    localStorage.removeItem("hearme_auth");
    localStorage.removeItem("hearme_role");
    localStorage.removeItem("hearme_user");
    localStorage.removeItem("hearme_token");

    navigate("/");
  };

  // ======================================================
  // VERIFICATION LABEL
  // ======================================================

  const getVerificationLabel = () => {
    switch (verificationStatus) {
      case "approved":
        return "Terverifikasi";

      case "pending":
        return "Menunggu Verifikasi";

      case "rejected":
        return "Verifikasi Ditolak";

      default:
        return "Belum Terverifikasi";
    }
  };

  const getVerificationClass = () => {
    switch (verificationStatus) {
      case "approved":
        return "text-green-600 bg-green-50 border-green-200";

      case "pending":
        return "text-amber-600 bg-amber-50 border-amber-200";

      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";

      default:
        return "text-amber-600 bg-amber-50 border-amber-200";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-indigo-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* ======================================================
            LOGO
        ====================================================== */}

        <Link
          to="/psychologist/dashboard"
          className="flex items-center gap-2"
        >
          <Logo size={28} />

          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Psikolog
          </span>
        </Link>

        {/* ======================================================
            DESKTOP NAVIGATION
        ====================================================== */}

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => {
            const Icon = l.icon;

            const locked =
              l.requiresVerification && !isApproved;

            const active =
              !locked &&
              (
                loc.pathname === l.to ||
                loc.pathname.startsWith(l.to + "/")
              );

            // --------------------------------------------------
            // LOCKED MENU
            // --------------------------------------------------

            if (locked) {
              return (
                <span
                  key={l.to}
                  title="Tersedia setelah verifikasi disetujui"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-gray-300 cursor-not-allowed select-none"
                >
                  <Icon size={15} />

                  {l.label}

                  <Lock
                    size={11}
                    className="opacity-60"
                  />
                </span>
              );
            }

            // --------------------------------------------------
            // ACTIVE / NORMAL MENU
            // --------------------------------------------------

            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? "text-[#6F3FB5] bg-[#F5EEFC]"
                    : "text-gray-600 hover:text-[#6F3FB5] hover:bg-[#F5EEFC]"
                }`}
              >
                <Icon size={15} />

                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* ======================================================
            DESKTOP RIGHT SIDE
        ====================================================== */}

        <div className="hidden lg:flex items-center gap-2">

          {/* VERIFICATION STATUS */}

          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${getVerificationClass()}`}
          >
            <ShieldCheck size={11} />

            {getVerificationLabel()}
          </span>

          {/* PROFILE DROPDOWN */}

          <div className="relative">

            <button
              onClick={() =>
                setDropdownOpen(!dropdownOpen)
              }
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#F5EEFC] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-300 to-[#6F3FB5] flex items-center justify-center text-white text-xs font-bold">
                {name[0]?.toUpperCase()}
              </div>

              <span className="text-sm font-semibold text-gray-700">
                {name}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden animate-scale-in">

                {/* PROFILE */}

                <Link
                  to="/psychologist/profile"
                  onClick={() =>
                    setDropdownOpen(false)
                  }
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EEFC] transition-colors"
                >
                  <UserCircle size={14} />

                  Profil Saya
                </Link>

                {/* VERIFICATION */}

                <Link
                  to="/psychologist/verification"
                  onClick={() =>
                    setDropdownOpen(false)
                  }
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EEFC] transition-colors"
                >
                  <ShieldCheck size={14} />

                  Verifikasi
                </Link>

                {/* LOGOUT */}

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />

                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================
            MOBILE BUTTON
        ====================================================== */}

        <button
          className="lg:hidden p-2 text-[#6F3FB5]"
          onClick={() =>
            setMobileOpen(!mobileOpen)
          }
        >
          {mobileOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </div>

      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-purple-100 px-4 py-4 flex flex-col gap-1 animate-fade-in">

          {/* STATUS */}

          <div
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg border mb-2 ${getVerificationClass()}`}
          >
            <ShieldCheck size={15} />

            {getVerificationLabel()}
          </div>

          {/* NAV LINKS */}

          {navLinks.map((l) => {
            const Icon = l.icon;

            const locked =
              l.requiresVerification && !isApproved;

            // LOCKED

            if (locked) {
              return (
                <span
                  key={l.to}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-300 cursor-not-allowed select-none"
                >
                  <Icon size={15} />

                  {l.label}

                  <Lock size={11} />
                </span>
              );
            }

            // NORMAL

            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() =>
                  setMobileOpen(false)
                }
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  loc.pathname === l.to
                    ? "text-[#6F3FB5] bg-[#F5EEFC]"
                    : "text-gray-600 hover:text-[#6F3FB5]"
                }`}
              >
                <Icon size={15} />

                {l.label}
              </Link>
            );
          })}

          {/* PROFILE */}

          <Link
            to="/psychologist/profile"
            onClick={() =>
              setMobileOpen(false)
            }
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600"
          >
            <UserCircle size={15} />

            Profil Saya
          </Link>

          {/* VERIFICATION */}

          <Link
            to="/psychologist/verification"
            onClick={() =>
              setMobileOpen(false)
            }
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600"
          >
            <ShieldCheck size={15} />

            Verifikasi
          </Link>

          {/* LOGOUT */}

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-400"
          >
            <LogOut size={14} />

            Logout
          </button>
        </div>
      )}
    </header>
  );
}