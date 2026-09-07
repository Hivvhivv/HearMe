import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  MessageSquareWarning,
  BadgeCheck,
  BookOpen,
  LogOut,
  Brain,
} from "lucide-react"

interface AdminSession {
  role: string
  name: string
}

interface AdminSidebarProps {
  session: AdminSession
  onLogout: () => void
}

export default function AdminSidebar({ session, onLogout }: AdminSidebarProps) {
  const location = useLocation()

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    {
      label: "Forum Moderasi",
      icon: MessageSquareWarning,
      path: "/admin/forum-moderation",
    },
    {
      label: "Verifikasi Psikolog",
      icon: BadgeCheck,
      path: "/admin/verification",
    },
    {
      label: "Mind Hub",
      icon: BookOpen,
      path: "/admin/mind-hub",
    },
  ]

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "#6F3FB5" }}
        >
          <Brain className="w-4 h-4 text-white" />
        </div>

        <div>
          <p className="text-sm font-bold" style={{ color: "#6F3FB5" }}>
            HearMe
          </p>

          <p className="text-[10px] text-gray-400">Admin Panel</p>
        </div>
      </div>

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
              }}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "#6F3FB5" }}
          >
            A
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700">
              {session?.name || "Admin"}
            </p>

            <p className="text-[10px] text-gray-400">Administrator</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}
