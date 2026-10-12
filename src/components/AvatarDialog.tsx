import { useState } from "react";
import { X } from "lucide-react";
import AvatarPicker from "./AvatarPicker";
import { userAPI } from "../api/user.api";
import type { AvatarChoice } from "../lib/avatars";

type Props = {
  name?: string;
  // Avatar yang sedang dipakai.
  current?: string;
  onClose: () => void;
  // Dipanggil setelah avatar tersimpan, dengan URL barunya.
  onSaved: (avatar: string) => void | Promise<void>;
};

// Jendela "Ganti Avatar" untuk halaman profil user dan
// psikolog. Menyimpan lewat PUT /api/users/me/avatar.
export default function AvatarDialog({ name, current, onClose, onSaved }: Props) {
  const [choice, setChoice] = useState<AvatarChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!choice) return;

    try {
      setSaving(true);
      setError("");

      const updated = await userAPI.updateAvatar(choice);

      await onSaved(updated.avatar || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan avatar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ganti avatar"
        className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Ganti Avatar</h3>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-[#F5EEFC] hover:text-[#6F3FB5] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <AvatarPicker name={name} current={current} value={choice} onChange={setChoice} />

        {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 border border-purple-100 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-[#F5EEFC] transition-colors text-sm"
          >
            Batal
          </button>
          <button
            onClick={save}
            disabled={!choice || saving}
            className="flex-1 bg-[#6F3FB5] text-white font-semibold py-2.5 rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
