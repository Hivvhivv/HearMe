import type { ForumPost, ForumBan } from "../types";
import { forumPosts as mockPosts } from "../data/mockData";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// forum_posts table: id, author_id, category, title, content, is_anonymous, visibility, created_at
// forum_bans table: id, user_id, reason, duration, banned_at, expires_at, banned_by
// ======================================================

const POSTS_KEY = "hearme_forum_v2";
const BANS_KEY = "hearme_forum_bans";
const SAVED_KEY = "hearme_forum_saved";

function allPosts(): ForumPost[] {
  const raw = localStorage.getItem(POSTS_KEY);
  if (!raw) {
    const init = mockPosts.map((p) => ({ ...p, isAnonymous: false, visibility: "public" as const, saved: false, archived: false }));
    localStorage.setItem(POSTS_KEY, JSON.stringify(init));
    return init;
  }
  return JSON.parse(raw);
}
function savePosts(p: ForumPost[]) { localStorage.setItem(POSTS_KEY, JSON.stringify(p)); }

function allBans(): ForumBan[] {
  const raw = localStorage.getItem(BANS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveBans(b: ForumBan[]) { localStorage.setItem(BANS_KEY, JSON.stringify(b)); }

export const forumAPI = {
  getPosts: async (category?: string, currentUserId = "me"): Promise<ForumPost[]> => {
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // SELECT * FROM forum_posts WHERE (visibility = 'public' OR author_id = ?) AND category LIKE ?
    const posts = allPosts();
    return posts.filter((p) => {
      if (p.visibility === "private" && p.authorId !== currentUserId) return false;
      if (p.archived) return false;
      if (category && category !== "Semua") return p.category === category;
      return true;
    });
  },

  createPost: async (data: { title: string; excerpt: string; category: string; isAnonymous: boolean; visibility: "public" | "private" }, author = "Kamu"): Promise<ForumPost> => {
    const post: ForumPost = {
      id: `f${Date.now()}`,
      authorId: "me",
      author: data.isAnonymous ? "Anonymous" : author,
      avatar: data.isAnonymous
        ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format",
      category: data.category,
      title: data.title,
      excerpt: data.excerpt,
      likes: 0,
      comments: 0,
      time: "Baru saja",
      liked: false,
      saved: false,
      archived: false,
      isAnonymous: data.isAnonymous,
      visibility: data.visibility,
    };
    savePosts([post, ...allPosts()]);
    return post;
  },

  toggleLike: async (postId: string): Promise<void> => {
    savePosts(allPosts().map((p) =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  },

  toggleSave: async (postId: string): Promise<void> => {
    savePosts(allPosts().map((p) => p.id === postId ? { ...p, saved: !p.saved } : p));
  },

  archivePost: async (postId: string): Promise<void> => {
    savePosts(allPosts().map((p) => p.id === postId ? { ...p, archived: true } : p));
  },

  restorePost: async (postId: string): Promise<void> => {
    savePosts(allPosts().map((p) => p.id === postId ? { ...p, archived: false } : p));
  },

  deletePost: async (postId: string): Promise<void> => {
    savePosts(allPosts().filter((p) => p.id !== postId));
  },

  getMyPosts: async (): Promise<ForumPost[]> => allPosts().filter((p) => p.authorId === "me"),
  getSaved: async (): Promise<ForumPost[]> => allPosts().filter((p) => p.saved),
  getArchived: async (): Promise<ForumPost[]> => allPosts().filter((p) => p.archived && p.authorId === "me"),

  // Moderation
  getBans: async (): Promise<ForumBan[]> => allBans(),

  banUser: async (data: { userId: string; userName: string; reason: string; duration: ForumBan["duration"] }): Promise<ForumBan> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → INSERT INTO forum_bans (user_id, reason, duration, banned_at, banned_by) VALUES (...)
    const now = new Date();
    const durationMap = { "1d": 1, "3d": 3, "7d": 7, "30d": 30, "permanent": null } as const;
    const days = durationMap[data.duration];
    const ban: ForumBan = {
      id: `ban_${Date.now()}`,
      userId: data.userId,
      userName: data.userName,
      reason: data.reason,
      duration: data.duration,
      bannedAt: now.toISOString(),
      expiresAt: days ? new Date(now.getTime() + days * 86400000).toISOString() : undefined,
      bannedBy: "admin",
    };
    saveBans([ban, ...allBans()]);
    return ban;
  },

  unbanUser: async (banId: string): Promise<void> => {
    saveBans(allBans().filter((b) => b.id !== banId));
  },
};
