import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { authService } from "./services";
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

function UserRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/sign-in" replace />;
  const role = authService.getRole();
  if (role === "psychologist") return <Navigate to="/psychologist/dashboard" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
}

function getPsychVerificationStatus(): string {
  try {
    const vs: { status: string; submittedBy?: string }[] = JSON.parse(localStorage.getItem("hearme_verifications") || "[]");
    const u = JSON.parse(localStorage.getItem("hearme_user") || "{}");
    const mine = vs.filter((v) => v.submittedBy === u.name || v.submittedBy === u.email);
    if (mine.length === 0) return "none";
    return mine[mine.length - 1].status || "pending";
  } catch { return "none"; }
}

function PsychologistRoute({ children, requiresVerification = false }: { children: React.ReactNode; requiresVerification?: boolean }) {
  if (!authService.isAuthenticated()) return <Navigate to="/sign-in" replace />;
  const role = authService.getRole();
  if (role === "user") return <Navigate to="/dashboard" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (requiresVerification && getPsychVerificationStatus() !== "approved") {
    return <Navigate to="/psychologist/dashboard?blocked=1" replace />;
  }
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/sign-in" replace />;
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

        {/* Admin — own session guard */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/forum" element={<AdminForumPage />} />
        <Route path="/admin/verification" element={<AdminVerificationPage />} />
        <Route path="/admin/mind-hub" element={<AdminMindHubPage />} />
        <Route path="/admin/forum-moderation" element={<AdminForumModerationPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
