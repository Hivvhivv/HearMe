import { useCallback, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Phone, Video } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import { consultationAPI } from "../api/consultation.api";
import { chatSocket, type ChatMessage as ApiMessage } from "../api/socket";
import type { Consultation } from "../types";

// ======================================================
// CHAT KONSULTASI (SISI USER) — REALTIME
// ======================================================
//
// INI YANG PALING KELIRU SEBELUMNYA:
//
// Halaman ini TIDAK pernah bicara dengan psikolog. Pesan
// disimpan di localStorage, dan "balasan psikolog" diambil
// acak dari array `psychologistResponses` setelah jeda
// 1,2 detik. Jadi user merasa sedang berkonsultasi padahal
// sedang bicara dengan teks kaleng.
//
// Sekarang pesan benar-benar dikirim ke psikolog lewat
// Socket.IO, tersimpan di MongoDB, dan sampai ke semua
// device peserta. Tidak ada lagi balasan otomatis.
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

export default function ConsultationChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [input, setInput] = useState("");

  // `typing` kini berarti LAWAN BICARA sedang menulis,
  // bukan animasi palsu sebelum balasan otomatis.
  const [typing, setTyping] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Info konsultasi untuk header.
  useEffect(() => {
    let cancelled = false;

    consultationAPI
      .getMyConsultations()
      .then((all) => {
        if (!cancelled) setConsultations(all);
      })
      .catch(() => {
        if (!cancelled) setConsultations([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Socket: join ruang + dengarkan pesan.
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

        setMessages(result.messages.map(toChatMessage));

        offMessage = chatSocket.onMessage((payload) => {
          if (payload.consultationId !== id) return;

          setMessages((prev) =>
            prev.some((m) => m.id === String(payload.message._id))
              ? prev
              : [...prev, toChatMessage(payload.message)]
          );
        });

        offTyping = chatSocket.onTyping((payload) => {
          if (payload.consultationId !== id) return;

          setTyping(payload.typing);
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const consult = consultations.find((c) => c.id === id);

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

      setInput("");
      chatSocket.typing(id, false);
    } finally {
      setSending(false);
    }
  };

  // Avatar dari data konsultasi (MongoDB), bukan mockData.
  const avatarSrc = consult?.avatar || undefined;
  const displayName = consult?.psychologistName || "Psikolog";

  return (
    <div className="min-h-screen bg-[#FAF8FD] flex flex-col">
      <DashboardNavbar />
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4">
        {/* Chat header */}
        <div className="bg-white rounded-2xl p-4 border border-purple-50 shadow-sm mb-4 flex items-center gap-3">
          <button onClick={() => navigate("/consultations")} className="p-1.5 text-gray-400 hover:text-[#6F3FB5] rounded-lg hover:bg-[#F5EEFC] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="relative">
            <img src={avatarSrc} alt={displayName} className="w-10 h-10 rounded-2xl object-cover bg-purple-100" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-sm">{displayName}</div>
            <div className="text-xs text-gray-400">{consult?.specialization || "Psikolog"} · Online</div>
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
        {consult && (
          <div className="bg-[#F5EEFC] rounded-xl px-4 py-2 mb-4 text-xs text-[#6F3FB5] font-semibold text-center">
            📅 Sesi: {new Date(consult.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · {consult.time} WIB
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4" style={{ maxHeight: "calc(100vh - 350px)" }}>
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
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">
                Belum ada pesan. Mulai percakapan dengan psikologmu.
              </p>
            </div>
          )}

          {!loading && messages.map((m) => (
            <div key={m.id} className={`flex items-end gap-2 animate-fade-in ${m.sender === "user" ? "flex-row-reverse" : ""}`}>
              {m.sender === "psychologist" && (
                <img src={avatarSrc} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-purple-100" />
              )}
              <div className={`max-w-[75%] ${m.sender === "user" ? "flex flex-col items-end" : ""}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.sender === "psychologist"
                    ? "bg-white border border-purple-100 text-gray-800 rounded-tl-sm"
                    : "bg-[#6F3FB5] text-white rounded-tr-sm"
                }`}>
                  {m.text}
                </div>
                <span className="text-xs text-gray-400 mt-1 px-1">{m.time}</span>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-end gap-2">
              <img src={avatarSrc} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-purple-100" />
              <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#C9A9E9]"
                      style={{ animation: `pulse-gentle 1s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3 mt-2">
          <button className="p-3 bg-white border border-purple-100 rounded-2xl text-gray-400 hover:text-[#6F3FB5] hover:border-purple-300 transition-colors">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); notifyTyping(e.target.value); }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ketik pesan..."
            className="flex-1 bg-white border border-purple-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/20 focus:border-[#6F3FB5] transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="bg-[#6F3FB5] disabled:bg-purple-300 text-white p-3 rounded-2xl hover:bg-purple-800 transition-colors shadow-sm shadow-purple-200"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
