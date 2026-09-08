import type { User, UserRole } from "../types";

const API_URL = "http://localhost:5000/api/auth";

const SESSION_KEY = "hearme_session";

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username?: string;
  gender?: string;
  birthDate?: string;
  phoneNumber?: string;
  verificationStatus?: "pending" | "approved" | "rejected" | "unverified" | "not_required";
};

type LoginResponse = {
  message: string;
  token: string;
  user: BackendUser;
};

function convertUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    gender: user.gender,
    birthDate: user.birthDate,
    phoneNumber: user.phoneNumber,
    role: user.role,
    verificationStatus: user.verificationStatus,
    createdAt: new Date().toISOString(),
  } as User;
}

function saveSession(user: User, token: string) {
  const session = {
    user,
    token,
    expiresAt: Date.now() + 86400000,
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  localStorage.setItem(
    "hearme_auth",
    "true"
  );

  localStorage.setItem(
    "hearme_user",
    JSON.stringify(user)
  );

  // Disimpan juga agar API lain bisa mengambil token
  localStorage.setItem(
    "token",
    token
  );
}

export const authAPI = {

  // ====================================================
  // LOGIN
  // ====================================================

  login: async (
    email: string,
    password: string
  ): Promise<{
    user: User;
    token: string;
  } | null> => {

    const response = await fetch(
      `${API_URL}/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
        "Login failed"
      );
    }

    const result =
      data as LoginResponse;

    const user =
      convertUser(result.user);

    saveSession(
      user,
      result.token
    );

    return {
      user,
      token: result.token,
    };
  },


  // ====================================================
  // REGISTER
  // ====================================================

  register: async (data: {
    username: string;
    gender: string;
    birthDate: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    role: "user" | "psychologist";
  }): Promise<User> => {

    const response = await fetch(
      `${API_URL}/register`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: data.username,
          username: data.username,
          gender: data.gender,
          birthDate: data.birthDate,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          phoneNumber: data.phoneNumber,
          role: data.role,
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result?.message ||
        "Registration failed"
      );
    }

    const user =
      convertUser(result.user);

    return user;
  },


  // ====================================================
  // LOGOUT
  // ====================================================

  logout: async (): Promise<void> => {

    localStorage.removeItem(
      SESSION_KEY
    );

    localStorage.removeItem(
      "hearme_auth"
    );

    localStorage.removeItem(
      "hearme_user"
    );

    localStorage.removeItem(
      "token"
    );
  },


  // ====================================================
  // GET SESSION
  // ====================================================

  getSession: (): {
    user: User;
    token: string;
  } | null => {

    const raw =
      localStorage.getItem(
        SESSION_KEY
      );

    if (!raw) {
      return null;
    }

    try {

      const session =
        JSON.parse(raw);

      if (
        !session.token ||
        !session.user
      ) {
        return null;
      }

      if (
        session.expiresAt &&
        session.expiresAt < Date.now()
      ) {

        localStorage.removeItem(
          SESSION_KEY
        );

        localStorage.removeItem(
          "hearme_auth"
        );

        localStorage.removeItem(
          "hearme_user"
        );

        localStorage.removeItem(
          "token"
        );

        return null;
      }

      return {
        user: session.user,
        token: session.token,
      };

    } catch {

      return null;
    }
  },


  // ====================================================
  // AUTHENTICATED?
  // ====================================================

  isAuthenticated: (): boolean => {
    return !!authAPI.getSession();
  },


  // ====================================================
  // CURRENT USER
  // ====================================================

  getCurrentUser: (): User | null => {

    const session =
      authAPI.getSession();

    return session?.user || null;
  },


  // ====================================================
  // CURRENT ROLE
  // ====================================================

  getCurrentRole: (): UserRole => {

    const user =
      authAPI.getCurrentUser();

    return user?.role || "user";
  },


  // ====================================================
  // GET CURRENT USER FROM BACKEND
  // ====================================================

  refreshCurrentUser: async (): Promise<User> => {

    const session =
      authAPI.getSession();

    if (!session?.token) {
      throw new Error(
        "Authentication required"
      );
    }

    const response = await fetch(
      `${API_URL}/me`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${session.token}`,
        },
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result?.message ||
        "Failed to get current user"
      );
    }

    const user =
      convertUser(result.user);

    saveSession(
      user,
      session.token
    );

    return user;
  },


  // ====================================================
  // UPDATE PROFILE
  // ====================================================

  updateProfile: async (
    data: Partial<User>
  ): Promise<User> => {

    /*
     * Backend kamu saat ini belum mempunyai
     * endpoint update profile.
     *
     * Jadi untuk sementara kita hanya
     * memperbarui session frontend.
     *
     * Nanti bisa dibuat:
     * PATCH /api/auth/me
     */

    const current =
      authAPI.getCurrentUser();

    if (!current) {
      throw new Error(
        "User not authenticated"
      );
    }

    const updated = {
      ...current,
      ...data,
    };

    const session =
      authAPI.getSession();

    if (session) {
      saveSession(
        updated,
        session.token
      );
    }

    return updated;
  },
};
