PROMPT PENAMBAHAN FITUR HEARME

Lakukan penambahan fitur berikut pada project HearMe yang sudah ada. Jangan mengubah struktur yang telah berjalan. Integrasikan fitur baru ke dalam flow yang sudah tersedia. Seluruh fitur harus dibuat Database Ready dan API Ready dengan komentar kode yang jelas pada area yang nantinya membutuhkan backend.

USER FEATURE

1. Verifikasi Psikolog Saat Registrasi

Setelah psikolog berhasil membuat akun:

Status akun:

Pending Verification

Psikolog wajib mengunggah dokumen verifikasi:

KTP

STR Psikolog

SIP (jika ada)

Sertifikat Pendukung

Tambahkan:

Upload file

Preview dokumen

Status verifikasi

Status:

Pending

Approved

Rejected

Psikolog tidak dapat menerima konsultasi sebelum status Approved.

Tambahkan komentar:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// psychologist_verifications
//
// id
// psychologist_id
// document_type
// document_url
// verification_status
// reviewed_by
// reviewed_at
//
// ======================================================


2. Tombol Back

Tambahkan tombol Back pada:

journal perasaan

Tombol harus kembali ke Home/Landing Page.

3. Upload Gambar Pada Journaling

Saat membuat jurnal:

Tambahkan:

Upload gambar

Preview gambar

Hapus gambar

Multiple image support (max 5)

Jurnal dapat berisi:

Judul

Isi jurnal

Mood

Gambar

Tambahkan komentar:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// journal_images
//
// id
// journal_id
// image_url
//
// ======================================================


4. Konsultasi Video / Call

Pada halaman konsultasi:

Tambahkan tombol:

Voice Call

Video Call

Ketika ditekan:

Masuk ke ruang konsultasi.

Status:

Waiting

Connecting

Active

Ended

Tambahkan area:

Mic On/Off

Camera On/Off

End Call

Tambahkan komentar:

// ======================================================
// ## API TEMPLATE IF CONNECTED ##
//
// WebRTC
// Agora
// Daily.co
// Twilio Video
//
// ======================================================


5. Voice AI Listener

Tambahkan icon microphone pada AI Listener.

Jika ditekan:

Masuk ke halaman:

/ai-listener/voice


Fitur:

Voice Input

Voice Response

Real-time conversation

Tampilkan:

Listening State

Recording State

Speaking State

Setelah sesi selesai:

AI membuat recap otomatis:

Judul sesi

Ringkasan

Emosi dominan

Saran

Simpan ke:

AI Session History

Contoh:

"Merasa Cemas Tentang Kuliah"

"Percakapan Mengenai Hubungan"

"Burnout dan Tugas"

User dapat membuka kembali sesi lama.

Tambahkan komentar:

// ======================================================
// ## AI API INTEGRATION AREA ##
//
// Speech To Text
// OpenAI Realtime
// Gemini Live
// ElevenLabs
//
// ======================================================


6. Anonymous Forum Mode

Tambahkan pengaturan:

Anonymous Mode

Jika aktif:

Forum akan menyembunyikan:

Nama

Username

Foto Profil

Menjadi:

Anonymous User

Default Avatar

Hanya berlaku di Forum.

7. Public / Private Forum Post

Saat membuat post:

Tambahkan pilihan:

Public

Private

Public:

Semua user dapat melihat.

Private:

Hanya pembuat post yang dapat melihat.

8. Forum Profile

Tambahkan halaman:

/forum/profile


Menampilkan:

Total Post

Total Reply

Total Like

Total Saved

Tab:

Posts

Replies

Likes

Saved

Archived

Actions:

Edit

Delete

Archive

Restore

9. Payment System

Saat booking konsultasi:

Tambahkan:

Payment Page

Metode:

Bank Transfer

E-Wallet

QRIS

Status:

Pending

Paid

Failed

Expired

Refunded

Flow:

Book Consultation
↓
Payment
↓
Success
↓
Consultation Scheduled

Tambahkan komentar:

// ======================================================
// ## PAYMENT API TEMPLATE ##
//
// Midtrans
// Xendit
// Stripe
//
// ======================================================


PSYCHOLOGIST FEATURE

10. Consultation Approval

Psikolog dapat:

Accept

Reject

Reschedule

Jika Accept:

Status menjadi:

Approved

Jika Reject:

User menerima notifikasi.

Jika Reschedule:

User menerima jadwal baru.

Tambahkan notification system.

11. Upcoming Session Dashboard

Pada Home Dashboard Psikolog:

Tambahkan section:

Upcoming Sessions

Menampilkan:

Nama User

Tanggal

Waktu

Status

Actions:

Open Consultation

Reschedule

Cancel

ADMIN FEATURE

12. Admin Authentication

Buat halaman login admin terpisah.

Route:

/admin/login


Login menggunakan:

Email Admin

Password Admin

Tidak menggunakan login user biasa.

Admin dashboard:

/admin/dashboard


13. Forum Moderation

Admin dapat:

Ban User

Unban User

Durasi:

1 Hari

3 Hari

7 Hari

30 Hari

Permanent

Jika user dibanned:

Tidak dapat:

Membuat Post

Reply

Like

Tetapi tetap bisa login.

Tambahkan alasan ban.

14. Psychologist Verification

Admin dapat:

Review Dokumen

Approve

Reject

Tampilkan:

Preview Dokumen

Tanggal Upload

Catatan Verifikasi

15. Mind Hub Management

Admin dapat:

Create Content

Edit Content

Delete Content

Publish Content

Kategori:

Mind and Balance

Self-Care Corner

Field:

Title

Description

Thumbnail

Content

Category

NOTIFICATION SYSTEM

16. Notification Center

Tambahkan notifikasi untuk:

Consultation Approved

Consultation Rejected

Consultation Rescheduled

Payment Success

Payment Failed

Psychologist Verification Approved

Psychologist Verification Rejected

Forum Ban

Forum Unban

DATABASE READY REQUIREMENT

Pada setiap fitur baru tambahkan komentar:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// Replace mock/localStorage with:
//
// Supabase
// PostgreSQL
// MySQL
// Firebase
// MongoDB
//
// ======================================================


API READY REQUIREMENT

Pada setiap fitur yang memerlukan layanan eksternal tambahkan komentar:

// ======================================================
// ## API TEMPLATE IF CONNECTED ##
//
// Authentication API
// Payment API
// AI API
// Voice API
// Video Call API
// Notification API
//
// ======================================================


FINAL REQUIREMENT

Seluruh fitur baru harus:

Responsive Desktop & Mobile

Mengikuti Design System HearMe

Menggunakan route yang jelas

Menggunakan mock data terlebih dahulu

Memiliki struktur siap integrasi database

Memiliki struktur siap integrasi API

Tidak merusak fitur yang sudah berjalan sebelumnya

Terintegrasi dengan User Dashboard, Psychologist Dashboard, dan Admin Dashboard