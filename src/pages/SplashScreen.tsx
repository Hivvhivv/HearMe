import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/"), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* Organic corner shapes */}
      <svg className="absolute top-0 left-0 w-64 h-64 opacity-60" viewBox="0 0 200 200" fill="none">
        <path d="M0 0 Q80 0 100 50 Q120 100 80 140 Q40 180 0 160 Z" fill="#F5EEFC" />
        <path d="M0 0 Q50 0 70 40 Q90 80 60 110 Q30 140 0 120 Z" fill="#C9A9E9" fillOpacity={0.3} />
      </svg>
      <svg className="absolute top-0 right-0 w-64 h-64 opacity-60" viewBox="0 0 200 200" fill="none">
        <path d="M200 0 Q120 0 100 50 Q80 100 120 140 Q160 180 200 160 Z" fill="#F5EEFC" />
        <path d="M200 0 Q150 0 130 40 Q110 80 140 110 Q170 140 200 120 Z" fill="#C9A9E9" fillOpacity={0.3} />
      </svg>
      <svg className="absolute bottom-0 left-0 w-64 h-64 opacity-60" viewBox="0 0 200 200" fill="none">
        <path d="M0 200 Q80 200 100 150 Q120 100 80 60 Q40 20 0 40 Z" fill="#F5EEFC" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-64 h-64 opacity-60" viewBox="0 0 200 200" fill="none">
        <path d="M200 200 Q120 200 100 150 Q80 100 120 60 Q160 20 200 40 Z" fill="#F5EEFC" />
        <path d="M200 200 Q150 200 130 160 Q110 120 140 90 Q170 60 200 80 Z" fill="#C9A9E9" fillOpacity={0.3} />
      </svg>

      {/* Center content */}
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="animate-float">
          <Logo size={64} />
        </div>
        <p className="text-center text-gray-500 text-sm leading-relaxed max-w-xs">
          Teman bicara di genggamanmu,<br />
          <span className="text-[#6F3FB5] font-medium">kapan pun dan di mana pun.</span>
        </p>
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#C9A9E9]"
              style={{ animation: `pulse-gentle 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
