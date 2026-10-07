import { useState } from "react";

type Props = {
  src?: string;
  name?: string;
  // Kelas ukuran dan teks, mis. "w-7 h-7 text-xs".
  className?: string;
};

// Foto/avatar user, dengan cadangan huruf awal nama kalau
// belum ada avatar atau gambarnya gagal dimuat.
export default function UserAvatar({ src, name, className = "w-10 h-10 text-sm" }: Props) {
  const [failedSrc, setFailedSrc] = useState("");

  const initial = name?.trim()?.[0]?.toUpperCase() || "U";

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={name ? `Avatar ${name}` : "Avatar"}
        onError={() => setFailedSrc(src)}
        className={`${className} rounded-full object-cover bg-[#F5EEFC] shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-[#C9A9E9] to-[#6F3FB5] flex items-center justify-center text-white font-bold shrink-0`}
    >
      {initial}
    </div>
  );
}
