import { useEffect, useState, useRef, ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import AdminSidebar from "../../components/AdminSidebar"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Archive,
  Upload,
  ImageIcon,
} from "lucide-react"

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// mind_hub_articles
//   id, title, category, thumbnail, short_description, content, tags, status, created_by, created_at
//
// status: 'draft' | 'published' | 'archived'
// category: 'Mind and Balance' | 'Self Care Corner'
//
// Published articles automatically appear on User Dashboard → Mind Hub
// ======================================================

interface AdminSession {
  role: string
  name: string
}

interface MindHubArticle {
  id: string
  title: string
  category: "Mind and Balance" | "Self-Care Corner"
  thumbnail: string
  shortDescription: string
  content: string
  tags: string
  status: "draft" | "published" | "archived"
  duration: string
  createdBy: string
  createdAt: string
  updatedAt: string
  // legacy compat
  image?: string
  excerpt?: string
  published?: boolean
}

type FilterTab = "Semua" | "Mind and Balance" | "Self-Care Corner"

const STORAGE_KEY = "hearme_mindhub_admin"
const SESSION_KEY = "hearme_admin_session"


function StatusBadge({ status }: { status: MindHubArticle["status"] }) {
  const map = {
    published: "bg-green-100 text-green-800",
    draft: "bg-gray-100 text-gray-600",
    archived: "bg-yellow-100 text-yellow-700",
  }
  const labels = {
    published: "Dipublikasikan",
    draft: "Draft",
    archived: "Diarsipkan",
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status]}`}
    >
      {labels[status]}
    </span>
  )
}

interface ModalProps {
  item: MindHubArticle | null
  onClose: () => void
  onSave: (
    data: Omit<MindHubArticle, "id" | "status" | "createdAt" | "updatedAt" | "createdBy">,
  ) => void
}

function ArticleModal({ item, onClose, onSave }: ModalProps) {
  const [title, setTitle] = useState(item?.title ?? "")
  const [category, setCategory] =
    useState<"Mind and Balance" | "Self-Care Corner">(
      item?.category ?? "Mind and Balance",
    )
  const [thumbnail, setThumbnail] = useState(
    item?.thumbnail ?? item?.image ?? "",
  )
  const [thumbnailError, setThumbnailError] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [shortDescription, setShortDescription] = useState(
    item?.shortDescription ?? item?.excerpt ?? "",
  )
  const [content, setContent] = useState(item?.content ?? "")
  const [tags, setTags] = useState(item?.tags ?? "")
  const [duration, setDuration] = useState(item?.duration ?? "")

  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  const handleImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailError("")
    if (!ALLOWED_TYPES.includes(file.type)) {
      setThumbnailError("Format tidak didukung. Gunakan JPG, PNG, atau WEBP.")
      return
    }
    if (file.size > MAX_SIZE) {
      setThumbnailError("Ukuran file melebihi 5MB.")
      return
    }
    // ======================================================
    // ## STORAGE / API TEMPLATE IF CONNECTED ##
    // TODO: Upload Mind Hub image to Supabase Storage / Firebase / S3
    // TODO: Save returned URL/path into mind_hub_articles.image_url
    // ======================================================
    const reader = new FileReader()
    reader.onload = (ev) => setThumbnail(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!title || !shortDescription || !content) return
    onSave({
      title,
      category,
      thumbnail,
      shortDescription,
      content,
      tags,
      duration,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
          <h2 className="text-lg font-semibold text-[#6F3FB5]">
            {item ? "Edit Artikel" : "Tambah Artikel"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="Mind and Balance">Mind and Balance</option>
              <option value="Self-Care Corner">Self-Care Corner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail Image
              <span className="ml-2 text-xs font-normal text-gray-400">JPG, PNG, WEBP · Maks. 5MB</span>
            </label>
            {thumbnail ? (
              <div className="relative">
                <img src={thumbnail} alt="" className="h-40 w-full rounded-xl object-cover border border-gray-200" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/90 text-xs font-semibold text-gray-700 rounded-lg shadow hover:bg-white transition-colors border border-gray-200">
                    <ImageIcon size={11} /> Ganti
                  </button>
                  <button onClick={() => setThumbnail("")}
                    className="p-1.5 bg-white/90 text-gray-500 rounded-lg shadow hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-purple-200 rounded-xl py-8 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                <Upload size={24} className="text-[#6F3FB5] opacity-70" />
                <span className="text-sm font-medium text-[#6F3FB5]">Browse & Upload Gambar</span>
                <span className="text-xs text-gray-400">JPG, PNG, WEBP · Maks. 5MB</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleImageFile} />
            {thumbnailError && <p className="mt-1 text-xs text-red-500">{thumbnailError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konten
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags{" "}
              <span className="font-normal text-gray-400">
                (pisahkan dengan koma)
              </span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Kesehatan Mental, Stres, Meditasi"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimasi Baca
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="contoh: 5 menit"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-purple-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title || !shortDescription || !content}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#6F3FB5" }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 animate-scale-in">
        <h3 className="font-semibold text-gray-900 mb-2">Hapus Artikel?</h3>
        <p className="text-sm text-gray-500 mb-5">
          Artikel <strong>"{title}"</strong> akan dihapus secara permanen dan
          tidak bisa dikembalikan.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            Hapus
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}

function migrateItem(it: MindHubArticle): MindHubArticle {
  return {
    ...it,
    thumbnail: it.thumbnail ?? it.image ?? "",
    shortDescription: it.shortDescription ?? it.excerpt ?? "",
    status: it.status ?? (it.published ? "published" : "draft"),
    tags: it.tags ?? "",
    duration: it.duration ?? "5 menit",
    createdBy: it.createdBy ?? "Admin",
  }
}

export default function AdminMindHubPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<MindHubArticle[]>([])
  const [filter, setFilter] = useState<FilterTab>("Semua")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MindHubArticle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MindHubArticle | null>(null)

  useEffect(() => {
  const sessionRaw =
    localStorage.getItem("hearme_admin_session");

  if (!sessionRaw) {
    navigate("/admin/login");
    return;
  }

  setSession(JSON.parse(sessionRaw));

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      setItems(JSON.parse(raw).map(migrateItem));
    }
  } catch {
    setItems([]);
  }
}, [navigate]);

  const persist = (next: MindHubArticle[]) => {
    setItems(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const handleLogout = () => {
  localStorage.removeItem(
    "hearme_admin_session"
  );

  navigate("/admin/login");
};

  const handleSave = (
    data: Omit<MindHubArticle, "id" | "status" | "createdAt" | "updatedAt" | "createdBy">,
  ) => {
    const now = new Date().toISOString()
    if (editingItem) {
      persist(
        items.map((it) =>
          it.id === editingItem.id
            ? {
                ...it,
                ...data,
                image: data.thumbnail,
                excerpt: data.shortDescription,
                updatedAt: now,
              }
            : it,
        ),
      )
    } else {
      const newItem: MindHubArticle = {
        id: `mh_${Date.now()}`,
        ...data,
        image: data.thumbnail,
        excerpt: data.shortDescription,
        status: "draft",
        published: false,
        createdBy: "Admin",
        createdAt: now,
        updatedAt: now,
      }
      persist([...items, newItem])
    }
    setModalOpen(false)
    setEditingItem(null)
  }

  const handleDelete = (id: string) => {
    persist(items.filter((it) => it.id !== id))
    setDeleteTarget(null)
  }

  const cycleStatus = (id: string) => {
    const order: MindHubArticle["status"][] = ["draft", "published", "archived"]
    persist(
      items.map((it) => {
        if (it.id !== id) return it
        const next = order[(order.indexOf(it.status) + 1) % order.length]
        return {
          ...it,
          status: next,
          published: next === "published",
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }

  const [session, setSession] =
  useState<AdminSession | null>(null);

  const filtered =
    filter === "Semua" ? items : items.filter((it) => it.category === filter)
  const tabs: FilterTab[] = ["Semua", "Mind and Balance", "Self-Care Corner"]

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FAF8FD" }}>
    {session && (
  <AdminSidebar
    session={session}
    onLogout={handleLogout}
  />
)}

      <main className="flex-1 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Kelola Mind Hub
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Artikel yang dipublikasikan otomatis muncul pada halaman Mind Hub
              user
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#6F3FB5" }}
          >
            <Plus size={18} /> Tambah Artikel
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(["draft", "published", "archived"] as const).map((s) => {
            const count = items.filter((i) => i.status === s).length
            const labels = {
              draft: "Draft",
              published: "Dipublikasikan",
              archived: "Diarsipkan",
            }
            const colors = {
              draft: "text-gray-600 bg-gray-50",
              published: "text-green-700 bg-green-50",
              archived: "text-yellow-700 bg-amber-50",
            }
            return (
              <div
                key={s}
                className={`rounded-xl p-4 border border-purple-100 ${colors[s].split(" ")[1]}`}
              >
                <p className={`text-2xl font-bold ${colors[s].split(" ")[0]}`}>
                  {count}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{labels[s]}</p>
              </div>
            )
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === tab
                  ? "text-white"
                  : "text-gray-600 hover:bg-purple-50"
              }`}
              style={
                filter === tab
                  ? { backgroundColor: "#6F3FB5" }
                  : { backgroundColor: "white", border: "1px solid #C9A9E9" }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
          style={{ border: "1px solid #C9A9E9" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: "#FAF8FD",
                  borderBottom: "1px solid #C9A9E9",
                }}
              >
                <th className="text-left px-5 py-3.5 font-semibold text-gray-700">
                  Artikel
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-700">
                  Kategori
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-700">
                  Tags
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Belum ada artikel.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t"
                    style={{ borderColor: "#EDE7F6" }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-purple-50"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-800 max-w-xs truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">
                            {item.shortDescription}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: "#EDE7F6", color: "#6F3FB5" }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {(item.tags || "")
                          .split(",")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((t) => (
                            <span
                              key={t}
                              className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full"
                            >
                              {t.trim()}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cycleStatus(item.id)}
                          title={
                            item.status === "published"
                              ? "Unpublish → Archived"
                              : item.status === "draft"
                                ? "Publish"
                                : "Kembalikan ke Draft"
                          }
                          className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                          style={{ color: "#6F3FB5" }}
                        >
                          {item.status === "published" ? (
                            <EyeOff size={16} />
                          ) : item.status === "archived" ? (
                            <Archive size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item)
                            setModalOpen(true)
                          }}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Hapus"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {modalOpen && (
        <ArticleModal
          item={editingItem}
          onClose={() => {
            setModalOpen(false)
            setEditingItem(null)
          }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          title={deleteTarget.title}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
