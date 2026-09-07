# PROMPT REVISI HEARME WEBSITE

Lakukan revisi dan penyempurnaan terhadap project HearMe yang sudah dibuat sebelumnya. Jangan membuat ulang dari awal. Fokus pada perbaikan fitur, navigasi, UX flow, integrasi halaman yang belum berfungsi, serta persiapan integrasi database dan AI API di masa depan.

---

# 1. AUTHENTICATION FLOW

## Login, Get Started, Daftar Gratis

Perbaiki alur autentikasi:

* Tombol **Sign In** mengarahkan ke halaman login.
* Tombol **Get Started** mengarahkan ke halaman pemilihan role (User/Psychologist).
* Tombol **Daftar Gratis / Create Account** mengarahkan ke halaman registrasi.

Setelah berhasil login atau registrasi:

* User diarahkan ke Dashboard.
* Dashboard menggunakan layout terpisah dari Landing Page.
* Gunakan route yang berbeda untuk Dashboard dan Public Website.
* Simpan status login menggunakan localStorage.
* Jika user sudah login lalu membuka halaman login atau register, otomatis redirect ke Dashboard.

Tambahkan komentar berikut pada area autentikasi:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// LOGIN FLOW
// Check user credentials from database.
//
// Example:
//
// const user = await database.users.findOne({
//   email,
//   password
// });
//
// ======================================================
```

---

# 2. LANDING PAGE NAVBAR

Navbar saat ini belum bekerja sepenuhnya.

Pastikan menu berikut berfungsi:

## Home

Scroll atau navigasi ke Hero Section.

## About

Scroll atau navigasi ke About Section.

## How It Works

Scroll atau navigasi ke How It Works Section.

## Features

Scroll atau navigasi ke Features Section.

## Contact

Scroll atau navigasi ke Contact Section.

Tambahkan:

* Smooth scrolling
* Responsive navbar
* Sticky navbar
* Active menu highlight
* Mobile hamburger menu

---

# 3. CONTACT SECTION

Bagian Contact saat ini tidak sesuai.

Buat seperti website profesional pada umumnya.

## Contact Information

Email:
[support@hearme.com](mailto:support@hearme.com)

Phone:
+62 812 3456 7890

Location:
Jakarta, Indonesia

Operating Hours:
Monday - Friday
08:00 - 17:00 WIB

## Contact Form

Fields:

* Full Name
* Email
* Subject
* Message

Button:

* Send Message

Tambahkan validasi form.

---

# 4. FOOTER NAVIGATION

Seluruh menu footer harus bisa diklik.

## Footer Product

* AI Listener
* Consultation
* Mood Journal
* Mind Hub
* Forum

Jika user BELUM login:

* Redirect ke halaman login.
* Tampilkan alert:
  "Silakan login terlebih dahulu untuk mengakses fitur ini."

Jika user SUDAH login:

* Redirect ke halaman terkait.

## Footer Company

* About
* Contact
* Privacy Policy
* Terms & Conditions

Semua halaman harus tersedia dan berfungsi.

---

# 5. DAILY MOOD LOG IMPROVEMENT

Saat ini Daily Mood Log hanya menampilkan angka statis.

Ubah menjadi sistem berbasis tanggal.

## Ketentuan

* Menampilkan 7 hari terakhir.
* Menggunakan tanggal aktual berdasarkan device user.
* Otomatis berubah setiap hari.
* Data mood tersimpan berdasarkan tanggal.
* Jika user mengisi mood hari ini maka mood akan muncul pada tanggal hari ini.
* Mood history dapat dilihat kembali.

Contoh:

Mon
Tue
Wed
Thu
Fri
Sat
Sun

Gunakan localStorage.

Tambahkan komentar:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// mood_logs table
//
// id
// user_id
// mood
// note
// created_at
//
// ======================================================
```

---

# 6. MIND HUB IMPROVEMENT

Saat ini isi Mind Hub masih terlalu mirip.

Pisahkan secara jelas.

## Mind and Balance

Fokus:

* Mengatur stres
* Membangun kebiasaan sehat
* Produktivitas
* Keseimbangan hidup
* Time management
* Self discipline

Buat minimal:

* 15 materi
* Bisa dibaca
* Ada halaman detail
* Materi dapat dipraktikkan dalam kehidupan sehari-hari

## Self-Care Corner

Fokus:

* Self love
* Self appreciation
* Relaxation
* Breathing exercise
* Healing
* Sleep improvement
* Emotional awareness

Buat minimal:

* 15 materi
* Bisa dibaca
* Ada halaman detail
* Materi dapat dipraktikkan dalam kehidupan sehari-hari

Semua artikel harus dapat dibuka.

Tambahkan komentar:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// mind_hub_contents
//
// id
// category
// title
// content
// image
//
// category:
// - Mind and Balance
// - Self-Care Corner
//
// ======================================================
```

---

# 7. ARTICLE PAGE

Saat ini artikel tidak bisa dibuka.

Perbaiki:

* Semua artikel dapat diakses.
* Setiap artikel memiliki halaman detail.

Tambahkan:

* Thumbnail
* Author
* Reading Time
* Publish Date
* Related Articles

Gunakan React Router.

Route:

```text
/article/:id
```

Tambahkan komentar:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// articles table
//
// id
// title
// content
// author
// thumbnail
// reading_time
// publish_date
//
// ======================================================
```

---

# 8. AI LISTENER IMPROVEMENT

Saat ini AI Listener hanya memberikan jawaban random.

## Mode 1 - Mock AI

Tambahkan keyword matching untuk:

* Sedih
* Marah
* Cemas
* Takut
* Bingung
* Kesepian
* Stress
* Bahagia
* Overthinking
* Burnout
* Patah Hati
* Kurang Percaya Diri

Buat respons yang lebih natural dan empatik.

Simpan riwayat chat.

Tambahkan komentar:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// chat_sessions
// chat_messages
//
// Save chat history.
//
// ======================================================
```

## Mode 2 - AI API Ready

Tambahkan komentar berikut pada source code:

```js
// ======================================================
// ## AI API INTEGRATION AREA ##
//
// Replace mock response with:
//
// OpenAI API
// Gemini API
// Claude API
//
// Example:
//
// const response = await fetch("/api/chat");
//
// ======================================================
```

Struktur kode harus mudah diintegrasikan dengan AI API tanpa refactor besar.

---

# 9. EMERGENCY CALL PAGE

Saat ini bagian:

"Jika tidak dalam krisis akut"

belum berfungsi.

Perbaiki:

## AI Listener

Jika dipencet:

Redirect ke:

```text
/ai-listener
```

## Konsultasi Psikolog

Jika dipencet:

Redirect ke:

```text
/psychologists
```

## Emergency Hotline

Tampilkan:

* Call Button
* Confirmation Modal

Pastikan semua tombol berfungsi.

---

# 10. CONSULTATION SYSTEM

Saat ini konsultasi hanya sampai tahap booking.

Tambahkan fitur:

## Setelah Booking

User dapat masuk ke ruang konsultasi.

Route:

```text
/consultation/:id
```

## Consultation Chat Page

Tampilan seperti chat profesional.

Terdapat:

* Psychologist Profile
* Schedule Information
* Status

Chat area:

* User Message
* Psychologist Message
* Timestamp

Input:

* Message Field
* Send Button
* Attachment Button

Gunakan mock data.

## Consultation Status

* Upcoming
* Active
* Completed
* Cancelled

Jika status Active:

Button:

**Enter Consultation**

akan membuka halaman chat.

Tambahkan komentar:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// consultations table
//
// id
// user_id
// psychologist_id
// consultation_date
// consultation_time
// status
//
// ======================================================
```

Untuk chat konsultasi:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// consultation_messages table
//
// id
// consultation_id
// sender
// message
// created_at
//
// ======================================================
```

---

# 11. PSYCHOLOGIST BOOKING FLOW

Perbaiki flow:

Psychologist List
↓
Psychologist Detail
↓
Book Consultation
↓
Choose Date
↓
Choose Time
↓
Confirmation
↓
Consultation List
↓
Enter Consultation Chat

Pastikan seluruh flow berfungsi.

Tambahkan komentar:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// psychologists table
//
// id
// name
// specialization
// rating
// experience
// profile_photo
// consultation_fee
// availability
//
// ======================================================
```

---

# 12. ROUTE PROTECTION

Tambahkan Protected Route.

Halaman berikut wajib login:

* Dashboard
* AI Listener
* Mood Journal
* Forum
* Consultation
* Psychologist Booking
* Mind Hub Progress
* Emergency Call

Jika belum login:

Redirect ke:

```text
/sign-in
```

---

# 13. UX IMPROVEMENT

Tambahkan:

* Loading State
* Empty State
* Success Notification
* Error Notification
* Confirmation Modal
* Skeleton Loading
* Page Transition
* Smooth Animation

Gunakan animasi yang lembut dan profesional.

---

# 14. USER PROFILE

Perbaiki halaman Profile.

Tambahkan:

* Profile Photo
* Name
* Username
* Email
* Gender
* Birthday
* Contact Number

Actions:

* Edit Profile
* Change Password
* Logout

Tambahkan komentar:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// users table
//
// id
// username
// email
// gender
// birthday
// contact_number
//
// ======================================================
```

---

# 15. DATABASE INTEGRATION PREPARATION

Karena ke depannya aplikasi akan menggunakan database, seluruh fitur harus dibuat database-ready.

## Struktur Folder

```text
src/
├── services/
├── api/
├── database/
├── hooks/
├── components/
├── pages/
```

Gunakan service layer.

Jangan hardcode data langsung di component.

Contoh:

```js
export const getPsychologists = async () => {
  return mockPsychologists;
};
```

Tambahkan komentar berikut di seluruh area yang nantinya menggunakan database:

```js
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// Replace localStorage/mock data with database query.
// Example:
// Firebase Firestore
// Supabase
// MySQL
// PostgreSQL
// MongoDB
// ======================================================
```

---

# 16. RECOMMENDED DATABASE CHOICE

Untuk development:

* localStorage
* Mock Data

Untuk production:

Pilihan utama:

* Supabase + PostgreSQL

Alternatif:

* Firebase Authentication
* Firebase Firestore

Seluruh struktur project harus mudah diintegrasikan dengan backend tanpa perlu refactor besar.

---

# 17. FINAL REQUIREMENT

Pastikan seluruh website tidak hanya berupa tampilan UI.

Semua fitur berikut harus benar-benar berfungsi:

* Navbar Landing Page
* Contact Section
* Footer Navigation
* Login
* Register
* Protected Routes
* Daily Mood Log berbasis tanggal aktual
* Add Mood
* Mood History
* AI Listener
* Mind Hub Articles
* Recommendation Articles
* Emergency Call Actions
* Psychologist Booking
* Consultation Chat
* Profile
* Logout
* Database Ready Structure
* AI API Ready Structure

Aplikasi harus terasa seperti prototype produk yang siap dipresentasikan, diuji oleh pengguna, dan siap dikembangkan menjadi aplikasi production-ready.
