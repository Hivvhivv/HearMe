# HearMe - MongoDB + Backend Security Starter

Struktur ini menyiapkan database/auth dasar untuk HearMe.

Role:
- user
- psychologist
- admin
- super_admin

Alur psikolog:
- pending -> menunggu verifikasi admin
- approved -> dapat mengakses fitur psikolog/konsultasi
- rejected -> ditolak

Catatan:
1. Data content lama tetap berada di collection masing-masing.
2. Collection `users` dipakai khusus akun/authentication.
3. Email dibuat unique agar registrasi tidak membuat akun ganda.
4. Password wajib di-hash dengan bcryptjs.
5. JWT secret disimpan di `.env`, bukan di source code.
