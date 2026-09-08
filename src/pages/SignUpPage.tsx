import { useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import PublicNavbar from "../components/PublicNavbar"
import type { AppRole } from "../services"
import { authAPI } from "../api/auth.api"

interface FormData {
  username: string
  gender: string
  birthday: string
  email: string
  password: string
  confirm: string
  contact: string
}

interface FieldProps {
  label: string
  name: keyof FormData
  value: string
  onChange: (name: keyof FormData, value: string) => void
  error?: string
  type?: string
  placeholder?: string
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder = "",
}: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-[#FAF8FD] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 transition-colors ${
          error ? "border-red-300" : "border-purple-100 focus:border-[#6F3FB5]"
        }`}
      />

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function SignUpPage() {
  const { role } = useParams()
  const navigate = useNavigate()

  const appRole = useMemo<AppRole>(
    () => (role === "psychologist" ? "psychologist" : "user"),
    [role],
  )

  const [showPw, setShowPw] = useState(false)

  const [form, setForm] = useState<FormData>({
    username: "",
    gender: "",
    birthday: "",
    email: "",
    password: "",
    confirm: "",
    contact: "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  )
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!form.username.trim()) {
      newErrors.username = "Username wajib diisi"
    }

    if (!form.gender) {
      newErrors.gender = "Pilih jenis kelamin"
    }

    if (!form.birthday) {
      newErrors.birthday = "Tanggal lahir wajib diisi"
    }

    if (!form.email.trim()) {
      newErrors.email = "Email wajib diisi"
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Format email tidak valid"
    }

    if (!form.password) {
      newErrors.password = "Password wajib diisi"
    } else if (form.password.length < 6) {
      newErrors.password = "Minimal 6 karakter"
    }

    if (!form.confirm) {
      newErrors.confirm = "Konfirmasi password wajib diisi"
    } else if (form.password !== form.confirm) {
      newErrors.confirm = "Password tidak cocok"
    }

    if (!form.contact.trim()) {
      newErrors.contact = "Nomor kontak wajib diisi"
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validate()) return

    setSubmitError("")
    setSubmitting(true)

    try {
      await authAPI.register({
        username: form.username.trim(),
        gender: form.gender,
        birthDate: form.birthday,
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirm,
        phoneNumber: form.contact.trim(),
        role: appRole === "psychologist" ? "psychologist" : "user",
      })

      // Register tidak membuat session palsu. User login untuk menerima JWT,
      // lalu psikolog dapat membuka halaman verifikasi dengan token tersebut.
      navigate("/sign-in", {
        replace: true,
        state: { registeredEmail: form.email.trim() },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Gagal membuat akun. Silakan coba lagi.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PublicNavbar />

      <div className="max-w-lg mx-auto px-4 py-12">
        <button
          onClick={() => navigate("/choose-role")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6F3FB5] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 border border-purple-50 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Create Account
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            Daftar sebagai{" "}
            <span className="text-[#6F3FB5] font-semibold capitalize">
              {role}
            </span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <Field
              label="Username"
              name="username"
              value={form.username}
              onChange={updateField}
              error={errors.username}
              placeholder="contoh: inof123"
            />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Jenis Kelamin
              </label>

              <select
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className={`w-full px-4 py-3 bg-[#FAF8FD] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6F3FB5]/30 ${
                  errors.gender ? "border-red-300" : "border-purple-100"
                }`}
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
                <option value="lainnya">Lainnya</option>
              </select>

              {errors.gender && (
                <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
              )}
            </div>

            <Field
              label="Tanggal Lahir"
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={updateField}
              error={errors.birthday}
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              error={errors.email}
              placeholder="email@contoh.com"
            />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-[#FAF8FD] border border-purple-100 rounded-xl"
                />

                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <Field
              label="Konfirmasi Password"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={updateField}
              error={errors.confirm}
            />

            <Field
              label="Nomor Kontak"
              name="contact"
              type="tel"
              value={form.contact}
              onChange={updateField}
              error={errors.contact}
              placeholder="+62 812 3456 7890"
            />

            {appRole === "psychologist" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                Setelah membuat akun, kamu akan diminta mengunggah dokumen
                verifikasi (KTP, STR, SIP, Sertifikat). Akun psikolog aktif
                setelah disetujui admin.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#6F3FB5] hover:bg-[#5f34a1] disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {submitting ? "Membuat akun..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
