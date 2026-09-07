import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  QrCode,
  CheckCircle,
  Copy,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";

interface Consultation {
  id: string;
  psychologistName: string;
  date: string;
  time: string;
  fee: number;
  paymentStatus?: string;
  status?: string;
}

type PaymentMethod = "bank_transfer" | "ewallet" | "qris";
type EWalletOption = "gopay" | "ovo" | "dana";

const EWALLET_OPTIONS: { key: EWalletOption; label: string; color: string }[] = [
  { key: "gopay", label: "GoPay", color: "bg-green-500" },
  { key: "ovo", label: "OVO", color: "bg-purple-600" },
  { key: "dana", label: "DANA", color: "bg-blue-500" },
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function PaymentPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [eWallet, setEWallet] = useState<EWalletOption>("gopay");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("hearme_consultations_v2");
    if (raw) {
      try {
        const list: Consultation[] = JSON.parse(raw);
        const found = list.find((c) => c.id === consultationId);
        setConsultation(found || null);
      } catch {
        setConsultation(null);
      }
    }
  }, [consultationId]);

  const copyAccount = () => {
    navigator.clipboard.writeText("1234567890").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = () => {
    if (!consultation) return;
    setLoading(true);
    setTimeout(() => {
      // Create payment record
      const payment = {
        id: `pay_${Date.now()}`,
        consultationId: consultation.id,
        amount: consultation.fee,
        method,
        eWallet: method === "ewallet" ? eWallet : undefined,
        status: "success",
        createdAt: new Date().toISOString(),
      };
      const existingPayments = JSON.parse(localStorage.getItem("hearme_payments") || "[]");
      localStorage.setItem("hearme_payments", JSON.stringify([...existingPayments, payment]));

      // Update consultation paymentStatus
      const rawConsultations = localStorage.getItem("hearme_consultations_v2");
      if (rawConsultations) {
        try {
          const list: Consultation[] = JSON.parse(rawConsultations);
          const updated = list.map((c) =>
            c.id === consultation.id ? { ...c, paymentStatus: "paid" } : c
          );
          localStorage.setItem("hearme_consultations_v2", JSON.stringify(updated));
        } catch {}
      }

      // Add success notification
      const notif = {
        id: `notif_${Date.now()}`,
        userId: "me",
        type: "payment_success",
        title: "Pembayaran Berhasil",
        message: `Pembayaran konsultasi dengan ${consultation.psychologistName} sebesar ${formatRupiah(consultation.fee)} telah berhasil.`,
        read: false,
        link: "/consultations",
        createdAt: new Date().toISOString(),
      };
      const notifs = JSON.parse(localStorage.getItem("hearme_notifications") || "[]");
      localStorage.setItem("hearme_notifications", JSON.stringify([notif, ...notifs]));

      setLoading(false);
      setPaid(true);
      setTimeout(() => navigate("/consultations"), 2000);
    }, 1500);
  };

  if (!consultation) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <DashboardNavbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard size={28} className="text-red-400" />
          </div>
          <h2
            className="text-xl font-bold text-gray-800 mb-2"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Konsultasi tidak ditemukan
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Data konsultasi tidak tersedia atau sudah dihapus.
          </p>
          <Link
            to="/consultations"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6F3FB5] text-white text-sm font-medium hover:bg-[#5a2fa0] transition"
          >
            <ArrowLeft size={16} /> Kembali ke Konsultasi
          </Link>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-[#FAF8FD] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Pembayaran Berhasil!
          </h2>
          <p className="text-gray-500 text-sm">Mengalihkan ke halaman konsultasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back */}
        <Link
          to="/consultations"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#6F3FB5] mb-5 transition-colors"
        >
          <ArrowLeft size={15} /> Kembali
        </Link>

        <h1
          className="text-2xl font-bold text-gray-900 mb-5"
          style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
        >
          Pembayaran
        </h1>

        {/* Consultation summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h2
            className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Ringkasan Konsultasi
          </h2>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <User size={15} className="text-[#6F3FB5]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Psikolog</p>
                <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  {consultation.psychologistName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Calendar size={15} className="text-[#6F3FB5]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Tanggal</p>
                <p className="text-sm font-medium text-gray-800">{consultation.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Clock size={15} className="text-[#6F3FB5]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Waktu</p>
                <p className="text-sm font-medium text-gray-800">{consultation.time}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Pembayaran</span>
            <span
              className="text-xl font-bold text-[#6F3FB5]"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              {formatRupiah(consultation.fee)}
            </span>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h2
            className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Metode Pembayaran
          </h2>
          <div className="space-y-2">
            {/* Bank Transfer */}
            <label
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                method === "bank_transfer"
                  ? "border-[#6F3FB5] bg-purple-50"
                  : "border-gray-200 hover:border-[#C9A9E9]"
              }`}
            >
              <input
                type="radio"
                className="accent-[#6F3FB5]"
                checked={method === "bank_transfer"}
                onChange={() => setMethod("bank_transfer")}
              />
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <CreditCard size={16} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-800">Transfer Bank</span>
            </label>

            {/* E-Wallet */}
            <label
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                method === "ewallet"
                  ? "border-[#6F3FB5] bg-purple-50"
                  : "border-gray-200 hover:border-[#C9A9E9]"
              }`}
            >
              <input
                type="radio"
                className="accent-[#6F3FB5]"
                checked={method === "ewallet"}
                onChange={() => setMethod("ewallet")}
              />
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Smartphone size={16} className="text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-800">E-Wallet</span>
            </label>

            {/* QRIS */}
            <label
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                method === "qris"
                  ? "border-[#6F3FB5] bg-purple-50"
                  : "border-gray-200 hover:border-[#C9A9E9]"
              }`}
            >
              <input
                type="radio"
                className="accent-[#6F3FB5]"
                checked={method === "qris"}
                onChange={() => setMethod("qris")}
              />
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <QrCode size={16} className="text-[#6F3FB5]" />
              </div>
              <span className="text-sm font-medium text-gray-800">QRIS</span>
            </label>
          </div>

          {/* Method details */}
          {method === "bank_transfer" && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-500 font-medium mb-2">Transfer ke rekening berikut:</p>
              <p className="text-sm text-blue-800 font-semibold">BCA</p>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <p className="text-lg font-bold text-blue-900 tracking-widest">1234567890</p>
                  <p className="text-xs text-blue-600">a.n. HearMe Indonesia</p>
                </div>
                <button
                  onClick={copyAccount}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition"
                >
                  {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
            </div>
          )}

          {method === "ewallet" && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Pilih layanan e-wallet:</p>
              <div className="grid grid-cols-3 gap-2">
                {EWALLET_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setEWallet(opt.key)}
                    className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      eWallet === opt.key
                        ? "border-[#6F3FB5] scale-105 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${opt.color} mx-auto mb-1.5 flex items-center justify-center`}>
                      <Smartphone size={14} className="text-white" />
                    </div>
                    <span className="text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Ikuti instruksi di aplikasi {EWALLET_OPTIONS.find((o) => o.key === eWallet)?.label} Anda.
              </p>
            </div>
          )}

          {method === "qris" && (
            <div className="mt-4 flex flex-col items-center">
              <div className="w-40 h-40 rounded-xl bg-gradient-to-br from-[#6F3FB5] to-[#C9A9E9] flex items-center justify-center mb-2 shadow-md">
                <div className="w-32 h-32 rounded-lg bg-white flex items-center justify-center">
                  <div className="w-24 h-24 rounded bg-gradient-to-br from-gray-800 to-gray-600 grid grid-cols-3 gap-1 p-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${i % 3 === 0 || i === 4 ? "bg-white" : "bg-gray-800"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium">QR Code</p>
              <p className="text-xs text-gray-400 mt-1">Scan dengan aplikasi perbankan Anda</p>
            </div>
          )}
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#6F3FB5] text-white font-bold text-base hover:bg-[#5a2fa0] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
          style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Bayar Sekarang · {formatRupiah(consultation.fee)}
            </>
          )}
        </button>
        <p className="text-xs text-center text-gray-400 mt-3">
          Dengan melanjutkan, Anda menyetujui syarat dan ketentuan pembayaran HearMe.
        </p>
      </div>
    </div>
  );
}
