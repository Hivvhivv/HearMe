import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  FileText,
  Eye,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import PsychologistNavbar from "../../components/PsychologistNavbar";
import Footer from "../../components/Footer";
import { verificationAPI } from "../../api/verification.api";

interface UploadedFile {
  name: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
}

interface VerificationDocument {
  id?: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
}

interface VerificationSubmission {
  _id: string;
  psychologistId: string;
  submissionNumber: number;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  documents: VerificationDocument[];
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

const DOC_FIELDS = [
  {
    key: "ktp",
    label: "KTP (Kartu Tanda Penduduk)",
    description: "Foto KTP yang jelas dan masih berlaku.",
  },
  {
    key: "str",
    label: "STR (Surat Tanda Registrasi)",
    description:
      "STR yang diterbitkan oleh Konsil Tenaga Kesehatan Indonesia.",
  },
  {
    key: "sip",
    label: "SIP (Surat Izin Praktik)",
    description:
      "SIP yang masih berlaku dari dinas kesehatan setempat.",
  },
  {
    key: "sertifikat",
    label: "Sertifikat Kompetensi",
    description:
      "Sertifikat kompetensi resmi dari lembaga yang berwenang.",
  },
];

function formatDate(date?: string) {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return date;
  }
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentLabel(type: string) {
  const doc = DOC_FIELDS.find((item) => item.key === type);

  return doc?.label || type;
}

function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
        <CheckCircle size={15} />
        Terverifikasi
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
        <XCircle size={15} />
        Ditolak
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
      <Clock size={15} />
      Menunggu Review
    </span>
  );
}

export default function PsychologistVerificationPage() {
  const [submissions, setSubmissions] = useState<
    VerificationSubmission[]
  >([]);

  const [verificationStatus, setVerificationStatus] =
    useState<"pending" | "approved" | "rejected" | "unverified" | null>(null);

  const [statusLatestSubmission, setStatusLatestSubmission] =
    useState<VerificationSubmission | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFile>
  >({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRefs = useRef<
    Record<string, HTMLInputElement | null>
  >({});

  // ======================================================
  // LOAD DATA
  // ======================================================

  const loadVerification = async () => {
    try {
      setLoading(true);
      setError("");

      const [statusData, data] = await Promise.all([
        verificationAPI.getStatus(),
        verificationAPI.getByPsychologist(),
      ]);

      // users.verificationStatus dari MongoDB adalah sumber status utama.
      setVerificationStatus(
        statusData.user.verificationStatus
      );
      setStatusLatestSubmission(
        statusData.latestSubmission
      );

      setSubmissions(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error("Load verification error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data verifikasi."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerification();
  }, []);

  // ======================================================
  // SORT SUBMISSION TERBARU
  // ======================================================

  const latestFromHistory =
    submissions.length > 0
      ? [...submissions].sort(
          (a, b) =>
            b.submissionNumber -
            a.submissionNumber
        )[0]
      : null;

  // Endpoint /status menentukan submission terbaru; history hanya fallback.
  const latestSubmission =
    statusLatestSubmission || latestFromHistory;

  // ======================================================
  // STATUS
  // ======================================================

  const status =
    verificationStatus ??
    latestSubmission?.status ??
    null;

  const hasSubmission =
    latestSubmission !== null;

  const isPending =
    status === "pending";

  const isApproved =
    status === "approved";

  const isRejected =
    status === "rejected";

  console.log(
    "LATEST SUBMISSION:",
    latestSubmission
  );

  console.log(
    "CURRENT VERIFICATION STATUS:",
    status
  );

  // ======================================================
  // HANDLE FILE
  // ======================================================

  const handleFileChange = (
    key: string,
    file?: File
  ) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(
        `${file.name} melebihi ukuran maksimal 5MB.`
      );
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Format file harus JPG, PNG, atau PDF."
      );
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      setUploadedFiles((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          fileType: file.type,
          fileSize: file.size,
          dataUrl: reader.result as string,
        },
      }));
    };

    reader.readAsDataURL(file);
  };

  // ======================================================
  // REMOVE FILE
  // ======================================================

  const handleRemoveFile = (key: string) => {
    setUploadedFiles((prev) => {
      const copy = {
        ...prev,
      };

      delete copy[key];

      return copy;
    });

    const input =
      fileInputRefs.current[key];

    if (input) {
      input.value = "";
    }
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (isPending) {
      setError(
        "Verifikasi kamu masih dalam proses review."
      );
      return;
    }

    if (isApproved) {
      setError(
        "Akun kamu sudah terverifikasi."
      );
      return;
    }

    const uploadedKeys =
      Object.keys(uploadedFiles);

    if (uploadedKeys.length === 0) {
      setError(
        "Silakan upload minimal satu dokumen."
      );
      return;
    }

    try {
      setSubmitting(true);

      const documents = uploadedKeys.map(
        (key) => ({
          type: key,
          fileName:
            uploadedFiles[key].name,
          fileUrl:
            uploadedFiles[key].dataUrl,
        })
      );

      await verificationAPI.submit(documents);

      setSuccess(
        "Dokumen berhasil dikirim untuk verifikasi."
      );

      setUploadedFiles({});

      await loadVerification();
    } catch (err) {
      console.error(
        "Submit verification error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim dokumen verifikasi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />

        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-[#6F3FB5]"
          />

          <p className="mt-4 text-sm text-gray-500">
            Memuat data verifikasi...
          </p>
        </div>

        <Footer />
      </div>
    );
  }

  // Status akun dari MongoDB tetap menang, termasuk bila data submission
  // lama tidak tersedia. Dalam kondisi ini form tidak boleh dirender.
  if (isApproved && !latestSubmission) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl border border-green-200 shadow-sm p-6">
            <StatusBadge status="approved" />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              Akun kamu sudah terverifikasi
            </h1>
            <p className="text-sm text-green-700 mt-2">
              Seluruh fitur psikolog sekarang sudah dapat digunakan.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isPending && !latestSubmission) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6">
            <StatusBadge status="pending" />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              Verifikasi Sedang Diproses
            </h1>
            <p className="text-sm text-amber-700 mt-2">
              Dokumen kamu sedang diperiksa oleh admin. Silakan tunggu hasil review.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ======================================================
  // APPROVED
  // ======================================================
  //
  // KALAU APPROVED:
  // TIDAK ADA FORM
  // TIDAK ADA TOMBOL SUBMIT
  //
  // ======================================================

  if (isApproved && latestSubmission) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />

        <main className="max-w-3xl mx-auto px-4 py-8">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Verifikasi Psikolog
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Data verifikasi akun psikolog kamu.
            </p>
          </div>

          {/* STATUS */}

          <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6 mb-5">

            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Status Verifikasi
                </p>

                <div className="mt-2">
                  <StatusBadge status="approved" />
                </div>
              </div>

              <ShieldCheck
                size={42}
                className="text-green-500"
              />

            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">
                  Submission
                </span>

                <span className="font-semibold text-gray-800">
                  #{latestSubmission.submissionNumber}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm mt-2">
                <span className="text-gray-500">
                  Dikirim
                </span>

                <span className="font-semibold text-gray-800 text-right">
                  {formatDate(
                    latestSubmission.submittedAt
                  )}
                </span>
              </div>

              {latestSubmission.reviewedAt && (
                <div className="flex justify-between gap-4 text-sm mt-2">
                  <span className="text-gray-500">
                    Direview
                  </span>

                  <span className="font-semibold text-gray-800 text-right">
                    {formatDate(
                      latestSubmission.reviewedAt
                    )}
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* APPROVED MESSAGE */}

          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5">

            <div className="flex gap-3">

              <CheckCircle
                size={22}
                className="text-green-600 shrink-0"
              />

              <div>
                <p className="font-semibold text-green-800">
                  Akun kamu sudah terverifikasi
                </p>

                <p className="text-sm text-green-700 mt-1">
                  Seluruh fitur psikolog sekarang
                  sudah dapat digunakan.
                </p>
              </div>

            </div>

          </div>

          {/* DOCUMENTS */}

          <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6">

            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Dokumen yang Telah Dikirim
            </h2>

            <div className="space-y-3">

              {latestSubmission.documents.map(
                (document) => (
                  <div
                    key={
                      document.id ||
                      `${document.type}-${document.fileName}`
                    }
                    className="flex items-center justify-between gap-4 p-4 bg-[#FAF8FD] rounded-2xl border border-purple-50"
                  >

                    <div className="flex items-center gap-3 min-w-0">

                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <FileText
                          size={19}
                          className="text-[#6F3FB5]"
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-gray-800">
                          {getDocumentLabel(
                            document.type
                          )}
                        </p>

                        <p className="text-xs text-gray-500 truncate">
                          {document.fileName}
                        </p>

                      </div>

                    </div>

                    {document.fileUrl && (
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6F3FB5] bg-purple-50 rounded-xl hover:bg-purple-100 shrink-0"
                      >
                        <Eye size={14} />
                        Lihat
                      </a>
                    )}

                  </div>
                )
              )}

            </div>

          </div>

        </main>

        <Footer />
      </div>
    );
  }

  // ======================================================
  // PENDING
  // ======================================================
  //
  // KALAU PENDING:
  // TIDAK ADA FORM
  // TIDAK ADA TOMBOL SUBMIT
  //
  // ======================================================

  if (isPending && latestSubmission) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />

        <main className="max-w-3xl mx-auto px-4 py-8">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Verifikasi Psikolog
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Data verifikasi akun psikolog kamu.
            </p>
          </div>

          {/* STATUS */}

          <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6 mb-5">

            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Status Verifikasi
                </p>

                <div className="mt-2">
                  <StatusBadge status="pending" />
                </div>
              </div>

              <ShieldCheck
                size={42}
                className="text-amber-500"
              />

            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">
                  Submission
                </span>

                <span className="font-semibold text-gray-800">
                  #{latestSubmission.submissionNumber}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm mt-2">
                <span className="text-gray-500">
                  Dikirim
                </span>

                <span className="font-semibold text-gray-800 text-right">
                  {formatDate(
                    latestSubmission.submittedAt
                  )}
                </span>
              </div>

            </div>
          </div>

          {/* PENDING MESSAGE */}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">

            <div className="flex gap-3">

              <Clock
                size={22}
                className="text-amber-600 shrink-0"
              />

              <div>
                <p className="font-semibold text-amber-800">
                  Verifikasi Sedang Diproses
                </p>

                <p className="text-sm text-amber-700 mt-1">
                  Dokumen kamu sedang diperiksa
                  oleh admin. Silakan tunggu hasil
                  verifikasi.
                </p>
              </div>

            </div>

          </div>

          {/* DOCUMENTS */}

          <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6">

            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Dokumen yang Telah Dikirim
            </h2>

            <div className="space-y-3">

              {latestSubmission.documents.map(
                (document) => (
                  <div
                    key={
                      document.id ||
                      `${document.type}-${document.fileName}`
                    }
                    className="flex items-center justify-between gap-4 p-4 bg-[#FAF8FD] rounded-2xl border border-purple-50"
                  >

                    <div className="flex items-center gap-3 min-w-0">

                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <FileText
                          size={19}
                          className="text-[#6F3FB5]"
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-gray-800">
                          {getDocumentLabel(
                            document.type
                          )}
                        </p>

                        <p className="text-xs text-gray-500 truncate">
                          {document.fileName}
                        </p>

                      </div>

                    </div>

                    {document.fileUrl && (
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#6F3FB5] bg-purple-50 rounded-xl hover:bg-purple-100 shrink-0"
                      >
                        <Eye size={14} />
                        Lihat
                      </a>
                    )}

                  </div>
                )
              )}

            </div>

          </div>

        </main>

        <Footer />
      </div>
    );
  }

  // ======================================================
  // REJECTED / BELUM SUBMIT
  // ======================================================

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PsychologistNavbar />

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* HEADER */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Verifikasi Psikolog
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {isRejected
              ? "Perbaiki dokumen yang ditolak dan kirim kembali untuk verifikasi."
              : "Unggah dokumen berikut untuk memverifikasi akun psikologmu."}
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-4 text-sm flex gap-2 items-start">

            <CheckCircle
              size={18}
              className="shrink-0 mt-0.5"
            />

            <span>{success}</span>

          </div>
        )}

        {/* REJECTED */}

        {isRejected && latestSubmission && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-5">

            <div className="flex gap-3">

              <XCircle
                size={22}
                className="text-red-500 shrink-0"
              />

              <div>

                <p className="font-semibold text-red-800">
                  Verifikasi Ditolak
                </p>

                {latestSubmission.reason && (
                  <p className="text-sm text-red-700 mt-1">
                    Alasan:{" "}
                    {latestSubmission.reason}
                  </p>
                )}

                <p className="text-xs text-red-600 mt-2">
                  Silakan perbaiki dokumen dan
                  kirim kembali.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* DOCUMENT UPLOAD */}

        {DOC_FIELDS.map((doc) => {

          const uploaded =
            uploadedFiles[doc.key];

          return (
            <div
              key={doc.key}
              className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6 mb-5"
            >

              <h2 className="font-bold text-gray-900">
                {doc.label}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {doc.description}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Maks. 5MB · JPG, PNG, PDF
              </p>

              <input
                ref={(element) => {
                  fileInputRefs.current[
                    doc.key
                  ] = element;
                }}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(event) =>
                  handleFileChange(
                    doc.key,
                    event.target.files?.[0]
                  )
                }
              />

              {!uploaded ? (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRefs.current[
                      doc.key
                    ]?.click()
                  }
                  className="w-full mt-4 border-2 border-dashed border-purple-200 rounded-2xl py-8 flex flex-col items-center justify-center text-[#6F3FB5] hover:bg-purple-50 transition-colors"
                >
                  <Upload size={24} />

                  <span className="text-sm font-semibold mt-2">
                    Klik untuk unggah
                  </span>
                </button>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-3 p-4 bg-purple-50 rounded-2xl">

                  <div className="flex items-center gap-3 min-w-0">

                    <FileText
                      size={22}
                      className="text-[#6F3FB5] shrink-0"
                    />

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {uploaded.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {formatFileSize(
                          uploaded.fileSize
                        )}
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveFile(
                        doc.key
                      )
                    }
                    className="text-xs font-semibold text-red-500 hover:text-red-700 shrink-0"
                  >
                    Hapus
                  </button>

                </div>
              )}

            </div>
          );
        })}

        {/* ==================================================
            SUBMIT BUTTON
            HANYA MUNCUL:
            1. BELUM PERNAH SUBMIT
            2. REJECTED
        ================================================== */}

        {!isPending && !isApproved && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
              submitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#6F3FB5] text-white hover:bg-purple-800"
            }`}
          >
            {submitting
              ? "Mengirim..."
              : isRejected
              ? "Kirim Ulang Dokumen"
              : "Kirim Dokumen"}
          </button>
        )}

      </main>

      <Footer />
    </div>
  );
}
