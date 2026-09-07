import { useEffect, useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import AdminSidebar from "../../components/AdminSidebar"
import {
  LayoutDashboard,
  MessageSquareWarning,
  BadgeCheck,
  BookOpen,
  LogOut,
  Brain,
  ShieldBan,
  ShieldCheck,
  X,
  Plus,
} from "lucide-react"

interface AdminSession {
  role: string
  name: string
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

const DURATION_OPTIONS = [
  { value: "1d", label: "1 Hari" },
  { value: "3d", label: "3 Hari" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "permanent", label: "Permanen" },
]

function calcExpiry(duration: string): string {
  if (duration === "permanent") return "Permanen"
  const days = parseInt(duration)
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function AdminForumPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [bans, setBans] = useState<ForumBan[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    userId: "",
    userName: "",
    reason: "",
    duration: "1d",
  })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    const sessionRaw = localStorage.getItem("hearme_admin_session")

    if (!sessionRaw) {
      navigate("/admin/login")
      return
    }

    setSession(JSON.parse(sessionRaw))

   const bansRaw = localStorage.getItem("hearme_forum_bans")

if (bansRaw) {
  setBans(JSON.parse(bansRaw))
}
  }, [navigate])

  const saveBans = (updated: ForumBan[]) => {
    setBans(updated)
    localStorage.setItem("hearme_forum_bans", JSON.stringify(updated))
  }

  const handleBan = () => {
    if (!form.userId.trim() || !form.userName.trim() || !form.reason.trim()) {
      setFormError("Semua kolom harus diisi.")
      return
    }
    const now = new Date()
    const newBan: ForumBan = {
      id: crypto.randomUUID(),
      userId: form.userId.trim(),
      userName: form.userName.trim(),
      reason: form.reason.trim(),
      duration:
        DURATION_OPTIONS.find((d) => d.value === form.duration)?.label ??
        form.duration,
      bannedAt: now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      expiresAt: calcExpiry(form.duration),
    }
    saveBans([newBan, ...bans])
    setShowModal(false)
    setForm({ userId: "", userName: "", reason: "", duration: "1d" })
    setFormError("")
  }

  const handleUnban = (id: string) => {
    saveBans(bans.filter((b) => b.id !== id))
  }

  const handleLogout = () => {
    localStorage.removeItem("hearme_admin_session")

    navigate("/admin/login")
  }
  if (!session) return null

  return (
    <div className="flex min-h-screen" style={{ background: "#FAF8FD" }}>
      {session && <AdminSidebar session={session} onLogout={handleLogout} />}

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1
              className="text-2xl font-bold text-gray-800"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Forum Moderasi
            </h1>
            <p
              className="text-sm text-gray-500 mt-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Kelola pengguna yang diblokir dari forum diskusi
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#6F3FB5", fontFamily: "Inter, sans-serif" }}
          >
            <Plus className="w-4 h-4" />
            Ban Pengguna
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Pengguna
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Alasan
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Durasi
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Berakhir
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p
                      className="text-sm text-gray-400"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Tidak ada pengguna yang diblokir
                    </p>
                  </td>
                </tr>
              ) : (
                bans.map((ban) => (
                  <tr
                    key={ban.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p
                        className="font-medium text-gray-800"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {ban.userName}
                      </p>
                      <p className="text-xs text-gray-400">ID: {ban.userId}</p>
                    </td>
                    <td
                      className="px-5 py-3.5 text-gray-600 max-w-[220px]"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <span className="line-clamp-2">{ban.reason}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {ban.duration}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-gray-600 text-xs"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {ban.expiresAt}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleUnban(ban.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Unban
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Ban Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldBan className="w-5 h-5 text-red-500" />
                <h3
                  className="text-base font-semibold text-gray-800"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Ban Pengguna
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormError("")
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
                  {formError}
                </div>
              )}
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  User ID
                </label>
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  placeholder="user_12345"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  value={form.userName}
                  onChange={(e) =>
                    setForm({ ...form, userName: e.target.value })
                  }
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Alasan
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Jelaskan alasan pemblokiran..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Durasi
                </label>
                <select
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormError("")
                }}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Batal
              </button>
              <button
                onClick={handleBan}
                className="flex-1 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{
                  background: "#DC2626",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Blokir Pengguna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
