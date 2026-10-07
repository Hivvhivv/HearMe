// ======================================================
// AVATAR
// ======================================================
//
// Daftar avatar bawaan (file di public/avatars/) dan
// helper untuk memperkecil foto sebelum diunggah.
//
// ID di sini HARUS sama dengan AVATAR_PRESETS di
// backend/services/UserService.js. Backend hanya menerima
// ID, lalu membentuk URL-nya sendiri.
//
// ======================================================

export type AvatarPreset = {
  id: string;
  label: string;
  url: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "sunny", label: "Sunny" },
  { id: "calm", label: "Calm" },
  { id: "bloom", label: "Bloom" },
  { id: "breeze", label: "Breeze" },
  { id: "cozy", label: "Cozy" },
  { id: "dreamy", label: "Dreamy" },
  { id: "spark", label: "Spark" },
  { id: "leafy", label: "Leafy" },
].map((p) => ({ ...p, url: `/avatars/${p.id}.svg` }));


// sessionStorage: user menekan "Lewati" di halaman welcome.
export const WELCOME_SKIP_KEY = "hearme_welcome_skipped";

// Apakah user perlu diarahkan ke halaman welcome setelah
// login: role user, belum punya avatar, dan belum
// melewatinya di sesi browser ini.
export function needsWelcome(user: { role?: unknown; avatar?: unknown }): boolean {
  if (user.role !== "user" || user.avatar) return false;

  try {
    return sessionStorage.getItem(WELCOME_SKIP_KEY) !== "1";
  } catch {
    return true;
  }
}


// Pilihan avatar yang dikirim ke backend.
export type AvatarChoice =
  | { preset: string }
  | { image: string };


const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Batas file mentah dari komputer. Setelah diperkecil,
// yang terkirim jauh lebih kecil dari batas backend (5 MB).
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

const OUTPUT_SIZE = 512;


/*
 * Memotong foto jadi persegi (tengah) dan memperkecilnya ke
 * 512x512 JPEG. Foto kamera HP bisa belasan MB; tanpa ini
 * upload lambat dan bisa melewati batas backend.
 */
export async function prepareAvatarImage(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Foto profil harus JPG, PNG, atau WEBP.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Ukuran foto maksimal 10 MB.");
  }

  const url = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Foto tidak bisa dibaca."));
      el.src = url;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const size = Math.min(OUTPUT_SIZE, side);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Browser tidak mendukung pengolahan foto.");
    }

    // Latar putih supaya PNG transparan tidak jadi hitam
    // setelah dikonversi ke JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
