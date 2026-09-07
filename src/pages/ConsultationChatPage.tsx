import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, Phone, Video } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import { consultationService } from "../services";
import { consultationChatService } from "../services";
import { psychologists } from "../data/mockData";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// consultation_messages table:
// id, consultation_id, sender (user|psychologist), message, created_at
//
// Real-time: Firebase Realtime DB / Supabase Realtime / WebSocket
// ======================================================

interface ChatMessage {
  id: string;
  sender: "user" | "psychologist";
  text: string;
  time: string;
}

const psychologistResponses = [
  "Terima kasih telah berbagi. Itu pasti tidak mudah untuk diungkapkan.",
  "Saya memahami apa yang Anda rasakan. Bisa ceritakan lebih lanjut?",
  "Perasaan seperti itu sangat wajar. Mari kita eksplorasi bersama.",
  "Saya mendengar Anda. Sudah berapa lama Anda merasakan ini?",
  "Itu insight yang sangat berharga. Bagaimana perasaan Anda setelah mengatakannya?",
  "Bersama kita bisa mengerjakan ini langkah demi langkah.",
];

export default function ConsultationChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<{ id: string; psychologistId?: string; psychologistName: string; specialization: string; date: string; time: string; status: string; avatar: string }[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consultationService.getAll().then((all) => {
      setConsultations(all);
    });
    const history = consultationChatService.getMessages(id || "");
    if (history.length > 0) {
      setMessages(history);
    } else {
      const initMsg: ChatMessage = {
        id: "init",
        sender: "psychologist",
        text: "Halo! Selamat datang di sesi konsultasi kita. Bagaimana kabar Anda hari ini?",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([initMsg]);
      consultationChatService.saveMessage(id || "", initMsg);
    }
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const consult = consultations.find((c) => c.id === id);
  const psych = consult?.psychologistId ? psychologists.find((p) => p.id === consult.psychologistId) : null;

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    consultationChatService.saveMessage(id || "", userMsg);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = psychologistResponses[Math.floor(Math.random() * psychologistResponses.length)];
      const psychMsg: ChatMessage = {
        id: `m${Date.now()}p`,
        sender: "psychologist",
        text: reply,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      const final = [...updated, psychMsg];
      setMessages(final);
      consultationChatService.saveMessage(id || "", psychMsg);
      setTyping(false);
    }, 1200 + Math.random() * 600);
  };

  const avatarSrc = consult?.avatar || psych?.avatar || undefined;
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
          {messages.map((m) => (
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ketik pesan..."
            className="flex-1 bg-white border border-purple-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/20 focus:border-[#6F3FB5] transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="bg-[#6F3FB5] disabled:bg-purple-300 text-white p-3 rounded-2xl hover:bg-purple-800 transition-colors shadow-sm shadow-purple-200"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
