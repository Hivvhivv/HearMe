import type { User, UserRole } from "../types";

// ======================================================
// ## API TEMPLATE IF CONNECTED ##
// Authentication API
//
// Supabase Auth:
// import { supabase } from '../lib/supabase'
// const { data, error } = await supabase.auth.signInWithPassword({ email, password })
//
// Firebase Auth:
// import { signInWithEmailAndPassword } from 'firebase/auth'
// await signInWithEmailAndPassword(auth, email, password)
//
// Custom API:
// const response = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
// ======================================================

const USERS_KEY = "hearme_users_db";
const SESSION_KEY = "hearme_session";

function getUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const authAPI = {
  login: async (email: string, _password: string): Promise<{ user: User; token: string } | null> => {
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // const user = await database.users.findOne({ email, password_hash: hash(_password) });
    // ======================================================
    const users = getUsers();
    let user = users.find((u) => u.email === email);

    if (!user) {
      // Auto-create for demo
      const saved = localStorage.getItem("hearme_user");
      const existing = saved ? JSON.parse(saved) : null;
      user = {
        id: `u_${Date.now()}`,
        name: existing?.name || email.split("@")[0],
        email,
        role: "user",
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, user]);
    }

    const token = btoa(`${user.id}:${Date.now()}`);
    const session = { user, token, expiresAt: Date.now() + 86400000 * 7 };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem("hearme_auth", "true");
    localStorage.setItem("hearme_user", JSON.stringify(user));
    return { user, token };
  },

  register: async (data: Omit<User, "id" | "createdAt"> & { password: string }): Promise<User> => {
    // ======================================================
    // ## DATABASE TEMPLATE IF CONNECTED ##
    // INSERT INTO users (name, email, gender, birthday, contact, role) VALUES (...)
    // ======================================================
    const users = getUsers();
    const user: User = {
      id: `u_${Date.now()}`,
      name: data.name,
      email: data.email,
      gender: data.gender,
      birthday: data.birthday,
      contact: data.contact,
      role: data.role,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, user]);
    const session = { user, token: btoa(`${user.id}:${Date.now()}`), expiresAt: Date.now() + 86400000 * 7 };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem("hearme_auth", "true");
    localStorage.setItem("hearme_user", JSON.stringify(user));
    return user;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("hearme_auth");
  },

  getSession: (): { user: User; token: string } | null => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  },

  isAuthenticated: (): boolean => !!localStorage.getItem("hearme_auth"),

  getCurrentUser: (): User | null => {
    const raw = localStorage.getItem("hearme_user");
    return raw ? JSON.parse(raw) : null;
  },

  getCurrentRole: (): UserRole => {
    const user = authAPI.getCurrentUser();
    return user?.role || "user";
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    // ## DATABASE TEMPLATE IF CONNECTED ## → UPDATE users SET ... WHERE id = ?
    const current = authAPI.getCurrentUser();
    const updated = { ...current, ...data };
    localStorage.setItem("hearme_user", JSON.stringify(updated));
    const users = getUsers().map((u) => u.id === updated.id ? updated : u);
    saveUsers(users);
    return updated;
  },
};
