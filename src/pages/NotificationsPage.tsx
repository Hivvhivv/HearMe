import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  CreditCard,
  Shield,
  Trash2,
  CheckCheck,
  Inbox,
} from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case "consultation_approved":
      return <CheckCircle size={20} className="text-green-500" />;
    case "payment_success":
      return <CreditCard size={20} className="text-green-500" />;
    case "forum_ban":
      return <Shield size={20} className="text-red-500" />;
    case "new_message":
      return <MessageCircle size={20} className="text-blue-500" />;
    default:
      return <Bell size={20} className="text-[#6F3FB5]" />;
  }
}

function NotifIconBg({ type }: { type: string }) {
  switch (type) {
    case "consultation_approved":
      return "bg-green-100";
    case "payment_success":
      return "bg-green-100";
    case "forum_ban":
      return "bg-red-100";
    case "new_message":
      return "bg-blue-100";
    default:
      return "bg-purple-100";
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("hearme_notifications");
    if (raw) {
      try {
        const parsed: Notification[] = JSON.parse(raw);
        setNotifications(parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch {
        setNotifications([]);
      }
    }
  }, []);

  const save = (updated: Notification[]) => {
    setNotifications(updated);
    localStorage.setItem("hearme_notifications", JSON.stringify(updated));
  };

  const markAllRead = () => {
    save(notifications.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string, link?: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    save(updated);
    if (link) navigate(link);
  };

  const deleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    save(notifications.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              Notifikasi
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-[#6F3FB5] mt-0.5">
                {unreadCount} notifikasi belum dibaca
              </p>
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm text-[#6F3FB5] hover:text-[#5a2fa0] font-medium transition-colors"
            >
              <CheckCheck size={16} />
              Tandai semua dibaca
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Inbox size={36} className="text-[#C9A9E9]" />
            </div>
            <h3
              className="text-lg font-semibold text-gray-700 mb-1"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              Tidak ada notifikasi
            </h3>
            <p className="text-gray-400 text-sm">Semua notifikasi akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id, n.link)}
                className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all group
                  ${n.read
                    ? "bg-white border-gray-100 hover:border-[#C9A9E9]"
                    : "bg-purple-50 border-[#C9A9E9] border-l-4 border-l-[#6F3FB5]"
                  }`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${NotifIconBg({ type: n.type })}`}>
                  <NotifIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-semibold ${n.read ? "text-gray-700" : "text-gray-900"}`}
                      style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                      {n.title}
                    </p>
                    <span className="flex-shrink-0 text-xs text-gray-400">{getRelativeTime(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                <button
                  onClick={(e) => deleteNotif(n.id, e)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                  title="Hapus notifikasi"
                >
                  <Trash2 size={15} />
                </button>
                {!n.read && (
                  <span className="absolute top-3 right-10 w-2 h-2 rounded-full bg-[#6F3FB5]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
