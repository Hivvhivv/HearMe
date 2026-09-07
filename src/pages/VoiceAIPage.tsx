import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, ArrowLeft, Clock, ChevronRight, X } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";

type SessionState = "idle" | "listening" | "processing";

interface SessionRecap {
  id: string;
  date: string;
  dominantEmotion: string;
  emotionEmoji: string;
  duration: string;
  summary: string;
  suggestions: string[];
  mode?: string;
  type?: string;
}

const MOCK_RECAP: Omit<SessionRecap, "id" | "date" | "duration"> = {
  dominantEmotion: "Cemas",
  emotionEmoji: "😰",
  summary:
    "Dalam sesi ini kamu berbagi tentang tekanan pekerjaan dan kekhawatiran terhadap masa depan. Kamu tampak merasa kewalahan dan mencari dukungan untuk mengelola stres.",
  suggestions: [
    "Coba teknik pernapasan 4-7-8 setiap pagi untuk menenangkan pikiran.",
    "Tuliskan kekhawatiranmu di jurnal agar terasa lebih ringan.",
    "Batasi paparan berita atau media sosial yang memicu kecemasan.",
  ],
};

function RecapModal({
  recap,
  onClose,
}: {
  recap: SessionRecap;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-xl font-bold text-gray-800"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Recap Sesi Suara
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
          <Clock size={14} />
          <span>{recap.date}</span>
          <span>·</span>
          <span>{recap.duration}</span>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          {recap.summary}
        </p>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Emosi Dominan
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
            {recap.dominantEmotion} {recap.emotionEmoji}
          </span>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Saran
          </p>
          <ul className="space-y-2">
            {recap.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="mt-0.5 flex-shrink-0 text-purple-500">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#6F3FB5" }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export default function VoiceAIPage() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [listeningSeconds, setListeningSeconds] = useState(0);
  const [activeRecap, setActiveRecap] = useState<SessionRecap | null>(null);
  const [showNewRecap, setShowNewRecap] = useState(false);
  const [newRecap, setNewRecap] = useState<SessionRecap | null>(null);
  const [sessions, setSessions] = useState<SessionRecap[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hearme_ai_sessions");
      if (raw) {
        const parsed: SessionRecap[] = JSON.parse(raw);
        setSessions(
          parsed.filter((s) => s.mode === "voice" || s.type === "voice")
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (sessionState === "listening") {
      interval = setInterval(() => {
        setListeningSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStart = () => {
    setListeningSeconds(0);
    setSessionState("listening");
  };

  const handleStop = () => {
    setSessionState("processing");
    setTimeout(() => {
      const duration = formatDuration(listeningSeconds);
      const recap: SessionRecap = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration,
        ...MOCK_RECAP,
        type: "voice",
        mode: "voice",
      };
      setNewRecap(recap);
      setShowNewRecap(true);
      setSessionState("idle");

      // Persist
      try {
        const raw = localStorage.getItem("hearme_ai_sessions");
        const existing: SessionRecap[] = raw ? JSON.parse(raw) : [];
        const updated = [recap, ...existing];
        localStorage.setItem("hearme_ai_sessions", JSON.stringify(updated));
        setSessions(updated.filter((s) => s.mode === "voice" || s.type === "voice"));
      } catch {
        /* ignore */
      }
    }, 2000);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#FAF8FD", fontFamily: "Inter, sans-serif" }}
    >
      <DashboardNavbar />

      {/* Back button */}
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <button
          onClick={() => navigate("/ai-listener")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke AI Listener
        </button>

        {/* Main interaction area */}
        <div className="mb-8 flex flex-col items-center rounded-3xl bg-white px-6 py-10 shadow-sm">
          <h1
            className="mb-2 text-2xl font-bold text-gray-800"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Voice AI
          </h1>
          <p className="mb-8 text-center text-sm text-gray-500">
            Ceritakan perasaanmu, aku siap mendengarkan
          </p>

          {/* Visual center */}
          <div className="relative mb-8 flex items-center justify-center">
            {sessionState === "listening" && (
              <>
                <div
                  className="absolute rounded-full opacity-20 animate-ping"
                  style={{
                    width: 160,
                    height: 160,
                    backgroundColor: "#6F3FB5",
                    animationDuration: "1.4s",
                  }}
                />
                <div
                  className="absolute rounded-full opacity-10 animate-ping"
                  style={{
                    width: 200,
                    height: 200,
                    backgroundColor: "#6F3FB5",
                    animationDuration: "1.8s",
                    animationDelay: "0.2s",
                  }}
                />
              </>
            )}

            {sessionState === "processing" ? (
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full"
                style={{ backgroundColor: "#C9A9E9" }}
              >
                <div
                  className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"
                />
              </div>
            ) : (
              <button
                onClick={sessionState === "idle" ? handleStart : handleStop}
                className="relative flex h-28 w-28 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{
                  backgroundColor:
                    sessionState === "listening" ? "#5a2fa0" : "#6F3FB5",
                }}
              >
                {sessionState === "listening" ? (
                  <Square size={32} fill="white" className="text-white" />
                ) : (
                  <Mic size={36} className="text-white" />
                )}
              </button>
            )}
          </div>

          {/* State label */}
          {sessionState === "idle" && (
            <p className="text-base font-semibold text-gray-700">
              Mulai Berbicara
            </p>
          )}
          {sessionState === "listening" && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-base font-semibold" style={{ color: "#6F3FB5" }}>
                Mendengarkan...
              </p>
              <p className="text-sm text-gray-400">
                {formatDuration(listeningSeconds)}
              </p>
              <button
                onClick={handleStop}
                className="mt-3 rounded-full border-2 border-red-400 px-5 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                Stop
              </button>
            </div>
          )}
          {sessionState === "processing" && (
            <p className="text-base font-semibold text-gray-500">
              Sedang memproses...
            </p>
          )}
        </div>

        {/* Session history */}
        <div className="mb-10">
          <h2
            className="mb-4 text-lg font-bold text-gray-800"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Riwayat Sesi Suara
          </h2>
          {sessions.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
              Belum ada sesi suara yang tersimpan.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {s.date}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        {s.dominantEmotion} {s.emotionEmoji}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {s.duration}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveRecap(s)}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors hover:bg-purple-50"
                    style={{ color: "#6F3FB5" }}
                  >
                    Lihat Recap
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recap modals */}
      {showNewRecap && newRecap && (
        <RecapModal
          recap={newRecap}
          onClose={() => {
            setShowNewRecap(false);
            setNewRecap(null);
          }}
        />
      )}
      {activeRecap && (
        <RecapModal recap={activeRecap} onClose={() => setActiveRecap(null)} />
      )}
    </div>
  );
}
