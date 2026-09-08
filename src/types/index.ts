// ======================================================
// DATABASE TYPES
// ======================================================

export type UserRole =
  | "user"
  | "psychologist"
  | "admin"
  | "super_admin";


// ======================================================
// USERS
// ======================================================

export interface User {
  id: string;

  name: string;

  username?: string;

  email: string;

  gender?: string;

  birthday?: string;

  birthDate?: string;

  contact?: string;

  phoneNumber?: string;

  avatar?: string;

  role: UserRole;

  verificationStatus?:
    | "pending"
    | "approved"
    | "rejected"
    | "unverified"
    | "not_required";

  isActive?: boolean;

  createdAt: string;

  updatedAt?: string;
}


// ======================================================
// PSYCHOLOGIST
// ======================================================

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

  verificationStatus:
    | "pending"
    | "approved"
    | "rejected";
}


// ======================================================
// PSYCHOLOGIST VERIFICATION SUBMISSIONS
// ======================================================

export interface PsychologistVerification {
  id: string;

  psychologistId: string;

  submissionNumber?: number;

  documents: VerificationDocument[];

  status:
    | "pending"
    | "approved"
    | "rejected";

  reason?: string | null;

  reviewedBy?: string;

  reviewedAt?: string;

  submittedAt: string;
}


// ======================================================
// VERIFICATION DOCUMENT
// ======================================================

export interface VerificationDocument {
  id: string;

  type:
    | "ktp"
    | "str"
    | "sip"
    | "certificate";

  label: string;

  url: string;

  uploadedAt: string;

  // Backend fields
  fileName?: string;

  fileUrl?: string;
}


// ======================================================
// CONSULTATIONS
// ======================================================

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

  status:
    | "pending"
    | "approved"
    | "upcoming"
    | "active"
    | "completed"
    | "cancelled"
    | "rejected";

  paymentStatus?:
    | "pending"
    | "paid"
    | "failed"
    | "expired"
    | "refunded";

  paymentMethod?: string;

  avatar?: string;

  fee?: number | string;

  notes?: string;

  createdAt?: string;
}


// ======================================================
// CONSULTATION MESSAGES
// ======================================================

export interface ConsultationMessage {
  id: string;

  consultationId: string;

  senderId?: string;

  senderName?: string;

  sender?:
    | "user"
    | "psychologist";

  content?: string;

  text?: string;

  type?:
    | "text"
    | "image"
    | "file";

  time?: string;

  createdAt?: string;
}


// ======================================================
// PAYMENTS
// ======================================================

export interface Payment {
  id: string;

  consultationId: string;

  amount: number;

  method:
    | "bank_transfer"
    | "e_wallet"
    | "qris";

  status:
    | "pending"
    | "paid"
    | "failed"
    | "expired"
    | "refunded";

  createdAt: string;

  paidAt?: string;

  externalId?: string;
}


// ======================================================
// MOOD LOGS
// ======================================================

export interface MoodLog {
  id: string;

  userId: string;

  date: string;

  mood: string;

  note?: string;

  createdAt: string;
}


// ======================================================
// JOURNAL ENTRIES
// ======================================================

export interface JournalEntry {
  id: string;

  userId: string;

  title: string;

  content: string;

  mood: string;

  images: string[];

  createdAt: string;
}


// ======================================================
// JOURNAL IMAGES
// ======================================================

export interface JournalImage {
  id: string;

  journalId: string;

  imageUrl: string;

  createdAt: string;
}


// ======================================================
// FORUM POSTS
// ======================================================

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

  visibility:
    | "public"
    | "private";
}


// ======================================================
// FORUM BANS
// ======================================================

export interface ForumBan {
  id: string;

  userId: string;

  userName: string;

  reason: string;

  duration:
    | "1d"
    | "3d"
    | "7d"
    | "30d"
    | "permanent";

  bannedAt: string;

  expiresAt?: string;

  bannedBy: string;
}


// ======================================================
// AI SESSIONS
// ======================================================

export interface AISession {
  id: string;

  userId: string;

  mode?:
    | "text"
    | "voice";

  type?:
    | "text"
    | "voice";

  status?:
    | "active"
    | "ended";

  messages?: AIMessage[];

  recap?: AISessionRecap;

  createdAt: string;

  endedAt?: string;
}


// ======================================================
// AI MESSAGES
// ======================================================

export interface AIMessage {
  id: string;

  sessionId?: string;

  role?:
    | "user"
    | "assistant";

  // Legacy
  type?:
    | "user"
    | "ai";

  content?: string;

  text?: string;

  time?: string;

  createdAt?: string;
}


// ======================================================
// AI SESSION RECAP
// ======================================================

export interface AISessionRecap {
  title: string;

  summary: string;

  dominantEmotion: string;

  suggestions: string[];

  duration?: number;

  messageCount?: number;
}


// ======================================================
// NOTIFICATIONS
// ======================================================

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


// ======================================================
// NOTIFICATION TYPES
// ======================================================

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


// ======================================================
// MIND HUB CONTENT
// ======================================================

export interface MindHubContent {
  id: string;

  category:
    | "Mind and Balance"
    | "Self-Care Corner";

  title: string;

  excerpt: string;

  content: string;

  image: string;

  duration: string;

  published?: boolean;

  createdAt?: string;

  updatedAt?: string;
}
