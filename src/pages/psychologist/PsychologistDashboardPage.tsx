import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ClipboardList,
  Clock,
  Star,
  Users,
} from "lucide-react";

import PsychologistNavbar from "../../components/PsychologistNavbar";
import Footer from "../../components/Footer";

const API_URL = "http://localhost:5000/api";

type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "none";

interface User {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  verificationStatus?: VerificationStatus;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("none");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =====================================================
  // LOAD USER DARI BACKEND
  // =====================================================

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("hearme_token") ||
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("Token login tidak ditemukan");
        }

        const response = await fetch(
          `${API_URL}/auth/me`,
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
            data?.message || "Gagal mengambil data user"
          );
        }

        const currentUser = data.user;

        setUser(currentUser);

        // Ambil status VERIFIKASI langsung dari database
        setVerificationStatus(
          currentUser?.verificationStatus || "none"
        );

        // Update localStorage agar data lokal juga terbaru
        localStorage.setItem(
          "hearme_user",
          JSON.stringify(currentUser)
        );

        localStorage.setItem(
          "hearme_role",
          currentUser.role || "psychologist"
        );

      } catch (err) {
        console.error("Load user error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data user"
        );

        // Fallback ke localStorage
        try {
          const savedUser = JSON.parse(
            localStorage.getItem("hearme_user") || "null"
          );

          if (savedUser) {
            setUser(savedUser);

            setVerificationStatus(
              savedUser.verificationStatus || "none"
            );
          }
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // =====================================================
  // STATUS
  // =====================================================

  const isApproved =
    verificationStatus === "approved";

  const isPending =
    verificationStatus === "pending";

  const isRejected =
    verificationStatus === "rejected";

  // =====================================================
  // STATUS TEXT
  // =====================================================

  const getStatusText = () => {
    if (isApproved) return "Terverifikasi";

    if (isPending) return "Menunggu Verifikasi";

    if (isRejected) return "Verifikasi Ditolak";

    return "Belum Diverifikasi";
  };

  // =====================================================
  // STATUS DESCRIPTION
  // =====================================================

  const getStatusDescription = () => {
    if (isApproved) {
      return "Akun psikolog kamu sudah terverifikasi";
    }

    if (isPending) {
      return "Dokumen kamu sedang diperiksa oleh admin";
    }

    if (isRejected) {
      return "Silakan periksa alasan penolakan dan kirim ulang";
    }

    return "Silakan lengkapi verifikasi akun psikolog";
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusClass = () => {
    if (isApproved) {
      return "text-green-600";
    }

    if (isPending) {
      return "text-amber-600";
    }

    if (isRejected) {
      return "text-red-600";
    }

    return "text-gray-600";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />

        <main className="max-w-7xl mx-auto px-5 py-10">
          <div className="animate-pulse space-y-6">

            <div className="h-10 w-72 bg-gray-200 rounded-lg" />

            <div className="h-6 w-96 bg-gray-200 rounded-lg" />

            <div className="h-24 w-full bg-gray-200 rounded-2xl" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-40 bg-gray-200 rounded-2xl"
                />
              ))}
            </div>

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8FD]">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <PsychologistNavbar />

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="max-w-7xl mx-auto px-5 py-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-[#111827]">
            Dashboard Psikolog
          </h1>

          <p className="text-gray-500 mt-2">
            Kelola jadwal konsultasimu
          </p>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {/* =================================================
            VERIFICATION STATUS
        ================================================= */}

        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 mb-8">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-4">

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isApproved
                    ? "bg-green-50"
                    : isRejected
                    ? "bg-red-50"
                    : "bg-gray-50"
                }`}
              >
                {isApproved ? (
                  <span className="text-green-600 text-lg">
                    ✓
                  </span>
                ) : (
                  <AlertCircle
                    size={20}
                    className={
                      isRejected
                        ? "text-red-500"
                        : "text-gray-400"
                    }
                  />
                )}
              </div>

              <div>

                <p className="text-sm uppercase tracking-wide text-gray-500">
                  Status Verifikasi
                </p>

                <p
                  className={`text-lg font-semibold ${getStatusClass()}`}
                >
                  {getStatusText()}
                </p>

                <p className="text-sm text-gray-400 mt-0.5">
                  {getStatusDescription()}
                </p>

              </div>

            </div>

            <Link
              to="/psychologist/verification"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#6F3FB5] transition-colors"
            >
              Lihat Detail
              <ArrowRight size={16} />
            </Link>

          </div>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">

          {/* Pending Consultation */}

          <div className="bg-white border border-purple-100 rounded-2xl p-6">

            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-5">
              <ClipboardList
                size={24}
                className="text-amber-500"
              />
            </div>

            <p className="text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Konsultasi Pending
            </p>

          </div>

          {/* Today */}

          <div className="bg-white border border-purple-100 rounded-2xl p-6">

            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-5">
              <Calendar
                size={24}
                className="text-[#6F3FB5]"
              />
            </div>

            <p className="text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Konsultasi Hari Ini
            </p>

          </div>

          {/* Total */}

          <div className="bg-white border border-purple-100 rounded-2xl p-6">

            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
              <Users
                size={24}
                className="text-blue-500"
              />
            </div>

            <p className="text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Total Konsultasi
            </p>

          </div>

          {/* Rating */}

          <div className="bg-white border border-purple-100 rounded-2xl p-6">

            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center mb-5">
              <Star
                size={24}
                className="text-yellow-500"
              />
            </div>

            <p className="text-3xl font-bold text-gray-900">
              4.8
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Rating
            </p>

          </div>

        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* =================================================
              CONSULTATION REQUEST
          ================================================= */}

          <section>

            <div className="flex items-center justify-between mb-5">

              <h2 className="text-2xl font-bold text-gray-900">
                Permintaan Konsultasi
              </h2>

              {isApproved && (
                <Link
                  to="/psychologist/consultations"
                  className="text-sm text-[#6F3FB5] font-medium"
                >
                  Lihat Semua
                </Link>
              )}

            </div>

            <div className="bg-white border border-purple-100 rounded-2xl min-h-[220px] flex items-center justify-center">

              <div className="text-center px-6">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center mb-4">

                  <ClipboardList
                    size={30}
                    className="text-purple-300"
                  />

                </div>

                <h3 className="text-lg font-semibold text-gray-700">
                  Tidak ada permintaan baru
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                  Permintaan konsultasi dari pasien akan muncul di sini
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              UPCOMING SCHEDULE
          ================================================= */}

          <section>

            <div className="flex items-center justify-between mb-5">

              <h2 className="text-2xl font-bold text-gray-900">
                Jadwal Mendatang
              </h2>

              {isApproved && (
                <Link
                  to="/psychologist/upcoming"
                  className="text-sm text-[#6F3FB5] font-medium"
                >
                  Lihat Semua
                </Link>
              )}

            </div>

            <div className="bg-white border border-purple-100 rounded-2xl min-h-[220px] flex items-center justify-center">

              <div className="text-center px-6">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center mb-4">

                  <Calendar
                    size={30}
                    className="text-purple-300"
                  />

                </div>

                <h3 className="text-lg font-semibold text-gray-700">
                  Belum ada jadwal mendatang
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                  Konsultasi yang sudah disetujui akan tampil di sini
                </p>

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            QUICK ACTION
        ================================================= */}

        {isApproved && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">

            <Link
              to="/psychologist/schedule"
              className="bg-white border border-purple-100 rounded-2xl p-5 flex items-center gap-4 hover:border-purple-300 hover:shadow-sm transition-all"
            >

              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">

                <Calendar
                  size={20}
                  className="text-[#6F3FB5]"
                />

              </div>

              <div>

                <p className="font-semibold text-gray-800">
                  Kelola Jadwal
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Atur waktu konsultasi
                </p>

              </div>

            </Link>

            <Link
              to="/psychologist/patients"
              className="bg-white border border-purple-100 rounded-2xl p-5 flex items-center gap-4 hover:border-purple-300 hover:shadow-sm transition-all"
            >

              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">

                <Users
                  size={20}
                  className="text-blue-500"
                />

              </div>

              <div>

                <p className="font-semibold text-gray-800">
                  Pasien
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Lihat daftar pasien
                </p>

              </div>

            </Link>

            <Link
              to="/psychologist/upcoming"
              className="bg-white border border-purple-100 rounded-2xl p-5 flex items-center gap-4 hover:border-purple-300 hover:shadow-sm transition-all"
            >

              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">

                <Clock
                  size={20}
                  className="text-amber-500"
                />

              </div>

              <div>

                <p className="font-semibold text-gray-800">
                  Jadwal Mendatang
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Lihat jadwal konsultasi
                </p>

              </div>

            </Link>

          </div>
        )}

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />

    </div>
  );
}