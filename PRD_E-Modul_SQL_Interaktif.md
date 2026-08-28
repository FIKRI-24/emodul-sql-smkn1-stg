# PRD — E-Modul Interaktif Berbasis Website
## Materi: Mengenal Perintah SQL — Mata Pelajaran Basis Data Kelas XI RPL
### SMK Negeri 1 Sintuk Toboh Gadang

**Client / Peneliti:** Okfiqha Risdawati (NIM 2201100058) — Pendidikan Informatika, UPGRISBA
**Disusun oleh:** Fikri Arrahman (Developer)
**Sumber acuan:** Proposal Penelitian (revisi seminar proposal)
**Model pengembangan akademik:** ADDIE (Analyze, Design, Development, Implementation, Evaluation)

> **Catatan asumsi teknis:** Proposal menyebutkan stack **HTML, CSS, JavaScript, dan Firebase**, dikembangkan dengan Visual Studio Code. PRD ini mengikuti stack tersebut agar sinkron dengan BAB III proposal dan tidak memaksa client merevisi dokumen akademiknya. Editor SQL diasumsikan **simulasi di sisi client (in-browser, tanpa server database sungguhan)** menggunakan SQLite via WebAssembly (`sql.js`), karena ini paling cocok untuk aplikasi statis berbasis Firebase Hosting dan tidak butuh backend server terpisah. Jika ternyata Anda ingin memakai stack lain, bagian "Tech Stack" di bawah bisa diganti tanpa mengubah struktur fitur.

---

## 1. Latar Belakang & Masalah (dari Proposal)

- Bahan ajar mapel Basis Data di sekolah masih berupa **modul cetak** (hanya dipegang guru) dan **PowerPoint** satu arah.
- Siswa kesulitan belajar mandiri di luar jam pelajaran, khususnya materi SQL: **DDL, DML, DCL**.
- Materi menuntut siswa tidak hanya paham konsep, tapi juga **mempraktikkan langsung perintah SQL** — bahan ajar yang ada tidak memfasilitasi ini.
- Sekolah sudah punya lab komputer + internet, tapi belum ada bahan ajar digital yang memanfaatkannya.

**Solusi:** E-modul interaktif berbasis website yang bisa diakses mandiri, memuat teks, gambar, video, latihan, simulasi editor SQL, dan kuis evaluasi.

---

## 2. Tujuan Produk

1. Menyediakan bahan ajar digital yang bisa diakses siswa kapan saja tanpa bergantung pada guru.
2. Memberi ruang praktik langsung (hands-on) menulis dan menguji perintah SQL.
3. Menyediakan struktur pembelajaran lengkap: kompetensi → materi → latihan → simulasi → evaluasi.
4. Menjadi objek uji **validitas** (ahli media & ahli materi) dan **praktikalitas** (guru & siswa) sesuai instrumen penelitian di BAB III.

---

## 3. Target Pengguna & Role

| Role | Kebutuhan Akses |
|---|---|
| **Siswa (XI RPL)** | Login, akses materi, video, latihan, editor SQL, kuis evaluasi, lihat progres sendiri |
| **Guru Mapel Basis Data** | Login, akses semua materi, mengisi angket praktikalitas guru (di luar sistem/manual) |
| **Peneliti/Admin (Okfiqha)** | Kelola akun siswa (opsional), lihat rekap hasil kuis siswa untuk data penelitian |

> Karena ini riset pengembangan (bukan LMS produksi penuh), scope autentikasi bisa disederhanakan: akun siswa disiapkan lebih dulu (bukan self-register), fokus riset ada di validitas & praktikalitas produk, bukan manajemen sekolah skala besar.

---

## 4. Tech Stack (Sesuai Proposal)

| Layer | Teknologi |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Styling | CSS custom (boleh + framework ringan seperti Bootstrap agar development lebih cepat, tetap "berbasis HTML/CSS/JS") |
| Autentikasi | Firebase Authentication (Email/Password) |
| Database | Firebase Firestore (materi, data siswa, hasil kuis, progres belajar) |
| Hosting | Firebase Hosting |
| Editor SQL (simulasi) | `sql.js` (SQLite compiled to WebAssembly) — jalan 100% di browser, tanpa backend |
| Video | Embed YouTube (unlisted) atau Firebase Storage untuk file video |
| Editor kode saat development | Visual Studio Code |

**Kenapa `sql.js` untuk Editor SQL?** Karena stack Firebase tidak punya backend server sendiri (serverless/hosting statis), simulasi query di browser adalah pendekatan paling ringan dan cocok untuk skala latihan siswa SMK — mereka `CREATE TABLE`, `INSERT`, `SELECT`, dll di database SQLite virtual yang di-reset setiap sesi/soal, tanpa risiko keamanan server.

---

## 5. Peta Fitur / Halaman (Sesuai "Spesifikasi Produk" Proposal)

| # | Halaman | Fungsi |
|---|---|---|
| 1 | Splash Screen | Tampilan pembuka sebelum masuk sistem |
| 2 | Login | Autentikasi siswa/guru via Firebase Auth |
| 3 | Beranda (Menu Utama) | Navigasi ke semua fitur |
| 4 | Panduan Penggunaan | Cara pakai e-modul |
| 5 | CP/ATP | Capaian & tujuan pembelajaran |
| 6 | Kegiatan Belajar (3 tahap) | Wadah 3 kegiatan belajar berurutan |
| 7 | Materi Pembelajaran | Teks + gambar + contoh perintah SQL |
| 8 | Video Pembelajaran | Video pendukung materi |
| 9 | Latihan | Soal latihan per kegiatan belajar |
| 10 | Editor SQL | Simulasi praktik query SQL |
| 11 | Evaluasi (Kuis) | Kuis akhir, penilaian pemahaman |
| 12 | Profil Pengembang | Identitas pengembang e-modul |

---

## 6. Alur Navigasi (Sitemap)

```
Splash Screen
    ↓
Login
    ↓
Beranda ─────────────┬─────────────┬─────────────┬─────────────┬──────────────┐
    │                │             │             │              │             │
 Panduan          CP/ATP     Kegiatan Belajar  Editor SQL    Evaluasi    Profil Pengembang
                              (1, 2, 3)          (bebas akses  (Kuis akhir)
                                 │                 sebagai
                    ┌────────────┼────────────┐    sandbox)
                    │            │            │
                Materi        Video        Latihan
                                              │
                              (Kegiatan 3 tambahan: Simulasi SQL)
```

**Catatan:** Diagram di atas adalah representasi teks dari "Gambar 4. Struktur Navigasi" yang ada di proposal (image tidak bisa saya baca detail visualnya, jadi ini direkonstruksi dari Tabel 3 Storyboard). Sebaiknya dicocokkan dengan gambar asli di proposal sebelum development dimulai.

---

## 7. Functional Requirements per Halaman

### 7.1 Splash Screen
- Logo/nama e-modul, judul materi, tombol "Mulai" → redirect ke Login.
- Auto-transition opsional (3 detik) atau manual klik.

### 7.2 Login
- Form email + password.
- Validasi Firebase Auth, pesan error jelas (akun salah/password salah).
- Redirect ke Beranda setelah sukses.
- **Tidak ada fitur register mandiri** — akun dibuat manual oleh peneliti/admin di Firebase Console atau lewat script seed (karena subjek penelitian terbatas: 43 siswa + guru).

### 7.3 Beranda
- Sapaan nama siswa yang login.
- Grid/menu kartu ke: Panduan, CP/ATP, Kegiatan Belajar, Editor SQL, Evaluasi, Profil Pengembang.
- Indikator progres sederhana (mis. badge "3/3 kegiatan selesai").

### 7.4 Panduan Penggunaan
- Konten statis: cara navigasi, cara pakai editor SQL, cara mengerjakan kuis.

### 7.5 CP/ATP
- Menampilkan capaian pembelajaran & tujuan pembelajaran (konten dari guru/kurikulum, bisa hardcode atau dari Firestore).

### 7.6 Kegiatan Belajar (3 Tahap)
- Kegiatan 1 & 2: Tujuan pembelajaran → Materi → Video → Latihan.
- Kegiatan 3: Tujuan → Materi → Video → Latihan → **Simulasi SQL** (jembatan ke Editor SQL dengan konteks soal kegiatan 3).
- Navigasi linear dengan tombol "Lanjut" antar sub-bagian, tapi siswa tetap bisa lompat balik.

### 7.7 Materi Pembelajaran
- Konten SQL: pengenalan SQL, DDL (`CREATE`, `ALTER`, `DROP`), DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), DCL (`GRANT`, `REVOKE`).
- Format: teks penjelasan + syntax highlighting untuk contoh query + gambar ilustrasi (mis. struktur tabel).
- Disimpan sebagai Markdown/HTML di Firestore agar mudah diedit tanpa deploy ulang.

### 7.8 Video Pembelajaran
- Embed video per topik (bisa YouTube unlisted untuk hemat storage, atau Firebase Storage jika ingin privat penuh).

### 7.9 Latihan
- Soal pilihan ganda / isian singkat terkait konsep SQL (bukan eksekusi query — itu ranah Editor SQL).
- Feedback langsung benar/salah setelah submit.
- Skor latihan tidak wajib mempengaruhi nilai evaluasi akhir (latihan = formatif, evaluasi = sumatif).

### 7.10 Editor SQL (fitur inti/paling kompleks)
- Text area untuk menulis query SQL.
- Database SQLite virtual (via `sql.js`) sudah berisi tabel contoh (mis. tabel `siswa`, `nilai`, `mapel`) yang di-load saat halaman dibuka.
- Tombol "Jalankan Query" → hasil ditampilkan sebagai tabel di bawah editor.
- Penanganan error SQL ditampilkan jelas (mis. "Syntax error near ...").
- Opsional: tombol "Reset Database" untuk mengembalikan data awal.
- Opsional: daftar soal latihan query (mis. "Tampilkan semua siswa dengan nilai > 80") dengan validasi otomatis apakah hasil query siswa sesuai ekspektasi.

### 7.11 Evaluasi (Kuis)
- Kuis pilihan ganda mencakup seluruh materi (bisa + 1-2 soal praktik query jika ingin terhubung ke Editor SQL).
- Timer opsional.
- Hasil kuis tersimpan ke Firestore per siswa (untuk data penelitian praktikalitas/hasil belajar, meski proposal menyatakan tidak mengkaji pengaruh ke hasil belajar secara mendalam — data ini tetap berguna sebagai bukti pendukung).
- Halaman hasil: skor akhir + review jawaban.

### 7.12 Profil Pengembang
- Foto, nama, NIM, program studi, deskripsi singkat, kontak (opsional).

---

## 8. Non-Functional Requirements

- **Responsif**: bisa diakses dari laptop lab sekolah maupun smartphone siswa (sesuai instrumen praktikalitas: "dapat diakses menggunakan komputer atau smartphone").
- **Ringan & cepat**: karena fasilitas sekolah terbatas, hindari asset berat; lazy-load video.
- **Aksesibilitas UI**: kontras warna cukup, ukuran font terbaca, navigasi tidak membingungkan (poin ini langsung berkaitan dengan indikator angket validitas media & praktikalitas).
- **Konsisten dengan instrumen penilaian**: setiap indikator di Tabel 5–8 proposal (E-Modul, Website, Interaktif, Kesesuaian Materi, dst.) sebaiknya jadi checklist QA sebelum e-modul diserahkan untuk validasi ahli.
- **Offline-tolerant tidak wajib** — asumsikan selalu ada koneksi internet (sesuai kondisi lab sekolah).

---

## 9. Struktur Data Firestore (Draft)

```
users/{uid}
  - nama, kelas (XI RPL 1 / XI RPL 2), role (siswa/guru), createdAt

materi/{materiId}
  - judul, kontenHtml, urutan, kegiatanKe (1/2/3)

video/{videoId}
  - judul, url, materiId (relasi)

latihan/{latihanId}
  - materiId, soal[], jawabanBenar, tipe (pg/isian)

kuis/{kuisId}
  - soal[] (pertanyaan, opsi, jawabanBenar)

hasilKuis/{uid}_{kuisId}
  - uid, kuisId, skor, jawabanSiswa[], waktuSelesai

progres/{uid}
  - kegiatan1Selesai, kegiatan2Selesai, kegiatan3Selesai, latihanSelesai[]
```

---

## 10. Fase Pengembangan (Selaras dengan Model ADDIE Proposal + Breakdown Teknis)

Proposal akademik memakai 5 fase ADDIE. Di bawah ini setiap fase ADDIE dipecah jadi **sub-fase teknis** yang bisa langsung jadi checklist kerja developer.

### **FASE 0 — Persiapan Proyek** *(1–2 hari)*
- Setup repo Git, struktur folder project.
- Setup Firebase project (Auth, Firestore, Hosting).
- Install & uji coba `sql.js` (proof of concept sederhana: buat tabel, jalankan `SELECT`).
- Sinkronisasi ulang dengan client: konfirmasi struktur navigasi final (cocokkan dengan Gambar 4 di proposal), konten materi SQL apa saja yang wajib ada (biasanya sudah ada RPP/silabus dari guru pamong).
- **Deliverable:** repo siap, Firebase aktif, PoC editor SQL jalan.

### **FASE 1 — Analyze (sudah dilakukan client, developer hanya validasi ulang)** *(0.5 hari)*
- Review ulang hasil observasi/wawancara proposal → pastikan tidak ada requirement tersembunyi yang belum masuk PRD ini.
- Konfirmasi jumlah & isi materi SQL (DDL/DML/DCL) ke client — siapa yang siapkan konten teks (client/guru) vs developer hanya membangun sistemnya.
- **Deliverable:** daftar final konten materi yang harus disiapkan client sebelum Fase Development.

### **FASE 2 — Design** *(2–3 hari)*
- Wireframe low-fidelity semua 12 halaman (bisa pakai Figma sederhana atau langsung sketsa HTML statis).
- Finalisasi struktur navigasi & storyboard digital (selaras Tabel 3 proposal).
- Desain skema warna & tipografi (harus terlihat "menarik" & "interaktif" — ini indikator penilaian validitas media).
- Desain struktur database Firestore final (lihat Section 9).
- **Deliverable:** wireframe semua halaman + skema Firestore final, disetujui client.

### **FASE 3 — Development** *(dipecah per sprint, total estimasi 3–4 minggu)*

**Sprint 3.1 — Fondasi & Auth** *(3–4 hari)*
- Setup Firebase Auth + halaman Login + Splash Screen.
- Layout dasar (navbar, struktur halaman) + Beranda dengan navigasi ke semua menu.
- Seed akun siswa (43 siswa) + guru ke Firebase.

**Sprint 3.2 — Konten Statis** *(3–4 hari)*
- Halaman Panduan Penggunaan.
- Halaman CP/ATP.
- Halaman Profil Pengembang.

**Sprint 3.3 — Kegiatan Belajar & Materi** *(5–7 hari)*
- Struktur 3 Kegiatan Belajar.
- Halaman Materi (render konten dari Firestore, syntax highlighting untuk query contoh — bisa pakai library ringan seperti Prism.js).
- Halaman Video Pembelajaran (embed).
- Halaman Latihan (soal + auto-feedback).

**Sprint 3.4 — Editor SQL (fitur paling kompleks)** *(4–6 hari)*
- Integrasi `sql.js`, inisialisasi database contoh.
- UI editor (textarea + tombol jalankan) + tampilan hasil query sebagai tabel.
- Error handling untuk query salah.
- (Opsional) bank soal query dengan validasi otomatis.

**Sprint 3.5 — Evaluasi & Progres** *(3–4 hari)*
- Halaman Kuis + logic skor.
- Simpan hasil ke Firestore (`hasilKuis`).
- Tracking progres siswa (`progres/{uid}`) ditampilkan di Beranda.

**Sprint 3.6 — Polish & QA Internal** *(2–3 hari)*
- Responsif mobile & desktop.
- Cross-browser check (Chrome, Edge — yang umum dipakai di lab sekolah).
- Self-review checklist berdasarkan indikator angket validitas media (Tabel 5) & materi (Tabel 6) di proposal — pastikan semua poin sudah terpenuhi sebelum diserahkan.

**Deliverable Fase 3:** E-modul fungsional penuh, siap untuk tahap validasi ahli.

### **FASE 4 — Implementation** *(dilakukan client, developer standby support)*
- Client memperkenalkan e-modul ke siswa di lab komputer.
- Developer bertugas: bug-fix cepat jika ada masalah teknis saat implementasi, siapkan panduan troubleshooting singkat (mis. jika Firebase auth gagal, jika sql.js tidak load di browser tertentu).
- **Deliverable:** e-modul stabil dipakai langsung oleh 10 siswa sampel + guru.

### **FASE 5 — Evaluation** *(dilakukan client, developer support jika perlu revisi)*
- Client menyebarkan angket validitas (media & materi) dan praktikalitas (guru & siswa).
- Jika ada revisi dari hasil validasi ahli (misal: ahli media minta ubah warna, ahli materi minta tambah contoh), developer masuk lagi ke sprint perbaikan singkat.
- **Deliverable:** e-modul versi final pasca-revisi, siap jadi lampiran/objek penelitian di skripsi client.

---

## 11. Ringkasan Timeline

| Fase | Estimasi Waktu |
|---|---|
| Fase 0 — Persiapan | 1–2 hari |
| Fase 1 — Analyze (validasi ulang) | 0.5 hari |
| Fase 2 — Design | 2–3 hari |
| Fase 3 — Development (6 sprint) | 3–4 minggu |
| Fase 4 — Implementation support | Sesuai jadwal client (biasanya 1–2 hari observasi lab) |
| Fase 5 — Evaluation & revisi | Fleksibel, tergantung hasil validasi (estimasi 3–5 hari kerja revisi) |
| **Total (di luar fase 4 & 5 yang tergantung jadwal client)** | **± 4–5 minggu kerja aktif development** |

---

## 12. Risiko & Catatan Penting

- **Konten materi SQL harus disiapkan client/guru** — developer membangun *sistem*, bukan menulis silabus SQL dari nol (kecuali disepakati lain & masuk biaya tambahan).
- **`sql.js` punya ukuran file (~1-2MB WASM)** — perlu di-cache/lazy-load agar tidak memberatkan loading awal, terutama jika koneksi sekolah terbatas.
- **Firebase free tier (Spark plan)** cukup untuk skala 43 siswa + testing, tapi tetap perlu cek limit Firestore read/write jika ada revisi ke tier berbayar nantinya.
- **Video pembelajaran**: jika pakai Firebase Storage, ukuran video besar bisa boros kuota — YouTube unlisted lebih hemat.
- **Perubahan scope di luar 12 halaman ini** = perlu update ke BAB III proposal client (tanggung jawab client mendokumentasikan, bukan developer).

---

## 13. Definition of Done (Acceptance Criteria)

- Semua 12 halaman di Section 5 berfungsi sesuai Section 7.
- Login berhasil dengan akun yang sudah di-seed.
- Editor SQL bisa menjalankan minimal `CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`, `DELETE` tanpa error pada query valid.
- Kuis evaluasi tersimpan datanya per siswa dan bisa direkap peneliti.
- Tampilan responsif minimal di 2 breakpoint: desktop & mobile.
- Semua indikator di instrumen validitas media (Tabel 5) & materi (Tabel 6) proposal sudah dicek secara mandiri sebelum diserahkan ke ahli.
