PROMPT REVISI HEARME — REPORT, VERIFIKASI PSIKOLOG, MIND HUB, DAN KONSULTASI

Lakukan revisi pada project HearMe yang sudah ada. Jangan membuat ulang project dari awal dan jangan menghilangkan fitur yang sudah berjalan.

Fokus pada implementasi functional flow, bukan hanya tampilan UI.

Setiap fitur yang membutuhkan penyimpanan data, file, autentikasi, notifikasi, atau integrasi eksternal harus diberikan mock implementation terlebih dahulu jika backend belum tersedia, serta tambahkan komentar ## DATABASE TEMPLATE IF CONNECTED ## atau ## API TEMPLATE IF CONNECTED ## pada bagian kode yang nantinya perlu dihubungkan ke backend/API.

1. ROLE USER — REPORT FORUM

Tambahkan tombol Report pada setiap postingan forum.

Report Button

Setiap forum post harus memiliki action:

Like
Reply
Report

Ketika user menekan Report, tampilkan modal:

Report Forum

Pilihan alasan:

Harassment / Bullying
Hate Speech
Sexual Content
Spam
Misinformation
Self-harm / Dangerous Content
Other

Tambahkan:

Additional Information
[ textarea ]

Button:

Cancel
Submit Report

User harus memilih alasan sebelum dapat melakukan submit.

Setelah berhasil:

Report berhasil dikirim.
Terima kasih telah membantu menjaga komunitas HearMe.

Jangan langsung menghapus forum dari sisi user.

2. DATABASE REPORT FORUM

Siapkan struktur agar report dapat diterima oleh Admin.

Tambahkan komentar:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// forum_reports
//
// id
// post_id
// reporter_user_id
// reason
// description
// status
// created_at
// reviewed_at
// reviewed_by
//
// status:
// - pending
// - reviewed
// - dismissed
//
// ======================================================

Jika belum menggunakan database:

Gunakan mock data/localStorage.
Tetapi struktur datanya harus menyerupai struktur database di atas.
3. ROLE ADMIN — FORUM MODERATION

Tambahkan menu Admin:

Forum Moderation

Route:

/admin/forum-moderation

Admin dapat melihat semua forum yang dilaporkan.

Tampilkan:

Judul forum
Isi forum
Gambar forum jika ada
Nama pembuat
Tanggal dibuat
Jumlah report
Alasan report
Status report

Admin dapat membuka:

View Detail
4. ADMIN REVIEW REPORT

Pada detail report Admin dapat melakukan:

Dismiss Report

Jika tidak ditemukan violation:

Dismiss Report

Status:

Dismissed

Forum tetap tersedia.

Delete Forum

Jika terbukti melakukan violation:

Delete Forum

Tampilkan confirmation modal sebelum menghapus.

Ban User

Jika violation dilakukan oleh user:

Ban User

Admin dapat memilih:

1 Day
3 Days
7 Days
30 Days
Permanent

Admin juga harus memasukkan:

Reason for Ban

User yang dibanned tidak dapat:

Membuat forum
Reply
Like
Report

Tetapi tetap dapat login dan mengakses fitur lain yang tidak terkena pembatasan.

5. ADMIN — PSYCHOLOGIST VERIFICATION FILE

Saat ini Admin pada detail verifikasi psikolog belum dapat melihat dan mendownload file dokumen yang dikirimkan psikolog.

Perbaiki.

Pada:

/admin/psychologist-verification

Admin harus dapat melihat detail pengajuan.

Tampilkan:

Psychologist Information

Name
Email
Contact
Specialization
Experience

Kemudian:

Verification Documents

Contoh:

KTP
[ Preview ] [ Download ]

STR
[ Preview ] [ Download ]

SIP
[ Preview ] [ Download ]

Supporting Certificate
[ Preview ] [ Download ]
6. FILE PREVIEW

Admin harus dapat menekan:

Preview

dan melihat dokumen tanpa meninggalkan halaman.

Jika file berupa:

JPG
JPEG
PNG
WEBP
PDF

maka tampilkan preview yang sesuai.

Jika PDF:

Tampilkan PDF viewer/browser preview.
Berikan tombol Download.

Jika gambar:

Tampilkan image preview.
Berikan tombol Download.
7. FILE UPLOAD PSYCHOLOGIST

File yang dikirim psikolog ketika registrasi harus disimpan sebagai file reference, bukan hanya nama file.

Minimal data:

file_name
file_type
file_size
file_url / file_path
document_type
uploaded_at

Tambahkan:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// psychologist_documents
//
// id
// psychologist_id
// document_type
// file_name
// file_url
// file_type
// file_size
// uploaded_at
//
// ======================================================

Untuk storage, siapkan struktur yang nantinya dapat dihubungkan dengan:

Supabase Storage
Firebase Storage
AWS S3
Cloud Storage

Tambahkan komentar:

// ======================================================
// ## API / STORAGE TEMPLATE IF CONNECTED ##
//
// Upload document to storage.
// Save returned file URL/path to database.
//
// ======================================================
8. PSYCHOLOGIST VERIFICATION STATUS

Pisahkan antara:

Psychologist Registration

Data awal psikolog.

dan:

Verified Psychologist

Psikolog yang sudah disetujui Admin dan memiliki akses untuk menerima konsultasi.

Jangan menggunakan satu status sederhana untuk semua kebutuhan.

Gunakan status:

Pending Verification
Approved
Rejected
Resubmission
9. DATABASE PSYCHOLOGIST DAN VERIFIED PSYCHOLOGIST

Karena fitur yang dimiliki berbeda, gunakan struktur data yang terpisah.

Contoh:

psychologists

untuk data psikolog yang melakukan registrasi.

Sedangkan:

verified_psychologists

untuk psikolog yang sudah diterima/approved Admin dan dapat menerima konsultasi.

Tambahkan:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// psychologists
//
// id
// user_id
// name
// email
// specialization
// verification_status
// created_at
//
//
//
// verified_psychologists
//
// id
// psychologist_id
// verified_by
// verified_at
// status
//
// status:
// - active
// - inactive
//
// ======================================================

Ketika Admin melakukan:

APPROVE

maka data psikolog masuk/terdaftar pada:

verified_psychologists

dan dapat ditampilkan kepada User.

10. PSYCHOLOGIST ACCESS BEFORE APPROVAL

Setelah psikolog selesai mengisi data dan mengupload dokumen, psikolog langsung diarahkan ke dashboard psikolog.

Route:

/psychologist/dashboard

Namun karena belum diverifikasi Admin, aksesnya masih terbatas.

Dashboard harus menampilkan:

Verification Status

Your account is currently under review.
Please wait for admin verification.
Menu yang TIDAK dapat diakses sebelum Approved

Psikolog yang masih:

Pending Verification
Rejected
Resubmission

tidak dapat menggunakan:

Consultation
Upcoming Sessions
Patients

dan fitur yang berhubungan dengan menerima pasien.

Jangan hanya menyembunyikan menu.

Tambahkan route protection.

Jika psikolog mencoba membuka:

/psychologist/consultations
/psychologist/upcoming
/psychologist/patients

maka redirect kembali ke:

/psychologist/dashboard

dengan pesan:

Akun Anda belum diverifikasi oleh admin.
Fitur konsultasi akan tersedia setelah verifikasi berhasil.
11. PSYCHOLOGIST NAVBAR BEFORE APPROVAL

Navbar tetap dapat ditampilkan, tetapi menu yang belum tersedia harus terlihat disabled.

Contoh:

Dashboard       ✓
Consultation    🔒
Upcoming        🔒
Patients        🔒
Schedule        🔒
Profile         ✓
Verification    ✓

Setelah status:

Approved

maka:

Consultation
Upcoming
Patients
Schedule

menjadi aktif.

12. ADMIN REJECT VERIFICATION

Jika Admin menolak verifikasi, jangan tetap menampilkan:

Pending Verification

Status harus berubah menjadi:

Verification Failed

Admin wajib memasukkan:

Rejection Reason
Reason
[ textarea ]

Contoh:

Dokumen STR tidak dapat terbaca dengan jelas.
Silakan upload ulang dokumen yang lebih jelas.
13. NOTIFICATION REJECTION

Setelah Admin melakukan Reject:

Psikolog menerima notification:

Verification Failed

Your psychologist verification was not approved.

Reason:
Dokumen STR tidak dapat terbaca dengan jelas.

Tambahkan:

View Details
14. PSYCHOLOGIST RE-VERIFICATION

Jika status:

Verification Failed

tambahkan tombol:

Submit Verification Again

Psikolog dapat melakukan upload dokumen baru.

Flow:

Verification Failed
↓
Submit Verification Again
↓
Upload Documents
↓
Submit
↓
Resubmission
↓
Admin Review
↓
Approved / Rejected

Status Resubmission harus berbeda dari Pending Verification pertama.

Gunakan:

initial_submission
resubmission

atau struktur submission/version agar Admin dapat melihat riwayat pengajuan sebelumnya.

Tambahkan:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// psychologist_verification_submissions
//
// id
// psychologist_id
// submission_number
// submission_type
// status
// rejection_reason
// admin_note
// submitted_at
// reviewed_at
// reviewed_by
//
// submission_type:
// - initial
// - resubmission
//
// status:
// - pending
// - approved
// - rejected
//
// ======================================================
15. ADMIN VERIFICATION HISTORY

Admin dapat melihat riwayat pengajuan psikolog.

Contoh:

Verification #1
Status: Rejected
Date: 01 Sept 2026
Reason: STR tidak jelas

Verification #2
Status: Pending
Date: 02 Sept 2026

Admin harus dapat membuka dokumen berdasarkan submission.

Jangan sampai dokumen pengajuan lama tertimpa oleh pengajuan baru.

16. ADMIN MIND HUB — UPLOAD IMAGE

Pada Admin Mind Hub, saat membuat artikel jangan menggunakan:

Thumbnail URL

sebagai metode utama.

Ganti dengan:

Upload Image

Admin dapat:

Browse file
Upload gambar
Preview gambar
Remove image
Replace image

Format:

JPG
JPEG
PNG
WEBP

Tambahkan validasi ukuran file.

17. DATABASE MIND HUB IMAGE

Tambahkan:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// mind_hub_articles
//
// id
// title
// category
// description
// content
// image_url
// status
// created_by
// created_at
// updated_at
//
// ======================================================

Storage:

// ======================================================
// ## STORAGE / API TEMPLATE IF CONNECTED ##
//
// Upload Mind Hub image to:
// Supabase Storage / Firebase Storage / S3
//
// Save returned URL/path into:
// mind_hub_articles.image_url
//
// ======================================================
18. PSYCHOLOGIST CONSULTATION PAGE

Setelah psikolog berstatus:

Approved

maka psikolog dapat mengakses:

/psychologist/consultations

Tampilkan:

Upcoming Patients
Patient Name
Date
Time
Status

Action:

Chat
19. PSYCHOLOGIST CHAT WITH USER

Ketika psikolog menekan:

Chat

arahkan ke:

/psychologist/consultation/:id

Halaman harus menggunakan consultation ID yang sama dengan User.

Artinya:

USER
/consultation/:id

PSYCHOLOGIST
/psychologist/consultation/:id

keduanya membuka sesi konsultasi yang sama.

Jangan membuat dua chat yang berbeda.

20. SHARED CONSULTATION CHAT

Chat harus menggunakan:

consultation_id

sebagai identifier.

Contoh:

Consultation #CONS-001

User
    ↕
Shared Chat
    ↕
Psychologist

Jika User mengirim pesan:

User → Psychologist

maka pesan tersebut juga muncul pada halaman psikolog.

Jika Psikolog membalas:

Psychologist → User

maka muncul pada halaman User.

Tambahkan:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// consultation_messages
//
// id
// consultation_id
// sender_id
// sender_role
// message
// attachment_url
// created_at
//
// sender_role:
// - user
// - psychologist
//
// ======================================================
21. PSYCHOLOGIST PATIENT HISTORY

Pada:

/psychologist/patients

halaman ini digunakan sebagai history pasien, bukan daftar konsultasi aktif.

Tampilkan pasien yang:

Completed
Cancelled

atau sudah memiliki riwayat konsultasi.

Jangan tampilkan konsultasi:

Pending
On Going

di halaman Patients.

Konsultasi:

Pending
On Going
Upcoming

tetap ditampilkan pada:

/psychologist/consultations

atau:

/psychologist/upcoming
22. PATIENT HISTORY

Pada Patient History tampilkan:

Patient Name
Total Consultation
Last Consultation
Status

Jika diklik:

View History

tampilkan:

Tanggal konsultasi
Status
Durasi
Catatan konsultasi jika tersedia
23. DATABASE COMMENT STANDARD

Setiap kali membuat fitur yang membutuhkan database, WAJIB memberikan komentar langsung pada file terkait.

Gunakan format:

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
//
// TODO:
// Replace mock/localStorage implementation with database.
//
// TABLE:
// [table_name]
//
// FIELDS:
// [field list]
//
// ======================================================

Jangan hanya membuat satu komentar database di satu file.

Komentar harus berada di bagian kode yang memang nantinya akan diganti dengan database.

24. API COMMENT STANDARD

Jika fitur membutuhkan API eksternal, gunakan:

// ======================================================
// ## API TEMPLATE IF CONNECTED ##
//
// TODO:
// Replace mock implementation with API request.
//
// SERVICE:
// [service name]
//
// ENDPOINT EXAMPLE:
// [endpoint]
//
// ======================================================

Gunakan untuk:

File Storage
Notification
Payment
Video Call
Voice Call
AI
Authentication
Database API
25. FINAL FUNCTIONAL FLOW

Pastikan flow berikut benar-benar berjalan:

USER
Forum
↓
Report
↓
Report Submitted
↓
Admin Moderation

User juga dapat:

Forum
↓
Reply
↓
Nested Reply
↓
Upload Image
PSYCHOLOGIST
Register
↓
Complete Data
↓
Upload Documents
↓
Submit Verification
↓
Psychologist Dashboard
↓
Pending Verification

Kemudian:

Admin Approve
↓
Verified Psychologist
↓
Consultation Menu Active
↓
User dapat melihat psikolog
↓
User melakukan booking
↓
Consultation
↓
Shared Chat

Jika ditolak:

Admin Reject
↓
Verification Failed
↓
Reason + Admin Note
↓
Psychologist Notification
↓
Submit Verification Again
↓
Resubmission
↓
Admin Review Again
↓
Approved / Rejected
ADMIN

Admin dapat:

Psychologist Verification
├── View Documents
├── Preview Documents
├── Download Documents
├── Approve
└── Reject + Reason

Forum Moderation
├── View Reports
├── View Report Detail
├── Dismiss
├── Delete Forum
└── Ban User

Mind Hub
├── Create Article
├── Upload Image
├── Edit
├── Delete
└── Publish

PENTING: Jangan menganggap fitur selesai hanya karena tombol atau halaman sudah muncul. Setiap tombol harus memiliki event handler, route, state update, mock data/storage, dan feedback kepada user. Jika fungsi penuh membutuhkan database/API yang belum tersedia, implementasikan mock flow yang tetap bisa diuji dari awal sampai akhir dan tandai titik integrasinya dengan komentar database/API.