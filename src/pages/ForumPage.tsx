import { useState, useRef } from "react";
import {
  Heart, MessageCircle, Plus, X, Bookmark, EyeOff, Eye,
  User, Lock, Image, Trash2, Pencil, Send, Share2, Flag, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { forumPosts as mockPosts } from "../data/mockData";

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

const REPORT_REASONS = [
  "Harassment / Bullying",
  "Hate Speech",
  "Sexual Content",
  "Spam",
  "Misinformation",
  "Self-harm / Dangerous Content",
  "Other",
];

interface ForumReport {
  id: string;
  postId: string;
  postTitle: string;
  postContent: string;
  postAuthor: string;
  reporterUserId: string;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

function loadReports(): ForumReport[] {
  try { return JSON.parse(localStorage.getItem("hearme_forum_reports") || "[]"); }
  catch { return []; }
}
function saveReports(r: ForumReport[]) {
  localStorage.setItem("hearme_forum_reports", JSON.stringify(r));
}

function isUserBanned(): boolean {
  try {
    const bans: { userId: string; expiresAt: string | null }[] = JSON.parse(localStorage.getItem("hearme_user_bans") || "[]");
    const ban = bans.find((b) => b.userId === CURRENT_USER_ID);
    if (!ban) return false;
    if (!ban.expiresAt) return true; // permanent
    return new Date(ban.expiresAt) > new Date();
  } catch { return false; }
}

// ---- Report Modal ----
function ReportModal({ post, onClose }: { post: { id: string; title: string; excerpt: string; author: string }; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!reason) return;
    // ======================================================
    // ## API TEMPLATE IF CONNECTED ##
    // TODO: POST /api/forum/reports
    // SERVICE: Moderation Service
    // ENDPOINT: POST /api/forum/reports
    //   body: { post_id, reason, description }
    // ======================================================
    const reports = loadReports();
    const newReport: ForumReport = {
      id: `rep_${Date.now()}`,
      postId: post.id,
      postTitle: post.title,
      postContent: post.excerpt,
      postAuthor: post.author,
      reporterUserId: CURRENT_USER_ID,
      reason,
      description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    saveReports([...reports, newReport]);
    setSubmitted(true);
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
                <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reason === r ? "border-[#6F3FB5] bg-[#F5EEFC]" : "border-gray-100 hover:border-purple-200"}`}>
                  <input type="radio" name="report_reason" value={r} checked={reason === r}
                    onChange={() => setReason(r)} className="accent-[#6F3FB5]" />
                  <span className="text-sm text-gray-700">{r}</span>
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
          <button onClick={handleSubmit} disabled={!reason}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

const CURRENT_USER_ID = "me";
const CURRENT_USER_NAME = "Kamu";

interface ForumImage { url: string; }

interface ForumReply {
  id: string;
  postId: string;
  parentReplyId: string | null;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  depth: number; // 0 = direct reply, 1 = reply to reply, 2 = nested reply (max)
}

interface ForumPost {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  category: string;
  title: string;
  excerpt: string;
  likes: number;
  comments: number;
  time: string;
  liked: boolean;
  saved?: boolean;
  archived?: boolean;
  isAnonymous: boolean;
  visibility: "public" | "private";
  images?: ForumImage[];
  content?: string;
}

const categories = ["Semua", "Kecemasan", "Hubungan", "Studi", "Pekerjaan", "Self Improvement"];

function loadPosts(): ForumPost[] {
  const raw = localStorage.getItem("hearme_forum_v2");
  if (!raw) {
    const init: ForumPost[] = (mockPosts as ForumPost[]).map((p) => ({
      ...p,
      authorId: p.id === "f1" ? CURRENT_USER_ID : "other",
      isAnonymous: false,
      visibility: "public" as const,
      saved: false,
      archived: false,
      images: [],
    }));
    localStorage.setItem("hearme_forum_v2", JSON.stringify(init));
    return init;
  }
  return JSON.parse(raw);
}

function savePosts(posts: ForumPost[]) {
  localStorage.setItem("hearme_forum_v2", JSON.stringify(posts));
}

function loadReplies(): ForumReply[] {
  try { return JSON.parse(localStorage.getItem("hearme_forum_replies") || "[]"); }
  catch { return []; }
}

function saveReplies(replies: ForumReply[]) {
  localStorage.setItem("hearme_forum_replies", JSON.stringify(replies));
}

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
function ReplyThread({
  postId, replies, parentReplyId = null, depth = 0,
  allReplies, onUpdate,
}: {
  postId: string;
  replies: ForumReply[];
  parentReplyId?: string | null;
  depth?: number;
  allReplies: ForumReply[];
  onUpdate: (replies: ForumReply[]) => void;
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState("");

  const levelReplies = replies.filter((r) => r.parentReplyId === parentReplyId);
  if (levelReplies.length === 0) return null;

  const handleLike = (id: string) => {
    const updated = allReplies.map((r) =>
      r.id === id ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r
    );
    onUpdate(updated);
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim()) return;
    const newReply: ForumReply = {
      id: `r${Date.now()}`,
      postId,
      parentReplyId: parentId,
      userId: CURRENT_USER_ID,
      userName: CURRENT_USER_NAME,
      content: replyText.trim(),
      likes: 0,
      liked: false,
      createdAt: new Date().toISOString(),
      depth: depth + 1,
    };
    const updated = [...allReplies, newReply];
    onUpdate(updated);
    setReplyText("");
    setReplyingTo(null);
  };

  const handleEdit = (id: string) => {
    if (!editText.trim()) return;
    const updated = allReplies.map((r) => r.id === id ? { ...r, content: editText.trim() } : r);
    onUpdate(updated);
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = (id: string) => {
    const updated = allReplies.filter((r) => r.id !== id && r.parentReplyId !== id);
    onUpdate(updated);
  };

  return (
    <div className={`flex flex-col gap-3 ${depth > 0 ? "ml-8 pl-3 border-l-2 border-purple-100" : ""}`}>
      {levelReplies.map((reply) => (
        <div key={reply.id} className="group">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
              {reply.userName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-[#FAF8FD] rounded-xl px-3 py-2.5 mb-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-800">{reply.userName}</span>
                  <span className="text-[10px] text-gray-400">{timeAgo(reply.createdAt)}</span>
                </div>
                {editingId === reply.id ? (
                  <div className="flex gap-2 mt-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="flex-1 text-xs px-2 py-1.5 border border-purple-200 rounded-lg resize-none focus:outline-none focus:border-[#6F3FB5]"
                    />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleEdit(reply.id)}
                        className="p-1.5 bg-[#6F3FB5] text-white rounded-lg hover:bg-[#5c32a0] transition-colors">
                        <Send size={11} />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-700 leading-relaxed">{reply.content}</p>
                )}
              </div>

              <div className="flex items-center gap-3 px-1">
                <button onClick={() => handleLike(reply.id)}
                  className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${reply.liked ? "text-[#6F3FB5]" : "text-gray-400 hover:text-[#6F3FB5]"}`}>
                  <Heart size={11} fill={reply.liked ? "currentColor" : "none"} />
                  {reply.likes > 0 && reply.likes}
                </button>

                {depth < 2 && (
                  <button onClick={() => { setReplyingTo(replyingTo === reply.id ? null : reply.id); setReplyText(""); }}
                    className="text-[10px] font-semibold text-gray-400 hover:text-[#6F3FB5] transition-colors">
                    Balas
                  </button>
                )}

                {reply.userId === CURRENT_USER_ID && (
                  <>
                    <button onClick={() => { setEditingId(reply.id); setEditText(reply.content); }}
                      className="text-[10px] font-semibold text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-0.5">
                      <Pencil size={9} /> Edit
                    </button>
                    <button onClick={() => handleDelete(reply.id)}
                      className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5">
                      <Trash2 size={9} /> Hapus
                    </button>
                  </>
                )}
              </div>

              {replyingTo === reply.id && (
                <div className="flex gap-2 mt-2 ml-1">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Balas ${reply.userName}...`}
                    rows={2}
                    className="flex-1 text-xs px-3 py-2 border border-purple-200 rounded-xl resize-none focus:outline-none focus:border-[#6F3FB5] bg-white"
                  />
                  <button onClick={() => handleSubmitReply(reply.id)} disabled={!replyText.trim()}
                    className="self-end p-2 bg-[#6F3FB5] text-white rounded-xl hover:bg-[#5c32a0] transition-colors disabled:opacity-50">
                    <Send size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Nested replies */}
          {depth < 2 && (
            <div className="mt-2">
              <ReplyThread
                postId={postId}
                replies={allReplies}
                parentReplyId={reply.id}
                depth={depth + 1}
                allReplies={allReplies}
                onUpdate={onUpdate}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Post Detail View with Replies ----
function PostDetail({
  post, onClose, allReplies, onRepliesUpdate,
}: {
  post: ForumPost;
  onClose: () => void;
  allReplies: ForumReply[];
  onRepliesUpdate: (r: ForumReply[]) => void;
}) {
  const [newReply, setNewReply] = useState("");

  const postReplies = allReplies.filter((r) => r.postId === post.id);

  const handleSubmitReply = () => {
    if (!newReply.trim()) return;
    const r: ForumReply = {
      id: `r${Date.now()}`,
      postId: post.id,
      parentReplyId: null,
      userId: CURRENT_USER_ID,
      userName: CURRENT_USER_NAME,
      content: newReply.trim(),
      likes: 0,
      liked: false,
      createdAt: new Date().toISOString(),
      depth: 0,
    };
    onRepliesUpdate([...allReplies, r]);
    setNewReply("");
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

          {/* Replies tree */}
          {postReplies.filter((r) => r.parentReplyId === null).length > 0 ? (
            <ReplyThread
              postId={post.id}
              replies={allReplies}
              parentReplyId={null}
              depth={0}
              allReplies={allReplies}
              onUpdate={onRepliesUpdate}
            />
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
  const [posts, setPosts] = useState<ForumPost[]>(loadPosts);
  const [replies, setReplies] = useState<ForumReply[]>(loadReplies);
  const [showCreate, setShowCreate] = useState(false);
  const [detailPost, setDetailPost] = useState<ForumPost | null>(null);
  const [reportPost, setReportPost] = useState<ForumPost | null>(null);
  const banned = isUserBanned();
  const [newPost, setNewPost] = useState({
    title: "",
    category: "Kecemasan",
    content: "",
    isAnonymous: false,
    visibility: "public" as "public" | "private",
  });

  const imageUpload = useImageUpload(5);

  const visiblePosts = posts.filter((p) => {
    if (p.archived) return false;
    if (p.visibility === "private" && p.authorId !== CURRENT_USER_ID) return false;
    if (selectedCat !== "Semua" && p.category !== selectedCat) return false;
    return true;
  });

  const updatePosts = (updated: ForumPost[]) => { setPosts(updated); savePosts(updated); };
  const updateReplies = (updated: ForumReply[]) => { setReplies(updated); saveReplies(updated); };

  const toggleLike = (id: string) => {
    updatePosts(posts.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (id: string) => {
    updatePosts(posts.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  const handleCreate = () => {
    if (!newPost.title || !newPost.content) return;
    const post: ForumPost = {
      id: `f${Date.now()}`,
      authorId: CURRENT_USER_ID,
      author: newPost.isAnonymous ? "Anonymous User" : CURRENT_USER_NAME,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format",
      category: newPost.category,
      title: newPost.title,
      content: newPost.content,
      excerpt: newPost.content.slice(0, 150),
      likes: 0,
      comments: 0,
      time: "Baru saja",
      liked: false,
      saved: false,
      archived: false,
      isAnonymous: newPost.isAnonymous,
      visibility: newPost.visibility,
      images: imageUpload.images.map((url) => ({ url })),
    };
    updatePosts([post, ...posts]);
    setNewPost({ title: "", category: "Kecemasan", content: "", isAnonymous: false, visibility: "public" });
    imageUpload.reset();
    setShowCreate(false);
  };

  const getReplyCount = (postId: string) => replies.filter((r) => r.postId === postId).length;

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
          {visiblePosts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Belum ada post</p>
            </div>
          )}

          {visiblePosts.map((p) => {
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

      {/* Banned notice */}
      {banned && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Flag size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">Akun Anda dibatasi. Beberapa fitur forum tidak tersedia.</p>
          </div>
        </div>
      )}

      {/* Post Detail with Replies */}
      {detailPost && (
        <PostDetail
          post={detailPost}
          onClose={() => setDetailPost(null)}
          allReplies={replies}
          onRepliesUpdate={updateReplies}
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
                disabled={!newPost.title || !newPost.content}
                className="w-full bg-[#6F3FB5] text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publish Post
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
