import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Phone, Video, User } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";
import { chatSocket, type ChatMessage as ApiMessage } from "../../api/socket";
import { consultationAPI } from "../../api/consultation.api";

// ======================================================
// CHAT KONSULTASI — REALTIME (SOCKET.IO)
// ======================================================
//
// Sebelumnya halaman ini menyimpan pesan di localStorage
// dan mem-POLLING localStorage setiap 2 detik — yang tentu
// tidak akan pernah menerima pesan dari device lain.
// PSYCH_ID juga di-hardcode "p1".
//
// Sekarang:
//
//   WS  consultation:join / :message / :typing
//
// Backend memverifikasi bahwa socket ini memang PESERTA
// konsultasi sebelum mengizinkan join maupun kirim pesan,
// dan senderId diambil dari session — bukan dari payload.
//
// Pesan dikirim ke ROOM, jadi semua device peserta yang
// online menerimanya.
//
// ======================================================

interface ChatMessage {
  id: string;
  sender: "user" | "psychologist";
  text: string;
  time: string;
}

function toChatMessage(m: ApiMessage): ChatMessage {
  return {
    id: String(m._id),
    sender: m.senderRole === "psychologist" ? "psychologist" : "user",
    text: m.content,
    time: new Date(m.createdAt).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default function PsychologistChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [consultation, setConsultation] = useState<{ userName?: string; date?: string; time?: string; status?: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);

  // ====================================================
  // INFO KONSULTASI
  // ====================================================
  //
  // Backend sudah memfilter berdasarkan psikolog yang
  // login, jadi tidak ada PSYCH_ID yang perlu dicocokkan.
  //
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const all = await consultationAPI.getMyConsultations();

        if (cancelled) return;

        const c = all.find((x) => x.id === id);

        if (c) {
          setConsultation({
            userName: c.userName,
            date: c.date,
            time: c.time,
            status: c.status,
          });
        }
      } catch {
        // Info header bukan hal kritis.
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ====================================================
  // SOCKET: JOIN + LISTENER
  // ====================================================

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let offMessage: (() => void) | undefined;
    let offTyping: (() => void) | undefined;

    const start = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await chatSocket.join(id);

        if (cancelled) return;

        if (!result.ok) {
          setError(
            result.code === "FORBIDDEN"
              ? "Kamu bukan peserta konsultasi ini."
              : "Gagal menyambung ke ruang konsultasi."
          );
          return;
        }

        // Riwayat dikirim backend saat join.
        setMessages(result.messages.map(toChatMessage));

        offMessage = chatSocket.onMessage((payload) => {
          if (payload.consultationId !== id) return;

          setMessages((prev) => {
            // Cegah duplikat: pesan sendiri juga datang
            // kembali lewat room.
            if (prev.some((m) => m.id === String(payload.message._id))) {
              return prev;
            }

            return [...prev, toChatMessage(payload.message)];
          });
        });

        offTyping = chatSocket.onTyping((payload) => {
          if (payload.consultationId !== id) return;

          setPeerTyping(payload.typing);
        });

        chatSocket.markRead(id);
      } catch {
        if (!cancelled) {
          setError("Gagal menyambung ke ruang konsultasi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      offMessage?.();
      offTyping?.();
      chatSocket.leave(id);
    };
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const userName = consultation?.userName || "Pasien";

  const notifyTyping = useCallback(
    (value: string) => {
      if (id) chatSocket.typing(id, value.length > 0);
    },
    [id]
  );

  const send = async () => {
    const text = input.trim();
    if (!text || !id) return;

    try {
      setSending(true);
      setError("");

      const result = await chatSocket.send(id, text);

      if (!result.ok) {
        setError(result.message || "Gagal mengirim pesan.");
        return;
      }

      // Pesan ditambahkan lewat listener room, jadi di sini
      // cukup bersihkan input.
      setInput("");
      chatSocket.typing(id, false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD] flex flex-col">
      <PsychologistNavbar />

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 border border-purple-50 shadow-sm mb-4 flex items-center gap-3">
          <button onClick={() => navigate("/psychologist/consultations")}
            className="p-1.5 text-gray-400 hover:text-[#6F3FB5] rounded-lg hover:bg-[#F5EEFC] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-300 to-[#6F3FB5] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            <User size={18} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-sm">{userName}</div>
            <div className="text-xs text-gray-400">
              Konsultasi {id} · {consultation?.date ? new Date(consultation.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""} {consultation?.time || ""}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-[#F5EEFC] hover:bg-purple-200 text-[#6F3FB5] rounded-xl transition-colors">
              <Phone size={16} />
            </button>
            <button className="p-2 bg-[#F5EEFC] hover:bg-purple-200 text-[#6F3FB5] rounded-xl transition-colors">
              <Video size={16} />
            </button>
          </div>
        </div>

        {/* Session info */}
        <div className="bg-[#F5EEFC] rounded-xl px-4 py-2 mb-4 text-xs text-[#6F3FB5] font-semibold text-center">
          Sesi Konsultasi dengan {userName} — pesan terlihat oleh kedua pihak
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4" style={{ maxHeight: "calc(100vh - 360px)" }}>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className={i % 2 ? "flex justify-end" : "flex"}>
                  <div className="h-10 w-48 rounded-2xl bg-purple-50 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Belum ada pesan. Mulai percakapan dengan pasien.</p>
            </div>
          )}
          {!loading && messages.map((m) => {
            const isMe = m.sender === "psychologist";
            return (
              <div key={m.id} className={`flex items-end gap-2 animate-fade-in ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {userName[0]?.toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? "flex flex-col items-end" : ""}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMe ? "bg-[#6F3FB5] text-white rounded-tr-sm" : "bg-white border border-purple-100 text-gray-800 rounded-tl-sm"
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 px-1">{m.time}</span>
                </div>
              </div>
            );
          })}
          {/* Indikator "sedang menulis" dari lawan bicara —
              dikirim lewat socket, tidak menyentuh database. */}
          {peerTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:0.3s]" />
              </span>
              {userName} sedang menulis...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3 mt-2">
          <button className="p-3 bg-white border border-purple-100 rounded-2xl text-gray-400 hover:text-[#6F3FB5] hover:border-purple-300 transition-colors">
            <Paperclip size={18} />
          </button>
          <input type="text" value={input} onChange={(e) => { setInput(e.target.value); notifyTyping(e.target.value); }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ketik pesan ke pasien..."
            className="flex-1 bg-white border border-purple-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/20 focus:border-[#6F3FB5] transition-colors" />
          <button onClick={send} disabled={!input.trim() || sending}
            className="bg-[#6F3FB5] disabled:bg-purple-300 text-white p-3 rounded-2xl hover:bg-purple-800 transition-colors shadow-sm shadow-purple-200">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
