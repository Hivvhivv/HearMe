import { useEffect, useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import {
  LayoutDashboard,
  MessageSquareWarning,
  BadgeCheck,
  BookOpen,
  Users,
  Stethoscope,
  ClipboardList,
  FileText,
  LogOut,
  Brain,
  TrendingUp,
  Clock,
} from "lucide-react"

interface AdminSession {
  role: string
  name: string
}

interface Verification {
  id: string
  psychologistId: string
  psychologistName: string
  submittedAt: string
  status: "pending" | "approved" | "rejected"
}

interface ForumBan {
  id: string
  userId: string
  userName: string
  reason: string
  duration: string
  bannedAt: string
  expiresAt: string
}

function AdminSidebar({
  session,
  onLogout,
}: {
  session: AdminSession
  onLogout: () => void
}) {
  const location = useLocation()

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    {
      label: "Forum Moderasi",
      icon: MessageSquareWarning,
      path: "/admin/forum",
    },
    {
      label: "Verifikasi Psikolog",
      icon: BadgeCheck,
      path: "/admin/verification",
    },
    { label: "Mind Hub", icon: BookOpen, path: "/admin/mind-hub" },
  ]

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "#6F3FB5" }}
        >
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <p
            className="text-sm font-bold leading-tight"
            style={{
              color: "#6F3FB5",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            HearMe
          </p>
          <p className="text-[10px] text-gray-400 leading-tight">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? "#F3ECF9" : "transparent",
                color: active ? "#6F3FB5" : "#6B7280",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "#6F3FB5" }}
          >
            A
          </div>
          <div className="overflow-hidden">
            <p
              className="text-xs font-semibold text-gray-700 truncate"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {session.name}
            </p>
            <p className="text-[10px] text-gray-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [forumBans, setForumBans] = useState<ForumBan[]>([])

  useEffect(() => {
    const raw = localStorage.getItem("hearme_admin_session")
    if (!raw) {
      navigate("/admin/login")
      return
    }
    setSession(JSON.parse(raw))

    const vRaw = localStorage.getItem("hearme_verifications")
    if (vRaw) {
      const parsed = JSON.parse(vRaw)
      setVerifications(Array.isArray(parsed) ? parsed : [])
    }

    const bRaw = localStorage.getItem("hearme_forum_bans")
    if (bRaw) setForumBans(JSON.parse(bRaw))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("hearme_admin_session")
    navigate("/admin/login")
  }

  if (!session) return null

  const statCards = [
    {
      label: "Total Pengguna",
      value: "2,481",
      icon: Users,
      color: "#6F3FB5",
      bg: "#F3ECF9",
      change: "+12%",
    },
    {
      label: "Total Psikolog",
      value: "38",
      icon: Stethoscope,
      color: "#059669",
      bg: "#ECFDF5",
      change: "+3",
    },
    {
      label: "Menunggu Verifikasi",
      value:
        verifications.filter((v) => v.status === "pending").length.toString() ||
        "5",
      icon: ClipboardList,
      color: "#D97706",
      bg: "#FFFBEB",
      change: "Perlu review",
    },
    {
      label: "Postingan Forum",
      value: "1,204",
      icon: FileText,
      color: "#2563EB",
      bg: "#EFF6FF",
      change: "+47 hari ini",
    },
  ]

  const statusColor: Record<string, string> = {
    pending: "#D97706",
    approved: "#059669",
    rejected: "#DC2626",
  }
  const statusBg: Record<string, string> = {
    pending: "#FFFBEB",
    approved: "#ECFDF5",
    rejected: "#FEF2F2",
  }
  const statusLabel: Record<string, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
  }

  const recentVerifications = verifications.slice(0, 5)
  const recentBans = forumBans.slice(0, 5)

  return (
    <div className="flex min-h-screen" style={{ background: "#FAF8FD" }}>
      <AdminSidebar session={session} onLogout={handleLogout} />

      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-7">
          <h1
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Dashboard
          </h1>
          <p
            className="text-sm text-gray-500 mt-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Selamat datang kembali, {session.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-xs text-gray-500 mb-1"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {card.label}
                  </p>
                  <p
                    className="text-2xl font-bold text-gray-800"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {card.value}
                  </p>
                  <p
                    className="text-xs mt-1 flex items-center gap-1"
                    style={{
                      color: card.color,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {card.change}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: card.bg }}
                >
                  <card.icon
                    className="w-5 h-5"
                    style={{ color: card.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Recent Verifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2
                className="text-sm font-semibold text-gray-700"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Verifikasi Terbaru
              </h2>
              <Link
                to="/admin/verification"
                className="text-xs font-medium hover:underline"
                style={{ color: "#6F3FB5", fontFamily: "Inter, sans-serif" }}
              >
                Lihat semua
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentVerifications.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p
                    className="text-xs text-gray-400"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Belum ada data verifikasi
                  </p>
                </div>
              ) : (
                recentVerifications.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p
                        className="text-sm font-medium text-gray-700"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {v.psychologistName}
                      </p>
                      <p className="text-xs text-gray-400">{v.submittedAt}</p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        color: statusColor[v.status],
                        background: statusBg[v.status],
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {statusLabel[v.status]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Bans */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2
                className="text-sm font-semibold text-gray-700"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Ban Forum Terbaru
              </h2>
              <Link
                to="/admin/forum"
                className="text-xs font-medium hover:underline"
                style={{ color: "#6F3FB5", fontFamily: "Inter, sans-serif" }}
              >
                Lihat semua
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentBans.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <MessageSquareWarning className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p
                    className="text-xs text-gray-400"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Belum ada pengguna yang diblokir
                  </p>
                </div>
              ) : (
                recentBans.map((ban) => (
                  <div
                    key={ban.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p
                        className="text-sm font-medium text-gray-700"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {ban.userName}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">
                        {ban.reason}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {ban.duration}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
