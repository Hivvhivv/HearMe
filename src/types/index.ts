// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// These types map 1:1 to database table schemas.
// Replace localStorage mock with Supabase / PostgreSQL / MySQL / Firebase / MongoDB
// ======================================================

export type UserRole = "user" | "psychologist" | "admin";

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  gender?: string;
  birthday?: string;
  contact?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
}

export interface Psychologist {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  consultations: string;
  experience: string;
  price: string;
  available: boolean;
  avatar: string;
  bio: string;
  schedule: string[];
  tags: string[];
  verificationStatus: "pending" | "approved" | "rejected";
}

// psychologist_verifications table
export interface PsychologistVerification {
  id: string;
  psychologistId: string;
  documents: VerificationDocument[];
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  submittedAt: string;
}

export interface VerificationDocument {
  id: string;
  type: "ktp" | "str" | "sip" | "certificate";
  label: string;
  url: string;        // base64 or storage URL
  uploadedAt: string;
}

// consultations table
export interface Consultation {
  id: string;
  userId?: string;
  userName?: string;
  psychologistId: string;
  psychologistName: string;
  psychologistAvatar?: string;
  specialization?: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "upcoming" | "active" | "completed" | "cancelled" | "rejected";
  paymentStatus?: "pending" | "paid" | "failed" | "expired" | "refunded";
  paymentMethod?: string;
  avatar?: string;
  fee?: number | string;
  notes?: string;
  createdAt?: string;
}

// consultation_messages table
export interface ConsultationMessage {
  id: string;
  consultationId: string;
  senderId?: string;
  senderName?: string;
  sender?: "user" | "psychologist";
  content?: string;
  text?: string;
  type?: "text" | "image" | "file";
  time?: string;
  createdAt?: string;
}

// payments table
export interface Payment {
  id: string;
  consultationId: string;
  amount: number;
  method: "bank_transfer" | "e_wallet" | "qris";
  status: "pending" | "paid" | "failed" | "expired" | "refunded";
  createdAt: string;
  paidAt?: string;
  externalId?: string;
}

// mood_logs table
export interface MoodLog {
  id: string;
  userId: string;
  date: string;       // YYYY-MM-DD
  mood: string;
  note?: string;
  createdAt: string;
}

// journal_entries table
export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  images: string[];   // base64 previews or storage URLs
  createdAt: string;
}

// journal_images table
export interface JournalImage {
  id: string;
  journalId: string;
  imageUrl: string;
  createdAt: string;
}

// forum_posts table
export interface ForumPost {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  category: string;
  title: string;
  excerpt: string;
  content?: string;
  likes: number;
  comments: number;
  time: string;
  liked: boolean;
  saved?: boolean;
  archived?: boolean;
  isAnonymous: boolean;
  visibility: "public" | "private";
}

// forum_bans table
export interface ForumBan {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  duration: "1d" | "3d" | "7d" | "30d" | "permanent";
  bannedAt: string;
  expiresAt?: string;
  bannedBy: string;
}

// ai_sessions table
export interface AISession {
  id: string;
  userId: string;
  mode?: "text" | "voice";
  type?: "text" | "voice";
  status?: "active" | "ended";
  messages?: AIMessage[];
  recap?: AISessionRecap;
  createdAt: string;
  endedAt?: string;
}

export interface AIMessage {
  id: string;
  sessionId?: string;
  role?: "user" | "assistant";
  // legacy
  type?: "user" | "ai";
  content?: string;
  text?: string;
  time?: string;
  createdAt?: string;
}

// ai session recap
export interface AISessionRecap {
  title: string;
  summary: string;
  dominantEmotion: string;
  suggestions: string[];
  duration?: number;
  messageCount?: number;
}

// notifications table
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export type NotificationType =
  | "consultation_approved"
  | "consultation_rejected"
  | "consultation_rescheduled"
  | "payment_success"
  | "payment_failed"
  | "verification_approved"
  | "verification_rejected"
  | "forum_ban"
  | "forum_unban"
  | "new_message";

// mind_hub_contents table (admin managed)
export interface MindHubContent {
  id: string;
  category: "Mind and Balance" | "Self-Care Corner";
  title: string;
  excerpt: string;
  content: string;
  image: string;
  duration: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
