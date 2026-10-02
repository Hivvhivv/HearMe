import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Edit2, Key, LogOut } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { userAPI, type ProfileUser } from "../api/user.api";

// ======================================================
// FORM <-> API FIELD MAPPING
// ======================================================
//
// UI yang sudah ada memakai nama field "contact" dan
// "birthday". Backend memakai "phoneNumber" dan
// "birthDate".
//
// Pemetaan dilakukan di sini supaya markup/design TIDAK
// perlu diubah sama sekali.
//
// ======================================================

type ProfileForm = {
  name: string;
  email: string;
  gender: string;
  contact: string;
  birthday: string;
};

function toForm(user: ProfileUser): ProfileForm {
  return {
    name: user.name || "",
    email: user.email || "",
    gender: user.gender || "",
    contact: user.phoneNumber || "",
    birthday: user.birthDate || "",
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const {
    logout: doLogout,
    logoutAll: doLogoutAll,
    reload,
  } = useAuth();

  const [user, setUser] = useState<ProfileForm | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);

  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ====================================================
  // LOAD PROFIL DARI MONGODB
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const profile = await userAPI.getMe();

        if (cancelled) return;

        setUser(toForm(profile));
        setForm(toForm(profile));
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data profil"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // ====================================================
  // SIMPAN KE MONGODB
  // ====================================================

  const save = async () => {
    if (!form) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await userAPI.updateMe({
        name: form.name,
        email: form.email,
        gender: form.gender,
        phoneNumber: form.contact,
        birthDate: form.birthday || undefined,
      });

      setUser(toForm(updated));
      setForm(toForm(updated));
      setEditing(false);
      setSuccess("Profil berhasil diperbarui");

      // Segarkan state auth global supaya navbar ikut berubah.
      await reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan profil"
      );
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await doLogout();

    navigate("/sign-in", { replace: true });
  };

  // Mengakhiri session di SEMUA device sekaligus.
  const logoutAll = async () => {
    await doLogoutAll();

    navigate("/sign-in", { replace: true });
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <DashboardNavbar />
        <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-100 border-t-[#6F3FB5] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat profil...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // ====================================================
  // ERROR TANPA DATA
  // ====================================================

  if (!user || !form) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <DashboardNavbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl border border-red-100 p-8">
            <p className="text-sm text-red-500 font-semibold mb-2">
              Gagal mengambil data profil
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {error || "Periksa koneksi ke server HearMe."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#6F3FB5] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-purple-800 transition-colors text-sm"
            >
              Coba lagi
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profil</h1>

        {/* Notifikasi */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-5 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-2xl px-5 py-3">
            {success}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden mb-4">
          {/* Avatar area */}
          <div className="bg-gradient-to-r from-[#F5EEFC] to-[#E9D5FF] p-8 flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#6F3FB5] text-white rounded-full flex items-center justify-center shadow-md hover:bg-purple-800 transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-4">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Info */}
          <div className="p-6">
            {editing ? (
              <div className="space-y-4">
                {[
                  { label: "Nama", key: "name" as const },
                  { label: "Email", key: "email" as const, type: "email" },
                  { label: "Kontak", key: "contact" as const, type: "tel" },
                ].map(({ label, key, type = "text" }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={form[key] || ""}
                      onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
                      className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jenis Kelamin</label>
                  <select
                    value={form.gender || ""}
                    onChange={(e) => setForm((f) => (f ? { ...f, gender: e.target.value } : f))}
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                  >
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex-1 bg-[#6F3FB5] text-white font-semibold py-2.5 rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-60"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setForm(user); setError(""); }}
                    disabled={saving}
                    className="flex-1 border border-purple-100 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  ["Nama", user.name],
                  ["Email", user.email],
                  ["Jenis Kelamin", user.gender || "-"],
                  ["Tanggal Lahir", user.birthday || "-"],
                  ["Kontak", user.contact || "-"],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-purple-50 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-800 capitalize">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!editing && (
          <div className="space-y-2">
            <button onClick={() => { setEditing(true); setSuccess(""); }} className="w-full flex items-center gap-3 bg-white border border-purple-100 hover:border-purple-300 text-gray-700 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors">
              <Edit2 size={16} className="text-[#6F3FB5]" /> Edit Profile
            </button>
            <button className="w-full flex items-center gap-3 bg-white border border-purple-100 hover:border-purple-300 text-gray-700 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors">
              <Key size={16} className="text-[#6F3FB5]" /> Change Password
            </button>
            <button onClick={logout} className="w-full flex items-center gap-3 bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors border border-red-100">
              <LogOut size={16} /> Logout
            </button>
            <button onClick={logoutAll} className="w-full flex items-center gap-3 bg-white hover:bg-red-50 text-red-400 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors border border-red-100">
              <LogOut size={16} /> Logout dari semua device
            </button>
            <p className="text-xs text-gray-400 px-2 pt-1">
              Logout hanya mengakhiri sesi di device ini. Device lain tetap login.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
