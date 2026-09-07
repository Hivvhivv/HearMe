import type { Consultation, ConsultationMessage } from "../types";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// consultations table: id, user_id, psychologist_id, date, time, status, notes, created_at
// consultation_messages table: id, consultation_id, sender_id, content, type, created_at
// SELECT * FROM consultations WHERE user_id = ? OR psychologist_id = ? ORDER BY date DESC
// ======================================================

const CONSULT_KEY = "hearme_consultations_v2";
const MSG_KEY = "hearme_consultation_messages";

function allConsultations(): Consultation[] {
  const raw = localStorage.getItem(CONSULT_KEY);
  if (!raw) {
    const mock: Consultation[] = [
      {
        id: "c1",
        userId: "me",
        psychologistId: "p1",
        psychologistName: "Dr. Inof Sucipto",
        psychologistAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop&auto=format",
        date: "25 Sep 2025",
        time: "10:00",
        status: "approved",
        fee: 150000,
        notes: "Konsultasi pertama",
        createdAt: new Date().toISOString(),
      },
      {
        id: "c2",
        userId: "me",
        psychologistId: "p2",
        psychologistName: "Dr. Anisa Rahmawati",
        psychologistAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&auto=format",
        date: "18 Sep 2025",
        time: "14:00",
        status: "pending",
        fee: 200000,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(CONSULT_KEY, JSON.stringify(mock));
    return mock;
  }
  return JSON.parse(raw);
}
function saveConsultations(c: Consultation[]) { localStorage.setItem(CONSULT_KEY, JSON.stringify(c)); }

function allMessages(): Record<string, ConsultationMessage[]> {
  const raw = localStorage.getItem(MSG_KEY);
  return raw ? JSON.parse(raw) : {};
}
function saveMessages(m: Record<string, ConsultationMessage[]>) { localStorage.setItem(MSG_KEY, JSON.stringify(m)); }

export const consultationAPI = {
  getAll: async (userId = "me"): Promise<Consultation[]> => {
    return allConsultations().filter((c) => c.userId === userId);
  },

  getForPsychologist: async (psychologistId: string): Promise<Consultation[]> => {
    return allConsultations().filter((c) => c.psychologistId === psychologistId);
  },

  getById: async (id: string): Promise<Consultation | null> => {
    return allConsultations().find((c) => c.id === id) || null;
  },

  book: async (data: {
    psychologistId: string;
    psychologistName: string;
    psychologistAvatar: string;
    date: string;
    time: string;
    fee: number;
    notes?: string;
  }): Promise<Consultation> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → INSERT INTO consultations (...) VALUES (...)
    const consultation: Consultation = {
      id: `c_${Date.now()}`,
      userId: "me",
      psychologistId: data.psychologistId,
      psychologistName: data.psychologistName,
      psychologistAvatar: data.psychologistAvatar,
      date: data.date,
      time: data.time,
      status: "pending",
      fee: data.fee,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    saveConsultations([consultation, ...allConsultations()]);
    return consultation;
  },

  updateStatus: async (id: string, status: Consultation["status"], rescheduleDate?: string, rescheduleTime?: string): Promise<void> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → UPDATE consultations SET status = ? WHERE id = ?
    saveConsultations(allConsultations().map((c) =>
      c.id === id ? { ...c, status, ...(rescheduleDate ? { date: rescheduleDate } : {}), ...(rescheduleTime ? { time: rescheduleTime } : {}) } : c
    ));
  },

  cancel: async (id: string): Promise<void> => {
    saveConsultations(allConsultations().map((c) => c.id === id ? { ...c, status: "cancelled" as const } : c));
  },

  // Messages
  getMessages: async (consultationId: string): Promise<ConsultationMessage[]> => {
    const all = allMessages();
    if (!all[consultationId]) {
      const defaultMsgs: ConsultationMessage[] = [
        {
          id: "m0",
          consultationId,
          senderId: consultationId === "c1" ? "p1" : "psych",
          senderName: "Dr. Inof Sucipto",
          content: "Halo! Saya Dr. Inof Sucipto. Apa yang bisa saya bantu hari ini?",
          type: "text",
          createdAt: new Date(Date.now() - 60000).toISOString(),
        },
      ];
      all[consultationId] = defaultMsgs;
      saveMessages(all);
    }
    return all[consultationId];
  },

  sendMessage: async (consultationId: string, senderId: string, senderName: string, content: string): Promise<ConsultationMessage> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → INSERT INTO consultation_messages (...) VALUES (...)
    const msg: ConsultationMessage = {
      id: `msg_${Date.now()}`,
      consultationId,
      senderId,
      senderName,
      content,
      type: "text",
      createdAt: new Date().toISOString(),
    };
    const all = allMessages();
    all[consultationId] = [...(all[consultationId] || []), msg];
    saveMessages(all);
    return msg;
  },
};
