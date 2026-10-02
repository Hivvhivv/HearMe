// ======================================================
// AUTH CONTEXT
// ======================================================
//
// Satu sumber kebenaran untuk status login di UI.
//
// Masalah yang diperbaiki:
//
//   Dulu route guard memutuskan "sudah login" hanya dari
//   keberadaan string di localStorage. Token kedaluwarsa,
//   token palsu, atau session yang sudah di-revoke tetap
//   merender halaman protected.
//
//   Sekarang: saat app dibuka, status login DIPASTIKAN ke
//   backend lebih dulu. Selama pengecekan, guard menahan
//   render dan menampilkan loading -- tidak pernah
//   membocorkan halaman protected.
//
// ======================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { authService, type AppRole } from "../services";
import { setAuthFailureHandler } from "../api/client";
import { subscribeAuth } from "../lib/authStorage";


export type AuthUser = {
  id?: string;
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  verificationStatus?: string;
} & Record<string, unknown>;


type AuthContextValue = {
  user: AuthUser | null;

  // true selama pengecekan session awal.
  // Guard WAJIB menunggu ini selesai.
  loading: boolean;

  isAuthenticated: boolean;

  role: AppRole;

  login: (
    email: string,
    password: string
  ) => Promise<AuthUser>;

  logout: () => Promise<void>;

  logoutAll: () => Promise<void>;

  // Muat ulang data user dari server.
  reload: () => Promise<void>;
};


const AuthContext =
  createContext<AuthContextValue | null>(null);


export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Dipakai supaya state tidak di-set setelah unmount.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);


  // ----------------------------------------------------
  // PENGECEKAN SESSION SAAT APP DIBUKA
  // ----------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const current = await authService.bootstrap();

        if (!cancelled && mounted.current) {
          setUser((current as AuthUser) || null);
        }

      } catch {
        if (!cancelled && mounted.current) {
          setUser(null);
        }

      } finally {
        if (!cancelled && mounted.current) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);


  // ----------------------------------------------------
  // KALAU API CLIENT GAGAL REFRESH -> SESSION BERAKHIR
  // ----------------------------------------------------

  useEffect(() => {
    setAuthFailureHandler(() => {
      if (mounted.current) {
        setUser(null);
      }
    });

    return () => {
      setAuthFailureHandler(null);
    };
  }, []);


  // ----------------------------------------------------
  // SINKRONISASI ANTAR TAB
  //
  // Logout di satu tab -> tab lain ikut logout.
  // ----------------------------------------------------

  useEffect(() => {
    return subscribeAuth((signal) => {
      if (!mounted.current) {
        return;
      }

      if (signal === "logout") {
        setUser(null);
        return;
      }

      // Tab lain baru login: ambil sessionnya.
      authService
        .bootstrap()
        .then((current) => {
          if (mounted.current) {
            setUser((current as AuthUser) || null);
          }
        })
        .catch(() => {
          // Diamkan.
        });
    });
  }, []);


  // ----------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login(
        email,
        password
      );

      const nextUser = result.user as AuthUser;

      setUser(nextUser);

      return nextUser;
    },
    []
  );


  const logout = useCallback(async () => {
    await authService.logout();

    if (mounted.current) {
      setUser(null);
    }
  }, []);


  const logoutAll = useCallback(async () => {
    await authService.logoutAll();

    if (mounted.current) {
      setUser(null);
    }
  }, []);


  const reload = useCallback(async () => {
    const current = await authService.bootstrap();

    if (mounted.current) {
      setUser((current as AuthUser) || null);
    }
  }, []);


  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role: (user?.role as AppRole) || "user",
      login,
      logout,
      logoutAll,
      reload,
    }),
    [user, loading, login, logout, logoutAll, reload]
  );


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


// ======================================================
// HOOK
// ======================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth harus dipakai di dalam <AuthProvider>"
    );
  }

  return context;
}
