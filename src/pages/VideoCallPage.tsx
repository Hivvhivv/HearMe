import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from "lucide-react";

type CallState = "waiting" | "connecting" | "active" | "ended";

interface Consultation {
  id: string;
  psychologistName?: string;
  doctorName?: string;
  name?: string;
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export default function VideoCallPage() {
  const navigate = useNavigate();
  const { consultationId } = useParams<{ consultationId: string }>();
  const [callState, setCallState] = useState<CallState>("waiting");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);
  const [psychologistName, setPsychologistName] = useState("Psikolog");
  const finalDuration = useRef("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hearme_consultations_v2");
      if (raw) {
        const list: Consultation[] = JSON.parse(raw);
        const found = list.find((c) => c.id === consultationId);
        if (found) {
          setPsychologistName(
            found.psychologistName || found.doctorName || found.name || "Psikolog"
          );
        }
      }
    } catch {
      /* ignore */
    }
  }, [consultationId]);

  // Waiting → connecting → active after 3s
  useEffect(() => {
    const t1 = setTimeout(() => setCallState("connecting"), 3000);
    const t2 = setTimeout(() => setCallState("active"), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Waiting timer
  useEffect(() => {
    if (callState !== "waiting") return;
    const interval = setInterval(() => setWaitingSeconds((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Call duration timer
  useEffect(() => {
    if (callState !== "active") return;
    const interval = setInterval(() => setCallSeconds((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const handleEndCall = () => {
    finalDuration.current = formatDuration(callSeconds);
    setCallState("ended");
  };

  // ── WAITING ─────────────────────────────────────────────────────────────
  if (callState === "waiting" || callState === "connecting") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-6"
        style={{ backgroundColor: "#1a1a2e", fontFamily: "Inter, sans-serif" }}
      >
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: "#6F3FB5" }}
        >
          <User size={40} className="text-white" />
        </div>

        <div className="text-center">
          <p className="mb-1 text-lg font-semibold text-white">
            {callState === "connecting"
              ? "Menghubungkan..."
              : "Menunggu psikolog bergabung..."}
          </p>
          <p className="text-sm text-gray-400">
            {callState === "waiting"
              ? formatDuration(waitingSeconds)
              : "Harap tunggu sebentar"}
          </p>
        </div>

        {callState === "waiting" && (
          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-full border border-red-500 px-6 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Batalkan
          </button>
        )}
      </div>
    );
  }

  // ── ENDED ────────────────────────────────────────────────────────────────
  if (callState === "ended") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-6"
        style={{ backgroundColor: "#1a1a2e", fontFamily: "Inter, sans-serif" }}
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700"
        >
          <PhoneOff size={32} className="text-gray-300" />
        </div>
        <div className="text-center">
          <p
            className="mb-1 text-2xl font-bold text-white"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Panggilan selesai
          </p>
          <p className="text-sm text-gray-400">
            Durasi: {finalDuration.current || formatDuration(callSeconds)}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#6F3FB5" }}
        >
          Kembali
        </button>
      </div>
    );
  }

  // ── ACTIVE ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden"
      style={{ backgroundColor: "#1a1a2e", fontFamily: "Inter, sans-serif" }}
    >
      {/* Remote video area */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        {/* Doctor placeholder */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full"
            style={{ backgroundColor: "#2d2d4e" }}
          >
            <User size={56} className="text-purple-300" />
          </div>
          <p className="text-base font-medium text-gray-300">
            {psychologistName}
          </p>
        </div>

        {/* Duration top left */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-mono text-white">
            {formatDuration(callSeconds)}
          </span>
        </div>

        {/* Psychologist name top center */}
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5">
          <span
            className="text-sm font-semibold text-white"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {psychologistName}
          </span>
        </div>

        {/* Self video overlay — bottom right */}
        <div
          className="absolute bottom-24 right-4 flex h-36 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-purple-500/50 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #6F3FB5 0%, #C9A9E9 100%)",
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {cameraOn ? (
              <Video size={20} className="text-white/80" />
            ) : (
              <VideoOff size={20} className="text-white/80" />
            )}
            <span className="text-xs font-semibold text-white">Kamu</span>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-center gap-6 pb-10 pt-4">
        <button
          onClick={() => setMicOn((p) => !p)}
          className="flex h-14 w-14 items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: micOn ? "#2d2d4e" : "#6F3FB5" }}
          title={micOn ? "Matikan Mikrofon" : "Nyalakan Mikrofon"}
        >
          {micOn ? (
            <Mic size={22} className="text-white" />
          ) : (
            <MicOff size={22} className="text-white" />
          )}
        </button>

        <button
          onClick={handleEndCall}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg transition-transform hover:scale-105 active:scale-95"
          title="Akhiri Panggilan"
        >
          <PhoneOff size={26} className="text-white" />
        </button>

        <button
          onClick={() => setCameraOn((p) => !p)}
          className="flex h-14 w-14 items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: cameraOn ? "#2d2d4e" : "#6F3FB5" }}
          title={cameraOn ? "Matikan Kamera" : "Nyalakan Kamera"}
        >
          {cameraOn ? (
            <Video size={22} className="text-white" />
          ) : (
            <VideoOff size={22} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
