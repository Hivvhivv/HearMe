export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="12" fill="#6F3FB5" />
        <path
          d="M20 8C13.373 8 8 13.373 8 20c0 3.314 1.343 6.314 3.515 8.485L8 32l3.515-3.515A11.958 11.958 0 0020 32c6.627 0 12-5.373 12-12S26.627 8 20 8z"
          fill="white"
          fillOpacity={0.9}
        />
        <path d="M15 18h10M15 22h6" stroke="#6F3FB5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="27" cy="14" r="4" fill="#C9A9E9" />
        <path d="M26 14l1 1 2-2" stroke="#6F3FB5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span
        className="font-bold text-[#6F3FB5]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size * 0.55 }}
      >
        HearMe
      </span>
    </div>
  );
}
