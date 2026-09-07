import type { Notification, NotificationType } from "../types";

// ======================================================
// ## API TEMPLATE IF CONNECTED ##
// Notification API
//
// Supabase Realtime:
// supabase.channel('notifications').on('postgres_changes', ...).subscribe()
//
// Firebase FCM:
// import { getMessaging, onMessage } from 'firebase/messaging'
//
// Custom WebSocket:
// const ws = new WebSocket('/api/notifications/ws')
//
// Push API:
// navigator.serviceWorker.ready.then(reg => reg.pushManager.subscribe(...))
// ======================================================

const KEY = "hearme_notifications";

function all(): Notification[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : getDefaultNotifications();
}
function save(n: Notification[]) {
  localStorage.setItem(KEY, JSON.stringify(n));
}

function getDefaultNotifications(): Notification[] {
  const now = new Date();
  const items: Notification[] = [
    {
      id: "n1",
      userId: "current",
      type: "consultation_approved",
      title: "Konsultasi Disetujui",
      message: "Dr. Inof Sucipto telah menyetujui jadwal konsultasimu pada 20 Sep 2025 pukul 10:00.",
      read: false,
      link: "/consultations",
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: "n2",
      userId: "current",
      type: "payment_success",
      title: "Pembayaran Berhasil",
      message: "Pembayaran konsultasi sebesar Rp 150.000 telah dikonfirmasi.",
      read: false,
      link: "/consultations",
      createdAt: new Date(now.getTime() - 7200000).toISOString(),
    },
    {
      id: "n3",
      userId: "current",
      type: "new_message",
      title: "Pesan Baru",
      message: "Kamu memiliki pesan baru dari komunitas forum.",
      read: true,
      link: "/forum",
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
  ];
  save(items);
  return items;
}

export const notificationAPI = {
  getAll: async (userId?: string): Promise<Notification[]> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC
    void userId;
    return all();
  },

  getUnreadCount: (): number => all().filter((n) => !n.read).length,

  markRead: async (id: string): Promise<void> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → UPDATE notifications SET read = true WHERE id = ?
    const updated = all().map((n) => n.id === id ? { ...n, read: true } : n);
    save(updated);
  },

  markAllRead: async (): Promise<void> => {
    save(all().map((n) => ({ ...n, read: true })));
  },

  push: (type: NotificationType, title: string, message: string, link?: string): void => {
    // ======================================================
    // ## API TEMPLATE IF CONNECTED ##
    // Replace with real push notification:
    // await fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ type, title, message }) })
    // ======================================================
    const n: Notification = {
      id: `n_${Date.now()}`,
      userId: "current",
      type,
      title,
      message,
      read: false,
      link,
      createdAt: new Date().toISOString(),
    };
    save([n, ...all()]);
  },

  delete: async (id: string): Promise<void> => {
    save(all().filter((n) => n.id !== id));
  },
};
