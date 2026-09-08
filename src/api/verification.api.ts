type VerificationDocumentPayload = {
  type: string;
  fileName: string;
  fileUrl: string;
};

// ======================================================
// BACKEND API
// ======================================================

const API_URL = "http://localhost:5000/api/verification";

// ======================================================
// TOKEN
// ======================================================

function getToken(): string | null {
  return (
    localStorage.getItem("hearme_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
}
// ======================================================
// REQUEST HELPER
// ======================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

// ======================================================
// BACKEND RESPONSE TYPE
// ======================================================

export interface VerificationSubmission {
  _id: string;

  psychologistId: string;

  submissionNumber: number;

  status:
    | "pending"
    | "approved"
    | "rejected";

  reason: string | null;

  documents: {
    type: string;
    fileName: string;
    fileUrl: string;
  }[];

  submittedAt: string;

  reviewedBy: string | null;

  reviewedAt: string | null;
}

export interface VerificationStatusResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: "psychologist";
    verificationStatus: "pending" | "approved" | "rejected" | "unverified" | null;
  };
  latestSubmission: VerificationSubmission | null;
}

// ======================================================
// VERIFICATION API
// ======================================================

export const verificationAPI = {

  getStatus: async (): Promise<VerificationStatusResponse> => {
    return request<VerificationStatusResponse>("/status");
  },

  // ====================================================
  // GET OWN VERIFICATION HISTORY
  // GET /api/verification/mine
  // ====================================================

  getByPsychologist: async (): Promise<VerificationSubmission[]> => {

    const data = await request<{
      submissions: VerificationSubmission[];
    }>("/mine");

    return data.submissions || [];
  },

  // ====================================================
  // GET ALL VERIFICATIONS
  // GET /api/verification
  // ADMIN
  // ====================================================

  getAll: async (): Promise<VerificationSubmission[]> => {

    const data = await request<{
      submissions: VerificationSubmission[];
    }>("/");

    return data.submissions || [];
  },

  // ====================================================
  // SUBMIT VERIFICATION
  // POST /api/verification
  // ====================================================

  submit: async (
    documents: VerificationDocumentPayload[]
  ): Promise<VerificationSubmission> => {

    if (
      !Array.isArray(documents) ||
      documents.length === 0
    ) {
      throw new Error(
        "Documents are required"
      );
    }

    const data = await request<{
      message: string;
      submission: VerificationSubmission;
    }>("/", {
      method: "POST",

      body: JSON.stringify({
        documents: documents.map(
          (document) => ({
            type: document.type,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
          })
        ),
      }),
    });

    return data.submission;
  },

  // ====================================================
  // ADMIN REVIEW
  // PATCH /api/verification/:id/review
  // ====================================================

  review: async (
    verificationId: string,
    status:
      | "approved"
      | "rejected",
    notes?: string
  ): Promise<VerificationSubmission> => {

    if (!verificationId) {
      throw new Error(
        "Verification ID is required"
      );
    }

    if (
      !["approved", "rejected"].includes(
        status
      )
    ) {
      throw new Error(
        "Invalid verification status"
      );
    }

    if (
      status === "rejected" &&
      !notes?.trim()
    ) {
      throw new Error(
        "Reason is required when rejecting verification"
      );
    }

    await request<{
      message: string;
      reason: string | null;
    }>(
      `/${verificationId}/review`,
      {
        method: "PATCH",

        body: JSON.stringify({
          status,

          ...(status === "rejected"
            ? {
                reason:
                  notes?.trim() || "",
              }
            : {}),
        }),
      }
    );

    // ==================================================
    // Ambil ulang submission setelah direview
    // ==================================================

    const submissions =
      await verificationAPI.getAll();

    const updated =
      submissions.find(
        (submission) =>
          submission._id ===
          verificationId
      );

    if (!updated) {
      throw new Error(
        "Updated verification submission not found"
      );
    }

    return updated;
  },
};
