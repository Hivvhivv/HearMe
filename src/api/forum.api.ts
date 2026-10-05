// ======================================================
// FORUM API — BACKEND + MONGODB
// ======================================================
//
// Sebelumnya seluruh forum hidup di localStorage
// ("hearme_forum_v2", "_replies", "_reports",
// "_forum_bans") dan di-seed dari mockData. Akibatnya post
// seorang user tidak pernah terlihat user lain, report
// tidak pernah sampai ke admin, dan ban tidak berlaku.
//
// Sekarang semuanya lewat /api/forums dan /api/admin/*.
//
// CATATAN SOAL ANONIM:
//
// Backend TIDAK PERNAH mengirim userId penulis pada
// response publik, dan untuk post anonim nama/avatar juga
// dibuang. Jadi frontend tidak punya data untuk
// membocorkan identitas — penyembunyiannya terjadi di
// server, bukan di UI.
//
// Kepemilikan dikenali lewat flag `isOwn` dari backend.
//
// ======================================================

import type { ForumPost } from "../types";
import { api } from "./client";

type Envelope<T> = { success: boolean; data: T };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Bentuk mentah dari backend.
export type ApiForumPost = {
  id: string;
  category: string;
  title: string;
  content: string;
  image: string;
  isAnonymous: boolean;
  status: "active" | "archived" | "deleted";
  author: { name: string; avatar: string; anonymous: boolean };
  likeCount: number;
  replyCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ForumReply = {
  id: string;
  content: string;
  isAnonymous: boolean;
  author: { name: string; anonymous: boolean };
  isOwn: boolean;
  createdAt: string;
};

export type BanStatus = {
  banned: boolean;
  bannedUntil: string | null;
  reason: string | null;
};

export type ForumReport = {
  id: string;
  reason: string;
  description: string;
  status: "pending" | "resolved" | "rejected";
  action: string | null;
  reviewedAt: string | null;
  createdAt: string;

  post: {
    id: string;
    category: string;
    title: string;
    content: string;
    image: string;
    isAnonymous: boolean;
    status: string;
  };

  reporter: { id: string; name: string; email: string };

  // Admin BOLEH melihat pemilik post walau post-nya anonim
  // (untuk keperluan moderasi).
  owner: {
    id: string;
    name: string;
    email: string;
    forumBan?: {
      isBanned?: boolean;
      bannedUntil?: string | null;
      reason?: string | null;
    };
  };
};

export type ForumBanRow = {
  userId: string;
  name: string;
  email: string;
  isBanned?: boolean;
  bannedUntil?: string | null;
  duration?: string;
  reason?: string | null;
  active: boolean;
};

export type BanDuration = "1d" | "3d" | "7d" | "30d" | "permanent";

export const REPORT_REASONS = [
  { value: "spam", label: "Spam / promosi" },
  { value: "harassment", label: "Pelecehan / perundungan" },
  { value: "hate_speech", label: "Ujaran kebencian" },
  { value: "self_harm", label: "Menyakiti diri sendiri" },
  { value: "misinformation", label: "Informasi menyesatkan" },
  { value: "other", label: "Lainnya" },
] as const;


// Jarak waktu singkat ("5 jam lalu") untuk UI lama yang
// memakai field `time`.
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;

  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


/*
 * Memetakan ke tipe ForumPost yang dipakai UI, supaya
 * markup/design yang sudah ada tidak perlu diubah.
 *
 * authorId diisi "me" / "" karena backend memang tidak
 * mengirim userId — UI hanya butuh tahu "ini milik saya",
 * dan itu datang dari isOwn.
 */
export function toForumPost(p: ApiForumPost): ForumPost {
  return {
    id: p.id,
    authorId: p.isOwn ? "me" : "",
    author: p.author.name,
    avatar: p.author.avatar || "",
    category: p.category,
    title: p.title,
    excerpt: p.content.slice(0, 200),
    content: p.content,
    likes: p.likeCount,
    comments: p.replyCount,
    time: timeAgo(p.createdAt),
    liked: p.likedByMe,
    saved: p.savedByMe,
    archived: p.status === "archived",
    isAnonymous: p.isAnonymous,
    visibility: "public",
  };
}


export const forumAPI = {

  // ====================================================
  // FEED
  // ====================================================

  getPosts: async (
    category?: string,
    params: { search?: string; page?: number; limit?: number } = {}
  ): Promise<ForumPost[]> => {
    const qs = new URLSearchParams();

    if (category && category !== "Semua") qs.set("category", category);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    qs.set("limit", String(params.limit || 50));

    const res = await api.get<
      Envelope<{ posts: ApiForumPost[]; pagination: Pagination }>
    >(`/forums?${qs}`);

    return res.data.posts.map(toForumPost);
  },


  getById: async (id: string): Promise<ForumPost> => {
    const res = await api.get<Envelope<{ post: ApiForumPost }>>(
      `/forums/${id}`
    );

    return toForumPost(res.data.post);
  },


  // ====================================================
  // BUAT POST
  // ====================================================
  //
  // User yang di-ban akan menerima 403 dari backend —
  // tombol yang di-disable di UI bukan pengamannya.
  //
  // ====================================================

  createPost: async (data: {
    title: string;
    content: string;
    category: string;
    isAnonymous: boolean;

    // data URL base64; divalidasi backend.
    image?: string;
  }): Promise<ForumPost> => {
    const res = await api.post<Envelope<{ post: ApiForumPost }>>(
      "/forums",
      data
    );

    return toForumPost(res.data.post);
  },


  // ====================================================
  // AKSI PEMILIK
  // ====================================================

  archivePost: async (id: string): Promise<void> => {
    await api.patch<Envelope<unknown>>(`/forums/${id}/archive`);
  },

  restorePost: async (id: string): Promise<void> => {
    await api.patch<Envelope<unknown>>(`/forums/${id}/restore`);
  },

  // Soft delete di backend: data tetap ada untuk moderasi.
  deletePost: async (id: string): Promise<void> => {
    await api.delete<Envelope<unknown>>(`/forums/${id}`);
  },


  // ====================================================
  // LIKE & SAVE
  // ====================================================

  toggleLike: async (
    id: string
  ): Promise<{ liked: boolean; likeCount: number }> => {
    const res = await api.post<
      Envelope<{ liked: boolean; likeCount: number }>
    >(`/forums/${id}/like`);

    return res.data;
  },

  toggleSave: async (
    id: string
  ): Promise<{ saved: boolean; savedCount: number }> => {
    const res = await api.post<
      Envelope<{ saved: boolean; savedCount: number }>
    >(`/forums/${id}/save`);

    return res.data;
  },


  // ====================================================
  // MY FORUM
  // ====================================================

  getMine: async (
    tab: "posts" | "replies" | "likes" | "saved" | "archived" = "posts"
  ): Promise<ForumPost[]> => {
    const res = await api.get<Envelope<{ items: ApiForumPost[] }>>(
      `/forums/mine?tab=${tab}`
    );

    // Tab "replies" mengembalikan bentuk berbeda; pemanggil
    // yang butuh itu memakai getMyReplies().
    return (res.data.items || []).map(toForumPost);
  },

  getMyReplies: async (): Promise<
    { id: string; postId: string; content: string; createdAt: string }[]
  > => {
    const res = await api.get<
      Envelope<{
        items: {
          id: string;
          postId: string;
          content: string;
          createdAt: string;
        }[];
      }>
    >("/forums/mine?tab=replies");

    return res.data.items || [];
  },

  getMyPosts: async (): Promise<ForumPost[]> =>
    forumAPI.getMine("posts"),

  getSaved: async (): Promise<ForumPost[]> =>
    forumAPI.getMine("saved"),

  getArchived: async (): Promise<ForumPost[]> =>
    forumAPI.getMine("archived"),

  getLiked: async (): Promise<ForumPost[]> =>
    forumAPI.getMine("likes"),


  // ====================================================
  // BALASAN
  // ====================================================

  getReplies: async (postId: string): Promise<ForumReply[]> => {
    const res = await api.get<Envelope<{ replies: ForumReply[] }>>(
      `/forums/${postId}/replies`
    );

    return res.data.replies;
  },

  reply: async (
    postId: string,
    content: string,
    isAnonymous = false
  ): Promise<ForumReply> => {
    const res = await api.post<Envelope<{ reply: ForumReply }>>(
      `/forums/${postId}/replies`,
      { content, isAnonymous }
    );

    return res.data.reply;
  },


  // ====================================================
  // REPORT
  // ====================================================

  report: async (
    postId: string,
    reason: string,
    description?: string
  ): Promise<void> => {
    await api.post<Envelope<unknown>>(`/forums/${postId}/reports`, {
      reason,
      description,
    });
  },


  // ====================================================
  // STATUS BAN SENDIRI
  // ====================================================

  getBanStatus: async (): Promise<BanStatus> => {
    const res = await api.get<Envelope<BanStatus>>(
      "/forums/ban-status"
    );

    return res.data;
  },


  // ====================================================
  // ADMIN
  // ====================================================

  adminGetReports: async (
    status?: string
  ): Promise<ForumReport[]> => {
    const qs = status && status !== "Semua" ? `?status=${status}` : "";

    const res = await api.get<Envelope<{ reports: ForumReport[] }>>(
      `/admin/forum-reports${qs}`
    );

    return res.data.reports;
  },

  adminReviewReport: async (
    reportId: string,
    action: "dismiss" | "archive" | "delete",
    note?: string
  ): Promise<void> => {
    await api.patch<Envelope<unknown>>(
      `/admin/forum-reports/${reportId}/review`,
      { action, note }
    );
  },

  adminGetBans: async (): Promise<ForumBanRow[]> => {
    const res = await api.get<Envelope<{ bans: ForumBanRow[] }>>(
      "/admin/forum-bans"
    );

    return res.data.bans;
  },

  adminBanUser: async (
    userId: string,
    duration: BanDuration,
    reason: string
  ): Promise<void> => {
    await api.post<Envelope<unknown>>(
      `/admin/forum-bans/${userId}`,
      { duration, reason }
    );
  },

  adminUnbanUser: async (userId: string): Promise<void> => {
    await api.delete<Envelope<unknown>>(
      `/admin/forum-bans/${userId}`
    );
  },
};
