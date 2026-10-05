import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import SplashScreen from "./pages/SplashScreen";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import SignInPage from "./pages/SignInPage";
import ChooseRolePage from "./pages/ChooseRolePage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import PsychologistsPage from "./pages/PsychologistsPage";
import PsychologistDetailPage from "./pages/PsychologistDetailPage";
import BookingPage from "./pages/BookingPage";
import ConsultationsPage from "./pages/ConsultationsPage";
import ConsultationChatPage from "./pages/ConsultationChatPage";
import ForumPage from "./pages/ForumPage";
import JournalPage from "./pages/JournalPage";
import MindHubPage from "./pages/MindHubPage";
import MindHubDetailPage from "./pages/MindHubDetailPage";
import AIListenerPage from "./pages/AIListenerPage";
import ProfilePage from "./pages/ProfilePage";
import EmergencyCallPage from "./pages/EmergencyCallPage";
import ArticlePage from "./pages/ArticlePage";
import NotificationsPage from "./pages/NotificationsPage";
import ForumProfilePage from "./pages/ForumProfilePage";
import PaymentPage from "./pages/PaymentPage";
import VoiceAIPage from "./pages/VoiceAIPage";
import VideoCallPage from "./pages/VideoCallPage";
import PsychologistDashboardPage from "./pages/psychologist/PsychologistDashboardPage";
import PsychologistVerificationPage from "./pages/psychologist/PsychologistVerificationPage";
import PsychologistPatientsPage from "./pages/psychologist/PsychologistPatientsPage";
import PsychologistSchedulePage from "./pages/psychologist/PsychologistSchedulePage";
import PsychologistConsultationRoomPage from "./pages/psychologist/PsychologistConsultationRoomPage";
import PsychologistChatPage from "./pages/psychologist/PsychologistChatPage";
import PsychologistConsultationsPage from "./pages/psychologist/PsychologistConsultationsPage";
import PsychologistUpcomingPage from "./pages/psychologist/PsychologistUpcomingPage";
import PsychologistProfilePage from "./pages/psychologist/PsychologistProfilePage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminForumPage from "./pages/admin/AdminForumPage";
import AdminVerificationPage from "./pages/admin/AdminVerificationPage";
import AdminMindHubPage from "./pages/admin/AdminMindHubPage";
import AdminForumModerationPage from "./pages/admin/AdminForumModerationPage";

// ======================================================
// ## RBAC — Role Based Access Control ##
// USER → /dashboard
// PSYCHOLOGIST → /psychologist/dashboard
// ADMIN → /admin/dashboard
// ======================================================

// ======================================================
// LOADING SAAT SESSION DIPERIKSA
// ======================================================
//
// Selama pengecekan session ke backend, JANGAN render
// halaman protected. Tanpa ini, halaman protected sempat
// tampil sekejap sebelum redirect -- dan data user lama
// bisa terlihat.
//
// ======================================================

function AuthLoading() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-[#6F3FB5] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Memeriksa sesi...</p>
      </div>
    </div>
  );
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  if (role === "psychologist") return <Navigate to="/psychologist/dashboard" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
}

// getPsychVerificationStatus() DIHAPUS.
//
// Fungsi itu membaca localStorage "hearme_verifications"
// dan mencocokkan dengan NAMA user — artinya seorang
// psikolog bisa meloloskan dirinya sendiri hanya dengan
// menulis status "approved" ke localStorage dari console.
//
// Status verifikasi sekarang hanya datang dari DATABASE
// lewat AuthContext (GET /api/users/me), dan backend juga
// memeriksanya ulang di setiap endpoint psikolog.

function PsychologistRoute({ children, requiresVerification = false }: { children: React.ReactNode; requiresVerification?: boolean }) {
  const { loading, isAuthenticated, role, user } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  if (role === "user") return <Navigate to="/dashboard" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;

  if (requiresVerification) {
    // Status verifikasi HANYA dari server (lewat context),
    // tanpa cadangan localStorage. Guard ini sekadar lapisan
    // UI — endpoint psikolog di backend tetap memeriksa
    // sendiri lewat requireVerifiedPsychologist.
    const status = (user?.verificationStatus as string) || "none";

    if (status !== "approved") {
      return <Navigate to="/psychologist/dashboard?blocked=1" replace />;
    }
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <AuthLoading />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/sign-in" replace />;
}

// ======================================================
// ADMIN ROUTE
// ======================================================
//
// Sebelumnya SEMUA route /admin/* tanpa guard sama sekali,
// dan "login" admin hanya mencocokkan string hardcode di
// JavaScript frontend. Siapa pun bisa membuka halaman
// admin dengan mengisi localStorage sendiri.
//
// Sekarang role diambil dari AuthContext, yang mengambilnya
// dari DATABASE lewat /api/users/me -- bukan dari input
// frontend. Endpoint admin di backend tetap punya
// authorize("admin","super_admin") sendiri, jadi guard ini
// hanya lapisan UI, bukan satu-satunya pengaman.
//
// ======================================================

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  if (role !== "admin" && role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] flex items-center justify-center p-8">
      <div className="max-w-2xl bg-white rounded-3xl p-8 border border-purple-50 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">HearMe berkomitmen untuk melindungi privasi pengguna. Semua data yang kamu berikan digunakan secara eksklusif untuk meningkatkan pengalaman layanan kesehatan mental kamu.</p>
        <p className="text-gray-600 text-sm leading-relaxed">Data tidak dijual kepada pihak ketiga. Riwayat konsultasi, jurnal, dan data mood tersimpan dengan enkripsi penuh.</p>
        <a href="/" className="inline-block mt-6 text-[#6F3FB5] font-semibold hover:underline text-sm">← Kembali ke Beranda</a>
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] flex items-center justify-center p-8">
      <div className="max-w-2xl bg-white rounded-3xl p-8 border border-purple-50 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">Dengan menggunakan HearMe, kamu menyetujui bahwa layanan ini adalah alat pendukung kesehatan mental dan bukan pengganti konsultasi medis profesional.</p>
        <p className="text-gray-600 text-sm leading-relaxed">Pengguna berusia minimal 13 tahun. Penggunaan di bawah 18 tahun memerlukan persetujuan orang tua.</p>
        <a href="/" className="inline-block mt-6 text-[#6F3FB5] font-semibold hover:underline text-sm">← Kembali ke Beranda</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        {/* Public */}
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<LandingPage />} />
        <Route path="/features" element={<LandingPage />} />
        <Route path="/contact" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/choose-role" element={<ChooseRolePage />} />
        <Route path="/sign-up/:role" element={<SignUpPage />} />
        <Route path="/privacy-policy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* User-only dashboard (redirects psychologist to their dashboard) */}
        <Route path="/dashboard" element={<UserRoute><DashboardPage /></UserRoute>} />
        <Route path="/psychologists" element={<UserRoute><PsychologistsPage /></UserRoute>} />
        <Route path="/psychologists/:id" element={<UserRoute><PsychologistDetailPage /></UserRoute>} />
        <Route path="/booking/:id" element={<UserRoute><BookingPage /></UserRoute>} />
        <Route path="/consultations" element={<UserRoute><ConsultationsPage /></UserRoute>} />
        <Route path="/consultation/:id" element={<UserRoute><ConsultationChatPage /></UserRoute>} />
        <Route path="/forum" element={<UserRoute><ForumPage /></UserRoute>} />
        <Route path="/forum/profile" element={<UserRoute><ForumProfilePage /></UserRoute>} />
        <Route path="/journal" element={<UserRoute><JournalPage /></UserRoute>} />
        <Route path="/mind-hub" element={<UserRoute><MindHubPage /></UserRoute>} />
        <Route path="/mind-hub/:id" element={<UserRoute><MindHubDetailPage /></UserRoute>} />
        <Route path="/ai-listener" element={<UserRoute><AIListenerPage /></UserRoute>} />
        <Route path="/ai-listener/voice" element={<UserRoute><VoiceAIPage /></UserRoute>} />
        <Route path="/profile" element={<UserRoute><ProfilePage /></UserRoute>} />
        <Route path="/emergency-call" element={<UserRoute><EmergencyCallPage /></UserRoute>} />
        <Route path="/article/:id" element={<UserRoute><ArticlePage /></UserRoute>} />
        <Route path="/notifications" element={<UserRoute><NotificationsPage /></UserRoute>} />
        <Route path="/payment/:consultationId" element={<UserRoute><PaymentPage /></UserRoute>} />
        <Route path="/video-call/:consultationId" element={<ProtectedRoute><VideoCallPage /></ProtectedRoute>} />

        {/* Psychologist-only routes */}
        <Route path="/psychologist/dashboard" element={<PsychologistRoute><PsychologistDashboardPage /></PsychologistRoute>} />
        <Route path="/psychologist/verification" element={<ProtectedRoute><PsychologistVerificationPage /></ProtectedRoute>} />
        <Route path="/psychologist/consultations" element={<PsychologistRoute requiresVerification><PsychologistConsultationsPage /></PsychologistRoute>} />
        <Route path="/psychologist/upcoming" element={<PsychologistRoute requiresVerification><PsychologistUpcomingPage /></PsychologistRoute>} />
        <Route path="/psychologist/patients" element={<PsychologistRoute requiresVerification><PsychologistPatientsPage /></PsychologistRoute>} />
        <Route path="/psychologist/schedule" element={<PsychologistRoute requiresVerification><PsychologistSchedulePage /></PsychologistRoute>} />
        <Route path="/psychologist/consultation/:id" element={<PsychologistRoute requiresVerification><PsychologistChatPage /></PsychologistRoute>} />
        <Route path="/psychologist/consultation-mgmt/:id" element={<PsychologistRoute><PsychologistConsultationRoomPage /></PsychologistRoute>} />
        <Route path="/psychologist/profile" element={<PsychologistRoute><PsychologistProfilePage /></PsychologistRoute>} />

          {/* Admin — role admin/super_admin dari database */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/forum" element={<AdminRoute><AdminForumPage /></AdminRoute>} />
          <Route path="/admin/verification" element={<AdminRoute><AdminVerificationPage /></AdminRoute>} />
          <Route path="/admin/mind-hub" element={<AdminRoute><AdminMindHubPage /></AdminRoute>} />
          <Route path="/admin/forum-moderation" element={<AdminRoute><AdminForumModerationPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
