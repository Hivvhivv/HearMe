# HearMe

Aplikasi kesehatan mental: pencatatan mood, jurnal digital, konsultasi
dengan psikolog, forum komunitas, dan pustaka konten self-care.

Frontend React + Vite + Tailwind CSS v4, backend Express + MongoDB Atlas.

## Menjalankan secara lokal

Butuh **dua** proses. Keduanya tidak dijalankan otomatis.

```bash
# terminal 1 — backend, port 5000
cd backend && node server.js

# terminal 2 — frontend, port 8443
npm run dev
```

Buka `http://localhost:8443`. Dari perangkat lain di jaringan yang sama,
pakai IP LAN di port yang sama — tidak perlu konfigurasi tambahan.

Frontend memanggil API lewat URL **relatif** `/api`, dan dev server
mem-proxy `/api`, `/uploads`, serta `/socket.io` ke backend. Jadi
frontend dan API selalu same-origin, di dev maupun di produksi. Jangan
menghardcode `http://localhost:5000` di kode frontend: nilai itu ikut
ter-build, dan di perangkat lain `localhost` berarti perangkat itu
sendiri.

Kalau muncul `failed to fetch`, periksa dulu apakah proses backend
hidup:

```bash
curl http://localhost:5000/api/health   # backend langsung
curl http://localhost:8443/api/health   # lewat proxy Vite
```

Yang pertama jalan tapi yang kedua 502 berarti `npm run dev` mati. Dua-duanya
gagal berarti backend yang mati.

## Struktur project

Mulai dari berkas yang relevan dengan tugasnya. Ikuti import atau periksa
berkas lain hanya kalau perlu, kalau path yang didokumentasikan tidak ada,
atau kalau isi repo bertentangan dengan panduan ini.

### Frontend

- `src/main.tsx` — entrypoint React; mengimpor `src/index.css` dan memasang `src/App.tsx` ke elemen `#root`
- `src/App.tsx` — komponen utama dan definisi seluruh route, termasuk guard `AdminRoute` dan `PsychologistRoute`
- `src/api/` — satu modul per domain (`forum.api.ts`, `journal.api.ts`, ...). `client.ts` memegang `apiFetch` dengan single-flight refresh; `config.ts` satu-satunya tempat alamat backend ditentukan; `socket.ts` klien Socket.IO
- `src/contexts/AuthContext.tsx` — sumber kebenaran status login dan `role` (dari `/api/users/me`, bukan dari localStorage)
- `src/lib/authStorage.ts` — akses token (memori) dan data user (localStorage)
- `src/pages/` — halaman, termasuk `admin/` dan `psychologist/`
- `src/index.css` — entrypoint CSS global dan import Tailwind v4
- `index.html` — shell HTML berisi `#root`, meta tag, dan meta robots
- `vite.config.ts` — konfigurasi Vite: React, Tailwind v4, alias `@` ke `src`, dan proxy dev ke backend

### Backend

Berlapis dan tidak boleh saling melompat:

```
core/        AppError, BaseController, BaseService, Database, Validator
services/    logika bisnis — TIDAK mengenal req/res
controllers/ hanya urusan HTTP — membaca request, memanggil service
routes/      perakitan tipis: path + middleware + controller
middleware/  AuthMiddleware (authenticate, authorize), Security (helmet, rate limit)
realtime/    ChatGateway (Socket.IO, memakai room bukan map socket)
http/        CookieService
server.js    perakitan app; start() hanya jalan di luar production
```

`api/index.js` di root adalah entry serverless untuk Vercel; ia hanya
meneruskan `export default app` dari `backend/server.js`. Letaknya di
`/api` karena itu konvensi Vercel, dan rewrite `/api/(.*)` → `/api` di
`vercel.json` yang mengarahkan seluruh `/api/*` ke sana.

## Aturan yang tidak boleh dilanggar

- **Jangan menaruh secret di frontend.** `JWT_SECRET`, `MONGODB_URI`, dan kredensial lain hanya di `backend/.env`, yang tidak ikut ke git.
- **Jangan mempercayai `role` dari frontend.** Role selalu berasal dari JWT atau database. Guard di frontend hanya lapisan UI; endpoint backend wajib punya `authorize(...)` sendiri.
- **Jangan mengirim stack trace ke frontend.** Pakai `AppError` dengan pesan yang aman.
- **Jangan memakai nama berkas dari user sebagai path.** `UploadService` membuat nama acak dan memvalidasi tipe lewat magic byte, bukan MIME yang diklaim.
- **MongoDB hanya menyimpan URL berkas**, bukan binary-nya.
- **Jangan membuat arsitektur duplikat** (`userService2`, `newAuthService`, dan sejenisnya). Ubah yang sudah ada.
- **Jangan mengklaim selesai kalau API belum benar-benar terhubung**, dan jangan membuat mock untuk menggantikan backend.
- Forum anonim: `userId` **tetap** disimpan di database untuk ownership, moderasi, laporan, dan audit. Anonim hanya berlaku pada respons publik.

## Dependensi

- Runtime: React 19 dan React DOM 19
- Styling: Tailwind CSS v4 lewat plugin `@tailwindcss/vite`
- Build: Vite 8, TypeScript 5.7, `@vitejs/plugin-react`
- Backend: Express 5, driver MongoDB native, Socket.IO, helmet, express-rate-limit
- Formatting: oxfmt

## Styling

Tailwind CSS v4 lewat plugin `@tailwindcss/vite` di `vite.config.ts`.
`src/index.css` mengimpornya dengan `@import 'tailwindcss';`. Pakai utility
class langsung di JSX, dan taruh CSS global atau kustomisasi tema Tailwind v4
di `src/index.css`. Scaffold ini tidak butuh berkas config Tailwind maupun
PostCSS.

`src/main.tsx` mengimpor `src/index.css`, jadi pemasangan font global juga
di sana. Urutannya: `@import` CSS dulu, baru `@font-face` dan default
font-family.

Warna utama ditulis sebagai literal `#6F3FB5` di seluruh komponen. Token
`--color-hearme-purple` ada di `src/index.css` tapi belum dipakai di satu
pun komponen — ikuti gaya yang sudah ada di berkas yang sedang diubah.

## Kualitas kode

- Pakai petik ganda untuk string yang mengandung apostrof (`"We're here to help"`), atau escape di dalam petik tunggal. Apostrof yang tidak di-escape di string petik tunggal merusak build.
- Pastikan tag JSX tertutup dan kurung kurawal seimbang.
- Export komponen sebagai default export.

## Deployment

Lihat `DEPLOYMENT.md`. Ringkasnya: `vercel.json` me-rewrite `/api/*` ke
serverless function dan sisanya ke `index.html`. Dua hal tidak bisa jalan
di Vercel — chat realtime (serverless tidak menahan WebSocket) dan upload
berkas (filesystem read-only).
