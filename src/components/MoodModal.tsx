import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  X,
  ChevronLeft,
  BarChart2,
  Plus,
} from "lucide-react";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

import dailyMoodApi from "../api/dailyMood.api";


// ======================================================
// PROPS
// ======================================================

interface Props {
  onClose: () => void;
  onSave: (mood: string) => void | Promise<void>;
}


// ======================================================
// MOODS
// ======================================================

const moods = [
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    color: "#F59E0B",
  },

  {
    id: "sad",
    label: "Sad",
    emoji: "😢",
    color: "#3B82F6",
  },

  {
    id: "surprised",
    label: "Surprised",
    emoji: "😮",
    color: "#8B5CF6",
  },

  {
    id: "disgust",
    label: "Disgust",
    emoji: "🤢",
    color: "#10B981",
  },

  {
    id: "angry",
    label: "Angry",
    emoji: "😡",
    color: "#EF4444",
  },

  {
    id: "fear",
    label: "Fear",
    emoji: "😨",
    color: "#6B7280",
  },
];


// ======================================================
// DAYS
// ======================================================

const weekDays = [
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
  "Min",
];


// ======================================================
// DATE HELPER
// ======================================================

function formatDateKey(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ======================================================
// MOOD MODAL
// ======================================================

export default function MoodModal({
  onClose,
  onSave,
}: Props) {

  // ====================================================
  // STEP
  // ====================================================

  const [step, setStep] =
    useState(1);


  // ====================================================
  // SELECTED MOOD
  // ====================================================

  const [selectedMood, setSelectedMood] =
    useState("");


  // ====================================================
  // TAB
  // ====================================================

  const [tab, setTab] =
    useState<
      "weekly" | "monthly" | "yearly"
    >("weekly");


  // ====================================================
  // MOOD HISTORY
  //
  // Data berasal dari MongoDB melalui API.
  // ====================================================

  const [moodHistory, setMoodHistory] =
    useState<
      Record<string, string>
    >({});


  // ====================================================
  // LOADING
  // ====================================================

  const [loading, setLoading] =
    useState(true);


  // ====================================================
  // ERROR
  // ====================================================

  const [error, setError] =
    useState("");


  // ====================================================
  // SAVING
  // ====================================================

  const [saving, setSaving] =
    useState(false);


  // ====================================================
  // TODAY
  // ====================================================

  const todayKey =
    formatDateKey(new Date());


  // ====================================================
  // LOAD MOOD HISTORY
  // ====================================================

  useEffect(() => {

    let cancelled = false;

    async function loadMoodHistory() {

      try {

        setLoading(true);
        setError("");

        /*
        ==================================================
        DATABASE FLOW

        MoodModal
            ↓
        dailyMoodApi
            ↓
        GET /api/daily-moods/history
            ↓
        Bearer JWT
            ↓
        Backend
            ↓
        MongoDB
        ==================================================
        */

        const history =
          await dailyMoodApi.getMoodHistory(
            365
          );

        if (cancelled) {
          return;
        }

        const map: Record<
          string,
          string
        > = {};

        history.forEach(
          (item) => {
            map[item.date] =
              item.mood;
          }
        );

        setMoodHistory(map);

        // ================================================
        // Jika user sudah memiliki mood hari ini,
        // tampilkan mood tersebut sebagai selected.
        // ================================================

        if (map[todayKey]) {
          setSelectedMood(
            map[todayKey]
          );
        }

      } catch (err) {

        console.error(
          "Failed to load mood history:",
          err
        );

        if (!cancelled) {

          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data mood"
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }

    loadMoodHistory();

    return () => {
      cancelled = true;
    };

  }, [todayKey]);


  // ====================================================
  // GET MOOD EMOJI
  // ====================================================

  const getMoodEmoji = (
    id: string
  ) => {

    return (
      moods.find(
        (mood) =>
          mood.id === id
      )?.emoji ||
      "🙂"
    );

  };


  // ====================================================
  // LAST 7 DAYS
  // ====================================================

  const last7Days =
    useMemo(() => {

      const result: {
        key: string;
        date: Date;
        label: string;
        mood?: string;
      }[] = [];

      for (
        let i = 6;
        i >= 0;
        i--
      ) {

        const date =
          new Date();

        date.setDate(
          date.getDate() - i
        );

        const key =
          formatDateKey(date);

        /*
        Sunday:
          getDay() = 0

        Monday:
          getDay() = 1

        Array:
          Sen = 0
          Sel = 1
          ...
          Min = 6
        */

        const labelIndex =
          date.getDay() === 0
            ? 6
            : date.getDay() - 1;

        result.push({
          key,
          date,
          label:
            weekDays[labelIndex],
          mood:
            moodHistory[key],
        });

      }

      return result;

    }, [moodHistory]);


  // ====================================================
  // MOOD COUNTS
  // ====================================================

  const moodCounts =
    useMemo(() => {

      const counts: Record<
        string,
        number
      > = {};

      Object.values(
        moodHistory
      ).forEach((mood) => {

        counts[mood] =
          (counts[mood] || 0) + 1;

      });

      return counts;

    }, [moodHistory]);


  // ====================================================
  // MOST COMMON MOOD
  // ====================================================

  const averageMood =
    useMemo(() => {

      const availableMoods =
        moods
          .map((mood) => ({
            ...mood,
            count:
              moodCounts[
                mood.id
              ] || 0,
          }))
          .filter(
            (mood) =>
              mood.count > 0
          )
          .sort(
            (a, b) =>
              b.count - a.count
          );

      return (
        availableMoods[0] ||
        null
      );

    }, [moodCounts]);


  // ====================================================
  // RADAR CHART
  //
  // TIDAK RANDOM LAGI.
  //
  // Data berdasarkan mood dari MongoDB.
  // ====================================================

  const moodChartData =
    useMemo(() => {

      return moods.map(
        (mood) => ({
          subject: mood.label,
          A:
            moodCounts[
              mood.id
            ] || 0,
        })
      );

    }, [moodCounts]);


  // ====================================================
  // TODAY MOOD
  // ====================================================

  const todayMood =
    moodHistory[todayKey];

  const todayMoodConfig =
    moods.find(
      (mood) =>
        mood.id === todayMood
    );


  // ====================================================
  // HANDLE SAVE
  // ====================================================

  const handleSave =
    async () => {

      if (!selectedMood) {
        return;
      }

      try {

        setSaving(true);
        setError("");

        /*
        ================================================
        Jangan langsung menyimpan dari Modal ke
        localStorage.

        Parent Dashboard akan memanggil API:

        onSave(selectedMood)

        Dashboard
          ↓
        dailyMoodApi.saveTodayMood()
          ↓
        PUT /api/daily-moods/today
          ↓
        MongoDB
        ================================================
        */

        await onSave(
          selectedMood
        );

      } catch (err) {

        console.error(
          "Failed to save mood:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Gagal menyimpan mood"
        );

      } finally {

        setSaving(false);

      }

    };


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:
          "rgba(0,0,0,0.4)",
        backdropFilter:
          "blur(4px)",
      }}
    >

      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl shadow-purple-300/30 animate-scale-in max-h-[90vh] overflow-y-auto">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between p-5 border-b border-purple-50">

          <button
            onClick={
              step > 1
                ? () =>
                    setStep(
                      step - 1
                    )
                : onClose
            }
            className="p-2 rounded-xl hover:bg-[#F5EEFC] text-gray-500 transition-colors"
            type="button"
          >
            <ChevronLeft size={20} />
          </button>


          <div className="flex items-center gap-1.5">

            {[1, 2, 3].map(
              (s) => (

                <div
                  key={s}
                  className={`
                    h-1.5 rounded-full
                    transition-all
                    ${
                      s === step
                        ? "w-8 bg-[#6F3FB5]"
                        : "w-3 bg-purple-200"
                    }
                  `}
                />

              )
            )}

          </div>


          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
            type="button"
          >
            <X size={18} />
          </button>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mx-6 mt-5 bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}


        {/* ==================================================
            STEP 1
        ================================================== */}

        {step === 1 && (

          <div className="p-6">

            <div className="flex items-center gap-2 mb-1">

              <BarChart2
                size={20}
                className="text-[#6F3FB5]"
              />

              <h2 className="text-xl font-bold text-gray-900">
                Your Mood Journal
              </h2>

            </div>

            <p className="text-sm text-gray-500 mb-5">
              Track your emotional journey
            </p>


            {/* TABS */}

            <div className="flex gap-2 mb-5">

              {(
                [
                  "weekly",
                  "monthly",
                  "yearly",
                ] as const
              ).map((type) => (

                <button
                  key={type}
                  onClick={() =>
                    setTab(type)
                  }
                  type="button"
                  className={`
                    px-4 py-1.5
                    rounded-lg
                    text-xs
                    font-semibold
                    capitalize
                    transition-colors
                    ${
                      tab === type
                        ? "bg-[#6F3FB5] text-white"
                        : "bg-[#F5EEFC] text-[#6F3FB5] hover:bg-purple-200"
                    }
                  `}
                >
                  {type}
                </button>

              ))}

            </div>


            {/* LOADING */}

            {loading ? (

              <div className="py-12 text-center">

                <div className="w-8 h-8 border-4 border-purple-100 border-t-[#6F3FB5] rounded-full animate-spin mx-auto mb-3" />

                <p className="text-sm text-gray-400">
                  Memuat data mood...
                </p>

              </div>

            ) : (

              <>

                {/* ==================================================
                    AVERAGE MOOD
                ================================================== */}

                <div className="bg-gradient-to-br from-[#F5EEFC] to-white rounded-2xl p-4 mb-4">

                  <div className="text-xs text-gray-500 mb-1">
                    Average Mood
                  </div>

                  {averageMood ? (

                    <div className="flex items-center gap-2">

                      <span className="text-3xl">
                        {averageMood.emoji}
                      </span>

                      <div>

                        <div className="text-lg font-bold text-[#6F3FB5]">
                          {averageMood.label.toUpperCase()}
                        </div>

                        <div className="text-xs text-gray-400">
                          {averageMood.count} hari
                        </div>

                      </div>

                    </div>

                  ) : (

                    <div className="text-sm text-gray-400">
                      Belum ada data mood
                    </div>

                  )}

                </div>


                {/* ==================================================
                    RADAR CHART
                ================================================== */}

                <ResponsiveContainer
                  width="100%"
                  height={180}
                >

                  <RadarChart
                    data={
                      moodChartData
                    }
                  >

                    <PolarGrid
                      stroke="#E9D5FF"
                    />

                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fontSize: 11,
                        fill: "#6B7280",
                      }}
                    />

                    <Radar
                      dataKey="A"
                      stroke="#6F3FB5"
                      fill="#6F3FB5"
                      fillOpacity={0.3}
                    />

                  </RadarChart>

                </ResponsiveContainer>


                {/* ==================================================
                    LAST 7 DAYS
                ================================================== */}

                <div className="grid grid-cols-7 gap-1 mt-4">

                  {last7Days.map(
                    (day) => (

                      <div
                        key={day.key}
                        className="text-center"
                      >

                        <div className="text-xs text-gray-400 mb-1">
                          {day.label}
                        </div>

                        <div className="text-lg">

                          {day.mood
                            ? getMoodEmoji(
                                day.mood
                              )
                            : "○"}

                        </div>

                      </div>

                    )
                  )}

                </div>

              </>

            )}


            <button
              onClick={() =>
                setStep(2)
              }
              disabled={loading}
              type="button"
              className="w-full mt-6 bg-[#6F3FB5] disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors"
            >
              Lihat Mood Harian
            </button>

          </div>

        )}


        {/* ==================================================
            STEP 2
        ================================================== */}

        {step === 2 && (

          <div className="p-6">

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Your Daily Mood
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              How was your day?
            </p>


            {/* TODAY MOOD */}

            <div className="bg-gradient-to-br from-[#6F3FB5] to-[#8B5CF6] text-white rounded-2xl p-6 mb-5 text-center">

              <div className="text-5xl mb-2">

                {todayMoodConfig?.emoji ||
                  "🙂"}

              </div>

              <div className="text-sm opacity-80">
                Today I feel
              </div>

              <div className="text-2xl font-bold">

                {todayMoodConfig?.label
                  ? todayMoodConfig.label.toUpperCase()
                  : "NO MOOD"}

              </div>

            </div>


            {/* THIS WEEK */}

            <div className="mb-5">

              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                This Week's Mood
              </h3>

              <div className="grid grid-cols-7 gap-1">

                {last7Days.map(
                  (day) => (

                    <div
                      key={day.key}
                      className="text-center"
                    >

                      <div className="text-xs text-gray-400 mb-1">
                        {day.label}
                      </div>

                      <div className="w-8 h-8 mx-auto rounded-lg bg-[#F5EEFC] flex items-center justify-center text-base">

                        {day.mood
                          ? getMoodEmoji(
                              day.mood
                            )
                          : "○"}

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            <button
              onClick={() =>
                setStep(3)
              }
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-[#6F3FB5] text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors"
            >

              <Plus size={16} />

              Log Mood

            </button>

          </div>

        )}


        {/* ==================================================
            STEP 3
        ================================================== */}

        {step === 3 && (

          <div className="p-6">

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Add Mood
            </h2>

            <p className="text-sm text-gray-400 mb-2">
              How are you feeling today?
            </p>

            <p className="text-xs text-gray-400 mb-5">
              {new Date().toLocaleDateString(
                "id-ID",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>


            {/* MOOD OPTIONS */}

            <div className="grid grid-cols-3 gap-3 mb-6">

              {moods.map(
                (mood) => (

                  <button
                    key={mood.id}
                    onClick={() =>
                      setSelectedMood(
                        mood.id
                      )
                    }
                    type="button"
                    className={`
                      flex flex-col items-center
                      gap-2 p-4 rounded-2xl
                      border-2 transition-all
                      ${
                        selectedMood ===
                        mood.id
                          ? "border-[#6F3FB5] bg-[#F5EEFC] scale-105"
                          : "border-gray-100 bg-gray-50 hover:border-purple-200"
                      }
                    `}
                  >

                    <span className="text-3xl">
                      {mood.emoji}
                    </span>

                    <span className="text-xs font-semibold text-gray-700">
                      {mood.label}
                    </span>

                  </button>

                )
              )}

            </div>


            {/* SAVE */}

            <button
              onClick={handleSave}
              disabled={
                !selectedMood ||
                saving
              }
              type="button"
              className="w-full bg-[#6F3FB5] disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl hover:bg-purple-800 transition-colors"
            >

              {saving
                ? "Menyimpan..."
                : "Set Mood"}

            </button>

          </div>

        )}

      </div>

    </div>
  );
}