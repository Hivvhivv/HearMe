import { useState } from "react";
import { X, ChevronLeft, BarChart2, Plus } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface Props {
  onClose: () => void;
  onSave: (mood: string) => void;
}

const moods = [
  { id: "happy", label: "Happy", emoji: "😊", color: "#F59E0B" },
  { id: "sad", label: "Sad", emoji: "😢", color: "#3B82F6" },
  { id: "surprised", label: "Surprised", emoji: "😮", color: "#8B5CF6" },
  { id: "disgust", label: "Disgust", emoji: "🤢", color: "#10B981" },
  { id: "angry", label: "Angry", emoji: "😡", color: "#EF4444" },
  { id: "fear", label: "Fear", emoji: "😨", color: "#6B7280" },
];

const weekMoods = ["happy", "sad", "happy", "okay", "happy", "surprised", "happy"];
const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const moodChartData = moods.map((m) => ({ subject: m.label, A: Math.floor(Math.random() * 8) + 1 }));

export default function MoodModal({ onClose, onSave }: Props) {
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState("");
  const [tab, setTab] = useState<"weekly" | "monthly" | "yearly">("weekly");

  const getMoodEmoji = (id: string) => moods.find((m) => m.id === id)?.emoji || "😊";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl shadow-purple-300/30 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-50">
          <button onClick={step > 1 ? () => setStep(step - 1) : onClose} className="p-2 rounded-xl hover:bg-[#F5EEFC] text-gray-500 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? "w-8 bg-[#6F3FB5]" : "w-3 bg-purple-200"}`} />
            ))}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Mood Journal */}
        {step === 1 && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your Mood Journal</h2>
            <p className="text-sm text-gray-500 mb-5">Track your emotional journey</p>

            <div className="flex gap-2 mb-5">
              {(["weekly", "monthly", "yearly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-[#6F3FB5] text-white" : "bg-[#F5EEFC] text-[#6F3FB5] hover:bg-purple-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#F5EEFC] to-white rounded-2xl p-4 mb-4">
              <div className="text-xs text-gray-500 mb-1">Average Mood</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">😊</span>
                <span className="text-lg font-bold text-[#6F3FB5]">HAPPY</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={moodChartData}>
                <PolarGrid stroke="#E9D5FF" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Radar dataKey="A" stroke="#6F3FB5" fill="#6F3FB5" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-7 gap-1 mt-4">
              {weekDays.map((d, i) => (
                <div key={d} className="text-center">
                  <div className="text-xs text-gray-400 mb-1">{d}</div>
                  <div className="text-lg">{getMoodEmoji(weekMoods[i])}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)} className="w-full mt-6 bg-[#6F3FB5] text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors">
              Lihat Mood Harian
            </button>
          </div>
        )}

        {/* Step 2: Daily Mood */}
        {step === 2 && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your Daily Mood</h2>
            <p className="text-sm text-gray-500 mb-5">How was your day?</p>

            <div className="bg-gradient-to-br from-[#6F3FB5] to-[#8B5CF6] text-white rounded-2xl p-6 mb-5 text-center">
              <div className="text-5xl mb-2">😊</div>
              <div className="text-sm opacity-80">Today I feel</div>
              <div className="text-2xl font-bold">HAPPY</div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">This Week's Mood</h3>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((d, i) => (
                  <div key={d} className="text-center">
                    <div className="text-xs text-gray-400 mb-1">{d}</div>
                    <div className="w-8 h-8 mx-auto rounded-lg bg-[#F5EEFC] flex items-center justify-center text-base">
                      {getMoodEmoji(weekMoods[i])}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full flex items-center justify-center gap-2 bg-[#6F3FB5] text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors"
            >
              <Plus size={16} /> Log Mood
            </button>
          </div>
        )}

        {/* Step 3: Add Mood */}
        {step === 3 && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Add Mood</h2>
            <p className="text-sm text-gray-400 mb-2">How are you feeling today?</p>
            <p className="text-xs text-gray-400 mb-5">
              {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    selectedMood === m.id ? "border-[#6F3FB5] bg-[#F5EEFC] scale-105" : "border-gray-100 bg-gray-50 hover:border-purple-200"
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-xs font-semibold text-gray-700">{m.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (!selectedMood) return;
                onSave(selectedMood);
              }}
              disabled={!selectedMood}
              className="w-full bg-[#6F3FB5] disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors"
            >
              Set Mood
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
