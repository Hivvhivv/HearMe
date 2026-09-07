import type { PsychologistVerification, VerificationDocument } from "../types";

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// psychologist_verifications table:
// id, psychologist_id, document_type, document_url, verification_status, reviewed_by, reviewed_at
//
// ## API TEMPLATE IF CONNECTED ##
// File Storage: Supabase Storage / Firebase Storage / AWS S3 / Cloudinary
// const { data } = await supabase.storage.from('verification-docs').upload(path, file)
// ======================================================

const KEY = "hearme_verifications";

function all(): PsychologistVerification[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
function save(v: PsychologistVerification[]) {
  localStorage.setItem(KEY, JSON.stringify(v));
}

export const verificationAPI = {
  getByPsychologist: async (psychologistId: string): Promise<PsychologistVerification | null> => {
    return all().find((v) => v.psychologistId === psychologistId) || null;
  },

  getAll: async (): Promise<PsychologistVerification[]> => all(),

  submit: async (psychologistId: string, documents: Omit<VerificationDocument, "id" | "uploadedAt">[]): Promise<PsychologistVerification> => {
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // INSERT INTO psychologist_verifications (psychologist_id, status) VALUES (?, 'pending')
    // INSERT INTO verification_documents (verification_id, type, url) VALUES (...)
    //
    // ## API TEMPLATE IF CONNECTED ##
    // Upload files to cloud storage first, then save URLs to DB
    // ======================================================
    const existing = all().find((v) => v.psychologistId === psychologistId);
    const docs: VerificationDocument[] = documents.map((d) => ({
      ...d,
      id: `doc_${Date.now()}_${Math.random()}`,
      uploadedAt: new Date().toISOString(),
    }));

    if (existing) {
      const updated = all().map((v) =>
        v.psychologistId === psychologistId
          ? { ...v, documents: docs, status: "pending" as const, submittedAt: new Date().toISOString() }
          : v
      );
      save(updated);
      return updated.find((v) => v.psychologistId === psychologistId)!;
    }

    const verification: PsychologistVerification = {
      id: `ver_${Date.now()}`,
      psychologistId,
      documents: docs,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    save([...all(), verification]);
    return verification;
  },

  review: async (verificationId: string, status: "approved" | "rejected", notes?: string): Promise<PsychologistVerification> => {
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // UPDATE psychologist_verifications SET status = ?, reviewed_by = ?, reviewed_at = NOW(), notes = ? WHERE id = ?
    const updated = all().map((v) =>
      v.id === verificationId
        ? { ...v, status, notes, reviewedBy: "admin", reviewedAt: new Date().toISOString() }
        : v
    );
    save(updated);
    return updated.find((v) => v.id === verificationId)!;
  },
};
