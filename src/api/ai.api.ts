import type { AISession, AIMessage, AISessionRecap } from "../types";

// ======================================================
// ## AI API TEMPLATE IF CONNECTED ##
//
// Text AI (OpenAI / Gemini / Claude):
// const response = await fetch('/api/ai/chat', {
//   method: 'POST',
//   body: JSON.stringify({ messages, model: 'gpt-4o' })
// })
//
// Voice AI (OpenAI Whisper / ElevenLabs / AssemblyAI):
// const transcript = await fetch('/api/ai/transcribe', {
//   method: 'POST',
//   body: formData  // multipart with audio blob
// })
//
// Text-to-Speech:
// const audio = await fetch('/api/ai/tts', {
//   method: 'POST',
//   body: JSON.stringify({ text, voice: 'nova' })
// })
// ======================================================

const SESSIONS_KEY = "hearme_ai_sessions";
const MESSAGES_KEY = "hearme_ai_messages";

function allSessions(): AISession[] {
  const raw = localStorage.getItem(SESSIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveSessions(s: AISession[]) { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)); }

function allMessages(): Record<string, AIMessage[]> {
  const raw = localStorage.getItem(MESSAGES_KEY);
  return raw ? JSON.parse(raw) : {};
}
function saveMessages(m: Record<string, AIMessage[]>) { localStorage.setItem(MESSAGES_KEY, JSON.stringify(m)); }

export const aiAPI = {
  getSessions: async (): Promise<AISession[]> => allSessions().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  createSession: async (mode: "text" | "voice"): Promise<AISession> => {
    const session: AISession = {
      id: `sess_${Date.now()}`,
      userId: "me",
      mode,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    saveSessions([session, ...allSessions()]);
    return session;
  },

  endSession: async (sessionId: string, recap: AISessionRecap): Promise<AISession> => {
    const updated = allSessions().map((s) =>
      s.id === sessionId ? { ...s, status: "ended" as const, endedAt: new Date().toISOString(), recap } : s
    );
    saveSessions(updated);
    return updated.find((s) => s.id === sessionId)!;
  },

  getMessages: async (sessionId: string): Promise<AIMessage[]> => {
    return allMessages()[sessionId] || [];
  },

  addMessage: async (sessionId: string, role: "user" | "assistant", content: string): Promise<AIMessage> => {
    const msg: AIMessage = {
      id: `aim_${Date.now()}`,
      sessionId,
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    const all = allMessages();
    all[sessionId] = [...(all[sessionId] || []), msg];
    saveMessages(all);
    return msg;
  },

  generateRecap: async (messages: AIMessage[]): Promise<AISessionRecap> => {
    // ## AI API TEMPLATE IF CONNECTED ##
    // const response = await fetch('/api/ai/recap', { method: 'POST', body: JSON.stringify({ messages }) })
    // const { title, summary, dominantEmotion, suggestions } = await response.json()

    const emotionKeywords: Record<string, string> = {
      sedih: "Sedih", cemas: "Cemas", marah: "Marah", takut: "Takut",
      stress: "Stres", burnout: "Kelelahan", bahagia: "Bahagia", bingung: "Bingung",
      kesepian: "Kesepian", overthinking: "Overthinking",
    };
    const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase()).join(" ");
    let dominantEmotion = "Netral";
    for (const [kw, label] of Object.entries(emotionKeywords)) {
      if (userMessages.includes(kw)) { dominantEmotion = label; break; }
    }

    return {
      title: `Sesi ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      summary: "Dalam sesi ini, kamu berbagi perasaan dan pikiran yang sedang kamu alami. HearMe AI telah mendengarkan dengan penuh perhatian.",
      dominantEmotion,
      suggestions: [
        "Luangkan waktu 10 menit untuk meditasi atau pernapasan dalam",
        "Tuliskan 3 hal yang kamu syukuri hari ini di jurnal",
        "Hubungi seseorang yang kamu percaya untuk berbagi perasaan",
      ],
      duration: messages.length * 30,
      messageCount: messages.length,
    };
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    saveSessions(allSessions().filter((s) => s.id !== sessionId));
    const all = allMessages();
    delete all[sessionId];
    saveMessages(all);
  },
};
