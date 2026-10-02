// ======================================================
// AUTH STORAGE
// ======================================================
//
// Aturan penyimpanan:
//
//   ACCESS TOKEN   -> HANYA di memori (variabel modul).
//                     Tidak pernah masuk localStorage.
//
//   REFRESH TOKEN  -> HANYA di cookie httpOnly yang
//                     dibuat backend. JavaScript tidak
//                     bisa membacanya.
//
//   PROFIL USER    -> boleh di localStorage, tapi hanya
//                     data tidak sensitif (nama, role),
//                     sekadar supaya UI tidak berkedip
//                     saat halaman dimuat. BUKAN sumber
//                     kebenaran untuk route guard.
//
// Kenapa access token tidak di localStorage:
//
//   Dulu token disimpan di sana, dan setelah logout
//   token itu bisa tertinggal -- sehingga refresh
//   halaman membuat user "login kembali". Dengan token
//   di memori, refresh halaman OTOMATIS kehilangan
//   token, dan satu-satunya cara masuk kembali adalah
//   cookie refresh token yang sudah di-revoke server
//   saat logout.
//
// ======================================================

export const AUTH_KEYS = {
  user: "hearme_user",
  role: "hearme_role",
  flag: "hearme_auth",
} as const;


// Key dari implementasi lama. Tetap dibersihkan supaya
// token yang masih tersimpan di browser user tidak bisa
// menghidupkan session kembali.
const LEGACY_KEYS = [
  "hearme_token",
  "hearme_session",
  "token",
  "authToken",
  "accessToken",
];


const ALL_AUTH_KEYS = [
  ...Object.values(AUTH_KEYS),
  ...LEGACY_KEYS,
];


// ======================================================
// ACCESS TOKEN (MEMORI)
// ======================================================

let accessToken: string | null = null;


export function getToken(): string | null {
  return accessToken;
}


export function setToken(token: string | null) {
  accessToken = token;
}


export function hasToken(): boolean {
  return !!accessToken;
}


// ======================================================
// LOCAL STORAGE AMAN
// ======================================================
//
// localStorage bisa dilarang (private mode, setelan
// browser) dan aksesnya bisa melempar error. Semua
// dibungkus try/catch supaya app tidak ikut crash.
//
// ======================================================

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}


function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Diamkan.
  }
}


// ======================================================
// PROFIL USER (CACHE UI)
// ======================================================

export function getStoredUser<T = Record<string, unknown>>(): T | null {
  const raw = safeGet(AUTH_KEYS.user);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}


export function getStoredRole(): string | null {
  return safeGet(AUTH_KEYS.role);
}


export function saveUser(
  user: { role?: string } & Record<string, unknown>
) {
  safeSet(AUTH_KEYS.user, JSON.stringify(user));
  safeSet(AUTH_KEYS.flag, "true");

  if (user?.role) {
    safeSet(AUTH_KEYS.role, String(user.role));
  }
}


// ======================================================
// SIMPAN HASIL LOGIN
// ======================================================

export function saveAuth(
  token: string,
  user: { role?: string } & Record<string, unknown>
) {
  setToken(token);
  saveUser(user);
}


// ======================================================
// CLEAR
// ======================================================
//
// Menghapus token di memori DAN semua key localStorage,
// termasuk key lama. Inilah yang dipanggil setiap logout.
//
// ======================================================

export function clearAuth() {
  accessToken = null;

  for (const key of ALL_AUTH_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Lanjut ke key berikutnya.
    }
  }
}


// ======================================================
// SINKRONISASI ANTAR TAB
// ======================================================
//
// Logout di satu tab harus membuat tab lain di browser
// yang sama ikut logout. Dikirim lewat BroadcastChannel
// -- hanya SINYAL, tidak pernah memuat token.
//
// ======================================================

const CHANNEL_NAME = "hearme_auth";

type AuthSignal = "logout" | "login";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }

  return channel;
}


export function broadcastAuth(signal: AuthSignal) {
  try {
    getChannel()?.postMessage(signal);
  } catch {
    // Diamkan.
  }
}


export function subscribeAuth(
  handler: (signal: AuthSignal) => void
): () => void {
  const ch = getChannel();

  if (!ch) {
    return () => {};
  }

  const listener = (event: MessageEvent) => {
    if (event.data === "logout" || event.data === "login") {
      handler(event.data);
    }
  };

  ch.addEventListener("message", listener);

  return () => {
    ch.removeEventListener("message", listener);
  };
}
