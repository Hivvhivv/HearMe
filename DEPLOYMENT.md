# Catatan Deployment HearMe

Dibuat untuk menjawab satu pertanyaan konkret:

> kenapa backend dan database-nya saat login **failed to fetch** di Vercel?

Ringkasnya: `failed to fetch` **bukan** error dari backend. Itu pesan
browser ketika request tidak pernah sampai ke server mana pun. Jadi yang
rusak ada di jalur sebelum backend, bukan di logika login-nya.

Ada 5 penyebab terpisah. Tiga sudah diperbaiki di repo (perlu **redeploy**
supaya aktif), dua hanya bisa dikerjakan dari dashboard Vercel dan Atlas.

---

## Yang harus kamu lakukan (checklist)

- [ ] 1. Atlas -> Network Access -> tambahkan `0.0.0.0/0`
- [ ] 2. Vercel -> Settings -> Environment Variables -> isi tabel di bawah
- [ ] 3. Redeploy (bukan sekadar restart, build frontend harus diulang)
- [ ] 4. Jalankan 3 perintah verifikasi di bagian paling bawah

Setelah itu login akan jalan. Chat realtime **tetap tidak jalan di
Vercel**; alasannya ada di bagian "Yang tidak bisa jalan di Vercel".

---

## Penyebab 1 - `/api/*` tidak pernah diarahkan ke backend

**Ini penyebab utamanya.**

Repo belum punya `vercel.json`. Akibatnya Vercel hanya melihat hasil
`vite build`, yaitu folder `dist` berisi file statis. Tidak ada yang
memberi tahu Vercel bahwa folder `backend/` adalah sebuah API.

Jadi ketika frontend memanggil `POST /api/auth/login`, Vercel mencari
file bernama `api/auth/login` di antara file statis, tidak menemukannya,
lalu mengembalikan HTML halaman 404. Browser menerima HTML padahal
menunggu JSON, dan hasilnya `failed to fetch`.

**Sudah diperbaiki**, lewat dua hal.

Pertama, berkas `api/[...path].js` di root. Vercel otomatis
memperlakukan isi folder `/api` sebagai serverless function, dan nama
`[...path]` berarti catch-all: semua `/api/*` masuk ke sana, termasuk
`/api/auth/login` dan `/api/forums/123/replies`. Isinya cuma meneruskan
Express app:

```js
import app from "../backend/server.js";
export default app;
```

Karena konvensi itu sudah menangani `/api`, `vercel.json` tidak perlu
rewrite untuk API — hanya untuk SPA:

```json
"rewrites": [
  { "source": "/((?!api/).*)", "destination": "/index.html" }
]
```

Itu mengirim selain `/api/*` ke `index.html`, supaya refresh di halaman
seperti `/forum` tidak 404 (kebutuhan SPA, terpisah dari masalah API,
tapi akan menggigit kalau tidak ada). Berkas statis tetap aman karena
Vercel memeriksa filesystem lebih dulu sebelum menerapkan rewrite.

Kedua, `installCommand` yang juga memasang dependensi backend:

```json
"installCommand": "npm install && npm install --prefix backend --omit=dev"
```

Tanpa baris itu build berhasil tapi function langsung mati saat
dipanggil, karena `express` dan `mongodb` ada di `backend/package.json`
sementara Vercel hanya memasang dependensi dari `package.json` root.

> **Catatan:** jangan menulis `"runtime"` di dalam `functions`. Untuk
> Node.js, Vercel mendeteksinya sendiri. Mengisinya dengan nilai seperti
> `@vercel/node@3` membuat build gagal dengan pesan
> *"Function Runtimes must have a valid version"*.

---

## Penyebab 2 - `localhost` ikut ter-build ke dalam bundle

Ini penyebab kedua yang berdiri sendiri, dan tetap akan mematikan login
walaupun Penyebab 1 sudah dibereskan.

Frontend dulu memakai `http://localhost:5000/api` sebagai alamat backend.
Nilai seperti itu **dibakar ke dalam file JavaScript saat build**, bukan
dibaca saat aplikasi jalan. Dan `localhost` selalu berarti *perangkat yang
sedang membuka halaman itu*, bukan servermu.

Jadi ketika pengunjung membuka situsmu, browser mereka mencoba
menghubungi port 5000 **di komputer mereka sendiri**. Di sana tidak ada
apa-apa, hasilnya `failed to fetch`. Ini juga alasan kenapa dulu tidak
bisa login dari HP meskipun laptopnya menyala.

**Sudah diperbaiki.** Default-nya sekarang relatif:

```ts
const RAW_BASE_URL = import.meta.env.VITE_API_URL || "/api";
```

`/api` artinya "origin yang sama dengan halaman ini", jadi alamatnya
menyesuaikan sendiri di mana pun aplikasi dibuka: `localhost:8443` saat
dev, IP LAN saat dites dari HP, domain Vercel saat produksi.

> **Penting:** jangan mengisi `VITE_API_URL` di Vercel. Mengisinya dengan
> `http://localhost:5000/api` akan mengembalikan bug ini persis seperti
> semula. Isi **hanya** kalau backend benar-benar dipindah ke domain lain
> (lihat bagian "Kalau kamu butuh chat realtime jalan").

Efek sampingnya bagus: frontend dan API jadi satu origin, sehingga tidak
ada urusan CORS, dan cookie refresh token tidak bergantung pada setelan
`SameSite` lintas domain.

---

## Penyebab 3 - Atlas memblokir IP Vercel (**perlu kamu kerjakan**)

Kalau yang kamu lihat adalah login menggantung lama lalu gagal (bukan
gagal seketika), ini penyebabnya.

MongoDB Atlas menolak koneksi dari IP yang tidak ada di daftar Network
Access. Daftarmu kemungkinan hanya berisi IP rumahmu, dan itu sebabnya
jalan di laptop tapi tidak di Vercel. IP serverless Vercel
**berubah-ubah**, jadi tidak ada satu IP yang bisa kamu daftarkan.

**Cara memperbaiki:** Atlas -> Network Access -> Add IP Address ->
`0.0.0.0/0` (Allow access from anywhere).

Itu terdengar menakutkan, tapi bukan berarti database jadi terbuka: yang
membuka pintu adalah username/password di `MONGODB_URI`. Untuk serverless
ini satu-satunya cara praktis. Yang perlu dijaga sebagai gantinya: pakai
password panjang, dan beri user Atlas itu akses hanya ke database
`hearme`, bukan role admin seluruh cluster.

---

## Penyebab 4 - Environment variable belum di-set di Vercel (**perlu kamu kerjakan**)

`.env` tidak ikut ke Git (memang harus begitu; `.gitignore` sudah
menutupnya dan tidak ada `.env` yang ter-track). Artinya di Vercel file
itu tidak ada sama sekali. Tanpa `MONGODB_URI`, function crash saat
request pertama dan mengembalikan 500, atau pada cold start yang gagal
tidak mengembalikan apa pun sehingga kembali jadi `failed to fetch`.

Vercel -> Settings -> Environment Variables (Production + Preview):

| Variabel | Nilai | Catatan |
|---|---|---|
| `MONGODB_URI` | connection string Atlas-mu | password harus di-percent-encode, lihat di bawah |
| `JWT_SECRET` | string acak panjang | lihat di bawah |
| `NODE_ENV` | `production` | |
| `COOKIE_SECURE` | `true` | wajib, Vercel selalu HTTPS |
| `COOKIE_SAMESITE` | `lax` | cukup, karena same-origin |
| `ACCESS_TOKEN_TTL` | `900` | 15 menit |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | |
| `REFRESH_GRACE_SECONDS` | `10` | toleransi refresh paralel |
| `CORS_ORIGINS` | **kosongkan** | lihat catatan di bawah |
| `VITE_API_URL` | **jangan dibuat** | lihat Penyebab 2 |

### Password Atlas wajib di-percent-encode

Jebakan ini sudah pernah menjerat sekali, dan akan menjerat
lagi saat menempel URI ke Vercel.

Driver membaca `MONGODB_URI` sebagai URI, dan memotong di `@`
**pertama** untuk memisahkan kredensial dari host. Jadi password
yang mengandung `@` harus ditulis sebagai `%40`:

```
password asli    : @Nadi@Nof280405
di dalam URI     : %40Nadi%40Nof280405
```

Kalau ditempel apa adanya, driver membaca password kosong dan
host `Nadi@Nof280405@cluster0...`, lalu Atlas menjawab:

```
MongoServerError: bad auth : authentication failed
```

Pesannya menyesatkan karena terdengar seperti password salah,
padahal passwordnya benar dan hanya salah tulis di URI.

| Karakter | Jadi | | Karakter | Jadi |
|---|---|---|---|---|
| `@` | `%40` | | `?` | `%3F` |
| `:` | `%3A` | | `#` | `%23` |
| `/` | `%2F` | | `%` | `%25` |

Cara aman membuatnya:

```bash
node -e "console.log(encodeURIComponent('password-mu'))"
```

Dan jangan sertakan tanda `<>` dari template Atlas — itu hanya
penanda tempat, bukan bagian dari password.

Bikin `JWT_SECRET` dengan:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`JWT_SECRET` lokalmu sudah diganti dari nilai default
`hearme_super_secret_ubah_ini`. Nilai default itu berbahaya karena
tertulis di `.env.example` yang ikut ke Git: siapa pun yang melihat repo
bisa menandatangani token palsu dan masuk sebagai admin. **Pakai secret
yang berbeda untuk Vercel**, jangan menyalin yang lokal.

Mengganti secret membuat semua sesi lama tidak valid, jadi semua orang
perlu login ulang sekali. Itu normal.

### Kenapa `CORS_ORIGINS` dikosongkan

Dulu kalau variabel ini kosong, backend mengizinkan **semua** origin.
Aman di dev, tapi di produksi itu sama dengan CORS terbuka, dan spec
melarangnya. Sekarang aturannya dibedakan: kosong + dev berarti pantulkan
origin apa pun; kosong + production berarti **tolak** request
cross-origin.

Jadi mengosongkannya di Vercel adalah pilihan yang paling ketat, bukan
yang paling longgar. Frontend tetap jalan karena memanggil `/api` relatif,
dan browser tidak meminta header CORS untuk request same-origin.

Isi variabel ini hanya kalau frontend benar-benar ada di domain lain.

---

## Penyebab 5 - Upload file menulis ke disk yang read-only

Filesystem serverless Vercel bersifat read-only kecuali `/tmp`, dan
`/tmp` pun hilang setiap function mati. Kode upload menulis ke
`process.cwd()/uploads`, jadi di Vercel pasti gagal.

**Sudah ditangani sebagian.** Errornya sekarang ditangkap dan diubah
menjadi pesan yang jelas:

```
503 UPLOAD_STORAGE_UNAVAILABLE
"Penyimpanan file belum tersedia di server ini."
```

Jadi tidak lagi berupa crash 500 yang membingungkan. Tapi ini penanganan
error, **bukan** solusi: upload tetap tidak berfungsi di Vercel. Solusi
sebenarnya adalah object storage (Vercel Blob, Cloudinary, atau S3) dan
mengganti isi `UploadService.persist()`. Database tetap hanya menyimpan
URL-nya dan tidak pernah binary-nya, jadi perubahan itu terbatas di satu
method saja.

---

## Yang tidak bisa jalan di Vercel

Dua hal, dan keduanya bukan bug yang bisa diperbaiki dengan kode.

**1. Chat konsultasi realtime (Socket.IO).** WebSocket butuh proses yang
hidup terus dan menyimpan koneksi di memori. Serverless function mati
setelah tiap request. Backend tidak akan crash, karena
`chatGateway.attach()` hanya dipanggil dari `start()` dan `start()`
dilewati saat production, tapi chat realtime tidak akan berfungsi.

**2. Upload file.** Lihat Penyebab 5.

Fitur lain, yaitu login, sesi multi-device, mood harian, jurnal, forum,
moderasi, booking, Mind Hub, dan profil, semuanya HTTP biasa dan jalan
normal di Vercel.

### Kalau kamu butuh chat realtime jalan

Pisahkan deploy-nya: frontend tetap di Vercel, backend ke host yang
prosesnya hidup terus (Railway, Render, atau Fly.io).

Saat itu frontend dan backend jadi beda domain, same-origin hilang, dan
empat setelan harus diubah bersamaan. Kalau hanya sebagian, login akan
gagal dengan cara yang membingungkan:

| Tempat | Variabel | Nilai |
|---|---|---|
| Vercel | `VITE_API_URL` | `https://backend-kamu.up.railway.app/api` |
| Backend | `CORS_ORIGINS` | `https://app-kamu.vercel.app` |
| Backend | `COOKIE_SAMESITE` | `none` |
| Backend | `COOKIE_SECURE` | `true` |

`SameSite=none` wajib karena cookie refresh token berubah jadi cookie
pihak ketiga; tanpa itu browser tidak mengirimkannya dan kamu akan selalu
ter-logout setelah 15 menit. Dan `SameSite=none` hanya diterima browser
kalau `Secure=true`, jadi keduanya satu paket.

---

## Cara memverifikasi setelah redeploy

Ganti `app-kamu.vercel.app` dengan domainmu. Jalankan berurutan; kalau
nomor 1 gagal, nomor 2 dan 3 tidak perlu dicoba.

```bash
# 1. Apakah function hidup dan database tersambung?
curl -i https://app-kamu.vercel.app/api/health
#    Harus: {"ok":true,"database":"hearme"}

# 2. Apakah login mengembalikan JSON, bukan HTML?
curl -i -X POST https://app-kamu.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"salah@example.com","password":"salah"}'
#    Harus: HTTP 401 + {"code":"INVALID_CREDENTIALS"}

# 3. Apakah cookie refresh token terkirim dengan benar?
curl -i -X POST https://app-kamu.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"email-asli@kamu.com","password":"password-asli"}' | grep -i set-cookie
#    Harus memuat: HttpOnly; Secure; Path=/api/auth
```

Cara membaca hasilnya:

| Yang kamu lihat | Artinya |
|---|---|
| 401 `INVALID_CREDENTIALS` di no. 2 | **Berhasil.** Backend hidup dan menjawab. |
| HTML, bukan JSON | `vercel.json` belum terpakai, redeploy |
| Menggantung lalu gagal | Atlas Network Access (Penyebab 3) |
| 500 | env var kurang, cek Vercel Function Logs |
| `Secure` tidak ada di no. 3 | `COOKIE_SECURE` belum `true` |

Kalau masih gagal, buka Vercel -> Deployments -> Functions -> Logs. Error
sebenarnya kelihatan di situ. Backend sengaja tidak mengirim stack trace
ke browser, jadi log server adalah satu-satunya tempat melihatnya.

---

## Catatan dev lokal

Tidak ada MongoDB lokal yang perlu dibuka atau ditutup. Database ini
Atlas, jalan di cloud. Terminal backend memang mencetak
`MongoDB connected: hearme` sehingga terlihat seperti ada MongoDB lokal,
tapi itu hanya konfirmasi koneksi ke Atlas.

Yang dulu bikin `failed to fetch` di lokal cuma satu: **proses backend
tidak hidup**. Perlu dua terminal:

```bash
# terminal 1
cd backend && node server.js      # port 5000

# terminal 2
npm run dev                       # port 8443, mem-proxy /api ke 5000
```

Buka `http://localhost:8443`. Dari HP, pakai IP LAN laptop di port yang
sama (`http://10.x.x.x:8443`), tanpa konfigurasi apa pun, karena proxy
Vite meneruskan `/api`, `/uploads`, dan `/socket.io` ke backend.

Cek cepat kalau ada yang aneh:

```bash
curl http://localhost:5000/api/health   # backend langsung
curl http://localhost:8443/api/health   # lewat proxy Vite
```

Kalau yang pertama jalan tapi yang kedua 502, berarti `npm run dev` yang
mati. Kalau keduanya gagal, backend-nya yang mati.
