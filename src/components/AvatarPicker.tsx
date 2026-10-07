import { useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import UserAvatar from "./UserAvatar";
import {
  AVATAR_PRESETS,
  prepareAvatarImage,
  type AvatarChoice,
} from "../lib/avatars";

type Props = {
  name?: string;
  // Avatar yang sedang dipakai, untuk pratinjau awal.
  current?: string;
  value: AvatarChoice | null;
  onChange: (choice: AvatarChoice) => void;
};

// Pilihan avatar bawaan + unggah foto dari komputer.
// Dipakai di halaman welcome dan di modal ganti avatar
// pada halaman profil.
export default function AvatarPicker({ name, current, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const preview = !value
    ? current
    : "preset" in value
      ? AVATAR_PRESETS.find((p) => p.id === value.preset)?.url
      : value.image;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setError("");
    setProcessing(true);

    try {
      onChange({ image: await prepareAvatarImage(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Foto tidak bisa dipakai.");
    } finally {
      setProcessing(false);
      // Supaya memilih file yang sama dua kali tetap memicu onChange.
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <UserAvatar
        src={preview}
        name={name}
        className="w-28 h-28 text-4xl shadow-lg ring-4 ring-white"
      />

      <div className="grid grid-cols-4 gap-3 mt-6 w-full max-w-xs">
        {AVATAR_PRESETS.map((p) => {
          const selected = !!value && "preset" in value && value.preset === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setError("");
                onChange({ preset: p.id });
              }}
              aria-label={`Pilih avatar ${p.label}`}
              aria-pressed={selected}
              className={`relative aspect-square rounded-full overflow-hidden transition-all ${
                selected
                  ? "ring-4 ring-[#6F3FB5] scale-105"
                  : "ring-2 ring-transparent hover:ring-[#C9A9E9]"
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full" />
              {selected && (
                <span className="absolute inset-0 bg-[#6F3FB5]/25 flex items-center justify-center">
                  <Check size={18} className="text-white drop-shadow" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={processing}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-200 text-sm font-semibold text-[#6F3FB5] hover:bg-[#F5EEFC] transition-colors disabled:opacity-60"
      >
        <Upload size={16} />
        {processing ? "Memproses foto..." : "Unggah foto dari komputer"}
      </button>

      <p className="mt-2 text-xs text-gray-400">JPG, PNG, atau WEBP. Maksimal 10 MB.</p>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
