import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, AlertTriangle, Heart, MessageCircle } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";

const hotlines = [
  { name: "Into The Light Indonesia", number: "119 ext 8", desc: "Hotline krisis kesehatan mental 24 jam", color: "#EF4444" },
  { name: "Yayasan Pulih", number: "(021) 788-42580", desc: "Konseling psikologis dan dukungan", color: "#F97316" },
  { name: "Kementerian Kesehatan RI", number: "1500-454", desc: "Layanan kesehatan nasional", color: "#8B5CF6" },
  { name: "RS Jiwa Dr. Soeharto Heerdjan", number: "(021) 560-8007", desc: "Rumah sakit jiwa Jakarta", color: "#3B82F6" },
];

export default function EmergencyCallPage() {
  const [confirmHotline, setConfirmHotline] = useState<typeof hotlines[0] | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-red-50">
      <DashboardNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-600 text-white rounded-3xl p-6 mb-8 text-center">
          <AlertTriangle size={36} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-2">Butuh Bantuan Segera?</h1>
          <p className="text-red-200 text-sm leading-relaxed">
            Jika kamu atau seseorang dalam bahaya, segera hubungi layanan darurat di bawah ini.
            Kamu tidak sendirian — bantuan selalu tersedia.
          </p>
        </div>

        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Phone size={16} className="text-red-500" /> Hotline Darurat
        </h2>
        <div className="space-y-3 mb-8">
          {hotlines.map((h) => (
            <div key={h.name} className="bg-white rounded-2xl p-4 border border-red-100 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">{h.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-gray-800 text-sm mb-1.5">{h.number}</div>
                <button
                  onClick={() => setConfirmHotline(h)}
                  className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: h.color }}
                >
                  <Phone size={11} /> Hubungi
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-base font-bold text-gray-800 mb-4">Jika Tidak dalam Krisis Akut</h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => navigate("/ai-listener")}
            className="bg-white rounded-2xl p-5 border border-purple-100 text-center hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <Heart size={24} className="mx-auto text-[#6F3FB5] mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-semibold text-gray-800">AI Listener</div>
            <div className="text-xs text-gray-500 mt-1">Cerita kapan saja</div>
          </button>
          <button
            onClick={() => navigate("/psychologists")}
            className="bg-white rounded-2xl p-5 border border-purple-100 text-center hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <MessageCircle size={24} className="mx-auto text-[#6F3FB5] mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-semibold text-gray-800">Konsultasi Psikolog</div>
            <div className="text-xs text-gray-500 mt-1">Dengan profesional</div>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-purple-100">
          <h3 className="font-bold text-gray-800 mb-2 text-sm">Ingat: Kamu Tidak Sendirian</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Mencari bantuan adalah tanda keberanian, bukan kelemahan. Setiap perasaan yang kamu rasakan valid,
            dan ada orang-orang yang peduli dan siap membantumu.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmHotline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-scale-in text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: confirmHotline.color + "20" }}>
              <Phone size={24} style={{ color: confirmHotline.color }} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Konfirmasi Panggilan</h2>
            <p className="text-sm text-gray-500 mb-1">Kamu akan menghubungi</p>
            <p className="font-bold text-gray-800 mb-1">{confirmHotline.name}</p>
            <p className="text-lg font-bold mb-5" style={{ color: confirmHotline.color }}>{confirmHotline.number}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmHotline(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => { window.location.href = `tel:${confirmHotline.number.replace(/\D/g, "")}`; setConfirmHotline(null); }}
                className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors hover:opacity-90"
                style={{ backgroundColor: confirmHotline.color }}
              >
                Hubungi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
