import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Phone, Video, User } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";
import { consultationChatService } from "../../services";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// TABLE: consultation_messages
// FIELDS:
//   id, consultation_id, sender_id, sender_role,
//   message, attachment_url, created_at
//
// sender_role: user | psychologist
//
// Real-time: Firebase Realtime DB / Supabase Realtime / WebSocket
// ======================================================

// ======================================================
// ## API TEMPLATE IF CONNECTED ##
//
// SERVICE: Real-time Messaging
// ENDPOINT EXAMPLE:
//   GET  /api/consultations/:id/messages
//   POST /api/consultations/:id/messages
//   WS   /ws/consultations/:id
//
// ======================================================

interface ChatMessage {
  id: string;
  sender: "user" | "psychologist";
  text: string;
  time: string;
}

const PSYCH_ID = "p1";

export default function PsychologistChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [consultation, setConsultation] = useState<{ userName?: string; date?: string; time?: string; status?: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = () => {
    const msgs = consultationChatService.getMessages(id || "");
    setMessages(msgs);
  };

  useEffect(() => {
    // Load consultation info
    try {
      const all: { id: string; userName?: string; date?: string; time?: string; status?: string; psychologistId?: string }[] =
        JSON.parse(localStorage.getItem("hearme_consultations_v2") || "[]");
      const c = all.find((x) => x.id === id && (x.psychologistId === PSYCH_ID || !x.psychologistId));
      if (c) setConsultation(c);
    } catch {}

    loadMessages();

    // Poll for new messages every 2 seconds (simulates real-time)
    pollRef.current = setInterval(loadMessages, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const userName = consultation?.userName || "Pasien";

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const msg: ChatMessage = {
      id: `pm${Date.now()}`,
      sender: "psychologist",
      text,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // TODO: INSERT INTO consultation_messages (consultation_id, sender_id, sender_role, message) VALUES (?)
    // ======================================================
    consultationChatService.saveMessage(id || "", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
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
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Belum ada pesan. Mulai percakapan dengan pasien.</p>
            </div>
          )}
          {messages.map((m) => {
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
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3 mt-2">
          <button className="p-3 bg-white border border-purple-100 rounded-2xl text-gray-400 hover:text-[#6F3FB5] hover:border-purple-300 transition-colors">
            <Paperclip size={18} />
          </button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ketik pesan ke pasien..."
            className="flex-1 bg-white border border-purple-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/20 focus:border-[#6F3FB5] transition-colors" />
          <button onClick={send} disabled={!input.trim()}
            className="bg-[#6F3FB5] disabled:bg-purple-300 text-white p-3 rounded-2xl hover:bg-purple-800 transition-colors shadow-sm shadow-purple-200">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
