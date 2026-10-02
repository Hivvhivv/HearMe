// ======================================================
// API CLIENT
// ======================================================
//
// Satu pintu untuk SEMUA request ke backend.
//
// Tanggung jawabnya:
//
//   1. Menyertakan Authorization header otomatis.
//   2. Mengirim cookie refresh token (credentials).
//   3. SINGLE-FLIGHT REFRESH -- kalau banyak request
//      kena 401 bersamaan, hanya SATU yang memanggil
//      /auth/refresh. Sisanya menunggu, lalu diulang
//      dengan token baru.
//   4. Kalau refresh gagal, bersihkan state auth dan
//      beri tahu aplikasi supaya mengarahkan ke /sign-in.
//
// Yang menentukan token masih berlaku adalah BACKEND
// (lewat 401), bukan jam device. Jam device bisa berbeda
// dari server, dan token yang masih sah bisa salah
// dianggap kedaluwarsa.
//
// ======================================================

import { API_BASE_URL } from "./config";

import {
  broadcastAuth,
  clearAuth,
  getToken,
  saveUser,
  setToken,
} from "../lib/authStorage";


export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}


// ======================================================
// CALLBACK SAAT SESSION BERAKHIR
// ======================================================
//
// AuthProvider mendaftarkan dirinya di sini. Client
// sengaja TIDAK mengimpor react-router, supaya modul ini
// tetap bisa dipakai di mana saja.
//
// ======================================================

type AuthFailureHandler = () => void;

let onAuthFailure: AuthFailureHandler | null = null;

export function setAuthFailureHandler(
  handler: AuthFailureHandler | null
) {
  onAuthFailure = handler;
}


function handleAuthFailure() {
  clearAuth();
  broadcastAuth("logout");
  onAuthFailure?.();
}


// ======================================================
// SINGLE-FLIGHT REFRESH
// ======================================================
//
// refreshPromise menyimpan SATU proses refresh yang
// sedang berjalan. Request lain yang butuh refresh akan
// menunggu promise yang sama, bukan memanggil endpoint
// refresh berkali-kali.
//
// Ini penting karena refresh token DIROTASI: beberapa
// panggilan refresh paralel dengan token yang sama bisa
// terbaca sebagai pemakaian ulang token.
//
// ======================================================

let refreshPromise: Promise<string | null> | null = null;


async function performRefresh(): Promise<string | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/refresh`,
      {
        method: "POST",

        // WAJIB: cookie refresh token httpOnly hanya
        // terkirim kalau credentials diikutkan.
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response
      .json()
      .catch(() => null);

    if (!data?.token) {
      return null;
    }

    setToken(data.token);

    if (data.user) {
      saveUser(data.user);
    }

    return data.token;

  } catch {
    // Jaringan mati. Jangan anggap session tidak valid.
    return null;
  }
}


export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      // Dikosongkan supaya refresh berikutnya bisa jalan.
      refreshPromise = null;
    });
  }

  return refreshPromise;
}


// ======================================================
// REQUEST
// ======================================================

type RequestOptions = RequestInit & {
  // Lewati penanganan auth (dipakai login / register).
  skipAuth?: boolean;

  // Internal: menandai request sudah pernah diulang,
  // supaya tidak terjadi perulangan tanpa akhir.
  _retried?: boolean;
};


function buildHeaders(
  options: RequestOptions
): HeadersInit {
  const headers: Record<string, string> = {};

  // Jangan paksa Content-Type untuk FormData.
  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();

  if (token && !options.skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    ...headers,
    ...(options.headers as Record<string, string>),
  };
}


export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {

  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,

    credentials: "include",

    headers: buildHeaders(options),
  });


  // ----------------------------------------------------
  // 401 -> coba refresh SEKALI, lalu ulangi request.
  // ----------------------------------------------------

  if (
    response.status === 401 &&
    !options.skipAuth &&
    !options._retried
  ) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      return apiFetch<T>(path, {
        ...options,
        _retried: true,
      });
    }

    // Refresh gagal: session memang sudah berakhir.
    handleAuthFailure();

    throw new ApiError(
      "Session berakhir. Silakan login kembali.",
      401,
      "SESSION_ENDED"
    );
  }


  // 503 = backend/database bermasalah, BUKAN token salah.
  // Jangan menghapus session user karena ini.
  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ||
        `Request gagal dengan status ${response.status}`,
      response.status,
      data?.code
    );
  }

  return data as T;
}


// ======================================================
// SHORTHAND
// ======================================================

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) =>
    apiFetch<T>(path, { ...options, method: "GET" }),

  post: <T>(
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ) =>
    apiFetch<T>(path, {
      ...options,
      method: "POST",
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    }),

  patch: <T>(
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ) =>
    apiFetch<T>(path, {
      ...options,
      method: "PATCH",
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    }),

  put: <T>(
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ) =>
    apiFetch<T>(path, {
      ...options,
      method: "PUT",
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    }),

  delete: <T>(path: string, options: RequestOptions = {}) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
