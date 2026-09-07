import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  Calendar,
  Clock,
  Star,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageCircle,
  Video,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  ClipboardList,
} from "lucide-react"
import PsychologistNavbar from "../../components/PsychologistNavbar"

const PSYCH_ID = "p1"

interface Consultation {
  id: string
  psychologistId: string
  userId: string
  userName?: string
  date: string
  time: string
  fee: number
  status: "pending" | "approved" | "rejected" | "completed"
  rejectionReason?: string
}

interface Verification {
  psychologistId: string
  status: "pending" | "verified" | "rejected" | "unsubmitted"
  submittedAt?: string
}

function getConsultations(): Consultation[] {
  try {
    return JSON.parse(localStorage.getItem("hearme_consultations_v2") || "[]")
  } catch {
    return []
  }
}

function saveConsultations(list: Consultation[]) {
  localStorage.setItem("hearme_consultations_v2", JSON.stringify(list))
}

function getVerification(): Verification | null {
  try {
    const list: Verification[] = JSON.parse(
      localStorage.getItem("hearme_verifications") || "[]",
    )
    return list.find((v) => v.psychologistId === PSYCH_ID) || null
  } catch {
    return null
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0]
}

interface RescheduleFormProps {
  consultation: Consultation
  onSave: (date: string, time: string) => void
  onCancel: () => void
}

function RescheduleForm({
  consultation,
  onSave,
  onCancel,
}: RescheduleFormProps) {
  const [date, setDate] = useState(consultation.date)
  const [time, setTime] = useState(consultation.time)

  return (
    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in">
      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
        Jadwal Baru
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">Tanggal</label>
          <input
            type="date"
            value={date}
            min={getTodayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5] bg-white"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">Waktu</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5] bg-white"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(date, time)}
          disabled={!date || !time}
          className="flex-1 px-4 py-2 text-sm font-semibold bg-[#6F3FB5] text-white rounded-lg hover:bg-[#5c32a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Simpan Jadwal
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  )
}

interface RejectModalProps {
  onConfirm: (reason: string) => void
  onCancel: () => void
}

function RejectModal({ onConfirm, onCancel }: RejectModalProps) {
  const [reason, setReason] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tolak Konsultasi</h3>
            <p className="text-xs text-gray-500">
              Berikan alasan penolakan kepada pasien
            </p>
          </div>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Contoh: Jadwal sudah penuh pada waktu tersebut..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            Tolak Konsultasi
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

export default function PsychologistDashboardPage() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [verification, setVerification] = useState<Verification | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)

  useEffect(() => {
    const all = getConsultations().filter((c) => c.psychologistId === PSYCH_ID)
    setConsultations(all)
    setVerification(getVerification())
  }, [])

  const pending = consultations.filter((c) => c.status === "pending")
  const upcoming = consultations.filter(
    (c) => c.status === "approved" && c.date >= getTodayStr(),
  )
  const todayCount = consultations.filter(
    (c) =>
      c.date === getTodayStr() &&
      (c.status === "approved" || c.status === "completed"),
  ).length
  const avgRating = 4.8

  const refreshFromStorage = () => {
    const all = getConsultations().filter((c) => c.psychologistId === PSYCH_ID)
    setConsultations(all)
  }

  const handleApprove = (id: string) => {
    const all = getConsultations()
    const updated = all.map((c) =>
      c.id === id ? { ...c, status: "approved" as const } : c,
    )
    saveConsultations(updated)
    refreshFromStorage()
  }

  const handleReject = (id: string, reason: string) => {
    const all = getConsultations()
    const updated = all.map((c) =>
      c.id === id
        ? { ...c, status: "rejected" as const, rejectionReason: reason }
        : c,
    )
    saveConsultations(updated)
    setRejectId(null)
    refreshFromStorage()
  }

  const handleReschedule = (id: string, date: string, time: string) => {
    const all = getConsultations()
    const updated = all.map((c) => (c.id === id ? { ...c, date, time } : c))
    saveConsultations(updated)
    setRescheduleId(null)
    refreshFromStorage()
  }

  const verificationBadge = () => {
    const status = verification?.status
    if (!status || status === "unsubmitted") {
      return {
        label: "Belum Diverifikasi",
        color: "text-gray-500",
        bg: "bg-gray-50 border-gray-200",
        icon: <AlertCircle size={16} className="text-gray-400" />,
      }
    }
    if (status === "pending") {
      return {
        label: "Sedang Diproses",
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200",
        icon: <Clock size={16} className="text-amber-500" />,
      }
    }
    if (status === "verified") {
      return {
        label: "Terverifikasi",
        color: "text-green-600",
        bg: "bg-green-50 border-green-200",
        icon: <ShieldCheck size={16} className="text-green-500" />,
      }
    }
    return {
      label: "Ditolak",
      color: "text-red-500",
      bg: "bg-red-50 border-red-200",
      icon: <XCircle size={16} className="text-red-400" />,
    }
  }

  const vBadge = verificationBadge()

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PsychologistNavbar />

      {rejectId && (
        <RejectModal
          onConfirm={(reason) => handleReject(rejectId, reason)}
          onCancel={() => setRejectId(null)}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Dashboard Psikolog
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola jadwal konsultasimu
          </p>
        </div>

        {/* Verification Status Card */}
        <Link
          to="/psychologist/verification"
          className={`flex items-center justify-between px-5 py-4 rounded-2xl border mb-6 hover:shadow-md transition-all animate-fade-in ${vBadge.bg}`}
        >
          <div className="flex items-center gap-3">
            {vBadge.icon}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Status Verifikasi
              </p>
              <p className={`text-sm font-semibold mt-0.5 ${vBadge.color}`}>
                {vBadge.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            Lihat Detail
            <ChevronRight size={14} />
          </div>
        </Link>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <div className="bg-white rounded-2xl border border-purple-100 p-5 flex flex-col gap-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <ClipboardList size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pending.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Konsultasi Pending</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-purple-100 p-5 flex flex-col gap-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#F5EEFC] flex items-center justify-center">
              <Calendar size={20} className="text-[#6F3FB5]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Konsultasi Hari Ini
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-purple-100 p-5 flex flex-col gap-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {consultations.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total Konsultasi</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-purple-100 p-5 flex flex-col gap-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Star size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
              <p className="text-xs text-gray-500 mt-0.5">Rating</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Consultations */}
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Permintaan Konsultasi
              </h2>
              {pending.length > 0 && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  {pending.length} baru
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5EEFC] flex items-center justify-center mb-3">
                  <ClipboardList size={24} className="text-[#C9A9E9]" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Tidak ada permintaan baru
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Permintaan konsultasi dari pasien akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map((c, idx) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-purple-100 p-5 hover:shadow-md transition-all animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(c.userName || `P${idx + 1}`)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {c.userName || `Pengguna #${idx + 1}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatCurrency(c.fee)}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full border border-amber-200">
                        Menunggu
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 ml-12">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {formatDate(c.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {c.time}
                      </span>
                    </div>

                    {rescheduleId === c.id ? (
                      <RescheduleForm
                        consultation={c}
                        onSave={(date, time) =>
                          handleReschedule(c.id, date, time)
                        }
                        onCancel={() => setRescheduleId(null)}
                      />
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle size={13} />
                          Setujui
                        </button>
                        <button
                          onClick={() => setRejectId(c.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <XCircle size={13} />
                          Tolak
                        </button>
                        <button
                          onClick={() =>
                            setRescheduleId(rescheduleId === c.id ? null : c.id)
                          }
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <RefreshCw size={13} />
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Consultations */}
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Jadwal Mendatang
              </h2>
              {upcoming.length > 0 && (
                <span className="px-2.5 py-0.5 bg-[#F5EEFC] text-[#6F3FB5] text-xs font-semibold rounded-full">
                  {upcoming.length} sesi
                </span>
              )}
            </div>

            {upcoming.length === 0 ? (
              <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5EEFC] flex items-center justify-center mb-3">
                  <Calendar size={24} className="text-[#C9A9E9]" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Belum ada jadwal mendatang
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Konsultasi yang sudah disetujui akan tampil di sini
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((c, idx) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-purple-100 p-5 hover:shadow-md transition-all animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6F3FB5] to-[#C9A9E9] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(c.userName || `P${idx + 1}`)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {c.userName || `Pengguna #${idx + 1}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatCurrency(c.fee)}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-200">
                        Disetujui
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 ml-12">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {formatDate(c.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {c.time}
                      </span>
                    </div>

                    <div className="flex gap-2 ml-12">
                      <button
                        onClick={() => navigate(`/consultation/${c.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#6F3FB5] text-white rounded-xl hover:bg-[#5c32a0] transition-colors"
                      >
                        <MessageCircle size={13} />
                        Mulai Chat
                      </button>
                      <button
                        onClick={() => navigate(`/video-call/${c.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#F5EEFC] text-[#6F3FB5] border border-[#C9A9E9] rounded-xl hover:bg-[#ede0fa] transition-colors"
                      >
                        <Video size={13} />
                        Video Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
