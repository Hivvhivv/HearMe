import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Archive,
  Trash2,
  Edit3,
  RotateCcw,
  Clock,
  FileText,
  UserCircle,
} from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";

interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  saved?: boolean;
  archived?: boolean;
  anonymous?: boolean;
  isPublic?: boolean;
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

const CATEGORY_COLORS: Record<string, string> = {
  Kecemasan: "bg-yellow-100 text-yellow-700",
  Depresi: "bg-blue-100 text-blue-700",
  Trauma: "bg-red-100 text-red-700",
  Hubungan: "bg-pink-100 text-pink-700",
  Kerja: "bg-orange-100 text-orange-700",
  Umum: "bg-gray-100 text-gray-600",
};

function PostCard({
  post,
  actions,
}: {
  post: ForumPost;
  actions: React.ReactNode;
}) {
  const catColor = CATEGORY_COLORS[post.category] || "bg-purple-100 text-purple-700";
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#C9A9E9] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
              {post.category}
            </span>
            {post.anonymous && (
              <span className="text-xs text-gray-400 italic">(Anonim)</span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                post.isPublic === false
                  ? "bg-gray-100 text-gray-500"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {post.isPublic === false ? "Privat" : "Publik"}
            </span>
          </div>
          <h3
            className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {post.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Heart size={12} /> {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={12} /> {post.comments}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {getRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1">{actions}</div>
      </div>
    </div>
  );
}

type Tab = "myPosts" | "saved" | "archived";

export default function ForumProfilePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("myPosts");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("hearme_forum_v2");
    if (raw) {
      try {
        setPosts(JSON.parse(raw));
      } catch {
        setPosts([]);
      }
    }
  }, []);

  const savePosts = (updated: ForumPost[]) => {
    setPosts(updated);
    localStorage.setItem("hearme_forum_v2", JSON.stringify(updated));
  };

  const archivePost = (id: string) => {
    savePosts(posts.map((p) => (p.id === id ? { ...p, archived: true } : p)));
  };

  const restorePost = (id: string) => {
    savePosts(posts.map((p) => (p.id === id ? { ...p, archived: false } : p)));
  };

  const deletePost = (id: string) => {
    savePosts(posts.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  const myPosts = posts.filter((p) => p.authorId === "me" && !p.archived);
  const savedPosts = posts.filter((p) => p.saved);
  const archivedPosts = posts.filter((p) => p.archived && p.authorId === "me");

  const totalLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "myPosts", label: "Postingan Saya", count: myPosts.length },
    { key: "saved", label: "Tersimpan", count: savedPosts.length },
    { key: "archived", label: "Arsip", count: archivedPosts.length },
  ];

  const displayPosts =
    activeTab === "myPosts" ? myPosts : activeTab === "saved" ? savedPosts : archivedPosts;

  const joinDate = "Agustus 2024";

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3
              className="text-lg font-bold text-gray-900 mb-2"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              Hapus Postingan?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Postingan ini akan dihapus permanen dan tidak bisa dipulihkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => deletePost(deleteConfirm)}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6F3FB5] to-[#C9A9E9] flex items-center justify-center flex-shrink-0">
              <UserCircle size={36} className="text-white" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                Saya
              </h2>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <Clock size={13} /> Bergabung sejak {joinDate}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Postingan", value: myPosts.length, icon: <FileText size={16} /> },
              { label: "Suka diterima", value: totalLikes, icon: <Heart size={16} /> },
              { label: "Tersimpan", value: savedPosts.length, icon: <Bookmark size={16} /> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center p-3 rounded-xl bg-[#FAF8FD] border border-purple-50"
              >
                <span className="text-[#6F3FB5] mb-1">{stat.icon}</span>
                <span
                  className="text-lg font-bold text-gray-900"
                  style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                  {stat.value}
                </span>
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5
                ${activeTab === t.key
                  ? "bg-[#6F3FB5] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === t.key ? "bg-white/20" : "bg-gray-100"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Posts list */}
        {displayPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
              <FileText size={28} className="text-[#C9A9E9]" />
            </div>
            <p
              className="text-gray-500 font-medium"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              {activeTab === "myPosts"
                ? "Belum ada postingan"
                : activeTab === "saved"
                ? "Belum ada postingan tersimpan"
                : "Tidak ada postingan diarsipkan"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                actions={
                  activeTab === "myPosts" ? (
                    <>
                      <button
                        onClick={() => navigate(`/forum/edit/${post.id}`)}
                        className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-[#6F3FB5] transition"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => archivePost(post.id)}
                        className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition"
                        title="Arsipkan"
                      >
                        <Archive size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(post.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  ) : activeTab === "archived" ? (
                    <>
                      <button
                        onClick={() => restorePost(post.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-[#6F3FB5] text-xs font-medium hover:bg-purple-100 transition"
                      >
                        <RotateCcw size={13} /> Pulihkan
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(post.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
