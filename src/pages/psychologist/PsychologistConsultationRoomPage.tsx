import { useState, useEffect } from "react"
import { Calendar, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"

import PsychologistNavbar from "../../components/PsychologistNavbar"
import Footer from "../../components/Footer"
import { consultationService } from "../../services"

type Status = "pending" | "approved" | "rejected" | "completed"

export default function PsychologistConsultationPage() {
  const [consultations, setConsultations] = useState<any[]>([])
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")

  useEffect(() => {
    consultationService
      .getPsychologistConsultations()
      .then((data) => setConsultations(data))
  }, [])

  const handleApprove = async (id: string) => {
    await consultationService.approve(id)

    setConsultations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "approved" } : item,
      ),
    )
  }

  const handleReject = async (id: string) => {
    const reason = prompt("Alasan penolakan")

    if (!reason) return

    await consultationService.reject(id, reason)

    setConsultations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "rejected",
              rejectionReason: reason,
            }
          : item,
      ),
    )
  }

  const handleReschedule = async (id: string) => {
    if (!newDate || !newTime) {
      alert("Tanggal dan jam wajib diisi")
      return
    }

    await consultationService.reschedule(id, newDate, newTime)

    setConsultations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              date: newDate,
              time: newTime,
            }
          : item,
      ),
    )

    setRescheduleId(null)
    setNewDate("")
    setNewTime("")
  }

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PsychologistNavbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Permintaan Konsultasi
          </h1>

          <p className="text-sm text-gray-500">
            Kelola permintaan konsultasi pasien
          </p>
        </div>

        <div className="space-y-4">
          {consultations.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-5 border border-purple-50 hover:border-purple-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <img
                  src={c.avatar}
                  alt={c.userName}
                  className="w-14 h-14 rounded-2xl object-cover bg-purple-100"
                />

                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{c.userName}</h3>

                  <p className="text-sm text-gray-500">Pasien</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(c.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock size={11} />
                      {c.time}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    c.status === "pending"
                      ? "bg-amber-50 text-amber-600"
                      : c.status === "approved"
                        ? "bg-green-50 text-green-600"
                        : c.status === "rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              {c.status === "pending" && (
                <div className="mt-4 pt-4 border-t border-purple-50">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApprove(c.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle size={14} />
                      Terima
                    </button>

                    <button
                      onClick={() => handleReject(c.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                      <XCircle size={14} />
                      Tolak
                    </button>

                    <button
                      onClick={() => setRescheduleId(c.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <RefreshCw size={14} />
                      Reschedule
                    </button>
                  </div>

                  {rescheduleId === c.id && (
                    <div className="mt-4 grid md:grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="px-4 py-3 border border-purple-100 rounded-xl"
                      />

                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="px-4 py-3 border border-purple-100 rounded-xl"
                      />

                      <button
                        onClick={() => handleReschedule(c.id)}
                        className="md:col-span-2 bg-[#6F3FB5] text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition-colors"
                      >
                        Simpan Jadwal Baru
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {consultations.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />

              <p className="font-semibold">Belum ada permintaan konsultasi</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
