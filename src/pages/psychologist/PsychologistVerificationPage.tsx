import { useState, useRef, useEffect, ChangeEvent } from "react";
import { CheckCircle, Clock, XCircle, Upload, FileText, RefreshCw, History, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// TABLE: psychologist_verification_submissions
// FIELDS:
//   id, psychologist_id, submission_number, submission_type,
//   status, rejection_reason, admin_note,
//   submitted_at, reviewed_at, reviewed_by
//
// submission_type: initial | resubmission
// status: pending | approved | rejected
//
// TABLE: psychologist_documents
// FIELDS:
//   id, psychologist_id, document_type,
//   file_name, file_url, file_type, file_size, uploaded_at
//
// ======================================================

// ======================================================
// ## API / STORAGE TEMPLATE IF CONNECTED ##
//
// Upload document to storage (Supabase / Firebase / S3).
// Save returned file URL/path to database.
//
// POST /api/verifications (submit verification)
// GET  /api/verifications/me (get own submissions)
//
// ======================================================

interface DocFileRef {
  documentType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string; // dataURL for mock; file URL when storage is connected
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

const DOC_FIELDS = [
  { key: "ktp", label: "KTP (Kartu Tanda Penduduk)", description: "Foto KTP yang jelas dan masih berlaku." },
  { key: "str", label: "STR (Surat Tanda Registrasi)", description: "STR yang diterbitkan oleh Konsil Tenaga Kesehatan Indonesia." },
  { key: "sip", label: "SIP (Surat Izin Praktik)", description: "SIP yang masih berlaku dari dinas kesehatan setempat." },
  { key: "sertifikat", label: "Sertifikat Kompetensi", description: "Sertifikat kompetensi resmi dari lembaga yang berwenang." },
];

function loadAllVerifications(): VerificationSubmission[] {
  try {
    const raw = localStorage.getItem("hearme_verifications");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveAllVerifications(subs: VerificationSubmission[]) {
  localStorage.setItem("hearme_verifications", JSON.stringify(subs));
}

function StatusBadge({ status, submissionType }: { status: string; submissionType?: string }) {
  const isResubmission = submissionType === "resubmission";
  if (status === "pending") return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
      <Clock size={15} />
      {isResubmission ? "Resubmission — Menunggu Review" : "Menunggu Review"}
    </span>
  );
  if (status === "approved") return (
    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
      <CheckCircle size={15} /> Terverifikasi
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
      <XCircle size={15} /> Verifikasi Gagal
    </span>
  );
}

interface UploadedFile {
  name: string;
  previewUrl: string | null;
  isImage: boolean;
  fileType: string;
  fileSize: number;
  dataUrl: string;
}

export default function PsychologistVerificationPage() {
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([]);
  const [mode, setMode] = useState<"view" | "upload">("view");
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const user = JSON.parse(localStorage.getItem("hearme_user") || '{"name":"Psikolog","email":""}');

  useEffect(() => {
    const all = loadAllVerifications();
    const mine = all.filter((s) => s.submittedBy === user.name || s.submittedBy === user.email);
    setSubmissions(mine);
    if (mine.length === 0) setMode("upload");
    else setMode("view");
  }, [user.name, user.email]);

  const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;

  const handleFileChange = (key: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [key]: "Ukuran file melebihi 5MB." }));
      return;
    }
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = (ev.target?.result as string) || "";
      setUploadedFiles((prev) => ({
        ...prev,
        [key]: { name: file.name, previewUrl: isImage ? dataUrl : null, isImage, fileType: file.type, fileSize: file.size, dataUrl },
      }));
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    DOC_FIELDS.forEach(({ key }) => { if (!uploadedFiles[key]) newErrors[key] = "Dokumen ini wajib diunggah."; });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const all = loadAllVerifications();
    const myPrevious = all.filter((s) => s.submittedBy === user.name || s.submittedBy === user.email);
    const submissionNumber = myPrevious.length + 1;
    const submissionType = myPrevious.length === 0 ? "initial" : "resubmission";

    const newSubmission: VerificationSubmission = {
      id: `ver_${Date.now()}`,
      psychologistId: `PSY-${Date.now()}`,
      psychologistName: user.name || "Psikolog",
      email: user.email || "",
      submittedBy: user.name || user.email || "",
      submittedAt: new Date().toISOString(),
      status: "pending",
      submissionType,
      submissionNumber,
      documents: DOC_FIELDS.map(({ key, label }) => {
        const f = uploadedFiles[key];
        return {
          documentType: key,
          fileName: f.name,
          fileType: f.fileType,
          fileSize: f.fileSize,
          fileUrl: f.dataUrl,
          uploadedAt: new Date().toISOString(),
        } as DocFileRef;
      }),
    };

    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // TODO: INSERT INTO psychologist_verification_submissions (...) VALUES (...)
    // TODO: INSERT INTO psychologist_documents (psychologist_id, document_type, ...) VALUES (...)
    // ======================================================
    all.push(newSubmission);
    saveAllVerifications(all);
    setSubmissions([...myPrevious, newSubmission]);
    setSubmitted(true);
    setMode("view");
  };

  if (submitted && latestSubmission) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAF8FD" }}>
        <PsychologistNavbar />
        <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4">
          <div className="flex max-w-sm flex-col items-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: "#C9A9E9" }}>
              <CheckCircle size={40} style={{ color: "#6F3FB5" }} />
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-bold text-gray-800">Dokumen Berhasil Dikirim</h2>
              <p className="text-sm text-gray-500">
                {latestSubmission.submissionType === "resubmission"
                  ? "Resubmisi dokumenmu sedang dalam proses review."
                  : "Tim kami akan meninjau dokumenmu dalam 1-3 hari kerja."}
                Kamu akan mendapat notifikasi setelah proses selesai.
              </p>
            </div>
            <button onClick={() => setSubmitted(false)} className="rounded-xl px-8 py-3 text-sm font-semibold text-white" style={{ backgroundColor: "#6F3FB5" }}>
              Lihat Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "upload") {
    const isResubmission = submissions.length > 0;
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAF8FD" }}>
        <PsychologistNavbar />
        <div className="mx-auto max-w-xl px-4 py-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {isResubmission ? "Upload Ulang Dokumen" : "Verifikasi Psikolog"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isResubmission
                ? "Upload dokumen baru untuk pengajuan ulang verifikasi."
                : "Unggah dokumen berikut untuk memverifikasi akun psikologmu."}
            </p>
          </div>

          {isResubmission && latestSubmission?.rejectionReason && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">Alasan Penolakan Sebelumnya</p>
                  <p className="text-sm text-red-700">{latestSubmission.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {DOC_FIELDS.map(({ key, label, description }) => {
              const uploaded = uploadedFiles[key];
              return (
                <div key={key} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-1">
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{description}</p>
                    <p className="mt-0.5 text-xs text-gray-400">Maks. 5MB · JPG, PNG, PDF</p>
                  </div>

                  {uploaded ? (
                    <div className="mt-3">
                      {uploaded.isImage && uploaded.previewUrl ? (
                        <img src={uploaded.previewUrl} alt={label} className="mb-2 h-32 w-full rounded-xl object-cover" />
                      ) : (
                        <div className="mb-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                          <FileText size={16} className="text-gray-400" />
                          <span className="truncate text-xs text-gray-600">{uploaded.name}</span>
                        </div>
                      )}
                      <button onClick={() => fileInputRefs.current[key]?.click()} className="text-xs font-medium hover:underline" style={{ color: "#6F3FB5" }}>
                        Ganti file
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRefs.current[key]?.click()}
                      className="mt-3 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-purple-200 py-6 transition-colors hover:border-purple-400 hover:bg-purple-50">
                      <Upload size={22} style={{ color: "#6F3FB5" }} />
                      <span className="text-xs font-medium" style={{ color: "#6F3FB5" }}>Klik untuk unggah</span>
                    </button>
                  )}

                  <input ref={(el) => { fileInputRefs.current[key] = el; }} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => handleFileChange(key, e)} />
                  {errors[key] && <p className="mt-2 text-xs text-red-500">{errors[key]}</p>}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 mt-8">
            {isResubmission && (
              <button onClick={() => setMode("view")} className="flex-1 rounded-xl py-4 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Batal
              </button>
            )}
            <button onClick={handleSubmit} className="flex-1 rounded-xl py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90" style={{ backgroundColor: "#6F3FB5" }}>
              {isResubmission ? "Kirim Ulang Dokumen" : "Kirim Dokumen"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Status view
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF8FD" }}>
      <PsychologistNavbar />
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Verifikasi Psikolog</h1>
        <p className="text-sm text-gray-500 mb-6">Status pengajuan dokumen kamu</p>

        {latestSubmission && (
          <div className="rounded-2xl bg-white p-6 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-4">
              <StatusBadge status={latestSubmission.status} submissionType={latestSubmission.submissionType} />
              <span className="text-xs text-gray-400">
                {new Date(latestSubmission.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>

            {latestSubmission.status === "pending" && (
              <p className="text-sm text-gray-500">
                {latestSubmission.submissionType === "resubmission"
                  ? "Pengajuan ulangmu sedang dalam proses review admin. Harap tunggu 1-3 hari kerja."
                  : "Dokumenmu sedang dalam proses review. Harap tunggu 1-3 hari kerja."}
              </p>
            )}

            {latestSubmission.status === "approved" && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Selamat! Akun psikologmu telah terverifikasi. Kamu kini bisa mulai menerima konsultasi.
                </p>
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle size={13} /> Semua fitur konsultasi telah aktif
                </div>
              </div>
            )}

            {latestSubmission.status === "rejected" && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Pengajuanmu ditolak oleh admin. Silakan perbaiki dokumen dan ajukan ulang.</p>
                {latestSubmission.rejectionReason && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3">
                    <p className="text-xs font-semibold text-red-600">Alasan Penolakan:</p>
                    <p className="mt-1 text-sm text-red-700">{latestSubmission.rejectionReason}</p>
                    {latestSubmission.adminNote && (
                      <p className="mt-1.5 text-xs text-red-500">{latestSubmission.adminNote}</p>
                    )}
                  </div>
                )}
                <button onClick={() => { setMode("upload"); setUploadedFiles({}); setErrors({}); }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#6F3FB5" }}>
                  <RefreshCw size={15} /> Submit Verification Again
                </button>
              </div>
            )}

            {/* Submitted documents */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Dokumen yang Dikirim</p>
              <div className="space-y-1.5">
                {latestSubmission.documents.map((doc) => {
                  const field = DOC_FIELDS.find((f) => f.key === doc.documentType);
                  return (
                    <div key={doc.documentType} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <FileText size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-700 flex-1 truncate">{field?.label || doc.documentType}</span>
                      <span className="text-[10px] text-gray-400 font-mono px-1.5 py-0.5 bg-white border border-gray-200 rounded">
                        {doc.fileType.split("/").pop()?.toUpperCase() || "FILE"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Submission history */}
        {submissions.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="flex items-center gap-2"><History size={15} className="text-gray-400" /> Riwayat Pengajuan ({submissions.length})</span>
              {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {showHistory && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {[...submissions].reverse().map((sub, i) => {
                  const isLatest = i === 0;
                  return (
                    <div key={sub.id} className={`px-5 py-4 ${isLatest ? "bg-purple-50/30" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">
                          Pengajuan #{sub.submissionNumber} {sub.submissionType === "resubmission" ? "(Ulang)" : "(Awal)"}
                          {isLatest && <span className="ml-2 text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">Terbaru</span>}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          sub.status === "approved" ? "text-green-700 bg-green-100" :
                          sub.status === "rejected" ? "text-red-700 bg-red-100" :
                          "text-amber-700 bg-amber-100"
                        }`}>{sub.status === "approved" ? "Disetujui" : sub.status === "rejected" ? "Ditolak" : "Menunggu"}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(sub.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      {sub.rejectionReason && (
                        <p className="mt-1.5 text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{sub.rejectionReason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
