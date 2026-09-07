import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Edit2, Key, LogOut } from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import Footer from "../components/Footer";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("hearme_user") || '{"name":"Inof","email":"inof@email.com","gender":"laki-laki","contact":"+62 812 3456 7890"}'));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user);

  const save = () => {
    localStorage.setItem("hearme_user", JSON.stringify(form));
    setUser(form);
    setEditing(false);
  };

  const logout = () => {
    localStorage.removeItem("hearme_auth");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <DashboardNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profil</h1>

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
                  { label: "Nama", key: "name" },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Kontak", key: "contact", type: "tel" },
                ].map(({ label, key, type = "text" }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={form[key] || ""}
                      onChange={(e) => setForm((f: typeof form) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jenis Kelamin</label>
                  <select
                    value={form.gender || ""}
                    onChange={(e) => setForm((f: typeof form) => ({ ...f, gender: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#FAF8FD] border border-purple-100 rounded-xl text-sm focus:outline-none focus:border-[#6F3FB5] transition-colors"
                  >
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={save} className="flex-1 bg-[#6F3FB5] text-white font-semibold py-2.5 rounded-xl hover:bg-purple-800 transition-colors text-sm">
                    Simpan
                  </button>
                  <button onClick={() => { setEditing(false); setForm(user); }} className="flex-1 border border-purple-100 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  ["Nama", user.name],
                  ["Email", user.email],
                  ["Jenis Kelamin", user.gender],
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
            <button onClick={() => setEditing(true)} className="w-full flex items-center gap-3 bg-white border border-purple-100 hover:border-purple-300 text-gray-700 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors">
              <Edit2 size={16} className="text-[#6F3FB5]" /> Edit Profile
            </button>
            <button className="w-full flex items-center gap-3 bg-white border border-purple-100 hover:border-purple-300 text-gray-700 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors">
              <Key size={16} className="text-[#6F3FB5]" /> Change Password
            </button>
            <button onClick={logout} className="w-full flex items-center gap-3 bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-5 py-3.5 rounded-2xl text-sm transition-colors border border-red-100">
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
