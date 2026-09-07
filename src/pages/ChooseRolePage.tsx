import { useNavigate } from "react-router-dom";
import { Heart, Stethoscope } from "lucide-react";
import PublicNavbar from "../components/PublicNavbar";

export default function ChooseRolePage() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "user",
      icon: Heart,
      title: "User",
      desc: "I want to talk and get support",
      color: "#6F3FB5",
      bg: "#F5EEFC",
      path: "/sign-up/user",
    },
    {
      id: "psychologist",
      icon: Stethoscope,
      title: "Psychologist",
      desc: "I want to help and support others",
      color: "#10B981",
      bg: "#ECFDF5",
      path: "/sign-up/psychologist",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PublicNavbar />
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-center mb-10 animate-fade-in">
          <p className="text-[#6F3FB5] font-semibold text-sm uppercase tracking-widest mb-2">Langkah 1 dari 2</p>
          <h1 className="text-4xl font-bold text-gray-900">I'm a...</h1>
          <p className="text-gray-500 mt-2">What fits you?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full animate-scale-in">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(r.path)}
              className="group bg-white rounded-3xl p-8 border-2 border-transparent hover:border-opacity-100 shadow-sm hover:shadow-xl transition-all text-left hover:-translate-y-1"
              style={{ "--hover-border": r.color } as React.CSSProperties}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = r.color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: r.bg }}
              >
                <r.icon size={28} style={{ color: r.color }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{r.title}</h2>
              <p className="text-gray-500">{r.desc}</p>
              <div
                className="mt-6 inline-flex items-center text-sm font-semibold gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: r.color }}
              >
                Pilih ini →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
