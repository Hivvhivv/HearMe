import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle, CreditCard, Smartphone, QrCode } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import { consultationService } from "../services";
import {
  psychologistAPI,
  type ApiPsychologist,
} from "../api/psychologist.api";

// ======================================================
// BOOKING — KETERSEDIAAN DARI BACKEND
// ======================================================
//
// Sebelumnya slot waktu adalah array HARDCODE di file ini,
// jadi user bisa memilih jam yang sebenarnya tidak dibuka
// psikolog, atau yang sudah terisi orang lain.
//
// Sekarang:
//
//   GET /api/psychologists/:id/availability?date=...
//
// Backend yang menentukan slot mana yang ada dan masih
// kosong. Saat booking dikirim, backend MEMERIKSA ULANG
// secara atomic -- jadi kalau slot baru saja diambil
// orang lain, responsnya 409 dan UI menampilkannya.
//
// ## PAYMENT API TEMPLATE ##
// Midtrans / Xendit / Stripe integration point
// ======================================================

type Step = "date" | "time" | "confirm" | "payment" | "success";
type PayMethod = "bank_transfer" | "e_wallet" | "qris";

function getNext14Days() {
  const days = [];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      key: d.toISOString().split("T")[0],
      day: dayNames[d.getDay()],
      date: d.getDate(),
      month: monthNames[d.getMonth()],
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return days;
}

function parseFee(price: string): number {
  const num = parseInt(price.replace(/\D/g, ""), 10);
  return isNaN(num) ? 150000 : num;
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [psych, setPsych] = useState<ApiPsychologist | null>(null);
  const [psychLoading, setPsychLoading] = useState(true);

  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("bank_transfer");
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Slot yang benar-benar tersedia, dari backend.
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const days = getNext14Days();
  const dayLabel = days.find((d) => d.key === selectedDate);

  // ====================================================
  // DATA PSIKOLOG
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) return;

      try {
        setPsychLoading(true);
        const data = await psychologistAPI.getById(id);
        if (!cancelled) setPsych(data);
      } catch {
        if (!cancelled) setPsych(null);
      } finally {
        if (!cancelled) setPsychLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ====================================================
  // SLOT TERSEDIA UNTUK TANGGAL TERPILIH
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const loadSlots = async () => {
      if (!id || !selectedDate) {
        setSlots([]);
        return;
      }

      try {
        setSlotsLoading(true);
        setSlotsError("");

        const available = await psychologistAPI.availability(
          id,
          selectedDate
        );

        if (cancelled) return;

        setSlots(available.map((s) => s.time));

        // Kalau jam yang sudah dipilih ternyata tidak lagi
        // tersedia, lepaskan pilihannya.
        setSelectedTime((current) =>
          current &&
          !available.some((s) => s.time === current)
            ? ""
            : current
        );
      } catch (err) {
        if (cancelled) return;

        setSlotsError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil jadwal"
        );
        setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [id, selectedDate]);

  if (psychLoading) return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-[#6F3FB5] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Memuat data psikolog...</p>
      </div>
    </div>
  );

  if (!psych) return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="flex items-center justify-center h-64 text-gray-400">Psikolog tidak ditemukan.</div>
    </div>
  );

  const fee = parseFee(psych.price);

  const stepBack = () => {
    const order: Step[] = ["date", "time", "confirm", "payment", "success"];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]);
    else navigate(-1);
  };

  const handlePay = async () => {
    // ======================================================
    // ## PAYMENT API TEMPLATE IF CONNECTED ##
    // const snap = new MidtransSnap({ clientKey: process.env.MIDTRANS_CLIENT_KEY })
    // const token = await fetch('/api/payment/create', { method: 'POST', body: JSON.stringify({ amount: fee, method: payMethod }) })
    // snap.pay(token)
    // ======================================================
    setLoading(true);
    setBookingError("");

    let consult: { id: string };

    try {
      // Backend MEMERIKSA ULANG ketersediaan slot secara
      // atomic. Kalau slot baru saja diambil user lain,
      // responsnya 409 -- bukan booking ganda.
      consult = await consultationService.book({
        psychologistId: psych.id,
        date: selectedDate,
        time: selectedTime,
        psychologistName: psych.name,
        psychologistAvatar: psych.avatar,
        fee,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal membuat booking";

      setBookingError(
        /terisi|unavailable|just booked/i.test(message)
          ? "Jadwal ini baru saja terisi. Silakan pilih waktu lain."
          : message
      );

      // Kembalikan user ke pemilihan waktu dan segarkan
      // daftar slot supaya yang sudah terisi hilang.
      setStep("time");
      setSelectedTime("");
      setLoading(false);

      if (id && selectedDate) {
        try {
          const refreshed =
            await psychologistAPI.availability(
              id,
              selectedDate
            );
          setSlots(refreshed.map((s) => s.time));
        } catch {
          // Biarkan daftar slot apa adanya.
        }
      }

      return;
    }

    // Save payment record
    const payments = JSON.parse(localStorage.getItem("hearme_payments") || "[]");
    payments.push({
      id: `pay_${Date.now()}`,
      consultationId: consult.id,
      amount: fee,
      method: payMethod,
      status: "paid",
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    });
    localStorage.setItem("hearme_payments", JSON.stringify(payments));

    // ======================================================
    // ## API TEMPLATE IF CONNECTED ##
    // Notification Service
    // notificationService.send(psych.id, "Anda memiliki permintaan konsultasi baru.")
    // Email Service / Push Notification
    // ======================================================
    const notifs = JSON.parse(localStorage.getItem("hearme_notifications") || "[]");
    notifs.unshift({
      id: `n${Date.now()}`,
      title: "Booking Berhasil",
      message: `Permintaan konsultasi dengan ${psych.name} berhasil dikirim. Menunggu konfirmasi psikolog.`,
      time: "Baru saja",
      read: false,
      type: "booking",
    });
    localStorage.setItem("hearme_notifications", JSON.stringify(notifs));

    const psychNotifs = JSON.parse(localStorage.getItem("hearme_psych_notifications") || "[]");
    psychNotifs.unshift({
      id: `pn${Date.now()}`,
      title: "Permintaan Konsultasi Baru",
      message: "Anda memiliki permintaan konsultasi baru dari pasien.",
      time: "Baru saja",
      read: false,
      type: "consultation_request",
    });
    localStorage.setItem("hearme_psych_notifications", JSON.stringify(psychNotifs));

    setLoading(false);
    setStep("success");
  };

  const stepLabels = ["Tanggal", "Waktu", "Konfirmasi", "Pembayaran"];
  const stepKeys: Step[] = ["date", "time", "confirm", "payment"];

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        {step !== "success" && (
          <button onClick={stepBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6F3FB5] mb-6 transition-colors">
            <ArrowLeft size={16} /> Kembali
          </button>
        )}

        {/* Psikolog info */}
        <div className="bg-white rounded-2xl p-4 border border-purple-50 flex items-center gap-4 mb-6 shadow-sm">
          <img src={psych.avatar || undefined} alt={psych.name} className="w-14 h-14 rounded-2xl object-cover bg-purple-100" />
          <div>
            <h2 className="font-bold text-gray-900">{psych.name}</h2>
            <p className="text-sm text-gray-500">{psych.specialization}</p>
            <p className="text-sm font-bold text-[#6F3FB5] mt-0.5">{psych.price} / sesi</p>
          </div>
        </div>

        {/* Progress — 4 steps */}
        {step !== "success" && (
          <div className="flex items-center gap-1 mb-6">
            {stepKeys.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                  step === s ? "bg-[#6F3FB5] text-white" :
                  stepKeys.indexOf(step) > i ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {stepKeys.indexOf(step) > i ? "✓" : i + 1}
                </div>
                <div className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">{stepLabels[i]}</div>
                {i < 3 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* STEP: Date */}
        {step === "date" && (
          <div className="bg-white rounded-3xl p-6 border border-purple-50 shadow-sm animate-scale-in">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Pilih Tanggal</h2>
            <p className="text-sm text-gray-500 mb-5">Pilih tanggal konsultasi yang tersedia</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {days.map((d) => (
                <button key={d.key} onClick={() => !d.isWeekend && setSelectedDate(d.key)} disabled={d.isWeekend}
                  className={`flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all text-sm ${
                    selectedDate === d.key ? "border-[#6F3FB5] bg-[#F5EEFC]" :
                    d.isWeekend ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed" :
                    "border-gray-100 hover:border-purple-200 hover:bg-[#FAF8FD]"
                  }`}>
                  <span className="text-xs text-gray-400">{d.day}</span>
                  <span className={`text-base font-bold ${selectedDate === d.key ? "text-[#6F3FB5]" : "text-gray-800"}`}>{d.date}</span>
                  <span className="text-xs text-gray-400">{d.month}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("time")} disabled={!selectedDate}
              className="w-full mt-6 bg-[#6F3FB5] disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors">
              Lanjut
            </button>
          </div>
        )}

        {/* STEP: Time */}
        {step === "time" && (
          <div className="bg-white rounded-3xl p-6 border border-purple-50 shadow-sm animate-scale-in">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Pilih Waktu</h2>
            <p className="text-sm text-gray-500 mb-5">{dayLabel && `${dayLabel.day}, ${dayLabel.date} ${dayLabel.month}`}</p>

            {/* Konflik jadwal dari backend (409) */}
            {bookingError && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-2xl px-5 py-3">
                {bookingError}
              </div>
            )}

            {/* LOADING slot */}
            {slotsLoading && (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-11 rounded-xl bg-purple-50 animate-pulse" />
                ))}
              </div>
            )}

            {/* ERROR slot */}
            {!slotsLoading && slotsError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-4">
                {slotsError}
              </div>
            )}

            {/* EMPTY slot */}
            {!slotsLoading && !slotsError && slots.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm font-semibold">Tidak ada jadwal tersedia</p>
                <p className="text-xs mt-1">Coba pilih tanggal lain</p>
              </div>
            )}

            {/* SLOT dari backend */}
            {!slotsLoading && !slotsError && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((t) => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selectedTime === t ? "border-[#6F3FB5] bg-[#F5EEFC] text-[#6F3FB5]" : "border-gray-100 hover:border-purple-200 text-gray-700"
                    }`}>
                    <Clock size={12} /> {t}
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => setStep("confirm")} disabled={!selectedTime}
              className="w-full mt-6 bg-[#6F3FB5] disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors">
              Lanjut
            </button>
          </div>
        )}

        {/* STEP: Confirm */}
        {step === "confirm" && (
          <div className="bg-white rounded-3xl p-6 border border-purple-50 shadow-sm animate-scale-in">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Konfirmasi Booking</h2>
            <div className="space-y-3 mb-6">
              {[
                ["Psikolog", psych.name],
                ["Spesialisasi", psych.specialization],
                ["Tanggal", dayLabel ? `${dayLabel.day}, ${dayLabel.date} ${dayLabel.month}` : ""],
                ["Waktu", `${selectedTime} WIB`],
                ["Durasi", "50 menit / sesi"],
                ["Biaya", psych.price],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-purple-50 last:border-0">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className="text-sm font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep("payment")}
              className="w-full bg-[#6F3FB5] text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors">
              Lanjut ke Pembayaran
            </button>
          </div>
        )}

        {/* STEP: Payment */}
        {step === "payment" && (
          <div className="bg-white rounded-3xl p-6 border border-purple-50 shadow-sm animate-scale-in">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Pilih Metode Pembayaran</h2>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">Total yang harus dibayar</p>
              <p className="text-xl font-bold text-[#6F3FB5]">Rp {fee.toLocaleString("id-ID")}</p>
            </div>

            <div className="space-y-3 mb-6">
              {([
                { id: "bank_transfer", icon: CreditCard, label: "Bank Transfer", desc: "BCA · BNI · Mandiri · BRI" },
                { id: "e_wallet", icon: Smartphone, label: "E-Wallet", desc: "GoPay · OVO · DANA · ShopeePay" },
                { id: "qris", icon: QrCode, label: "QRIS", desc: "Scan kode QR dengan aplikasi apapun" },
              ] as const).map(({ id: mid, icon: Icon, label, desc }) => (
                <button key={mid} onClick={() => setPayMethod(mid)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    payMethod === mid ? "border-[#6F3FB5] bg-[#F5EEFC]" : "border-gray-100 hover:border-purple-200"
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${payMethod === mid ? "bg-[#6F3FB5] text-white" : "bg-gray-100 text-gray-500"}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  {payMethod === mid && <CheckCircle size={18} className="ml-auto text-[#6F3FB5]" />}
                </button>
              ))}
            </div>

            {/* Bank transfer detail */}
            {payMethod === "bank_transfer" && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm">
                <p className="font-semibold text-blue-800 mb-2">Rekening Tujuan</p>
                <p className="text-blue-700">Bank BCA</p>
                <p className="text-blue-900 font-bold text-lg tracking-wider">1234 5678 90</p>
                <p className="text-blue-700 text-xs mt-1">a.n. HearMe Indonesia</p>
              </div>
            )}

            {payMethod === "qris" && (
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 bg-gray-900 rounded-xl flex items-center justify-center">
                  <QrCode size={80} className="text-white" />
                </div>
              </div>
            )}

            <button onClick={handlePay} disabled={loading}
              className="w-full bg-[#6F3FB5] disabled:bg-purple-300 text-white font-semibold py-3.5 rounded-xl hover:bg-purple-800 transition-colors">
              {loading ? "Memproses Pembayaran..." : `Bayar Rp ${fee.toLocaleString("id-ID")}`}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">Pembayaran aman & terenkripsi</p>
          </div>
        )}

        {/* STEP: Success */}
        {step === "success" && (
          <div className="bg-white rounded-3xl p-8 border border-purple-50 shadow-sm text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
            <p className="text-sm text-gray-500 mb-1">Konsultasi dengan <span className="font-semibold">{psych.name}</span></p>
            <p className="text-sm text-gray-500 mb-1">
              {dayLabel && `${dayLabel.day}, ${dayLabel.date} ${dayLabel.month}`} pukul {selectedTime} WIB
            </p>
            <p className="text-xs text-gray-400 mb-6">Menunggu konfirmasi dari psikolog</p>
            <button onClick={() => navigate("/consultations")}
              className="w-full bg-[#6F3FB5] text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors">
              Lihat Konsultasi Saya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
