import type { Consultation, ConsultationMessage } from "../types";

const API_URL = "http://localhost:5000/api/consultations";

function getToken() {
  return localStorage.getItem("hearme_token") || localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed with status ${response.status}`);
  return data;
}

function toConsultation(item: Record<string, unknown>): Consultation {
  return {
    ...item,
    id: String(item._id || item.id),
    userId: String(item.userId || ""),
    psychologistId: String(item.psychologistId || ""),
    psychologistName: String(item.psychologistName || "Psikolog"),
    date: String(item.date || ""),
    time: String(item.time || ""),
    status: item.status as Consultation["status"],
  } as Consultation;
}

function toMessage(item: Record<string, unknown>): ConsultationMessage {
  return {
    ...item,
    id: String(item._id || item.id),
    consultationId: String(item.consultationId || ""),
    senderId: String(item.senderId || ""),
    content: String(item.content || ""),
    type: "text",
    createdAt: String(item.createdAt || ""),
  } as ConsultationMessage;
}

export const consultationAPI = {
  getMyConsultations: async (): Promise<Consultation[]> => {
    const data = await request<{ consultations: Record<string, unknown>[] }>("/mine");
    return data.consultations.map(toConsultation);
  },

  getAll: async (): Promise<Consultation[]> => consultationAPI.getMyConsultations(),
  getForPsychologist: async (): Promise<Consultation[]> => consultationAPI.getMyConsultations(),

  createConsultation: async (data: { psychologistId: string; date: string; time: string; notes?: string }): Promise<Consultation> => {
    const result = await request<{ consultation: Record<string, unknown> }>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return toConsultation(result.consultation);
  },

  book: async (data: { psychologistId: string; date: string; time: string; notes?: string }): Promise<Consultation> => consultationAPI.createConsultation(data),

  updateConsultationStatus: async (id: string, status: Consultation["status"], reason?: string): Promise<void> => {
    await request(`/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) });
  },
  updateStatus: async (id: string, status: Consultation["status"]): Promise<void> => consultationAPI.updateConsultationStatus(id, status),
  cancel: async (id: string): Promise<void> => consultationAPI.updateConsultationStatus(id, "cancelled"),

  getPsychologistSchedules: async (psychologistId: string) => {
    const data = await request<{ schedules: Record<string, unknown>[] }>(`/schedules/${psychologistId}`);
    return data.schedules;
  },
  getMySchedules: async () => {
    const data = await request<{ schedules: Record<string, unknown>[] }>("/schedules/mine");
    return data.schedules;
  },
  createSchedule: async (data: { date: string; time: string; duration?: number }) => {
    const result = await request<{ schedule: Record<string, unknown> }>("/schedules/mine", { method: "POST", body: JSON.stringify(data) });
    return result.schedule;
  },

  getMessages: async (consultationId: string): Promise<ConsultationMessage[]> => {
    const data = await request<{ messages: Record<string, unknown>[] }>(`/${consultationId}/messages`);
    return data.messages.map(toMessage);
  },
  sendMessage: async (consultationId: string, content: string): Promise<ConsultationMessage> => {
    const data = await request<{ message: Record<string, unknown> }>(`/${consultationId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
    return toMessage(data.message);
  },
};
