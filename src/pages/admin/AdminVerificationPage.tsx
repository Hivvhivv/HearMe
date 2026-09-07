import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, XCircle, Clock, X, Eye, Download, Image as ImageIcon, History, ChevronDown, ChevronUp } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// TABLE: psychologists
//   id, user_id, name, email, specialization,
//   verification_status, created_at
//
// TABLE: verified_psychologists
//   id, psychologist_id, verified_by, verified_at, status (active|inactive)
//
// TABLE: psychologist_verification_submissions
//   id, psychologist_id, submission_number, submission_type,
//   status, rejection_reason, admin_note,
//   submitted_at, reviewed_at, reviewed_by
//
// TABLE: psychologist_documents
//   id, psychologist_id, document_type,
//   file_name, file_url, file_type, file_size, uploaded_at
//
// ======================================================

interface DocFileRef {
  documentType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

interface VerificationSubmission {
  id: string;
  psychologistId: string;
  psychologistName: string;
  email: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  submissionType: "initial" | "resubmission";
  submissionNumber: number;
  documents: DocFileRef[];
  rejectionReason?: string;
  adminNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// Seed data for demo — uses placeholder documents
const SEED_VERIFICATIONS: VerificationSubmission[] = [
  {
    id: "ver_seed_001",
    psychologistId: "PSY-2024-001",
    psychologistName: "Dr. Siti Rahayu, M.Psi",
    email: "siti.rahayu@email.com",
    submittedBy: "siti.rahayu@email.com",
    submittedAt: "2026-08-12T08:00:00.000Z",
    status: "pending",
    submissionType: "initial",
    submissionNumber: 1,
    documents: [
      { documentType: "ktp", fileName: "KTP_Siti.jpg", fileType: "image/jpeg", fileSize: 512000, fileUrl: "", uploadedAt: "2026-08-12T08:00:00.000Z" },
      { documentType: "str", fileName: "STR_Siti.pdf", fileType: "application/pdf", fileSize: 1024000, fileUrl: "", uploadedAt: "2026-08-12T08:00:00.000Z" },
      { documentType: "sip", fileName: "SIP_Siti.pdf", fileType: "application/pdf", fileSize: 800000, fileUrl: "", uploadedAt: "2026-08-12T08:00:00.000Z" },
      { documentType: "sertifikat", fileName: "Sertifikat_Siti.pdf", fileType: "application/pdf", fileSize: 600000, fileUrl: "", uploadedAt: "2026-08-12T08:00:00.000Z" },
    ],
  },
  {
    id: "ver_seed_002",
    psychologistId: "PSY-2024-002",
    psychologistName: "Dr. Budi Santoso, M.Psi",
    email: "budi.santoso@email.com",
    submittedBy: "budi.santoso@email.com",
    submittedAt: "2026-08-10T09:00:00.000Z",
    status: "approved",
    submissionType: "initial",
    submissionNumber: 1,
    documents: [
      { documentType: "ktp", fileName: "KTP_Budi.jpg", fileType: "image/jpeg", fileSize: 400000, fileUrl: "", uploadedAt: "2026-08-10T09:00:00.000Z" },
      { documentType: "str", fileName: "STR_Budi.pdf", fileType: "application/pdf", fileSize: 900000, fileUrl: "", uploadedAt: "2026-08-10T09:00:00.000Z" },
      { documentType: "sip", fileName: "SIP_Budi.pdf", fileType: "application/pdf", fileSize: 750000, fileUrl: "", uploadedAt: "2026-08-10T09:00:00.000Z" },
      { documentType: "sertifikat", fileName: "Sertifikat_Budi.pdf", fileType: "application/pdf", fileSize: 500000, fileUrl: "", uploadedAt: "2026-08-10T09:00:00.000Z" },
    ],
    reviewedAt: "2026-08-11T10:00:00.000Z",
    reviewedBy: "Admin",
  },
  {
    id: "ver_seed_003",
    psychologistId: "PSY-2024-003",
    psychologistName: "Dewi Kusuma, M.Psi",
    email: "dewi.kusuma@email.com",
    submittedBy: "dewi.kusuma@email.com",
    submittedAt: "2026-08-08T11:00:00.000Z",
    status: "rejected",
    submissionType: "initial",
    submissionNumber: 1,
    documents: [
      { documentType: "ktp", fileName: "KTP_Dewi.jpg", fileType: "image/jpeg", fileSize: 350000, fileUrl: "", uploadedAt: "2026-08-08T11:00:00.000Z" },
      { documentType: "str", fileName: "STR_Dewi_invalid.pdf", fileType: "application/pdf", fileSize: 200000, fileUrl: "", uploadedAt: "2026-08-08T11:00:00.000Z" },
      { documentType: "sip", fileName: "SIP_Dewi.pdf", fileType: "application/pdf", fileSize: 700000, fileUrl: "", uploadedAt: "2026-08-08T11:00:00.000Z" },
      { documentType: "sertifikat", fileName: "Sertifikat_Dewi.pdf", fileType: "application/pdf", fileSize: 450000, fileUrl: "", uploadedAt: "2026-08-08T11:00:00.000Z" },
    ],
    rejectionReason: "Dokumen STR tidak dapat terbaca dengan jelas. Silakan upload ulang dokumen yang lebih jelas.",
    reviewedAt: "2026-08-09T14:00:00.000Z",
    reviewedBy: "Admin",
  },
];

function loadVerifications(): VerificationSubmission[] {
  try {
    const raw = localStorage.getItem("hearme_verifications");
    if (!raw) { localStorage.setItem("hearme_verifications", JSON.stringify(SEED_VERIFICATIONS)); return SEED_VERIFICATIONS; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { localStorage.setItem("hearme_verifications", JSON.stringify(SEED_VERIFICATIONS)); return SEED_VERIFICATIONS; }
    return parsed;
  } catch { return SEED_VERIFICATIONS; }
}

function saveVerifications(subs: VerificationSubmission[]) {
  localStorage.setItem("hearme_verifications", JSON.stringify(subs));
}

const DOC_LABELS: Record<string, string> = {
  ktp: "KTP",
  str: "STR",
  sip: "SIP",
  sertifikat: "Sertifikat Kompetensi",
};

function FilePreviewModal({ doc, onClose }: { doc: DocFileRef; onClose: () => void }) {
  const isPDF = doc.fileType === "application/pdf" || doc.fileName.toLowerCase().endsWith(".pdf");
  const isImage = doc.fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(doc.fileName);
  const hasUrl = !!doc.fileUrl;

  const handleDownload = () => {
    if (!doc.fileUrl) return;
    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.download = doc.fileName;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{DOC_LABELS[doc.documentType] || doc.documentType}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} KB</p>
          </div>
          <div className="flex items-center gap-2">
            {hasUrl && (
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6F3FB5] bg-[#F5EEFC] rounded-lg hover:bg-purple-100 transition-colors">
                <Download size={12} /> Download
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 min-h-[300px] flex items-center justify-center">
          {!hasUrl ? (
            <div className="text-center text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Preview tidak tersedia</p>
              <p className="text-xs mt-1">File hanya tersedia saat terhubung ke storage</p>
            </div>
          ) : isPDF ? (
            <iframe src={doc.fileUrl} className="w-full h-[500px] rounded-lg border border-gray-200" title={doc.fileName} />
          ) : isImage ? (
            <img src={doc.fileUrl} alt={doc.fileName} className="max-w-full max-h-[500px] rounded-xl object-contain" />
          ) : (
            <div className="text-center text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Format file tidak didukung untuk preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function groupByPsychologist(subs: VerificationSubmission[]): Record<string, VerificationSubmission[]> {
  return subs.reduce((acc, sub) => {
    const key = sub.submittedBy;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sub);
    return acc;
  }, {} as Record<string, VerificationSubmission[]>);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    approved: "bg-green-50 text-green-700 border border-green-200",
    rejected: "bg-red-50 text-red-700 border border-red-200",
  };
  const labels: Record<string, string> = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };
  const icons: Record<string, React.ElementType> = { pending: Clock, approved: CheckCircle, rejected: XCircle };
  const Icon = icons[status] || Clock;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || ""}`}>
      <Icon size={11} /> {labels[status] || status}
    </span>
  );
}

export default function AdminVerificationPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ name: string; role: string } | null>(null);
  const [verifications, setVerifications] = useState<VerificationSubmission[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<VerificationSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocFileRef | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("hearme_admin_session");
    if (!raw) { navigate("/admin/login"); return; }
    setSession(JSON.parse(raw));
    setVerifications(loadVerifications());
  }, [navigate]);

  const persist = (updated: VerificationSubmission[]) => {
    setVerifications(updated);
    saveVerifications(updated);
  };

  const handleApprove = (id: string) => {
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // TODO: UPDATE psychologist_verification_submissions SET status='approved', reviewed_at=NOW(), reviewed_by=admin_id WHERE id=?
    // TODO: INSERT INTO verified_psychologists (psychologist_id, verified_by, verified_at, status) VALUES (...)
    // ======================================================
    const updated = verifications.map((v) =>
      v.id === id ? { ...v, status: "approved" as const, reviewedAt: new Date().toISOString(), reviewedBy: session?.name } : v
    );
    persist(updated);
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: "approved" } : s);

    // Notify psychologist
    const ver = verifications.find((v) => v.id === id);
    if (ver) {
      const notifs = JSON.parse(localStorage.getItem("hearme_psych_notifications") || "[]");
      notifs.unshift({
        id: `pn${Date.now()}`,
        title: "Verifikasi Disetujui",
        message: "Selamat! Akun psikolog Anda telah berhasil diverifikasi dan kini dapat menerima konsultasi.",
        time: "Baru saja",
        read: false,
        type: "verification_approved",
      });
      localStorage.setItem("hearme_psych_notifications", JSON.stringify(notifs));
    }
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // TODO: UPDATE psychologist_verification_submissions SET status='rejected', rejection_reason=?, reviewed_at=NOW() WHERE id=?
    // ======================================================
    const updated = verifications.map((v) =>
      v.id === id ? { ...v, status: "rejected" as const, rejectionReason: rejectReason.trim(), adminNote: adminNote.trim(), reviewedAt: new Date().toISOString(), reviewedBy: session?.name } : v
    );
    persist(updated);
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: "rejected", rejectionReason: rejectReason.trim() } : s);

    // Notify psychologist
    const notifs = JSON.parse(localStorage.getItem("hearme_psych_notifications") || "[]");
    notifs.unshift({
      id: `pn${Date.now()}`,
      title: "Verification Failed",
      message: `Your psychologist verification was not approved.\n\nReason:\n${rejectReason.trim()}`,
      time: "Baru saja",
      read: false,
      type: "verification_rejected",
    });
    localStorage.setItem("hearme_psych_notifications", JSON.stringify(notifs));
    setRejectReason("");
    setAdminNote("");
    setShowRejectInput(false);
  };

  if (!session) return null;

  // Get latest submission per psychologist for the main list
  const grouped = groupByPsychologist(verifications);
  const latestPerPsych = Object.values(grouped).map((subs) => subs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0]);

  const filtered = filterStatus === "all" ? latestPerPsych : latestPerPsych.filter((v) => v.status === filterStatus);

  const counts = {
    all: latestPerPsych.length,
    pending: latestPerPsych.filter((v) => v.status === "pending").length,
    approved: latestPerPsych.filter((v) => v.status === "approved").length,
    rejected: latestPerPsych.filter((v) => v.status === "rejected").length,
  };

  // Submissions history for selected psychologist
  const selectedPsychHistory = selected
    ? (grouped[selected.submittedBy] || []).sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    : [];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FAF8FD" }}>
      <AdminSidebar session={session} onLogout={() => { localStorage.removeItem("hearme_admin_session"); navigate("/admin/login"); }} />

      <main className="flex-1 px-8 py-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Verifikasi Psikolog</h1>
          <p className="text-sm text-gray-500 mt-1">Tinjau dan proses pengajuan verifikasi dari psikolog</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => {
            const labels = { all: "Total", pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };
            const colors = { all: "text-gray-700", pending: "text-amber-600", approved: "text-green-600", rejected: "text-red-600" };
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
          {(["all", "pending", "approved", "rejected"] as const).map((s) => {
            const labels = { all: "Semua", pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterStatus === s ? "bg-[#6F3FB5] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                {labels[s]} ({counts[s]})
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["ID Psikolog", "Nama", "Email", "Tanggal Pengajuan", "Tipe", "Status", "Aksi"].map((col) => (
                  <th key={col} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">Tidak ada data verifikasi</td></tr>
              ) : filtered.map((v) => (
                <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{v.psychologistId.slice(-8)}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{v.psychologistName}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{v.email}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(v.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${v.submissionType === "resubmission" ? "text-blue-600 bg-blue-50 border-blue-200" : "text-gray-500 bg-gray-50 border-gray-200"}`}>
                      {v.submissionType === "resubmission" ? "Ulang" : "Awal"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">{statusBadge(v.status)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => { setSelected(v); setShowRejectInput(false); setRejectReason(""); setAdminNote(""); setShowHistory(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6F3FB5] bg-[#F5EEFC] rounded-lg hover:bg-purple-100 transition-colors">
                      <Eye size={12} /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-900">Detail Verifikasi</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Psychologist Info */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Psychologist Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nama", value: selected.psychologistName },
                    { label: "Email", value: selected.email },
                    { label: "ID", value: selected.psychologistId.slice(-12) },
                    { label: "Tanggal", value: new Date(selected.submittedAt).toLocaleDateString("id-ID") },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                      <p className="text-sm font-medium text-gray-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                <div className="flex items-center gap-3">
                  {statusBadge(selected.status)}
                  {selected.submissionType === "resubmission" && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Resubmission #{selected.submissionNumber}</span>
                  )}
                </div>
                {selected.rejectionReason && (
                  <div className="mt-2 bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-600">Alasan Penolakan:</p>
                    <p className="text-sm text-red-700 mt-1">{selected.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Verification Documents */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Verification Documents</p>
                <div className="space-y-2">
                  {selected.documents.map((doc) => {
                    const isImage = doc.fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(doc.fileName);
                    const isPDF = doc.fileType === "application/pdf" || doc.fileName.toLowerCase().endsWith(".pdf");
                    return (
                      <div key={doc.documentType} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F3ECF9" }}>
                            {isImage ? <ImageIcon size={15} style={{ color: "#6F3FB5" }} /> : <FileText size={15} style={{ color: "#6F3FB5" }} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{DOC_LABELS[doc.documentType] || doc.documentType}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-gray-400 px-1.5 py-0.5 bg-white border border-gray-200 rounded">
                            {isPDF ? "PDF" : isImage ? "IMG" : "FILE"}
                          </span>
                          <button onClick={() => setPreviewDoc(doc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#6F3FB5] bg-[#F5EEFC] rounded-lg hover:bg-purple-100 transition-colors">
                            <Eye size={11} /> Preview
                          </button>
                          {doc.fileUrl && (
                            <button onClick={() => { const a = document.createElement("a"); a.href = doc.fileUrl; a.download = doc.fileName; a.click(); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                              <Download size={11} /> DL
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submission History */}
              {selectedPsychHistory.length > 1 && (
                <div>
                  <button onClick={() => setHistoryTarget(historyTarget ? null : selected.submittedBy)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                    <History size={13} /> Riwayat Pengajuan ({selectedPsychHistory.length})
                    {historyTarget ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {historyTarget && (
                    <div className="mt-2 space-y-2">
                      {selectedPsychHistory.map((sub, i) => (
                        <div key={sub.id} className={`px-3 py-3 rounded-xl border ${sub.id === selected.id ? "border-purple-200 bg-purple-50/40" : "border-gray-100 bg-gray-50"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700">
                              Verification #{sub.submissionNumber} ({sub.submissionType === "initial" ? "Awal" : "Ulang"})
                            </span>
                            {statusBadge(sub.status)}
                          </div>
                          <p className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                          {sub.rejectionReason && <p className="mt-1.5 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{sub.rejectionReason}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions for pending */}
              {selected.status === "pending" && (
                <div className="pt-2">
                  {showRejectInput ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Contoh: Dokumen STR tidak dapat terbaca dengan jelas. Silakan upload ulang dokumen yang lebih jelas."
                          rows={3}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-red-400 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Note (opsional)</label>
                        <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Catatan tambahan untuk psikolog..."
                          rows={2}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-gray-300 transition-colors" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowRejectInput(false); setRejectReason(""); setAdminNote(""); }}
                          className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Batal</button>
                        <button onClick={() => handleReject(selected.id)} disabled={!rejectReason.trim()}
                          className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50">
                          Konfirmasi Tolak
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setShowRejectInput(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
                        <XCircle size={15} /> Tolak
                      </button>
                      <button onClick={() => handleApprove(selected.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold bg-green-500 hover:bg-green-600 transition-colors">
                        <CheckCircle size={15} /> Setujui
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewDoc && <FilePreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  );
}
