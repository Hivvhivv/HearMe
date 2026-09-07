import { useState, useRef, useEffect } from "react";
import { Send, Bot, Trash2, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import { aiKeywordResponses, defaultAiResponses } from "../data/mockData";
import { chatService } from "../services";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// chat_sessions / chat_messages tables
// Save chat history per session per user
//
// ## AI API INTEGRATION AREA ##
// Replace getMockResponse with:
// const response = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message }) });
// OpenAI API / Gemini API / Claude API
// ======================================================

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
  time: string;
}

const INITIAL_MSG: Message = {
  id: "m_init",
  role: "ai",
  text: "Hei, aku di sini untuk mendengarkan. Bagaimana perasaanmu hari ini? 💜",
  time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
};

function getMockResponse(userMessage: string): string {
  // ======================================================
  // ## AI API INTEGRATION AREA ##
  // Replace this function with an actual AI API call.
  //
  // Example using Claude API:
  // const response = await fetch("/api/chat", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ message: userMessage, history: chatHistory }),
  // });
  // const data = await response.json();
  // return data.reply;
  // ======================================================

  const lower = userMessage.toLowerCase();

  for (const [keyword, responses] of Object.entries(aiKeywordResponses)) {
    if (lower.includes(keyword)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  return defaultAiResponses[Math.floor(Math.random() * defaultAiResponses.length)];
}

function formatTime() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function AIListenerPage() {
  const savedHistory = chatService.getHistory();
  const [messages, setMessages] = useState<Message[]>(
    savedHistory.length > 0 ? savedHistory : [INITIAL_MSG]
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: `m${Date.now()}`, role: "user", text, time: formatTime() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const aiText = getMockResponse(text);
      const aiMsg: Message = { id: `m${Date.now()}ai`, role: "ai", text: aiText, time: formatTime() };
      const final = [...updated, aiMsg];
      setMessages(final);
      chatService.saveHistory(final);
      setTyping(false);
    }, 900 + Math.random() * 700);
  };

  const clearHistory = () => {
    const fresh = [INITIAL_MSG];
    setMessages(fresh);
    chatService.saveHistory(fresh);
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD] flex flex-col">
      <DashboardNavbar />
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6F3FB5] to-[#8B5CF6] rounded-3xl p-5 mb-4 text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg">AI Listener</h1>
            <p className="text-purple-200 text-sm">Aku selalu di sini untuk mendengarkan</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/ai-listener/voice" title="Voice AI Session" className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors">
              <Mic size={13} /> Voice
            </Link>
            <button onClick={clearHistory} title="Hapus riwayat" className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <Trash2 size={14} />
            </button>
            <div className="flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4" style={{ maxHeight: "calc(100vh - 320px)" }}>
          {messages.map((m) => (
            <div key={m.id} className={`flex items-end gap-2 animate-fade-in ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[78%] ${m.role === "user" ? "flex flex-col items-end" : ""}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "ai"
                    ? "bg-white border border-purple-100 text-gray-800 rounded-tl-sm shadow-sm"
                    : "bg-[#6F3FB5] text-white rounded-tr-sm"
                }`}>
                  {m.text}
                </div>
                <span className="text-xs text-gray-400 mt-1 px-1">{m.time}</span>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-end gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
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

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {["Aku sedang stres", "Aku merasa kesepian", "Aku cemas tentang masa depan", "Aku butuh motivasi"].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="text-xs bg-white border border-purple-100 hover:border-[#6F3FB5] hover:bg-[#F5EEFC] text-gray-600 hover:text-[#6F3FB5] px-3 py-1.5 rounded-xl transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 mt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ceritakan apa yang kamu rasakan..."
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

        <p className="text-xs text-center text-gray-400 mt-3">
          AI Listener adalah pendukung emosional, bukan pengganti konsultasi profesional.
        </p>
      </div>
    </div>
  );
}
