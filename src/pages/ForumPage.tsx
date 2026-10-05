import { useCallback, useEffect, useState, useRef } from "react";
import {
  Heart, MessageCircle, Plus, X, Bookmark, EyeOff, Eye,
  User, Lock, Image, Trash2, Pencil, Send, Share2, Flag, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import type { ForumPost as SharedForumPost } from "../types";
import {
  forumAPI,
  REPORT_REASONS,
  type BanStatus,
  type ForumReply as ApiReply,
} from "../api/forum.api";

// ======================================================
// FORUM — DARI BACKEND + MONGODB
// ======================================================
//
// Sebelumnya seluruh forum ada di localStorage dan di-seed
// dari mockData, jadi post seorang user tidak pernah
// terlihat user lain dan report tidak pernah sampai ke
// admin.
//
// Yang sekarang dijaga BACKEND, bukan UI:
//
//   - identitas penulis anonim tidak pernah dikirim
//   - ownership (archive/delete) diverifikasi per request
//   - user yang di-ban dibalas 403 saat post/reply/like
//   - satu user hanya bisa melaporkan satu post sekali
//
// ======================================================

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// forum_posts
//   id, user_id, title, content, visibility, created_at
//
// forum_images
//   id, post_id, image_url
//
// forum_replies
//   id, post_id, parent_reply_id, user_id, content, created_at
//
// forum_reports
//   id, post_id, reporter_user_id, reason, description, status, created_at, reviewed_at, reviewed_by
//   status: 'pending' | 'reviewed' | 'dismissed'
//
// ======================================================

// Daftar alasan diambil dari forum.api (REPORT_REASONS),
// supaya nilai yang dikirim COCOK dengan enum backend.
// Daftar lokal sebelumnya memakai label bebas ("Hate
// Speech") yang akan ditolak backend sebagai 400.

// interface ForumReport DIHAPUS: bentuknya datang dari
// forum.api.ts.

// loadReports / saveReports / isUserBanned DIHAPUS.
//
// Report sekarang masuk MongoDB dan status ban diambil
// dari GET /api/forums/ban-status. isUserBanned() yang
// lama membaca localStorage -- artinya siapa pun bisa
// menghapus ban-nya sendiri dari console browser.
// ---- Report Modal ----
function ReportModal({ post, onClose }: { post: { id: string; title: string; excerpt: string; author: string }; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState("");

  // Laporan dikirim ke MongoDB dan langsung masuk antrean
  // moderasi admin. Backend menolak laporan kedua untuk
  // post yang sama (409).
  const handleSubmit = async () => {
    if (!reason) return;

    try {
      setSending(true);
      setFailed("");

      await forumAPI.report(post.id, reason, description);

      setSubmitted(true);
    } catch (err) {
      setFailed(
        err instanceof Error
          ? err.message
          : "Gagal mengirim laporan"
      );
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl animate-scale-in">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Report Berhasil Dikirim</h3>
          <p className="text-sm text-gray-500 mb-5">Terima kasih telah membantu menjaga komunitas HearMe.</p>
          <button onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold bg-[#6F3FB5] text-white rounded-xl hover:bg-[#5c32a0] transition-colors">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-50">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            <h3 className="font-bold text-gray-900">Report Forum</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-700 truncate">{post.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">oleh {post.author}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Pilih Alasan <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reason === r.value ? "border-[#6F3FB5] bg-[#F5EEFC]" : "border-gray-100 hover:border-purple-200"}`}>
                  <input type="radio" name="report_reason" value={r.value} checked={reason === r.value}
                    onChange={() => setReason(r.value)} className="accent-[#6F3FB5]" />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Additional Information</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan informasi lebih lanjut (opsional)..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#6F3FB5] transition-colors" />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!reason || sending}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? "Mengirim..." : "Submit Report"}
          </button>
        </div>

        {/* Pesan gagal dari backend, mis. sudah pernah
            melaporkan post ini (409). */}
        {failed && (
          <p className="px-5 pb-4 text-xs text-red-500">{failed}</p>
        )}
      </div>
    </div>
  );
}

const CURRENT_USER_ID = "me";
const CURRENT_USER_NAME = "Kamu";

interface ForumImage { url: string; }

/*
 * Tipe ForumPost diambil dari src/types (tipe bersama),
 * ditambah `images` yang hanya dipakai tampilan di halaman
 * ini. Sebelumnya halaman ini mendefinisikan ulang seluruh
 * bentuknya — duplikat yang mudah melenceng dari tipe asli.
 */
type ForumPost = SharedForumPost & { images?: ForumImage[] };

// interface ForumReply DIHAPUS: bentuk balasan datang
// dari forum.api.ts (ApiReply).

const categories = ["Semua", "Kecemasan", "Hubungan", "Studi", "Pekerjaan", "Self Improvement"];

// loadPosts / savePosts / loadReplies / saveReplies
// DIHAPUS: post dan balasan sekarang dari MongoDB lewat
// forum.api.ts, bukan localStorage "hearme_forum_v2" dan
// "hearme_forum_replies".
function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

// ---- Image Upload Helper ----
function useImageUpload(maxImages = 5) {
  const [images, setImages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const newImages: string[] = [];
    Array.from(files).forEach((f) => {
      if (!allowed.includes(f.type)) return;
      if (images.length + newImages.length >= maxImages) return;
      const url = URL.createObjectURL(f);
      newImages.push(url);
    });
    setImages((prev) => [...prev, ...newImages].slice(0, maxImages));
  };

  const remove = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));
  const reset = () => { setImages([]); if (inputRef.current) inputRef.current.value = ""; };

  return { images, inputRef, handleFiles, remove, reset };
}

// ---- Reply Thread Component ----
// ReplyThread DIHAPUS: balasan sekarang FLAT.
//
// Komponen ini menampilkan balasan berjenjang memakai
// parentReplyId, yang tidak ada di model balasan backend
// dan juga tidak diminta spec. Daftar balasan dirender
// langsung di PostDetail.
function PostDetail({
  post, onClose, onReplied,
}: {
  post: ForumPost;
  onClose: () => void;

  // Dipanggil setelah balasan tersimpan, supaya jumlah
  // komentar di feed ikut diperbarui.
  onReplied: () => void;
}) {
  const [newReply, setNewReply] = useState("");

  /*
   * Balasan diambil dari backend, bukan localStorage.
   *
   * Identitas penulis balasan anonim juga sudah dibuang di
   * server — frontend hanya menerima { name: "Anonymous
   * User", anonymous: true }.
   */
  const [postReplies, setPostReplies] = useState<ApiReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");

  const loadReplies = useCallback(async () => {
    try {
      setLoadingReplies(true);

      setPostReplies(await forumAPI.getReplies(post.id));
    } catch {
      setPostReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  }, [post.id]);

  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;

    try {
      setSending(true);
      setReplyError("");

      await forumAPI.reply(post.id, newReply.trim());

      setNewReply("");

      await loadReplies();
      onReplied();
    } catch (err) {
      // Mis. 403 karena user di-ban.
      setReplyError(
        err instanceof Error ? err.message : "Gagal mengirim balasan"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-50 flex-shrink-0">
          <h3 className="font-bold text-gray-900 text-sm truncate pr-4">{post.title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Post content */}
          <div className="flex items-start gap-3 mb-4">
            {post.isAnonymous ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-500" />
              </div>
            ) : (
              <img src={post.avatar || undefined} alt={post.author} className="w-9 h-9 rounded-full object-cover bg-purple-100 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-bold text-gray-800">{post.isAnonymous ? "Anonymous User" : post.author}</span>
                <span className="text-xs bg-[#F5EEFC] text-[#6F3FB5] px-2 py-0.5 rounded-full font-medium">{post.category}</span>
                <span className="text-xs text-gray-400">{post.time}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{post.content || post.excerpt}</p>
            </div>
          </div>

          {/* Post images */}
          {post.images && post.images.length > 0 && (
            <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {post.images.map((img, i) => (
                <img key={i} src={img.url} alt="" className="rounded-xl w-full object-cover max-h-48" />
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-purple-50 mb-4 pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              {postReplies.length} Balasan
            </p>
          </div>

          {/* ==========================================
              DAFTAR BALASAN
              ==========================================
              Balasan bersifat FLAT (tidak bersarang).

              UI lama punya thread berjenjang
              (parentReplyId + depth), tapi model balasan di
              backend tidak menyimpan induk — dan balasan
              berjenjang juga tidak diminta spec. Kalau nanti
              dibutuhkan, tambahkan parentReplyId di
              ForumService lalu kembalikan tampilan thread.
          ========================================== */}
          {loadingReplies ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-purple-100 rounded w-1/4" />
                    <div className="h-3 bg-purple-50 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : postReplies.length > 0 ? (
            <div className="space-y-3">
              {postReplies.map((r) => (
                <div key={r.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-800">
                        {r.author.name}
                      </span>
                      {r.isOwn && (
                        <span className="text-[10px] bg-[#F5EEFC] text-[#6F3FB5] px-1.5 py-0.5 rounded-full font-semibold">
                          Kamu
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mt-0.5 whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Jadilah yang pertama membalas!</p>
          )}
        </div>

        {/* Reply input */}
        <div className="px-5 py-4 border-t border-purple-50 flex-shrink-0">
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
              K
            </div>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Tulis balasanmu..."
              rows={2}
              className="flex-1 text-sm px-3 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl resize-none focus:outline-none focus:border-[#6F3FB5] transition-colors"
            />
            <button onClick={handleSubmitReply} disabled={!newReply.trim()}
              className="self-end p-2.5 bg-[#6F3FB5] text-white rounded-xl hover:bg-[#5c32a0] transition-colors disabled:opacity-50 flex-shrink-0">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function ForumPage() {
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [detailPost, setDetailPost] = useState<ForumPost | null>(null);
  const [reportPost, setReportPost] = useState<ForumPost | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  /*
   * Status ban datang dari BACKEND, bukan localStorage.
   *
   * Ini hanya untuk UI (menonaktifkan tombol + menjelaskan
   * alasannya). Pengamannya tetap di backend: aksi forum
   * dari user yang di-ban dibalas 403 apa pun yang
   * dilakukan frontend.
   */
  const [ban, setBan] = useState<BanStatus>({
    banned: false,
    bannedUntil: null,
    reason: null,
  });

  const banned = ban.banned;

  const [newPost, setNewPost] = useState({
    title: "",
    category: "Kecemasan",
    content: "",
    isAnonymous: false,
    visibility: "public" as "public" | "private",
  });

  const imageUpload = useImageUpload(5);

  // Penyaringan kategori dikerjakan BACKEND.
  const visiblePosts = posts;

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [list, banStatus] = await Promise.all([
        forumAPI.getPosts(selectedCat, { limit: 50 }),
        forumAPI.getBanStatus().catch(() => ({
          banned: false,
          bannedUntil: null,
          reason: null,
        })),
      ]);

      setPosts(list);
      setBan(banStatus);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil postingan forum"
      );
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCat]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleLike = async (id: string) => {
    // Optimistis dulu supaya terasa responsif, lalu
    // diselaraskan dengan jawaban server.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    try {
      const result = await forumAPI.toggleLike(id);

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, liked: result.liked, likes: result.likeCount }
            : p
        )
      );
    } catch (err) {
      // Gagal (mis. 403 karena di-ban): balikkan dan beri tahu.
      setError(
        err instanceof Error ? err.message : "Gagal menyukai postingan"
      );

      await reload();
    }
  };

  const toggleSave = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))
    );

    try {
      const result = await forumAPI.toggleSave(id);

      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, saved: result.saved } : p))
      );
    } catch {
      await reload();
    }
  };

  const handleCreate = async () => {
    if (!newPost.title || !newPost.content) return;

    try {
      setSaving(true);
      setError("");

      await forumAPI.createPost({
        title: newPost.title,
        category: newPost.category,
        content: newPost.content,
        isAnonymous: newPost.isAnonymous,

        // Backend memvalidasi gambar (MIME, ukuran, magic
        // bytes) lalu menyimpannya sebagai berkas.
        image: imageUpload.images[0],
      });

      setNewPost({ title: "", category: "Kecemasan", content: "", isAnonymous: false, visibility: "public" });
      imageUpload.reset();
      setShowCreate(false);

      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal membuat postingan"
      );
    } finally {
      setSaving(false);
    }
  };

  const getReplyCount = (postId: string) =>
    posts.find((p) => p.id === postId)?.comments || 0;

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forum Komunitas</h1>
            <p className="text-sm text-gray-500">Berbagi dan saling mendukung bersama</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/forum/profile"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#6F3FB5] bg-[#F5EEFC] px-3 py-2.5 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <User size={15} /> Profilku
            </Link>
            <button
              onClick={() => !banned && setShowCreate(true)}
              disabled={banned}
              className="flex items-center gap-2 bg-[#6F3FB5] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Buat Post
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                selectedCat === c ? "bg-[#6F3FB5] text-white" : "bg-white text-gray-600 border border-purple-100 hover:border-purple-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Posts list */}
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-3 mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-purple-50 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-purple-100 rounded w-1/3" />
                      <div className="h-3 bg-purple-50 rounded w-1/5" />
                    </div>
                  </div>
                  <div className="h-4 bg-purple-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-purple-50 rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && visiblePosts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Belum ada post</p>
            </div>
          )}

          {!loading && visiblePosts.map((p) => {
            const replyCount = getReplyCount(p.id);
            return (
              <div key={p.id} className="bg-white rounded-2xl p-5 border border-purple-50 hover:border-purple-200 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  {p.isAnonymous ? (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-gray-500" />
                    </div>
                  ) : (
                    <img src={p.avatar || undefined} alt={p.author} className="w-9 h-9 rounded-full object-cover bg-purple-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">
                        {p.isAnonymous ? "Anonymous User" : p.author}
                      </span>
                      <span className="text-xs bg-[#F5EEFC] text-[#6F3FB5] px-2 py-0.5 rounded-full font-medium">{p.category}</span>
                      {p.visibility === "private" && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Lock size={9} /> Privat
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{p.time}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">{p.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{p.excerpt}</p>

                    {/* Post images preview */}
                    {p.images && p.images.length > 0 && (
                      <div className={`grid gap-1.5 mt-3 ${p.images.length === 1 ? "grid-cols-1" : p.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                        {p.images.slice(0, 3).map((img, i) => (
                          <div key={i} className="relative">
                            <img src={img.url} alt="" className="rounded-xl w-full object-cover h-24" />
                            {i === 2 && p.images!.length > 3 && (
                              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                                +{p.images!.length - 3}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-purple-50">
                  <button onClick={() => !banned && toggleLike(p.id)}
                    disabled={banned}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${banned ? "opacity-40 cursor-not-allowed" : ""} ${p.liked ? "text-[#6F3FB5]" : "text-gray-400 hover:text-[#6F3FB5]"}`}>
                    <Heart size={14} fill={p.liked ? "currentColor" : "none"} />
                    {p.likes}
                  </button>
                  <button onClick={() => setDetailPost(p)}
                    disabled={banned}
                    className={`flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#6F3FB5] transition-colors ${banned ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <MessageCircle size={14} /> {replyCount + p.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#6F3FB5] transition-colors">
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={() => !banned && p.authorId !== CURRENT_USER_ID && setReportPost(p)}
                    disabled={banned || p.authorId === CURRENT_USER_ID}
                    title={p.authorId === CURRENT_USER_ID ? "Tidak bisa melaporkan postingan sendiri" : "Laporkan postingan"}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${banned || p.authorId === CURRENT_USER_ID ? "opacity-30 cursor-not-allowed text-gray-400" : "text-gray-400 hover:text-red-500"}`}>
                    <Flag size={13} />
                  </button>
                  <button onClick={() => toggleSave(p.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ml-auto ${p.saved ? "text-[#6F3FB5]" : "text-gray-400 hover:text-[#6F3FB5]"}`}>
                    <Bookmark size={14} fill={p.saved ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banned notice — alasan & masa berlaku dari backend */}
      {banned && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Flag size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">
                Akses forum dibatasi. Kamu masih bisa membaca, tapi
                belum bisa membuat postingan, membalas, atau menyukai.
              </p>
              {ban.reason && (
                <p className="text-xs text-red-600 mt-1">
                  Alasan: {ban.reason}
                </p>
              )}
              <p className="text-xs text-red-500 mt-0.5">
                {ban.bannedUntil
                  ? `Berlaku sampai ${new Date(ban.bannedUntil).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Pembatasan permanen"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail with Replies */}
      {detailPost && (
        <PostDetail
          post={detailPost}
          onClose={() => setDetailPost(null)}
          onReplied={reload}
        />
      )}

      {/* Report Modal */}
      {reportPost && (
        <ReportModal
          post={{ id: reportPost.id, title: reportPost.title, excerpt: reportPost.excerpt, author: reportPost.isAnonymous ? "Anonymous User" : reportPost.author }}
          onClose={() => setReportPost(null)}
        />
      )}

      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-scale-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Buat Post Baru</h2>
              <button onClick={() => { setShowCreate(false); imageUpload.reset(); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kategori</label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5]"
                >
                  {categories.filter((c) => c !== "Semua").map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Judul</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Tulis judul postinganmu..."
                  className="w-full px-3 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ceritamu</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Tulis apa yang ingin kamu bagikan..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] resize-none"
                />
              </div>

              {/* Image upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600">
                    Gambar <span className="font-normal text-gray-400">(maks. 5)</span>
                  </label>
                  <span className="text-xs text-gray-400">{imageUpload.images.length}/5</span>
                </div>

                {imageUpload.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {imageUpload.images.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-full h-20 object-cover rounded-xl" />
                        <button
                          onClick={() => imageUpload.remove(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {imageUpload.images.length < 5 && (
                      <button
                        onClick={() => imageUpload.inputRef.current?.click()}
                        className="h-20 border-2 border-dashed border-purple-200 rounded-xl flex items-center justify-center text-purple-300 hover:border-[#6F3FB5] hover:text-[#6F3FB5] transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                )}

                {imageUpload.images.length === 0 && (
                  <button
                    onClick={() => imageUpload.inputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-purple-200 rounded-xl text-sm text-gray-400 hover:border-[#6F3FB5] hover:text-[#6F3FB5] transition-colors"
                  >
                    <Image size={16} />
                    Upload gambar (jpg, jpeg, png, webp)
                  </button>
                )}

                <input
                  ref={imageUpload.inputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => imageUpload.handleFiles(e.target.files)}
                />
              </div>

              {/* Anonymous & Visibility */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setNewPost((p) => ({ ...p, isAnonymous: !p.isAnonymous }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${newPost.isAnonymous ? "border-[#6F3FB5] bg-[#F5EEFC] text-[#6F3FB5]" : "border-gray-100 text-gray-500 hover:border-purple-200"}`}
                >
                  <EyeOff size={14} />
                  {newPost.isAnonymous ? "Anonim Aktif" : "Posting Anonim"}
                </button>
                <button
                  onClick={() => setNewPost((p) => ({ ...p, visibility: p.visibility === "public" ? "private" : "public" }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${newPost.visibility === "private" ? "border-[#6F3FB5] bg-[#F5EEFC] text-[#6F3FB5]" : "border-gray-100 text-gray-500 hover:border-purple-200"}`}
                >
                  {newPost.visibility === "private" ? <Lock size={14} /> : <Eye size={14} />}
                  {newPost.visibility === "private" ? "Hanya Saya" : "Publik"}
                </button>
              </div>

              {newPost.isAnonymous && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                  Nama dan foto profilmu akan disembunyikan. Postingan akan tampil sebagai "Anonymous User".
                </p>
              )}

              <button
                onClick={handleCreate}
                disabled={saving || !newPost.title || !newPost.content}
                className="w-full bg-[#6F3FB5] text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Memposting..." : "Publish Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
