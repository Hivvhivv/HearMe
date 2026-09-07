// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// Replace mock data with database queries.
// Supabase / Firebase / MySQL / PostgreSQL / MongoDB
// ======================================================

export const psychologists = [
  { id: "1", name: "Dr. Inof Sucipto", specialization: "Psikolog Umum", rating: 4.9, consultations: "128+", experience: "8 tahun", price: "Rp 150.000", available: true, avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&auto=format", bio: "Dr. Inof Sucipto adalah psikolog klinis berpengalaman yang berfokus pada kesehatan mental umum, manajemen stres, dan kecemasan.", schedule: ["Senin 09:00-17:00", "Rabu 09:00-17:00", "Jumat 09:00-15:00"], tags: ["Kecemasan", "Depresi", "Stres"] },
  { id: "2", name: "Dr. Dhiro Sadino", specialization: "Psikoterapis", rating: 4.9, consultations: "96+", experience: "6 tahun", price: "Rp 175.000", available: true, avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&auto=format", bio: "Spesialis terapi kognitif-perilaku (CBT) dengan keahlian dalam menangani trauma dan gangguan kecemasan.", schedule: ["Selasa 10:00-18:00", "Kamis 10:00-18:00", "Sabtu 09:00-13:00"], tags: ["Trauma", "CBT", "PTSD"] },
  { id: "3", name: "Dr. Chelsie Angelie", specialization: "Psikoterapis", rating: 4.9, consultations: "112+", experience: "7 tahun", price: "Rp 160.000", available: false, avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&auto=format", bio: "Berfokus pada terapi keluarga, hubungan interpersonal, dan pengembangan diri.", schedule: ["Senin 13:00-18:00", "Rabu 13:00-18:00", "Jumat 13:00-18:00"], tags: ["Keluarga", "Hubungan", "Self-Growth"] },
  { id: "4", name: "Dr. Michelle Aurelia", specialization: "Psikiater Anak", rating: 4.9, consultations: "85+", experience: "10 tahun", price: "Rp 200.000", available: true, avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&auto=format", bio: "Psikiater anak berpengalaman yang menangani perkembangan anak, ADHD, autism, dan kesulitan belajar.", schedule: ["Senin 08:00-16:00", "Selasa 08:00-16:00", "Kamis 08:00-16:00"], tags: ["Anak", "ADHD", "Autism"] },
  { id: "5", name: "Dr. Rizky Pratama", specialization: "Psikolog Klinis", rating: 4.8, consultations: "74+", experience: "5 tahun", price: "Rp 140.000", available: true, avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&auto=format", bio: "Psikolog klinis muda dengan pendekatan modern dan empati tinggi.", schedule: ["Selasa 09:00-17:00", "Kamis 09:00-17:00", "Sabtu 09:00-14:00"], tags: ["Depresi", "Kecemasan", "Burnout"] },
  { id: "6", name: "Dr. Sari Dewi", specialization: "Konselor", rating: 4.7, consultations: "61+", experience: "4 tahun", price: "Rp 120.000", available: true, avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=200&h=200&fit=crop&auto=format", bio: "Konselor berfokus pada pengembangan diri, karir, dan kesehatan mental remaja.", schedule: ["Rabu 10:00-17:00", "Jumat 10:00-17:00", "Sabtu 10:00-15:00"], tags: ["Remaja", "Karir", "Self-Development"] },
];

export const consultations = [
  { id: "c1", psychologistId: "1", psychologistName: "Dr. Inof Sucipto", specialization: "Psikolog Umum", date: "2025-09-20", time: "10:00", status: "upcoming" as const, avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&auto=format" },
  { id: "c2", psychologistId: "2", psychologistName: "Dr. Dhiro Sadino", specialization: "Psikoterapis", date: "2025-09-05", time: "14:00", status: "completed" as const, avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&auto=format" },
  { id: "c3", psychologistId: "3", psychologistName: "Dr. Chelsie Angelie", specialization: "Psikoterapis", date: "2025-08-28", time: "09:00", status: "cancelled" as const, avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&auto=format" },
];

export const forumPosts = [
  { id: "f1", author: "Andi R.", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format", category: "Kecemasan", title: "Cara mengatasi serangan panik di tempat kerja", excerpt: "Saya sering mengalami serangan panik tiba-tiba saat sedang rapat. Apakah ada yang pernah mengalami hal yang sama?", likes: 42, comments: 18, time: "2 jam lalu", liked: false },
  { id: "f2", author: "Maya S.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format", category: "Self Improvement", title: "Jurnal harian mengubah hidup saya dalam 30 hari", excerpt: "Saya mulai menulis jurnal setiap malam selama sebulan. Perubahan yang saya rasakan sangat luar biasa.", likes: 86, comments: 34, time: "5 jam lalu", liked: false },
  { id: "f3", author: "Budi H.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format", category: "Studi", title: "Tips fokus belajar saat otak sudah lelah", excerpt: "Sebagai mahasiswa tingkat akhir, tekanan akademis sangat berat. Berbagi tips yang membantu saya bertahan.", likes: 55, comments: 22, time: "8 jam lalu", liked: false },
  { id: "f4", author: "Dina L.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format", category: "Hubungan", title: "Bagaimana cara mendukung pasangan yang depresi?", excerpt: "Pasangan saya didiagnosis depresi ringan. Saya ingin mendukung tapi tidak tahu caranya yang benar.", likes: 71, comments: 45, time: "1 hari lalu", liked: false },
  { id: "f5", author: "Reza P.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format", category: "Pekerjaan", title: "Burnout di usia 25, apa yang harus dilakukan?", excerpt: "Saya merasa sangat lelah secara mental dengan pekerjaan. Apakah ini burnout? Bagaimana cara mengatasinya?", likes: 93, comments: 57, time: "2 hari lalu", liked: false },
];

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// articles table: id, title, content, author, thumbnail, reading_time, publish_date
// ======================================================
export const articles = [
  {
    id: "a1",
    title: "Cara Mengelola Overthinking",
    readTime: "7 menit",
    category: "Kesehatan Mental",
    image: "https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=400&h=300&fit=crop&auto=format",
    author: "Dr. Inof Sucipto",
    publishDate: "10 September 2025",
    excerpt: "Overthinking adalah kebiasaan memikirkan sesuatu secara berlebihan.",
    content: `Overthinking — atau terlalu banyak berpikir — adalah kebiasaan mental yang dapat menguras energi dan mengganggu kesejahteraan. Banyak dari kita terjebak dalam lingkaran pikiran yang terus berputar tanpa solusi yang jelas.

## Apa itu Overthinking?

Overthinking adalah ketika kamu terus memikirkan masalah, situasi, atau keputusan secara berulang-ulang tanpa mengambil tindakan atau mencapai resolusi. Ini bisa berbentuk:
- Menganalisis kejadian masa lalu berulang kali
- Mengkhawatirkan masa depan yang belum terjadi
- Mencari tanda-tanda tersembunyi dalam situasi biasa
- Membayangkan skenario terburuk

## Teknik Efektif Mengatasi Overthinking

**1. Sadari Polanya**
Langkah pertama adalah menyadari ketika kamu mulai overthinking. Perhatikan tanda fisik seperti ketegangan otot, napas pendek, atau perut tidak nyaman.

**2. Jadwalkan Waktu Khawatir**
Paradoksnya, menjadwalkan waktu khusus untuk khawatir (misalnya 20 menit sehari) dapat membantu otak belajar bahwa kekhawatiran tidak perlu muncul sepanjang waktu.

**3. Teknik 5-4-3-2-1 Grounding**
Sebutkan 5 hal yang bisa kamu lihat, 4 yang bisa disentuh, 3 yang bisa didengar, 2 yang bisa dicium, 1 yang bisa dirasakan. Ini membawa fokus ke saat ini.

**4. Tulis Pikiranmu**
Journaling adalah cara ampuh untuk mengeluarkan pikiran dari kepala ke kertas, sehingga lebih mudah diproses secara objektif.

**5. Gerak Fisik**
Olahraga ringan seperti berjalan 15 menit dapat memotong siklus overthinking dengan mengalihkan energi mental ke fisik.

## Kapan Harus Mencari Bantuan?

Jika overthinking sudah mengganggu tidur, pekerjaan, atau hubunganmu secara signifikan, pertimbangkan untuk berkonsultasi dengan psikolog. Terapi CBT (Cognitive Behavioral Therapy) terbukti sangat efektif untuk mengatasi pola pikir berlebihan.`,
  },
  {
    id: "a2",
    title: "5 Teknik Mengatasi Kecemasan",
    readTime: "10 menit",
    category: "Kecemasan",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop&auto=format",
    author: "Dr. Dhiro Sadino",
    publishDate: "8 September 2025",
    excerpt: "Lima teknik berbasis sains yang terbukti membantu mengurangi kecemasan.",
    content: `Kecemasan adalah respons alami tubuh terhadap ancaman atau stres. Namun ketika kecemasan menjadi berlebihan dan mengganggu kehidupan sehari-hari, perlu ada langkah-langkah untuk mengelolanya.

## 5 Teknik Berbasis Sains

**1. Pernapasan Diafragma (4-7-8)**
Teknik ini mengaktifkan sistem saraf parasimpatis:
- Hirup napas selama 4 detik
- Tahan selama 7 detik
- Hembuskan perlahan selama 8 detik
- Ulangi 4 kali

**2. Progressive Muscle Relaxation**
Tegangkan dan rilekskan kelompok otot secara berurutan dari kaki hingga wajah. Ini mengurangi ketegangan fisik yang sering menyertai kecemasan.

**3. Mindfulness Meditasi**
Luangkan 10 menit sehari untuk duduk diam, fokus pada napas, dan amati pikiran tanpa menghakimi. Riset menunjukkan efektivitasnya dalam mengurangi kecemasan hingga 40%.

**4. Cognitive Restructuring**
Identifikasi pikiran otomatis negatif dan tantang validitasnya. Tanyakan: "Apakah ini fakta atau asumsi?" dan "Apa buktinya?"

**5. Exposure Therapy Ringan**
Secara bertahap hadapi situasi yang memicu kecemasan dalam dosis kecil yang terkontrol, membantu otak belajar bahwa situasi tersebut sebenarnya aman.

## Tips Tambahan

Tidur cukup, batasi kafein, olahraga rutin, dan jaga koneksi sosial adalah pilar penting dalam manajemen kecemasan jangka panjang.`,
  },
  {
    id: "a3",
    title: "Mengapa Jurnal Bisa Menjernihkan Pikiran",
    readTime: "8 menit",
    category: "Journaling",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&h=300&fit=crop&auto=format",
    author: "Dr. Chelsie Angelie",
    publishDate: "5 September 2025",
    excerpt: "Menulis jurnal bukan hanya tentang mencatat hari — ini adalah alat kuat untuk kesehatan mental.",
    content: `Journaling atau menulis jurnal adalah praktik yang telah digunakan selama berabad-abad sebagai alat refleksi diri. Penelitian modern mengonfirmasi manfaatnya bagi kesehatan mental secara signifikan.

## Bagaimana Jurnal Bekerja untuk Otak

Ketika kamu menulis tentang pengalaman emosional, otak mengaktifkan area prefrontal cortex yang bertanggung jawab atas penalaran dan regulasi emosi. Ini membantu:

- **Memproses emosi**: Memberi nama pada perasaan mengurangi intensitasnya
- **Menemukan pola**: Kamu mulai melihat pemicu dan respons yang berulang
- **Menciptakan jarak**: Melihat masalah dari perspektif "penulis" bukan "pelaku"
- **Meningkatkan kesadaran diri**: Memahami nilai dan prioritas sejati

## Cara Memulai Journaling

**Metode Stream of Consciousness**
Tulis apa saja yang muncul di pikiran selama 10-15 menit tanpa berhenti. Jangan pikirkan tata bahasa atau logika.

**Gratitude Journal**
Setiap malam, tulis 3 hal yang kamu syukuri hari ini — sekecil apapun.

**Prompted Journaling**
Gunakan pertanyaan pemandu seperti:
- "Apa yang paling membuat saya khawatir hari ini?"
- "Apa yang saya pelajari tentang diri sendiri minggu ini?"
- "Apa yang ingin saya lepaskan?"

## Konsistensi adalah Kunci

Manfaat journaling terakumulasi seiring waktu. Mulai dengan 5-10 menit sehari dan tingkatkan secara bertahap. Gunakan aplikasi jurnal HearMe untuk pengalaman yang lebih terstruktur dan privat.`,
  },
  {
    id: "a4",
    title: "Tingkatkan Suasana Hati Secara Instan",
    readTime: "6 menit",
    category: "Self-Care",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop&auto=format",
    author: "Dr. Michelle Aurelia",
    publishDate: "3 September 2025",
    excerpt: "Strategi sederhana yang dapat langsung meningkatkan mood kamu.",
    content: `Suasana hati yang buruk tidak harus berlangsung lama. Ada sejumlah strategi berbasis neuropsikologi yang dapat membantu mengubah mood dengan cepat dan efektif.

## Strategi Berbasis Neurosains

**1. Gerak Fisik 10 Menit**
Berjalan, melompat, atau menari selama 10 menit melepaskan endorfin dan dopamin — neurotransmitter kebahagiaan alami tubuh.

**2. Paparan Cahaya Matahari**
Keluar selama 5-10 menit di bawah sinar matahari langsung meningkatkan serotonin dan mengatur ritme sirkadian.

**3. Kontak Sosial Positif**
Kirim pesan singkat ke teman atau anggota keluarga yang kamu sayangi. Koneksi sosial langsung mengaktifkan sistem reward otak.

**4. Musik Uplifting**
Dengarkan lagu favorit yang energik. Musik terbukti secara klinis dapat mengubah suasana hati dalam hitungan menit.

**5. Tindakan Kebaikan Kecil**
Melakukan kebaikan untuk orang lain — sekecil apapun — meningkatkan well-being dan rasa bermakna.

**6. Aroma Terapi**
Lavender, jeruk, atau peppermint memiliki efek langsung pada sistem limbik yang mengatur emosi.

## Saat Mood Buruk Berlangsung Lama

Jika suasana hati buruk berlangsung lebih dari dua minggu dan mengganggu fungsi sehari-hari, ini bisa menjadi tanda depresi yang memerlukan perhatian profesional. HearMe siap menghubungkanmu dengan psikolog terverifikasi.`,
  },
];

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// mind_hub_contents: id, category, title, content, image
// category: "Mind and Balance" | "Self-Care Corner"
// ======================================================
export const mindHubContents = [
  // Mind and Balance (15 items)
  {
    id: "mb1", category: "Mind and Balance", title: "Teknik Manajemen Stres Box Breathing", duration: "10 menit", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop&auto=format",
    excerpt: "Teknik pernapasan kotak yang digunakan militer dan atlet untuk kontrol stres instan.",
    content: `Box breathing atau pernapasan kotak adalah teknik regulasi napas yang terbukti secara klinis mengurangi kortisol dan menenangkan sistem saraf.\n\n## Cara Melakukannya\n\n1. **Hirup** selama 4 detik\n2. **Tahan** selama 4 detik\n3. **Hembuskan** selama 4 detik\n4. **Tahan** selama 4 detik\n5. Ulangi 4-6 kali\n\n## Kapan Menggunakannya\n\n- Sebelum presentasi atau meeting penting\n- Saat merasa overwhelmed\n- Sebelum tidur untuk menenangkan pikiran\n- Di tengah konflik atau situasi tegang\n\n## Mengapa Ini Bekerja\n\nPernapasan yang terkontrol mengaktifkan sistem saraf parasimpatis, menurunkan detak jantung, tekanan darah, dan kadar kortisol. Efeknya terasa dalam 2-3 menit pertama.`,
  },
  {
    id: "mb2", category: "Mind and Balance", title: "Membangun Morning Routine yang Produktif", duration: "15 menit", image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=250&fit=crop&auto=format",
    excerpt: "Desain pagi hari yang memaksimalkan energi, fokus, dan kesejahteraan mental.",
    content: `Bagaimana kamu memulai pagi hari menentukan tone untuk seluruh hari. Morning routine yang konsisten membangun fondasi kesehatan mental yang kuat.\n\n## Komponen Morning Routine Ideal\n\n**5 Menit Pertama:**\n- Hindari handphone\n- Tarik napas dalam 3x\n- Ucapkan satu afirmasi positif\n\n**10-20 Menit Berikutnya:**\n- Minum segelas air\n- Stretching ringan atau yoga\n- Paparan cahaya alami\n\n**Opsional (jika waktu ada):**\n- Meditasi 10 menit\n- Journaling singkat\n- Membaca 10 halaman\n\n## Tips Konsistensi\n\nMulai kecil. Bahkan 5 menit morning routine lebih baik dari tidak ada sama sekali. Tingkatkan durasi secara bertahap setiap minggu.`,
  },
  {
    id: "mb3", category: "Mind and Balance", title: "Mengatasi Burnout: Panduan Lengkap", duration: "20 menit", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=250&fit=crop&auto=format",
    excerpt: "Kenali tanda-tanda burnout dan strategi pemulihan yang efektif.",
    content: `Burnout adalah kondisi kelelahan emosional, fisik, dan mental yang disebabkan oleh stres berlebihan yang berkepanjangan.\n\n## Tanda-Tanda Burnout\n\n- Kelelahan kronis meski sudah istirahat\n- Sinisme dan detachment dari pekerjaan\n- Penurunan produktivitas dan kreativitas\n- Masalah fisik: sakit kepala, gangguan tidur\n- Merasa tidak berdaya atau tidak bermakna\n\n## Strategi Pemulihan\n\n**Jangka Pendek:**\n- Ambil cuti atau hari istirahat\n- Disconnected dari email dan notifikasi\n- Lakukan aktivitas yang murni menyenangkan\n\n**Jangka Menengah:**\n- Evaluasi kembali beban kerja\n- Tetapkan batasan yang jelas\n- Prioritaskan tidur 7-9 jam\n- Olahraga rutin\n\n**Jangka Panjang:**\n- Identifikasi akar penyebab burnout\n- Pertimbangkan perubahan peran atau lingkungan\n- Bangun sistem dukungan sosial\n- Konsultasi dengan profesional jika diperlukan`,
  },
  {
    id: "mb4", category: "Mind and Balance", title: "Time Management untuk Kesehatan Mental", duration: "12 menit", image: "https://images.unsplash.com/photo-1552508744-1696d4464960?w=400&h=250&fit=crop&auto=format",
    excerpt: "Kelola waktu dengan cerdas untuk mengurangi stres dan meningkatkan keseimbangan hidup.",
    content: `Manajemen waktu yang buruk adalah salah satu penyebab utama stres kronis. Dengan strategi yang tepat, kamu bisa bekerja lebih efektif sambil menjaga kesehatan mental.\n\n## Teknik Efektif\n\n**Metode Pomodoro:**\n- Kerja fokus 25 menit\n- Istirahat 5 menit\n- Setiap 4 sesi, istirahat panjang 20-30 menit\n\n**Time Blocking:**\nAlokasikan blok waktu untuk tugas berbeda. Termasuk blok untuk istirahat, olahraga, dan hubungan sosial.\n\n**Matriks Eisenhower:**\nKategorikan tugas berdasarkan urgensi dan kepentingan:\n- Penting + Urgent: Lakukan sekarang\n- Penting + Tidak Urgent: Jadwalkan\n- Tidak Penting + Urgent: Delegasikan\n- Tidak Penting + Tidak Urgent: Eliminasi\n\n## Batasan Digital\n\nTetapkan jam bebas gadget, matikan notifikasi tidak penting, dan buat zona bebas ponsel di kamar tidur.`,
  },
  {
    id: "mb5", category: "Mind and Balance", title: "Mindset Growth: Mengubah Cara Pikir", duration: "15 menit", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop&auto=format",
    excerpt: "Kembangkan growth mindset untuk menghadapi tantangan dengan lebih resilient.",
    content: `Growth mindset — konsep yang dipopulerkan Carol Dweck — adalah keyakinan bahwa kemampuan dapat dikembangkan melalui usaha, strategi, dan bimbingan.\n\n## Fixed vs Growth Mindset\n\n**Fixed Mindset:**\n- "Saya memang tidak berbakat di ini"\n- Menghindari tantangan\n- Menyerah saat menghadapi hambatan\n- Merasa terancam oleh kesuksesan orang lain\n\n**Growth Mindset:**\n- "Saya belum bisa ini, tapi saya sedang belajar"\n- Menerima tantangan sebagai kesempatan\n- Belajar dari kritik\n- Terinspirasi oleh kesuksesan orang lain\n\n## Cara Membangun Growth Mindset\n\n1. Tambahkan kata "belum" pada pernyataan negatif\n2. Rayakan proses, bukan hanya hasil\n3. Lihat kegagalan sebagai data, bukan identitas\n4. Kelilingi diri dengan orang yang mendukung pertumbuhan`,
  },
  {
    id: "mb6", category: "Mind and Balance", title: "Membangun Kebiasaan Sehat yang Bertahan", duration: "18 menit", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&auto=format",
    excerpt: "Ilmu di balik pembentukan kebiasaan dan cara membuatnya bertahan seumur hidup.",
    content: `Pembentukan kebiasaan adalah ilmu yang dapat dipelajari. Dengan memahami mekanisme otak, kamu bisa merancang kebiasaan sehat yang bertahan lama.\n\n## The Habit Loop\n\nSetiap kebiasaan terdiri dari tiga komponen:\n1. **Cue (Pemicu)**: Sinyal yang memulai kebiasaan\n2. **Routine (Rutinitas)**: Perilaku itu sendiri\n3. **Reward (Hadiah)**: Hasil yang memuaskan\n\n## Strategi Pembentukan Kebiasaan\n\n**Habit Stacking:**\nKaitkan kebiasaan baru dengan yang sudah ada. "Setelah saya sikat gigi, saya akan meditasi 5 menit."\n\n**Mulai Sangat Kecil:**\nJika ingin berolahraga, mulai dengan 2 menit. Kemudahan memulai lebih penting dari durasi.\n\n**Desain Lingkungan:**\nBuat kebiasaan baik mudah dilakukan dan kebiasaan buruk sulit. Letakkan botol air di meja, simpan ponsel di laci.\n\n**Tracking:**\nCatat streak kebiasaanmu. Jangan putus rantainya!`,
  },
  {
    id: "mb7", category: "Mind and Balance", title: "Produktivitas Tanpa Burnout", duration: "14 menit", image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop&auto=format",
    excerpt: "Capai lebih banyak dengan energi lebih sedikit melalui prinsip produktivitas berkelanjutan.",
    content: `Produktivitas sejati bukan tentang bekerja lebih keras atau lebih lama — ini tentang bekerja lebih cerdas sambil menjaga energi jangka panjang.\n\n## Prinsip Produktivitas Berkelanjutan\n\n**Energy Management > Time Management:**\nKelola energi fisik, emosional, mental, dan spiritual kamu, bukan hanya jam kerja.\n\n**Peak Hours:**\nIdentifikasi kapan kamu paling tajam (biasanya pagi untuk kebanyakan orang) dan gunakan untuk pekerjaan paling penting.\n\n**Strategic Recovery:**\nIstirahat yang direncanakan meningkatkan output total. Tidur siang 20 menit meningkatkan performa 30%.\n\n**Single-tasking:**\nMultitasking mengurangi kualitas dan kecepatan. Fokus pada satu tugas dalam satu waktu.\n\n## Tanda Kamu Perlu Slow Down\n\n- Membuat lebih banyak kesalahan dari biasanya\n- Sulit berkonsentrasi meski sudah tidur cukup\n- Merasa resah bahkan saat tidak bekerja\n- Kreativitas terasa terkuras`,
  },
  {
    id: "mb8", category: "Mind and Balance", title: "Komunikasi Asertif untuk Batasan Sehat", duration: "16 menit", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=250&fit=crop&auto=format",
    excerpt: "Belajar berkata tidak dengan elegan dan membangun batasan yang melindungi energi mentalmu.",
    content: `Batasan yang sehat adalah fondasi hubungan yang sehat dan kesehatan mental yang baik. Komunikasi asertif memungkinkan kamu mengekspresikan kebutuhan tanpa agresi atau kepasifan.\n\n## Tiga Gaya Komunikasi\n\n**Pasif:** Mengorbankan kebutuhanmu demi orang lain\n**Agresif:** Memaksakan kebutuhanmu dengan mengorbankan orang lain\n**Asertif:** Mengekspresikan kebutuhanmu sambil menghormati orang lain ✓\n\n## Formula Komunikasi Asertif\n\n"Ketika [situasi], saya merasa [perasaan], karena [kebutuhan]. Saya ingin [permintaan spesifik]."\n\nContoh: "Ketika kamu mengirim pesan pekerjaan di malam hari, saya merasa terbebani, karena saya butuh waktu pemulihan. Saya ingin kita sepakati bahwa komunikasi kerja berakhir pukul 18:00."\n\n## Cara Menolak Permintaan\n\n1. Ucapkan terima kasih atas permintaannya\n2. Jelaskan mengapa kamu tidak bisa memenuhinya\n3. Tawarkan alternatif jika memungkinkan\n4. Teguh dengan keputusanmu`,
  },
  {
    id: "mb9", category: "Mind and Balance", title: "Mengelola Emosi di Tempat Kerja", duration: "13 menit", image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&h=250&fit=crop&auto=format",
    excerpt: "Strategi regulasi emosi untuk profesional yang menghadapi tekanan tinggi.",
    content: `Kecerdasan emosional (EQ) lebih berperan dalam kesuksesan profesional daripada IQ. Mengelola emosi di tempat kerja adalah keterampilan yang dapat dipelajari.\n\n## Regulasi Emosi di Tempat Kerja\n\n**Reframing Kognitif:**\nUbah perspektif terhadap situasi stres. "Ini bukan serangan pribadi, ini adalah masalah yang perlu dipecahkan."\n\n**STOP Technique:**\n- **S**top: Hentikan apa yang sedang dilakukan\n- **T**ake a breath: Ambil napas dalam\n- **O**bserve: Perhatikan pikiran dan perasaan\n- **P**roceed: Lanjutkan dengan niat sadar\n\n**Defusion:**\nCiptakan jarak dari pikiran. Ubah "Saya gagal" menjadi "Saya sedang memiliki pikiran bahwa saya gagal."\n\n## Menghadapi Konflik\n\n1. Tunggu hingga emosi mereda sebelum merespons\n2. Fokus pada masalah, bukan pada orangnya\n3. Cari win-win solution\n4. Dokumentasikan bila perlu`,
  },
  {
    id: "mb10", category: "Mind and Balance", title: "Self-Discipline: Latihan Pengendalian Diri", duration: "17 menit", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=250&fit=crop&auto=format",
    excerpt: "Bangun self-discipline yang kuat sebagai fondasi tujuan jangka panjang.",
    content: `Self-discipline bukanlah tentang hukuman diri sendiri — ini tentang menyelaraskan tindakan sehari-hari dengan nilai dan tujuan jangka panjangmu.\n\n## Memahami Self-Discipline\n\nSelf-discipline adalah otot mental yang dapat dilatih. Semakin sering digunakan, semakin kuat. Tapi seperti otot fisik, ia juga perlu istirahat dan pemulihan.\n\n## Strategi Membangun Self-Discipline\n\n**Implementation Intentions:**\nTentukan spesifik: "Saya akan berolahraga pada Senin, Rabu, Jumat pukul 06:30 di gym dekat rumah."\n\n**Reduce Decision Fatigue:**\nSederhanakan pilihan harian (menu makan, pakaian) agar energi keputusan tersisa untuk hal penting.\n\n**Reward System:**\nBuat sistem reward yang sehat untuk pencapaian. Ini memperkuat sirkuit neural positif.\n\n**Visualisasi:**\nBayangkan dirimu menjalani rutinitas dengan sukses setiap pagi. Otak memproses visualisasi hampir sama dengan pengalaman nyata.\n\n## Self-Compassion vs Kritik Diri\n\nSelf-discipline yang sehat disertai self-compassion. Ketika gagal, perlakukan dirimu seperti kamu memperlakukan sahabat baik.`,
  },
  {
    id: "mb11", category: "Mind and Balance", title: "Keseimbangan Hidup: Work-Life Balance", duration: "11 menit", image: "https://images.unsplash.com/photo-1551038247-3d935df5b6d4?w=400&h=250&fit=crop&auto=format",
    excerpt: "Temukan keseimbangan sejati antara pekerjaan, kehidupan pribadi, dan kesehatan mental.",
    content: `Work-life balance bukan tentang membagi waktu 50-50 antara kerja dan kehidupan pribadi. Ini tentang memastikan semua area penting hidupmu mendapat perhatian yang cukup.\n\n## Area Kehidupan yang Perlu Seimbang\n\n- Pekerjaan/Karir\n- Kesehatan fisik\n- Hubungan sosial\n- Pengembangan diri\n- Waktu pribadi/rekreasi\n- Kesehatan mental & spiritual\n\n## Audit Kehidupanmu\n\nBeri skor 1-10 pada setiap area. Area dengan skor rendah membutuhkan perhatian lebih. Tanyakan:\n- Area mana yang paling kamu abaikan?\n- Apa dampaknya terhadap kesejahteraanmu?\n- Apa satu langkah kecil yang bisa kamu ambil minggu ini?\n\n## Batasan Digital untuk Keseimbangan\n\nTetapkan:\n- Jam makan tanpa gadget\n- Jam tidur dan bangun yang konsisten\n- Akhir pekan bebas email kerja (jika memungkinkan)\n- Liburan yang benar-benar terputus dari kerja`,
  },
  {
    id: "mb12", category: "Mind and Balance", title: "Resiliensi: Bangkit dari Kegagalan", duration: "14 menit", image: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&h=250&fit=crop&auto=format",
    excerpt: "Bangun ketangguhan mental untuk menghadapi tantangan dan kembali bangkit lebih kuat.",
    content: `Resiliensi adalah kemampuan untuk beradaptasi dan pulih dari kesulitan. Ini bukan sifat bawaan — ini adalah keterampilan yang bisa dibangun.\n\n## Pilar Resiliensi\n\n**Koneksi Sosial:**\nHubungan yang kuat adalah buffer terbaik terhadap stres dan trauma.\n\n**Makna dan Tujuan:**\nOrang yang tahu "mengapa" mereka hidup bisa menanggung "bagaimana" apapun (Viktor Frankl).\n\n**Self-Efficacy:**\nKepercayaan pada kemampuan diri untuk mengatasi masalah.\n\n**Fleksibilitas Kognitif:**\nKemampuan melihat situasi dari berbagai perspektif.\n\n## Membangun Resiliensi\n\n1. Bangun dan jaga hubungan yang bermakna\n2. Temukan tujuan hidup yang lebih besar dari dirimu\n3. Pelajari dari pengalaman sulit, jangan hanya bertahan\n4. Jaga kesehatan fisik sebagai fondasi kesehatan mental\n5. Praktikkan self-compassion di tengah kesulitan`,
  },
  {
    id: "mb13", category: "Mind and Balance", title: "Fokus di Era Distraksi Digital", duration: "12 menit", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop&auto=format",
    excerpt: "Kuasai perhatianmu kembali di tengah badai notifikasi dan konten tanpa henti.",
    content: `Kemampuan untuk fokus adalah salah satu aset paling berharga di abad ke-21. Di tengah ekonomi perhatian yang sengaja dirancang untuk menguras fokusmu, perlawanan aktif diperlukan.\n\n## Memahami Krisis Perhatian\n\nRata-rata orang memeriksa ponsel 96 kali sehari. Setiap interupsi membutuhkan 23 menit untuk benar-benar kembali fokus. Ini menghancurkan produktivitas dan meningkatkan stres.\n\n## Strategi Melindungi Fokus\n\n**Deep Work Blocks:**\nAlokasikan 2-4 jam sehari untuk pekerjaan mendalam tanpa interupsi.\n\n**Batching Komunikasi:**\nCek email dan pesan hanya pada jam tertentu (misalnya 09:00, 13:00, 17:00).\n\n**Detox Digital:**\nSatu hari per minggu atau beberapa jam per hari tanpa media sosial.\n\n**Lingkungan Fokus:**\n- Matikan notifikasi non-esensial\n- Gunakan website blocker saat bekerja\n- Taruh ponsel di ruangan berbeda\n\n## Melatih Otot Fokus\n\nFokus adalah kapasitas yang dapat dilatih seperti otot. Meditasi, membaca buku fisik, dan aktivitas tanpa multitasking memperkuatnya.`,
  },
  {
    id: "mb14", category: "Mind and Balance", title: "Mengelola Keuangan untuk Kesehatan Mental", duration: "16 menit", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop&auto=format",
    excerpt: "Hubungan antara keuangan dan kesehatan mental, serta cara mengelolanya dengan bijak.",
    content: `Stres keuangan adalah salah satu penyebab utama kecemasan dan depresi. Mengelola keuangan dengan bijak bukan hanya tentang uang — ini tentang kedamaian pikiran.\n\n## Hubungan Uang dan Mental Health\n\nStres finansial memicu:\n- Kecemasan kronis\n- Gangguan tidur\n- Konflik hubungan\n- Penurunan performa kerja\n- Kebiasaan coping yang tidak sehat\n\n## Dasar-Dasar Financial Wellness\n\n**Emergency Fund:**\nSimpan 3-6 bulan pengeluaran sebagai dana darurat. Ini adalah asuransi mental terbesar.\n\n**Aturan 50/30/20:**\n- 50% kebutuhan\n- 30% keinginan\n- 20% tabungan/investasi\n\n**Mindful Spending:**\nTanyakan sebelum membeli: "Apakah ini menambah nilai sejati pada hidupku atau hanya kepuasan sesaat?"\n\n## Pisahkan Harga Diri dari Nilai Finansial\n\nKekayaanmu bukan identitasmu. Nilai dan harga dirimu tidak ditentukan oleh saldo rekening. Kembangkan identitas yang lebih kaya dari pencapaian finansial.`,
  },
  {
    id: "mb15", category: "Mind and Balance", title: "Tujuan Hidup dan Rasa Bermakna", duration: "20 menit", image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=400&h=250&fit=crop&auto=format",
    excerpt: "Temukan ikigai-mu dan jalani hidup dengan tujuan yang memberi makna sejati.",
    content: `Rasa bermakna adalah kebutuhan psikologis fundamental manusia. Ketika hidup terasa tidak bermakna, kita rentan terhadap depresi, kecemasan, dan krisis identitas.\n\n## Konsep Ikigai\n\nIkigai (alasan untuk bangun pagi) terletak di persimpangan empat pertanyaan:\n- Apa yang kamu **cintai**?\n- Apa yang kamu **kuasai**?\n- Apa yang **dunia butuhkan**?\n- Apa yang bisa kamu **dapatkan penghasilan** darinya?\n\n## Menemukan Tujuan Hidupmu\n\n**Refleksi Masa Kecil:**\nApa yang kamu lakukan dengan bebas tanpa disuruh saat kecil? Seringkali benih tujuan ada di sana.\n\n**Identifikasi Nilai Inti:**\nApa 5 nilai yang paling penting bagimu? Hidupmu paling bermakna ketika selaras dengan nilai-nilai ini.\n\n**Contribution Question:**\n"Kontribusi apa yang ingin saya berikan kepada dunia sebelum saya pergi?"\n\n## Tujuan Tidak Harus Besar\n\nTujuan hidup tidak selalu harus muluk. Menjadi orang tua yang baik, menciptakan karya yang indah, atau membuat orang tertawa adalah tujuan yang sama validnya.`,
  },

  // Self-Care Corner (15 items)
  {
    id: "sc1", category: "Self-Care Corner", title: "Meditasi Cinta Kasih (Loving-Kindness)", duration: "15 menit", image: "https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=400&h=250&fit=crop&auto=format",
    excerpt: "Praktik meditasi kuno yang meningkatkan kebahagiaan, empati, dan self-compassion.",
    content: `Loving-Kindness Meditation (Metta) adalah praktik meditasi Buddha yang terbukti secara ilmiah meningkatkan emosi positif dan mengurangi self-criticism.\n\n## Panduan Meditasi\n\n**Persiapan (2 menit):**\nDuduk nyaman, tutup mata, dan ambil beberapa napas dalam.\n\n**Fase 1 - Diri Sendiri (3 menit):**\nVisualisasikan dirimu dengan penuh kebaikan. Ucapkan dalam hati:\n- "Semoga saya bahagia"\n- "Semoga saya sehat"\n- "Semoga saya bebas dari penderitaan"\n- "Semoga saya hidup dengan damai"\n\n**Fase 2 - Orang Tersayang (3 menit):**\nPikiran seseorang yang kamu cintai. Kirimkan kalimat yang sama untuknya.\n\n**Fase 3 - Orang Netral (3 menit):**\nSeseorang yang kamu kenal tapi tidak dekat.\n\n**Fase 4 - Orang Sulit (2 menit):**\nSeseorang yang pernah menyakitimu. Ini bagian paling transformatif.\n\n**Fase 5 - Semua Makhluk (2 menit):**\nPerluas kebaikan ke seluruh dunia.\n\n## Manfaat Ilmiah\n\nMeta-analisis menunjukkan loving-kindness meditation meningkatkan emosi positif, empati, dan mengurangi self-criticism secara signifikan.`,
  },
  {
    id: "sc2", category: "Self-Care Corner", title: "Ritual Mandi untuk Self-Care", duration: "30 menit", image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=400&h=250&fit=crop&auto=format",
    excerpt: "Ubah mandi rutin menjadi ritual penyembuhan yang memulihkan tubuh dan pikiran.",
    content: `Mandi bukan hanya kebersihan fisik — dengan niat yang tepat, ini bisa menjadi ritual self-care yang kuat untuk melepaskan stres dan memulihkan diri.\n\n## Ritual Mandi Self-Care\n\n**Persiapkan Suasana:**\n- Matikan notifikasi ponsel\n- Nyalakan lilin atau lampu redup\n- Pilih musik relaxing atau keheningan\n- Siapkan handuk lembut dan pakaian nyaman\n\n**Selama Mandi:**\n- Perhatikan sensasi air pada kulit\n- Lepaskan hari yang telah lewat dengan setiap tetes air\n- Ucapkan afirmasi: "Saya melepaskan apa yang tidak lagi melayani saya"\n- Manjakan diri dengan produk perawatan favoritmu\n\n**Setelah Mandi:**\n- Moisturizer dengan penuh perhatian\n- Teh hangat atau minuman nyaman\n- Jurnal atau bacaan ringan\n\n## Mandi Air Hangat dan Sains\n\nMandi air hangat meningkatkan oksitosin, menurunkan kortisol, dan membantu transisi dari mode aktif ke mode istirahat — ideal sebelum tidur.`,
  },
  {
    id: "sc3", category: "Self-Care Corner", title: "Teknik Relaksasi Progressive Muscle", duration: "20 menit", image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=250&fit=crop&auto=format",
    excerpt: "Lepaskan ketegangan dari seluruh tubuh dengan teknik relaksasi otot progresif.",
    content: `Progressive Muscle Relaxation (PMR) adalah teknik yang dikembangkan Edmund Jacobson pada 1920-an yang terbukti efektif mengurangi kecemasan dan meningkatkan kualitas tidur.\n\n## Cara Melakukan PMR\n\nLakukan dalam posisi berbaring atau duduk nyaman.\n\n**Urutan Kelompok Otot:**\n\n1. Kaki (telapak kaki, betis)\n2. Paha\n3. Perut\n4. Dada dan punggung\n5. Tangan dan lengan\n6. Bahu dan leher\n7. Wajah\n\n**Untuk Setiap Kelompok:**\n1. Tegangkan selama 5-7 detik\n2. Perhatikan sensasi ketegangan\n3. Lepaskan tiba-tiba\n4. Rasakan perbedaan relaksasi selama 20-30 detik\n5. Ambil napas dalam\n\n## Manfaat PMR\n\n- Mengurangi kecemasan klinis\n- Meningkatkan kualitas tidur\n- Menurunkan tekanan darah\n- Mengurangi nyeri kronis\n- Membantu kontrol kemarahan`,
  },
  {
    id: "sc4", category: "Self-Care Corner", title: "Tidur Berkualitas: Panduan Ilmiah", duration: "15 menit", image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop&auto=format",
    excerpt: "Optimalkan tidur untuk pemulihan fisik dan mental yang maksimal.",
    content: `Tidur adalah fondasi utama kesehatan mental. Satu malam tidur buruk sudah cukup meningkatkan reaktivitas emosional 60% dan mengganggu fungsi kognitif secara signifikan.\n\n## Ilmu di Balik Tidur\n\nSelama tidur, otak:\n- Memproses dan menyimpan memori\n- Membersihkan toksin (sistem glymphatic)\n- Mengkonsolidasi pembelajaran\n- Meregulasi emosi\n- Memproduksi hormon pertumbuhan\n\n## Sleep Hygiene yang Terbukti\n\n**Konsistensi:**\nTidur dan bangun pada jam yang sama setiap hari, termasuk akhir pekan.\n\n**Lingkungan Tidur:**\n- Suhu ideal: 18-20°C\n- Kegelapan total atau masker mata\n- Ketenangan atau white noise\n- Hanya untuk tidur (bukan bekerja/menonton)\n\n**Ritual Sebelum Tidur (1 jam):**\n- Hindari layar elektronik\n- Redupkan cahaya\n- Bacaan ringan atau meditasi\n- Catat worry list untuk "melepaskan" pikiran\n\n**Hindari:**\n- Kafein setelah jam 14:00\n- Alkohol (mengganggu kualitas tidur)\n- Olahraga intens 2 jam sebelum tidur`,
  },
  {
    id: "sc5", category: "Self-Care Corner", title: "Self-Love: Belajar Mencintai Diri Sendiri", duration: "18 menit", image: "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=400&h=250&fit=crop&auto=format",
    excerpt: "Bangun hubungan yang sehat dengan diri sendiri sebagai fondasi semua hubungan lain.",
    content: `Self-love bukan narsisme — ini adalah dasar kesehatan mental yang sehat dan hubungan yang bermakna. Kamu tidak bisa benar-benar mencintai orang lain jika tidak mencintai dirimu sendiri.\n\n## Apa itu Self-Love?\n\nSelf-love adalah:\n- Menerima dirimu apa adanya, termasuk kekurangan\n- Menghormati kebutuhan dan batasanmu\n- Memperlakukan dirimu dengan kebaikan yang sama seperti kamu perlakukan orang yang kamu cintai\n- Percaya bahwa kamu layak mendapatkan kebahagiaan\n\n## Praktik Self-Love Konkret\n\n**Self-Compassion:**\nKetika melakukan kesalahan, alih-alih mengkritik, tanyakan: "Apa yang akan saya katakan kepada sahabat yang mengalami hal ini?"\n\n**Body Appreciation:**\nFokus pada apa yang bisa dilakukan tubuhmu, bukan bagaimana tampilannya. Ucapkan terima kasih kepada bagian-bagian tubuhmu.\n\n**Journaling Self-Love:**\nSetiap minggu, tulis satu hal yang kamu hargai dari dirimu.\n\n**Celebrasi Kecil:**\nRayakan pencapaian kecil. Tidak perlu menunggu momen besar.\n\n## Batasan sebagai Bentuk Self-Love\n\nMengatakan tidak pada hal yang menguras energimu adalah salah satu bentuk self-love tertinggi.`,
  },
  {
    id: "sc6", category: "Self-Care Corner", title: "Healing dari Patah Hati", duration: "22 menit", image: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=400&h=250&fit=crop&auto=format",
    excerpt: "Panduan ilmiah dan spiritual untuk sembuh dari kehilangan dan patah hati.",
    content: `Patah hati adalah salah satu pengalaman manusia yang paling menyakitkan. Otak merespons kehilangan hubungan seperti merespons rasa sakit fisik — dan penyembuhannya membutuhkan waktu dan perhatian.\n\n## Ilmu di Balik Patah Hati\n\nKetika hubungan berakhir, otak mengalami withdrawal dari dopamin dan oksitosin — mirip dengan putus dari kecanduan. Ini menjelaskan mengapa rasa sakitnya bisa begitu intens dan nyata.\n\n## Tahap-Tahap Penyembuhan\n\n1. **Shock dan penyangkalan** — normal dan akan berlalu\n2. **Kesedihan dan kerinduan** — beri ruang untuk berduka\n3. **Kemarahan** — respons sehat yang perlu diekspresikan dengan aman\n4. **Penerimaan** — datang secara bertahap, tidak linear\n5. **Pertumbuhan** — menemukan diri yang baru\n\n## Strategi Penyembuhan\n\n**Beri Dirimu Izin untuk Sedih:**\nJangan menekan perasaan. Tangisan adalah respons fisiologis yang membantu melepaskan stres.\n\n**No Contact Period:**\nHindari kontak dengan mantan selama minimal 30 hari untuk memberi otakmu waktu reset.\n\n**Fokus pada Dirimu:**\nGunakan energi untuk pengembangan diri, hobi baru, dan hubungan yang bermakna.\n\n**Journaling:**\nTulis apa yang kamu rasakan, apa yang kamu pelajari, dan apa yang kamu inginkan ke depan.`,
  },
  {
    id: "sc7", category: "Self-Care Corner", title: "Emotional First Aid: Pertolongan Pertama Emosi", duration: "12 menit", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=250&fit=crop&auto=format",
    excerpt: "Teknik cepat untuk menghadapi krisis emosional ketika kamu butuh bantuan segera.",
    content: `Sama seperti pertolongan pertama fisik, kita butuh pertolongan pertama emosional ketika menghadapi momen yang sangat menyakitkan atau overwhelmed.\n\n## Teknik Emotional First Aid\n\n**Teknik TIPP (untuk krisis akut):**\n- **T**emperature: Wajah ke dalam air dingin 30 detik untuk menurunkan agitasi\n- **I**ntense exercise: Olahraga intens 20 menit membakar kortisol\n- **P**aced breathing: Hembuskan lebih lama dari hirupan\n- **P**aired muscle relaxation: Tegangkan dan rilekskan otot\n\n**Grounding 5-4-3-2-1:**\nSebutkan 5 hal terlihat, 4 tersentuh, 3 terdengar, 2 tercium, 1 terrasakan.\n\n**Safe Place Visualization:**\nTutup mata dan bayangkan tempat yang membuatmu merasa aman dan tenang. Masuki sepenuhnya.\n\n**Self-Soothing:**\nCiptakan lingkungan yang menenangkan semua indra: musik lembut, aroma kesukaan, tekstur lembut, minuman hangat.\n\n## Kapan Mencari Bantuan\n\nJika kamu tidak bisa menggunakan teknik ini sendiri atau mengalami pikiran untuk menyakiti diri sendiri, segera hubungi orang tepercaya atau hotline krisis 119 ext 8.`,
  },
  {
    id: "sc8", category: "Self-Care Corner", title: "Kesadaran Emosi: Mengenal Perasaanmu", duration: "16 menit", image: "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?w=400&h=250&fit=crop&auto=format",
    excerpt: "Kembangkan kecerdasan emosional dengan belajar mengenali dan memahami emosimu.",
    content: `Banyak dari kita tidak pernah diajarkan cara mengenali dan memproses emosi. Hasilnya, kita bereaksi dari emosi alih-alih merespons dengan bijak.\n\n## Mengapa Kesadaran Emosi Penting\n\nEmosi adalah data, bukan musuh. Setiap emosi membawa informasi penting tentang kebutuhan, nilai, dan batasan kita.\n\n## Roda Emosi Plutchik\n\nRobert Plutchik mengidentifikasi 8 emosi dasar:\n- Kegembiraan - Kepercayaan - Rasa Takut\n- Kejutan - Kesedihan - Jijik\n- Kemarahan - Antisipasi\n\nSetiap emosi memiliki versi yang lebih ringan dan lebih intens.\n\n## Praktik Kesadaran Emosi\n\n**Name It to Tame It:**\nMemberi nama pada emosi mengurangi intensitasnya. "Saya sedang merasa cemas" berbeda dari "Saya cemas".\n\n**Body Scan Emosional:**\nPerhatikan di mana emosi terasa dalam tubuh. Kecemasan seringkali di dada, kemarahan di rahang atau dada.\n\n**Emosi Journal:**\nCatat 3x sehari: apa yang kamu rasakan dan situasi apa yang memicunya.\n\n**Pertanyaan untuk Refleksi:**\n- Apa yang emosi ini coba sampaikan?\n- Kebutuhan apa yang belum terpenuhi?\n- Respons apa yang paling bijak?`,
  },
  {
    id: "sc9", category: "Self-Care Corner", title: "Yoga Restoratif untuk Pemulihan Mental", duration: "25 menit", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop&auto=format",
    excerpt: "Pose yoga lembut yang membantu melepaskan ketegangan dan menenangkan sistem saraf.",
    content: `Yoga restoratif berbeda dari yoga vinyasa atau power yoga. Ini adalah praktik santai yang berfokus pada relaksasi mendalam menggunakan props untuk menopang tubuh.\n\n## Pose Dasar Yoga Restoratif\n\n**Child's Pose (Balasana) - 5 menit:**\nLutut terbuka lebar, dahi ke lantai, tangan terentang ke depan. Bernapas dalam, rasakan punggung bawah melebar.\n\n**Legs Up the Wall (Viparita Karani) - 10 menit:**\nBerbaring terlentang, angkat kaki ke dinding 90°. Sangat efektif untuk mengurangi kecemasan dan memulihkan energi.\n\n**Supported Bridge (Setu Bandha) - 5 menit:**\nGunakan bantal atau blok di bawah sakrum. Membuka dada dan mengurangi depresi ringan.\n\n**Savasana (Corpse Pose) - 10 menit:**\nBerbaring sempurna datar. Ini adalah "pose tersulit" karena membutuhkan pelepasan total.\n\n## Tips untuk Pemula\n\n- Gunakan selimut dan bantal sebanyak yang dibutuhkan\n- Atur timer agar tidak perlu mengecek waktu\n- Matikan ponsel sepenuhnya\n- Tidak ada yang "benar" atau "salah" — nyaman adalah tujuannya`,
  },
  {
    id: "sc10", category: "Self-Care Corner", title: "Digital Detox: Istirahat dari Layar", duration: "10 menit", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop&auto=format",
    excerpt: "Manfaat dan cara melakukan digital detox untuk kesehatan mental dan relasi yang lebih dalam.",
    content: `Penggunaan media sosial berlebihan dikaitkan dengan kecemasan, depresi, FOMO, dan gangguan tidur. Digital detox bukan tentang menghindari teknologi — ini tentang hubungan yang lebih sehat dengannya.\n\n## Tanda Kamu Butuh Digital Detox\n\n- Sering memeriksa ponsel tanpa tujuan\n- Merasa cemas ketika tidak bisa online\n- Membandingkan hidupmu dengan orang lain di sosmed\n- Menggunakan layar sebagai coping mechanism\n- Tidur terganggu karena konten yang dikonsumsi\n\n## Cara Melakukan Digital Detox\n\n**Mulai dengan 1 Jam:**\nMatikan notifikasi dan tinggalkan ponsel satu jam per hari. Lakukan aktivitas tanpa layar.\n\n**Zona Bebas Ponsel:**\nKamar tidur, meja makan, dan toilet adalah zona bebas ponsel.\n\n**Social Media Fasting:**\nSatu hari per minggu tanpa media sosial sama sekali.\n\n**Unfollow dan Kurasi:**\nBersihkan feed dari akun yang membuatmu merasa tidak cukup.\n\n## Alternatif Pengganti Screen Time\n\n- Membaca buku fisik\n- Jalan-jalan di alam\n- Ngobrol tatap muka\n- Hobi kreatif\n- Bermain dengan hewan peliharaan`,
  },
  {
    id: "sc11", category: "Self-Care Corner", title: "Jurnal Syukur: Ubah Perspektif Hidupmu", duration: "10 menit", image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&h=250&fit=crop&auto=format",
    excerpt: "Praktik gratitude yang terbukti meningkatkan kebahagiaan dan mengurangi depresi.",
    content: `Gratitude atau syukur adalah salah satu intervensi psikologi positif yang paling terdokumentasi dengan baik. Praktik rutin bersyukur secara literal mengubah jalur neural otak.\n\n## Sains di Balik Syukur\n\nPenelitian Dr. Martin Seligman menunjukkan bahwa orang yang menulis tiga hal yang disyukuri setiap hari selama satu minggu:\n- Meningkat kebahagiaannya hingga 2 bulan setelahnya\n- Mengalami penurunan gejala depresi\n- Tidur lebih nyenyak\n\n## Cara Menulis Gratitude Journal\n\n**Spesifik, Bukan Umum:**\nAlih-alih "Saya bersyukur punya keluarga," tulis "Saya bersyukur Ibu tadi menelepon dan menanyakan kabar saya."\n\n**Fokus pada Orang:**\nBersyukur atas orang lebih berdampak dari bersyukur atas benda atau situasi.\n\n**Kejutan Kecil:**\nCatat momen tak terduga yang menyenangkan — ini melatih otak mencari hal baik.\n\n**Tantangan Transformasi:**\nCari satu hal positif dari situasi sulit yang sedang kamu hadapi.\n\n## Variasi Praktik Syukur\n\n- Surat terima kasih (yang mungkin tidak kamu kirimkan)\n- Tiga hal baik sebelum tidur\n- Berbagi rasa syukur dengan seseorang secara langsung`,
  },
  {
    id: "sc12", category: "Self-Care Corner", title: "Healing Melalui Kreativitas", duration: "20 menit", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=250&fit=crop&auto=format",
    excerpt: "Eksplorasi terapi seni dan ekspresi kreatif sebagai jalur penyembuhan emosional.",
    content: `Ekspresi kreatif telah digunakan sebagai alat penyembuhan selama ribuan tahun. Art therapy kini adalah bidang klinis yang diakui dengan bukti ilmiah yang kuat.\n\n## Mengapa Kreativitas Menyembuhkan\n\nProses kreatif:\n- Mengalihkan fokus dari rumination ke flow state\n- Memungkinkan ekspresi emosi yang sulit diucapkan\n- Memberikan rasa kontrol dan pencapaian\n- Mengaktifkan area otak berbeda dari pikiran analitis\n\n## Bentuk-Bentuk Healing Kreatif\n\n**Menulis Bebas:**\nTulis tanpa berhenti selama 15 menit — biarkan apapun keluar tanpa editing.\n\n**Melukis/Menggambar:**\nGambar perasaanmu menggunakan warna dan bentuk, tanpa harus "bagus".\n\n**Kerajinan Tangan:**\nRajut, origami, pottery, atau mosaik — aktivitas berulang dengan tangan memiliki efek meditasi.\n\n**Musik:**\nMainkan alat musik, menyanyi (meski sendiri), atau buat playlist yang merefleksikan perjalananmu.\n\n**Gerakan Ekspresif:**\nTari bebas di kamar — biarkan tubuh mengekspresikan apa yang kata-kata tidak bisa.\n\n## Mulai Tanpa Tekanan\n\nJangan khawatirkan hasilnya. Proses adalah penyembuhannya, bukan produknya.`,
  },
  {
    id: "sc13", category: "Self-Care Corner", title: "Koneksi dengan Alam untuk Kesehatan Mental", duration: "15 menit", image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=250&fit=crop&auto=format",
    excerpt: "Manfaat terapi alam (ecotherapy) dan cara mengintegrasikan alam dalam kehidupan urban.",
    content: `Ecotherapy atau terapi alam adalah bidang yang berkembang pesat dengan bukti kuat bahwa koneksi dengan alam memiliki manfaat signifikan bagi kesehatan mental.\n\n## Bukti Ilmiah Terapi Alam\n\n- Penelitian Jepang menunjukkan "shinrin-yoku" (mandi hutan) menurunkan kortisol dan tekanan darah\n- Paparan alam 20 menit sudah cukup mengurangi kecemasan secara signifikan\n- Tanah mengandung Mycobacterium vaccae yang meningkatkan serotonin\n\n## Cara Terhubung dengan Alam\n\n**Jalan di Taman:**\nWalking barefoot di rumput atau tanah (earthing) memiliki efek anti-inflamasi.\n\n**Berkebun:**\nMerawat tanaman memberikan rasa tanggung jawab, ritme, dan koneksi dengan siklus hidup.\n\n**Meditasi Outdoor:**\nDuduk di taman atau bawah pohon selama 10 menit dengan penuh kesadaran.\n\n**Nature Journaling:**\nAmati dan catat detail alam di sekitarmu — ini melatih presentia dan rasa syukur.\n\n## Alam di Rumah\n\nJika akses ke alam terbatas:\n- Tanam tanaman dalam ruangan\n- Buka jendela untuk udara segar\n- Gunakan nature sounds untuk kerja atau tidur\n- Tonton video alam yang menenangkan`,
  },
  {
    id: "sc14", category: "Self-Care Corner", title: "Perawatan Diri Melalui Nutrisi", duration: "14 menit", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop&auto=format",
    excerpt: "Hubungan antara makanan yang kamu konsumsi dan kesehatan mentalmu.",
    content: `Bidang psikiatri nutrisi semakin mengonfirmasi apa yang nenek moyang kita sudah tahu: makanan yang kita makan langsung memengaruhi kesehatan mental kita.\n\n## Gut-Brain Connection\n\nUsus adalah "otak kedua" — mengandung lebih dari 100 juta sel saraf dan memproduksi 95% serotonin tubuh. Kesehatan usus = kesehatan mental.\n\n## Makanan untuk Kesehatan Mental\n\n**Omega-3:**\nIkan salmon, sarden, kacang kenari — penting untuk fungsi otak dan mengurangi depresi.\n\n**Fermentasi:**\nYogurt, kefir, kimchi — probiotik memperkuat kesehatan usus dan koneksi gut-brain.\n\n**Antioksidan:**\nBuah beri, sayuran berwarna cerah — melindungi otak dari stres oksidatif.\n\n**Triptofan:**\nTelur, kalkun, pisang — prekursor serotonin dan melatonin.\n\n**Magnesium:**\nAlmond, bayam, biji labu — dikenal sebagai "mineral relaksasi".\n\n## Yang Perlu Dikurangi\n\n- Gula berlebih (menyebabkan fluktuasi mood)\n- Makanan ultra-proses\n- Kafein berlebihan\n- Alkohol (depressant meski terasa menghibur)\n\n## Mindful Eating\n\nMakan dengan penuh perhatian — tanpa layar, nikmati setiap suap. Ini mengurangi makan berlebih dan meningkatkan kepuasan.`,
  },
  {
    id: "sc15", category: "Self-Care Corner", title: "Membangun Ritual Malam untuk Tidur Lebih Baik", duration: "18 menit", image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop&auto=format",
    excerpt: "Rancang ritual malam yang memberi sinyal pada otak bahwa waktunya istirahat dan pemulihan.",
    content: `Evening ritual adalah fondasi tidur berkualitas dan hari esok yang lebih baik. Penelitian menunjukkan rutinitas sebelum tidur yang konsisten mempercepat onset tidur dan meningkatkan kualitasnya.\n\n## Mengapa Ritual Malam Penting\n\nOtak membutuhkan sinyal bahwa hari telah berakhir. Tanpa transisi yang jelas, pikiran terus aktif dalam mode kerja, membuat tidur lebih sulit.\n\n## Ritual Malam yang Direkomendasikan\n\n**90 Menit Sebelum Tidur:**\n- Matikan atau dimmerkan layar\n- Tulis "worry dump" — keluarkan semua pikiran ke kertas\n- Siapkan pakaian dan tas untuk esok (kurangi keputusan pagi)\n\n**60 Menit Sebelum Tidur:**\n- Mandi air hangat\n- Baca buku fisik (bukan layar)\n- Minum teh chamomile atau susu hangat\n\n**30 Menit Sebelum Tidur:**\n- Jurnal singkat: 3 hal yang bersyukur, 1 hal yang dipelajari\n- Stretching ringan atau yoga restoratif\n- Meditasi atau breathing exercise\n\n**Saat di Tempat Tidur:**\n- Hindari scrolling ponsel\n- Body scan dari kaki ke kepala\n- Bayangkan tempat yang tenang\n\n## Konsistensi Adalah Kunci\n\nRitual yang sama setiap malam melatih otak untuk mengasosiasikan urutan aktivitas ini dengan tidur — seperti pavlovian conditioning.`,
  },
];

// ======================================================
// ## DATABASE TEMPLATE IF CONNECTED ##
// AI responses with keyword matching
// ======================================================
export const aiKeywordResponses: Record<string, string[]> = {
  sedih: [
    "Saya ikut merasakan kesedihanmu. Tidak apa-apa untuk merasa sedih — itu adalah bagian dari menjadi manusia. Mau ceritakan lebih tentang apa yang membuatmu sedih? 💜",
    "Kesedihan yang kamu rasakan itu valid. Saya di sini bersamamu. Apa yang sedang terjadi?",
  ],
  marah: [
    "Kemarahan itu sinyal bahwa ada sesuatu yang penting bagimu yang terancam atau tidak dihormati. Apa yang membuat kamu marah?",
    "Wajar untuk marah. Bagaimana kamu biasanya mengekspresikan kemarahan? Saya ingin membantu kamu memprosesnya.",
  ],
  cemas: [
    "Kecemasan bisa terasa sangat berat. Apakah kamu bisa ceritakan apa yang membuatmu cemas? Kita bisa coba menghadapinya bersama.",
    "Saya mendengarmu. Kecemasan itu melelahkan. Coba tarik napas dalam bersamaku — hirup 4 detik, tahan 4, hembuskan 4. Lebih baik?",
  ],
  takut: [
    "Rasa takut itu natural dan melindungi kita. Apa yang sedang kamu takuti? Mungkin kita bisa lihat bersama apakah ada langkah kecil yang bisa diambil.",
    "Tidak apa-apa untuk merasa takut. Keberanian bukan berarti tanpa rasa takut — tapi melangkah meski takut. Ceritakan lebih?",
  ],
  bingung: [
    "Perasaan bingung itu bisa sangat melelahkan. Coba kita urai perlahan — apa aspek yang paling membingungkan kamu sekarang?",
    "Bingung adalah tanda bahwa kamu sedang memproses sesuatu yang kompleks. Itu bukan kelemahan. Mau kita bicarakan satu per satu?",
  ],
  kesepian: [
    "Kesepian adalah salah satu perasaan paling menyakitkan. Saya di sini bersamamu sekarang. Ceritakan — apa yang membuatmu merasa kesepian?",
    "Kamu tidak sendirian meski mungkin rasanya seperti itu. Saya ingin mendengar lebih tentang apa yang kamu rasakan.",
  ],
  stress: [
    "Stres yang terus-menerus bisa sangat menguras. Apa sumber stres terbesar yang kamu rasakan sekarang?",
    "Terima kasih sudah berbagi. Stres itu nyata dan berat. Sudah berapa lama kamu merasakannya? Dan ada yang bisa kamu kontrol dari situasi ini?",
  ],
  bahagia: [
    "Wah, senang sekali mendengar kamu bahagia! Ceritakan — apa yang membuat kamu bahagia hari ini? 😊",
    "Kebahagiaan itu berharga — nikmati dan syukuri sepenuhnya! Apa yang terjadi?",
  ],
  overthinking: [
    "Overthinking bisa terasa seperti pikiran yang tidak bisa berhenti. Coba perhatikan — apakah pikiran yang muncul itu fakta atau asumsi?",
    "Ketika overthinking menyerang, coba teknik grounding: sebutkan 5 hal yang kamu lihat sekarang. Apa saja?",
  ],
  burnout: [
    "Burnout itu serius dan butuh perhatian sungguh-sungguh. Sudah berapa lama kamu merasa seperti ini? Apakah kamu bisa mengambil jeda kecil hari ini?",
    "Kelelahan yang dalam seperti ini memberi tahu sesuatu yang penting. Bagian mana dari hidupmu yang paling menguras energimu sekarang?",
  ],
  "patah hati": [
    "Patah hati itu nyata sakitnya — otak benar-benar merespons seperti rasa sakit fisik. Saya di sini. Mau ceritakan?",
    "Kehilangan seseorang yang berarti itu berat. Tidak ada timeline yang 'benar' untuk sembuh. Bagaimana perasaanmu sekarang?",
  ],
  "percaya diri": [
    "Banyak orang berjuang dengan kepercayaan diri — kamu tidak sendirian. Dalam situasi apa kamu merasa paling kurang percaya diri?",
    "Kepercayaan diri bisa dibangun, selangkah demi selangkah. Apa satu hal kecil yang bisa membuktikan kemampuanmu hari ini?",
  ],
};

export const defaultAiResponses = [
  "Terima kasih sudah berbagi itu denganku. Mau ceritakan lebih lanjut apa yang sedang kamu rasakan?",
  "Aku di sini untuk mendengarkan. Perasaanmu sangat valid dan kamu tidak sendirian.",
  "Kedengarannya berat sekali. Sudah berapa lama kamu merasakan ini?",
  "Aku menghargai kepercayaanmu untuk bercerita. Apakah ada hal spesifik yang memicunya?",
  "Kamu sudah sangat berani dengan mau membicarakannya. Apa yang paling mengganggu pikiranmu sekarang?",
  "Itu terdengar sangat melelahkan. Bagaimana tidur dan makanmu belakangan ini?",
  "Aku ingin kamu tahu bahwa semua perasaanmu itu sah. Tidak ada yang salah dengan kamu.",
  "Kadang-kadang menceritakan perasaan bisa sedikit meringankan beban. Apakah ada yang bisa aku bantu lebih lanjut?",
];
