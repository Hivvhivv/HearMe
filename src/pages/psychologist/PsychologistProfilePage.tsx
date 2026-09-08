import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Edit2, Key, LogOut } from "lucide-react";
import PsychologistNavbar from "../../components/PsychologistNavbar";
import Footer from "../../components/Footer";

interface PsychologistProfile {
  id?: string;
  name: string;
  email: string;
  contact?: string;
  avatar?: string;
  specialization?: string;
  experience?: string;
  price?: string;
  bio?: string;
}

const API_URL = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("hearme_token");
}

export default function PsychologistProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState<PsychologistProfile | null>(null);

  const [form, setForm] =
    useState<PsychologistProfile | null>(null);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ======================================================
  // GET PROFILE FROM BACKEND
  // ======================================================
useEffect(() => {
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        "http://localhost:5000/api/auth/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Gagal mengambil profil psikolog"
        );
      }

      // Backend /api/auth/me mengembalikan:
      // { user: {...} }
      const profile = data.user;

      setUser(profile);
      setForm(profile);

    } catch (err) {
      console.error("Load psychologist profile error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data profil"
      );
    } finally {
      setLoading(false);
    }
  };

  loadProfile();
}, []);


  // ======================================================
  // SAVE PROFILE TO BACKEND
  // ======================================================

  const save = async () => {
    if (!form) return;

    try {
      setSaving(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/psychologists/me`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            contact: form.contact,
            specialization: form.specialization,
            experience: form.experience,
            price: form.price,
            bio: form.bio,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Gagal menyimpan profil"
        );
      }

      const updatedProfile =
        data.psychologist || data.user || data;

      setUser(updatedProfile);
      setForm(updatedProfile);
      setEditing(false);
    } catch (err) {
      console.error("Save psychologist profile error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan profil"
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // LOGOUT
  // ======================================================

  const logout = () => {
    localStorage.removeItem("hearme_auth");
    localStorage.removeItem("hearme_role");
    localStorage.removeItem("hearme_user");
    localStorage.removeItem("hearme_token");

    navigate("/");
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-[#6F3FB5] rounded-full animate-spin" />

          <p className="text-sm text-gray-500 mt-4">
            Memuat profil psikolog...
          </p>
        </div>

        <Footer />
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (!user || !form) {
    return (
      <div className="min-h-screen bg-[#FAF8FD]">
        <PsychologistNavbar />

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-5 text-sm">
            {error || "Data profil tidak ditemukan."}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ======================================================
  // MAIN
  // ======================================================

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PsychologistNavbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Profil Psikolog
        </h1>

        {/* ERROR */}

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* PROFILE CARD */}

        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden mb-4">

          {/* ==================================================
              AVATAR
          ================================================== */}

          <div className="bg-gradient-to-r from-[#F5EEFC] to-[#E9D5FF] p-8 flex flex-col items-center">

            <div className="relative">

              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">

                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name?.[0]?.toUpperCase() || "P"
                )}

              </div>

              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#6F3FB5] text-white rounded-full flex items-center justify-center shadow-md hover:bg-purple-800 transition-colors"
              >
                <Camera size={14} />
              </button>

            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-4">
              {user.name}
            </h2>

            <p className="text-sm text-gray-500">
              {user.email}
            </p>

            {user.specialization && (
              <span className="mt-2 text-xs font-semibold text-[#6F3FB5] bg-purple-50 px-3 py-1 rounded-full">
                {user.specialization}
              </span>
            )}

          </div>

          {/* ==================================================
              INFORMATION
          ================================================== */}

          <div className="p-6">

            {editing ? (

              <div className="space-y-4">

                {/* NAMA */}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nama
                  </label>

                  <input
                    type="text"
                    value={form.name || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                  />
                </div>

                {/* KONTAK */}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Kontak
                  </label>

                  <input
                    type="tel"
                    value={form.contact || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                  />
                </div>

                {/* SPESIALISASI */}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Spesialisasi
                  </label>

                  <input
                    type="text"
                    value={form.specialization || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        specialization: e.target.value,
                      })
                    }
                    placeholder="Contoh: Psikologi Klinis"
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                  />
                </div>

                {/* EXPERIENCE */}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Pengalaman
                  </label>

                  <input
                    type="text"
                    value={form.experience || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        experience: e.target.value,
                      })
                    }
                    placeholder="Contoh: 5 tahun"
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                  />
                </div>

                {/* PRICE */}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Harga Konsultasi
                  </label>

                  <input
                    type="text"
                    value={form.price || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: e.target.value,
                      })
                    }
                    placeholder="Contoh: Rp150.000"
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                  />
                </div>

                {/* BIO */}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Bio
                  </label>

                  <textarea
                    value={form.bio || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bio: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Ceritakan tentang diri dan pengalaman profesional Anda..."
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors resize-none"
                  />
                </div>

                {/* BUTTON */}

                <div className="flex gap-3 pt-2">

                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex-1 bg-[#6F3FB5] text-white font-semibold py-2.5 rounded-xl hover:bg-purple-800 disabled:bg-purple-300 transition-colors text-sm"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>

                  <button
                    onClick={() => {
                      setEditing(false);
                      setForm(user);
                      setError("");
                    }}
                    disabled={saving}
                    className="flex-1 border border-purple-100 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
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
                  ["Kontak", user.contact || "-"],
                  ["Spesialisasi", user.specialization || "-"],
                  ["Pengalaman", user.experience || "-"],
                  ["Harga Konsultasi", user.price || "-"],
                ].map(([label, val]) => (

                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-2 border-b border-purple-50 last:border-0"
                  >
                    <span className="text-sm text-gray-500">
                      {label}
                    </span>

                    <span className="text-sm font-semibold text-gray-800 text-right">
                      {val}
                    </span>
                  </div>

                ))}

                {/* BIO */}

                <div className="pt-2">

                  <span className="text-sm text-gray-500">
                    Bio
                  </span>

                  <p className="text-sm font-medium text-gray-800 mt-2 leading-relaxed">
                    {user.bio || "-"}
                  </p>

                </div>

              </div>

            )}

          </div>
        </div>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        {!editing && (
          <div className="space-y-2">

            <button
              onClick={() => {
                setEditing(true);
                setError("");
              }}
              className="w-full flex items-center gap-3 bg-white border border-purple-100 hover:border-purple-300 text-gray-700 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors"
            >
              <Edit2
                size={16}
                className="text-[#6F3FB5]"
              />

              Edit Profile
            </button>

            <button
              type="button"
              className="w-full flex items-center gap-3 bg-white border border-purple-100 hover:border-purple-300 text-gray-700 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors"
            >
              <Key
                size={16}
                className="text-[#6F3FB5]"
              />

              Change Password
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors border border-red-100"
            >
              <LogOut size={16} />

              Logout
            </button>

          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}