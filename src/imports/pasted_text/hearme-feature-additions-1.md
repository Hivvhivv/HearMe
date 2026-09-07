PROMPT PENAMBAHAN FITUR HEARME
Lakukan penambahan fitur berikut pada project HearMe yang sudah ada. Jangan mengubah struktur yang telah berjalan. Integrasikan fitur baru ke dalam flow yang sudah tersedia. Seluruh fitur harus dibuat Database Ready dan API Ready dengan komentar kode yang jelas pada area yang nantinya membutuhkan backend.

USER FEATURE
1. Verifikasi Psikolog Saat Registrasi
Setelah psikolog create akun akan menampilkan Verification form:
Flow
sign up
↓
Pilih Role 
↓
Create account
↓
Verification Form

Psikolog wajib mengunggah dokumen verifikasi:
KTP
STR Psikolog
SIP (jika ada)
Sertifikat Pendukung
Tambahkan:
Upload file
Preview dokumen
Status verifikasi
Status ada pada profile psikolog:
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

Setelah selesai Verification Form, Psikolog akan di alihkan ke halaman Home Psikolog yang berisi psikolog dasboard. masukan Di dalam Navbar Khusus halaman Psikolog di tambahkan Pada Navbar yaitu Dashboard

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



9. Payment System
Saat booking konsultasi tambahkan step ke4 untuk memilih metode pembayaran:
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
tanggal
↓
waktu
↓
confirmation
↓
Payment
↓
Success
↓
Consultation Scheduled
Tambahkan komentar:


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
Buatkan fitur baru add mindhub Admin dapat:
Create Content
Edit Content
Delete Content
Publish Content
Kategori:
Mind and Balance
Self-Care Corner
Field:
photo
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

Berikut prompt yang bisa langsung kamu tambahkan ke Master Prompt HearMe agar AI memahami bahwa halaman User dan Psikolog harus benar-benar berbeda, bukan hanya beda menu.

USER ROLE VS PSYCHOLOGIST ROLE SEPARATION
Lakukan pemisahan penuh antara role User dan Psychologist.
Jangan hanya mengubah menu navigasi, tetapi buat dashboard, fitur, data, dan flow yang berbeda sesuai kebutuhan masing-masing role.
Gunakan Role Based Access Control (RBAC).
Role:
USER
PSYCHOLOGIST
ADMIN
Simpan role saat login dan gunakan untuk menentukan halaman yang dapat diakses.

USER DASHBOARD
Route:
/dashboard
Tujuan utama:
Mendapatkan dukungan kesehatan mental.
User Home Dashboard
Tampilkan:
Welcome Section
Nama User
Mood hari ini
Quick Reflection
Daily Mood Log
Mood Tracking
Add Mood
Mood History
Top Psychologists
Rekomendasi Psikolog
Rating
Specialization
Book Consultation
Journaling Feelings
Buat Jurnal
Upload Gambar
Riwayat Jurnal
Mind Hub
Artikel
Self Care
Mental Wellness
AI Listener
Chat dengan AI
Voice AI Session
Forum
Buat Post
Like
Reply
Anonymous Mode
Upcoming Consultation
Jika memiliki jadwal.
Menampilkan:
Nama Psikolog
Tanggal
Waktu
Status

USER MENU
Navbar User:
Home
Psychologists
AI Listener
Forum
Mind Hub
Consultation
Profile

USER PROFILE
User dapat:
Edit Profil
Edit Foto
Ubah Password
Melihat Mood History
Melihat Journal History
Melihat Consultation History
Logout

PSYCHOLOGIST DASHBOARD
Route:
/psychologist/dashboard
Tujuan utama:
Memberikan layanan konsultasi kepada user.
Dashboard harus berbeda total dari user.

PSYCHOLOGIST HOME DASHBOARD
Tampilkan:
Welcome Section
Nama Psikolog
Status Verifikasi
Total Pasien
Upcoming Sessions
Menampilkan:
Nama User
Tanggal
Waktu
Status
Action:
Open Session
Reschedule
Cancel
Consultation Requests
Menampilkan:
Nama User
Tanggal
Keluhan Singkat
Action:
Accept
Reject
Reschedule
Consultation Statistics
Total Konsultasi
Konsultasi Bulan Ini
Rating
Total Pasien
Earnings Summary
Jika fitur pembayaran aktif.
Menampilkan:
Pendapatan Hari Ini
Pendapatan Bulan Ini
Total Pendapatan

PSYCHOLOGIST MENU
Navbar Psikolog:
Dashboard
Consultation Requests
Upcoming Sessions
Patients
Schedule
Profile
JANGAN tampilkan:
AI Listener
Forum
Mood Journal
Mind Hub
karena fitur tersebut khusus user.

PATIENT MANAGEMENT
Route:
/psychologist/patients
Psikolog dapat melihat:
Daftar Pasien
Riwayat Konsultasi
Catatan Konsultasi
Detail:
Nama
Usia
Gender
Total Session
Last Consultation

PSYCHOLOGIST SCHEDULE MANAGEMENT
Route:
/psychologist/schedule
Psikolog dapat:
Menentukan jam praktik
Menentukan hari aktif
Menutup jadwal tertentu
Menambah slot konsultasi
Contoh:
Monday
09:00 - 17:00

Tuesday
09:00 - 17:00

Wednesday
Unavailable

CONSULTATION REQUEST FLOW
User
↓
Book Consultation
↓
Payment Success
↓
Waiting Approval
↓
Psychologist Review
↓
Accept / Reject
↓
Notification Sent
↓
Consultation Scheduled

PSYCHOLOGIST CONSULTATION ROOM
Route:
/psychologist/consultation/:id
Menampilkan:
Data User
Consultation Notes
Chat Area
Voice Call
Video Call
Psikolog dapat:
Menulis Catatan Konsultasi
Menyimpan Hasil Konsultasi
Menandai Konsultasi Selesai

PSYCHOLOGIST PROFILE
Psikolog dapat mengelola:
Personal Information
Nama
Gelar
Bio
Foto
Professional Information
STR
SIP
Sertifikasi
Public Profile
Specialization
Experience
Consultation Fee
Rating

ROLE PROTECTION
Pastikan setiap role tidak dapat mengakses dashboard role lain.
Contoh:
User tidak boleh mengakses:
/psychologist/*
Psychologist tidak boleh mengakses:
/dashboard
/mood
/forum
/ai-listener
Jika mencoba mengakses:
403 Forbidden
atau redirect ke dashboard masing-masing.

DATABASE TEMPLATE IF CONNECTED
Tambahkan komentar berikut:
// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// users
// psychologists
// consultations
// schedules
// psychologist_documents
// psychologist_notes
// payments
//
// ======================================================

FINAL REQUIREMENT
Dashboard User dan Dashboard Psychologist harus terasa seperti dua aplikasi berbeda dalam satu platform.
User fokus pada:
Mental Health Support
AI Listener
Journaling
Mood Tracking
Forum
Consultation
Psychologist fokus pada:
Patient Management
Consultation Management
Schedule Management
Consultation Notes
Earnings
Professional Profile
Jangan hanya membedakan menu, tetapi bedakan keseluruhan pengalaman penggunaan, fitur, data yang ditampilkan, dan workflow masing-masing role.

