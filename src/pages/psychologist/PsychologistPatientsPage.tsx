import { useState, useEffect } from "react";
import { Search, X, User, Calendar, Clock, FileText, ChevronRight } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// TABLE: consultations
// FIELDS:
//   id, user_id, psychologist_id, date, time,
//   status (pending|approved|completed|cancelled),
//   duration_minutes, notes, created_at
//
// Patient History: SELECT * FROM consultations
//   WHERE psychologist_id = ? AND status IN ('completed', 'cancelled')
//   ORDER BY date DESC
//
// ======================================================

interface Consultation {
  id: string;
  userId?: string;
  userName?: string;
  userPhoto?: string;
  date?: string;
  time?: string;
  status?: string;
  duration?: number;
  notes?: string;
  [key: string]: unknown;
}

interface Patient {
  userId: string;
  userName: string;
  userPhoto?: string;
  consultations: Consultation[];
}

const HISTORY_STATUSES = ["completed", "cancelled"];

const MOCK_PATIENTS: Patient[] = [
  {
    userId: "mock-1",
    userName: "Budi Santoso",
    consultations: [
      { id: "m1a", userId: "mock-1", userName: "Budi Santoso", date: "2026-06-01", time: "09:00", status: "completed", duration: 60, notes: "Pasien menunjukkan perkembangan positif dalam mengelola kecemasan." },
      { id: "m1b", userId: "mock-1", userName: "Budi Santoso", date: "2026-06-08", time: "10:00", status: "completed", duration: 50, notes: "Latihan pernapasan diberikan, tindak lanjut minggu depan." },
      { id: "m1c", userId: "mock-1", userName: "Budi Santoso", date: "2026-06-15", time: "09:00", status: "cancelled", notes: "Pasien membatalkan karena sakit." },
    ],
  },
  {
    userId: "mock-2",
    userName: "Raka Pratama",
    consultations: [
      { id: "m3a", userId: "mock-2", userName: "Raka Pratama", date: "2026-05-28", time: "14:00", status: "completed", duration: 45 },
      { id: "m3b", userId: "mock-2", userName: "Raka Pratama", date: "2026-06-04", time: "14:00", status: "completed", duration: 60, notes: "Evaluasi kemajuan baik." },
    ],
  },
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function gradientForName(name: string) {
  const gradients = ["from-purple-400 to-indigo-500", "from-pink-400 to-rose-500", "from-teal-400 to-cyan-500", "from-amber-400 to-orange-500", "from-green-400 to-emerald-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function statusInfo(status?: string): { label: string; cls: string } {
  if (status === "completed") return { label: "Selesai", cls: "bg-green-100 text-green-700" };
  if (status === "cancelled") return { label: "Dibatalkan", cls: "bg-red-100 text-red-700" };
  return { label: status || "-", cls: "bg-gray-100 text-gray-600" };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function PsychologistPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const raw1 = localStorage.getItem("hearme_consultations") || "[]";
    const raw2 = localStorage.getItem("hearme_consultations_v2") || "[]";
    let all: Consultation[] = [];
    try { all = [...JSON.parse(raw1), ...JSON.parse(raw2)]; } catch {}

    // Filter to only completed/cancelled
    const historyOnly = all.filter((c) => HISTORY_STATUSES.includes(c.status || ""));

    if (historyOnly.length === 0) {
      setPatients(MOCK_PATIENTS);
      return;
    }

    const map = new Map<string, Patient>();
    historyOnly.forEach((c, idx) => {
      const uid = c.userId || `anon-${idx}`;
      const uname = c.userName || `Pengguna #${idx + 1}`;
      if (!map.has(uid)) map.set(uid, { userId: uid, userName: uname, userPhoto: c.userPhoto as string | undefined, consultations: [] });
      map.get(uid)!.consultations.push(c);
    });
    setPatients(Array.from(map.values()));
  }, []);

  const filtered = patients.filter((p) => p.userName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PsychologistNavbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Pasien</h1>
          <p className="text-gray-500 text-sm mt-1">Daftar pasien dengan riwayat konsultasi selesai atau dibatalkan</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Cari nama pasien..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 focus:border-[#6F3FB5]" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Tidak ada riwayat pasien</p>
            <p className="text-sm mt-1 text-gray-400">Pasien dengan konsultasi selesai akan muncul di sini</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
            <div className="grid grid-cols-5 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <div className="col-span-2">Nama Pasien</div>
              <div>Total Sesi</div>
              <div>Konsultasi Terakhir</div>
              <div>Status Terakhir</div>
            </div>
            {filtered.map((patient) => {
              const sorted = [...patient.consultations].sort((a, b) =>
                new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
              );
              const last = sorted[0];
              const { label, cls } = statusInfo(last?.status);
              const gradient = gradientForName(patient.userName);
              return (
                <div key={patient.userId} className="grid grid-cols-5 items-center px-5 py-4 border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <div className="col-span-2 flex items-center gap-3">
                    {patient.userPhoto ? (
                      <img src={patient.userPhoto} alt={patient.userName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-xs">{getInitials(patient.userName)}</span>
                      </div>
                    )}
                    <span className="font-medium text-gray-900 text-sm">{patient.userName}</span>
                  </div>
                  <div className="text-sm text-gray-700">{patient.consultations.length} sesi</div>
                  <div className="text-sm text-gray-500">{formatDate(last?.date)}</div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>
                    <button onClick={() => setSelectedPatient(patient)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#6F3FB5] hover:underline">
                      View History <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* View History Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedPatient(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradientForName(selectedPatient.userName)} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold">{getInitials(selectedPatient.userName)}</span>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedPatient.userName}</h2>
                  <p className="text-xs text-gray-500">{selectedPatient.consultations.length} sesi konsultasi</p>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Riwayat Konsultasi</p>
              <div className="space-y-3">
                {[...selectedPatient.consultations]
                  .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
                  .map((c) => {
                    const { label, cls } = statusInfo(c.status);
                    return (
                      <div key={c.id} className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                            <Calendar size={14} className="text-gray-400" />
                            {formatDate(c.date)}
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {c.time && (
                            <span className="flex items-center gap-1"><Clock size={11} /> {c.time} WIB</span>
                          )}
                          {c.duration && (
                            <span className="flex items-center gap-1"><Clock size={11} /> {c.duration} menit</span>
                          )}
                        </div>
                        {c.notes && (
                          <div className="flex items-start gap-2 text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100">
                            <FileText size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
                            <span>{c.notes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
