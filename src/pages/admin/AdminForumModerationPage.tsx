import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flag, Eye, Trash2, ShieldBan, X, CheckCircle, AlertTriangle, Image as ImageIcon } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// TABLE: forum_reports
// FIELDS:
//   id, post_id, reporter_user_id, reason, description,
//   status (pending | reviewed | dismissed),
//   created_at, reviewed_at, reviewed_by
//
// TABLE: user_bans
// FIELDS:
//   id, user_id, reason, duration_days (null = permanent),
//   banned_at, expires_at, banned_by
//
// ======================================================

interface ForumReport {
  id: string;
  postId: string;
  postTitle: string;
  postContent: string;
  postAuthor: string;
  postImages?: { url: string }[];
  reporterUserId: string;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface BanOption { label: string; days: number | null; }

const BAN_OPTIONS: BanOption[] = [
  { label: "1 Hari", days: 1 },
  { label: "3 Hari", days: 3 },
  { label: "7 Hari", days: 7 },
  { label: "30 Hari", days: 30 },
  { label: "Permanent", days: null },
];

function loadReports(): ForumReport[] {
  try { return JSON.parse(localStorage.getItem("hearme_forum_reports") || "[]"); }
  catch { return []; }
}
function saveReports(r: ForumReport[]) {
  localStorage.setItem("hearme_forum_reports", JSON.stringify(r));
}

function getPostCounts(): Record<string, number> {
  const reports = loadReports();
  return reports.reduce((acc, r) => { acc[r.postId] = (acc[r.postId] || 0) + 1; return acc; }, {} as Record<string, number>);
}

function grouped(reports: ForumReport[]): ForumReport[] {
  const seen = new Set<string>();
  return reports.filter((r) => { if (seen.has(r.postId)) return false; seen.add(r.postId); return true; });
}

// ---- Delete Confirmation Modal ----
function DeleteModal({ postTitle, onConfirm, onCancel }: { postTitle: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Hapus Postingan?</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{postTitle}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-5">Postingan akan dihapus secara permanen dari forum.</p>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
            Hapus Postingan
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Ban User Modal ----
function BanModal({ authorName, onConfirm, onCancel }: {
  authorName: string;
  onConfirm: (days: number | null, reason: string) => void;
  onCancel: () => void;
}) {
  const [selectedDays, setSelectedDays] = useState<number | null>(1);
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldBan size={16} className="text-red-500" />
            <h3 className="font-semibold text-gray-900">Ban User: {authorName}</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Durasi Ban</label>
            <div className="flex flex-wrap gap-2">
              {BAN_OPTIONS.map((opt) => (
                <button key={opt.label} onClick={() => setSelectedDays(opt.days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${selectedDays === opt.days ? "border-red-500 bg-red-50 text-red-600" : "border-gray-200 text-gray-600 hover:border-red-300"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason for Ban <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan ban..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-red-400 transition-colors" />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Batal
          </button>
          <button onClick={() => reason.trim() && onConfirm(selectedDays, reason.trim())} disabled={!reason.trim()}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
            Ban User
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Detail Panel ----
function DetailPanel({ report, allReports, onDismiss, onDelete, onBan, onClose }: {
  report: ForumReport;
  allReports: ForumReport[];
  onDismiss: () => void;
  onDelete: () => void;
  onBan: () => void;
  onClose: () => void;
}) {
  const postReports = allReports.filter((r) => r.postId === report.postId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-900">Detail Report</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Post info */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Postingan</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-900 text-sm mb-1">{report.postTitle}</p>
              <p className="text-xs text-gray-500 mb-2">oleh {report.postAuthor}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.postContent}</p>
              {report.postImages && report.postImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {report.postImages.map((img, i) => (
                    <img key={i} src={img.url} alt="" className="rounded-lg h-20 w-full object-cover" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All reports for this post */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Laporan ({postReports.length})
            </p>
            <div className="space-y-2">
              {postReports.map((r) => (
                <div key={r.id} className="bg-red-50 rounded-xl p-3 border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Flag size={12} className="text-red-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-red-700">{r.reason}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {new Date(r.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  {r.description && <p className="text-xs text-red-600 mt-1">{r.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            <button onClick={onDismiss}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
              <CheckCircle size={14} /> Dismiss Report
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
              <Trash2 size={14} /> Delete Forum
            </button>
            <button onClick={onBan}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
              <ShieldBan size={14} /> Ban User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusBadge(status: ForumReport["status"]) {
  const map = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    reviewed: "bg-blue-50 text-blue-700 border-blue-200",
    dismissed: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const labels = { pending: "Pending", reviewed: "Ditinjau", dismissed: "Dismissed" };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${map[status]}`}>{labels[status]}</span>
  );
}

export default function AdminForumModerationPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ name: string; role: string } | null>(null);
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "reviewed" | "dismissed">("all");
  const [detailReport, setDetailReport] = useState<ForumReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ForumReport | null>(null);
  const [banTarget, setBanTarget] = useState<ForumReport | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("hearme_admin_session");
    if (!raw) { navigate("/admin/login"); return; }
    setSession(JSON.parse(raw));
    setReports(loadReports());
  }, [navigate]);

  const persist = (updated: ForumReport[]) => {
    setReports(updated);
    saveReports(updated);
  };

  const handleDismiss = (postId: string) => {
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // TODO: UPDATE forum_reports SET status = 'dismissed', reviewed_at = NOW(), reviewed_by = admin_id WHERE post_id = ?
    // ======================================================
    const updated = reports.map((r) =>
      r.postId === postId ? { ...r, status: "dismissed" as const, reviewedAt: new Date().toISOString(), reviewedBy: session?.name } : r
    );
    persist(updated);
    setDetailReport(null);
  };

  const handleDeletePost = (postId: string) => {
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // TODO: DELETE FROM forum_posts WHERE id = ?
    // TODO: UPDATE forum_reports SET status = 'reviewed', reviewed_at = NOW() WHERE post_id = ?
    // ======================================================
    const posts: { id: string }[] = JSON.parse(localStorage.getItem("hearme_forum_v2") || "[]");
    localStorage.setItem("hearme_forum_v2", JSON.stringify(posts.filter((p) => p.id !== postId)));
    const updatedReports = reports.map((r) =>
      r.postId === postId ? { ...r, status: "reviewed" as const, reviewedAt: new Date().toISOString(), reviewedBy: session?.name } : r
    );
    persist(updatedReports);
    setDetailReport(null);
    setDeleteTarget(null);
  };

  const handleBanUser = (report: ForumReport, days: number | null, reason: string) => {
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // TODO: INSERT INTO user_bans (user_id, reason, duration_days, expires_at, banned_by) VALUES (...)
    // TODO: UPDATE forum_reports SET status = 'reviewed', reviewed_at = NOW() WHERE post_id = ?
    // ======================================================
    const bans = JSON.parse(localStorage.getItem("hearme_user_bans") || "[]");
    const expiresAt = days ? new Date(Date.now() + days * 86400000).toISOString() : null;
    bans.push({
      userId: report.reporterUserId === "me" ? report.postAuthor : report.postAuthor,
      authorName: report.postAuthor,
      postId: report.postId,
      reason,
      durationDays: days,
      bannedAt: new Date().toISOString(),
      expiresAt,
      bannedBy: session?.name || "Admin",
    });
    localStorage.setItem("hearme_user_bans", JSON.stringify(bans));

    const updatedReports = reports.map((r) =>
      r.postId === report.postId ? { ...r, status: "reviewed" as const, reviewedAt: new Date().toISOString(), reviewedBy: session?.name } : r
    );
    persist(updatedReports);
    setBanTarget(null);
    setDetailReport(null);
  };

  if (!session) return null;

  const uniqueReports = grouped(reports);
  const postCounts = getPostCounts();

  const filtered = (filterStatus === "all" ? uniqueReports : uniqueReports.filter((r) => r.status === filterStatus))
    .sort((a, b) => (a.status === "pending" ? -1 : 1) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const counts = {
    all: uniqueReports.length,
    pending: uniqueReports.filter((r) => r.status === "pending").length,
    reviewed: uniqueReports.filter((r) => r.status === "reviewed").length,
    dismissed: uniqueReports.filter((r) => r.status === "dismissed").length,
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FAF8FD" }}>
      <AdminSidebar session={session} onLogout={() => { localStorage.removeItem("hearme_admin_session"); navigate("/admin/login"); }} />

      <main className="flex-1 px-8 py-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Forum Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">Tinjau dan tindaklanjuti laporan postingan dari komunitas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {(["all", "pending", "reviewed", "dismissed"] as const).map((s) => {
            const labels = { all: "Total", pending: "Pending", reviewed: "Ditinjau", dismissed: "Dismissed" };
            const colors = { all: "text-gray-700", pending: "text-amber-600", reviewed: "text-blue-600", dismissed: "text-gray-500" };
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`p-4 bg-white rounded-xl border text-left hover:shadow-sm transition-all ${filterStatus === s ? "border-[#6F3FB5]" : "border-purple-100"}`}>
                <p className={`text-2xl font-bold ${colors[s]}`}>{counts[s]}</p>
                <p className="text-xs text-gray-500 mt-0.5">{labels[s]}</p>
              </button>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(["all", "pending", "reviewed", "dismissed"] as const).map((s) => {
            const labels = { all: "Semua", pending: "Pending", reviewed: "Ditinjau", dismissed: "Dismissed" };
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterStatus === s ? "bg-[#6F3FB5] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                {labels[s]} {counts[s] > 0 && <span className="ml-1 text-xs opacity-70">({counts[s]})</span>}
              </button>
            );
          })}
        </div>

        {/* Reports list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
            <Flag size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">Tidak ada laporan</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Postingan</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Pembuat</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Laporan</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Tanggal</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((report) => (
                  <tr key={report.postId} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-medium text-gray-800 truncate">{report.postTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{report.postContent?.slice(0, 60)}...</p>
                      {report.postImages && report.postImages.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                          <ImageIcon size={10} /> {report.postImages.length} gambar
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700">{report.postAuthor}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {postCounts[report.postId] || 1}
                        </span>
                        <span className="text-xs text-gray-600 truncate max-w-[100px]">{report.reason}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">{statusBadge(report.status)}</td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setDetailReport(report)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6F3FB5] bg-[#F5EEFC] rounded-lg hover:bg-purple-100 transition-colors">
                        <Eye size={12} /> View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Detail Panel */}
      {detailReport && (
        <DetailPanel
          report={detailReport}
          allReports={reports}
          onDismiss={() => handleDismiss(detailReport.postId)}
          onDelete={() => setDeleteTarget(detailReport)}
          onBan={() => setBanTarget(detailReport)}
          onClose={() => setDetailReport(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteModal
          postTitle={deleteTarget.postTitle}
          onConfirm={() => handleDeletePost(deleteTarget.postId)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Ban modal */}
      {banTarget && (
        <BanModal
          authorName={banTarget.postAuthor}
          onConfirm={(days, reason) => handleBanUser(banTarget, days, reason)}
          onCancel={() => setBanTarget(null)}
        />
      )}
    </div>
  );
}
