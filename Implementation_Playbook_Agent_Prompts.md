# Implementation Playbook — Prompt Siap Pakai untuk AI Coding Agent
## E-Modul Interaktif SQL — SMK Negeri 1 Sintuk Toboh Gadang

**Cara pakai dokumen ini:**
- Setiap task punya blok prompt di dalam ``` yang bisa langsung Anda copy-paste ke Antigravity (atau agent lain).
- Kerjakan **berurutan** — task di sprint belakang bergantung pada task sebelumnya (auth harus ada sebelum halaman yang butuh `currentUser`, dst).
- Setelah agent selesai satu task, cek **Definition of Done (DoD)** sebelum lanjut ke task berikutnya. Jangan gabung banyak task jadi satu prompt besar — agent lebih akurat kalau scope-nya kecil dan jelas.
- Semua prompt ditulis mengasumsikan agent punya akses baca/tulis ke seluruh folder project.

---

## STRUKTUR FOLDER TARGET (acuan untuk semua task)

```
emodul-sql/
├── index.html                  (Splash Screen)
├── login.html
├── beranda.html
├── panduan.html
├── cp-atp.html
├── profil-pengembang.html
├── kegiatan/
│   ├── kegiatan-1.html
│   ├── kegiatan-2.html
│   └── kegiatan-3.html
├── editor-sql.html
├── evaluasi.html
├── hasil-evaluasi.html
├── assets/
│   ├── css/
│   │   ├── style.css           (global)
│   │   └── editor-sql.css
│   ├── js/
│   │   ├── firebase-config.js
│   │   ├── auth.js
│   │   ├── beranda.js
│   │   ├── materi-loader.js
│   │   ├── editor-sql.js
│   │   ├── evaluasi.js
│   │   └── progres.js
│   ├── img/
│   └── lib/
│       ├── sql-wasm.js         (dari sql.js)
│       └── sql-wasm.wasm
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── .firebaserc
```

---

# FASE 0 — Persiapan Proyek

## Task 0.1 — Inisialisasi Project & Firebase

**Konteks untuk agent:** Belum ada project sama sekali. Buat struktur folder dasar dan konfigurasi Firebase Hosting.

```
Buatkan struktur folder project baru bernama `emodul-sql` dengan struktur berikut:

emodul-sql/
├── index.html
├── login.html
├── beranda.html
├── assets/css/style.css
├── assets/js/firebase-config.js
├── firebase.json
├── firestore.rules
└── .firebaserc

Ketentuan:
1. index.html: halaman splash screen sederhana, HTML5 semantic, judul "E-Modul Interaktif SQL", subjudul "Mengenal Perintah SQL - Kelas XI RPL", tombol "Mulai" yang redirect ke login.html setelah 3 detik ATAU saat tombol diklik.
2. assets/css/style.css: buat CSS variables untuk warna utama (primary, secondary, background, text), gunakan font sans-serif modern (Poppins atau Inter dari Google Fonts via CDN).
3. firebase.json: konfigurasi hosting standar, public directory = root folder ini, ignore node_modules dan file .git.
4. firestore.rules: rules default yang menolak semua read/write dari luar (akan diisi detail nanti di task khusus security rules).
5. Jangan isi firebase-config.js dulu (masih placeholder object kosong) — saya akan isi manual dengan API key dari Firebase Console.

Setelah selesai, tampilkan struktur folder final dan isi tiap file yang dibuat.
```

**DoD:** Struktur folder sesuai acuan, `index.html` bisa dibuka di browser dan redirect ke `login.html` berjalan.

---

## Task 0.2 — Proof of Concept `sql.js`

**Konteks untuk agent:** Sebelum masuk fitur utama, pastikan `sql.js` bisa jalan di browser sebagai simulasi database SQL.

```
Buat file percobaan `test-sqljs.html` di root folder project untuk membuktikan sql.js berfungsi.

Ketentuan:
1. Load library sql.js dari CDN: https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js
2. Saat halaman dimuat, inisialisasi sql.js dengan locateFile yang mengarah ke CDN wasm file: https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.wasm
3. Setelah database siap, jalankan query berikut secara otomatis:
   - CREATE TABLE siswa (id INTEGER PRIMARY KEY, nama TEXT, nilai INTEGER);
   - INSERT INTO siswa (nama, nilai) VALUES ('Andi', 85), ('Budi', 70), ('Citra', 92);
   - SELECT * FROM siswa WHERE nilai > 75;
4. Tampilkan hasil SELECT sebagai tabel HTML sederhana di halaman (id="hasil-query").
5. Tampilkan juga console.log jika ada error saat load wasm.

Tujuannya murni untuk verifikasi bahwa sql.js bisa jalan di browser sebelum saya lanjut ke fitur Editor SQL yang sesungguhnya.
```

**DoD:** Buka `test-sqljs.html` di browser, tabel hasil query (Andi 85, Citra 92) muncul di layar tanpa error di console.

> **Setelah task ini berhasil**, hapus/pindahkan `test-sqljs.html` sebelum lanjut — jangan biarkan file uji coba masuk ke build final.

---

# FASE 2 — Design (Wireframe & Skema Data)

## Task 2.1 — Skema Firestore Lengkap

**Konteks untuk agent:** Ini bukan task coding, tapi dokumentasi skema yang harus jadi acuan semua task berikutnya.

```
Buat file dokumentasi `firestore-schema.md` di root project yang mendeskripsikan skema Firestore berikut secara lengkap dengan tipe data tiap field:

Collection: users
  Document ID = uid dari Firebase Auth
  Fields:
    - nama (string)
    - kelas (string, contoh: "XI RPL 1" atau "XI RPL 2")
    - role (string, enum: "siswa" | "guru")
    - createdAt (timestamp)

Collection: materi
  Document ID = auto-generate
  Fields:
    - judul (string)
    - kontenHtml (string, berisi HTML aman untuk di-render)
    - urutan (number)
    - kegiatanKe (number, 1 | 2 | 3)

Collection: video
  Fields:
    - judul (string)
    - urlYoutube (string)
    - materiId (string, reference ke collection materi)

Collection: latihan
  Fields:
    - materiId (string, reference)
    - soal (array of object: { pertanyaan: string, opsi: array of string, jawabanBenarIndex: number })

Collection: kuis
  Fields:
    - judul (string)
    - soal (array of object: { pertanyaan: string, opsi: array of string, jawabanBenarIndex: number })

Collection: hasilKuis
  Document ID = `${uid}_${kuisId}`
  Fields:
    - uid (string)
    - kuisId (string)
    - skor (number)
    - jawabanSiswa (array of number, index jawaban yang dipilih siswa per soal)
    - waktuSelesai (timestamp)

Collection: progres
  Document ID = uid
  Fields:
    - kegiatan1Selesai (boolean)
    - kegiatan2Selesai (boolean)
    - kegiatan3Selesai (boolean)
    - latihanSelesai (array of string, berisi latihanId yang sudah dikerjakan)

Untuk setiap collection, tulis juga contoh 1 dokumen JSON konkret sebagai referensi.
```

**DoD:** File `firestore-schema.md` berisi 7 collection lengkap dengan contoh dokumen JSON, dijadikan acuan untuk semua task Firestore berikutnya.

---

## Task 2.2 — Firestore Security Rules

```
Berdasarkan skema di firestore-schema.md, tuliskan isi firestore.rules dengan ketentuan berikut:

1. Semua collection hanya bisa diakses (read/write) oleh user yang sudah login (request.auth != null).
2. Collection "users": user hanya boleh membaca/menulis dokumennya sendiri (document ID harus sama dengan request.auth.uid), kecuali role guru boleh membaca semua dokumen users.
3. Collection "materi", "video", "latihan", "kuis": semua user yang login boleh READ, tapi WRITE hanya boleh dilakukan manual lewat Firebase Console (tolak semua write dari client, is create/update/delete = false).
4. Collection "hasilKuis": user hanya boleh create/read dokumen dengan uid = request.auth.uid miliknya sendiri. Tidak boleh update/delete (supaya hasil kuis tidak bisa dimanipulasi setelah submit).
5. Collection "progres": user hanya boleh read/write dokumen dengan document ID = uid miliknya sendiri.

Tuliskan firestore.rules lengkap dengan syntax Firestore Security Rules versi 2 (rules_version = '2';).
```

**DoD:** Rules bisa di-deploy tanpa error via `firebase deploy --only firestore:rules`, dan saat dites di Firebase Console Rules Playground, user A tidak bisa baca `hasilKuis` milik user B.

---

# FASE 3 — Development

## Sprint 3.1 — Fondasi & Auth

### Task 3.1.1 — Firebase Auth Setup + Halaman Login

```
Buat/lengkapi file assets/js/firebase-config.js dan assets/js/auth.js, serta lengkapi login.html.

Ketentuan firebase-config.js:
- Import Firebase SDK versi 10+ via CDN modular (type="module"): firebase-app.js, firebase-auth.js, firebase-firestore.js
- Inisialisasi app dengan object config (biarkan placeholder: apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId — akan saya isi manual)
- Export instance `auth` dan `db` (Firestore) agar bisa diimport file JS lain.

Ketentuan login.html:
- Form dengan input email, input password, tombol submit "Masuk"
- Area untuk menampilkan pesan error (kosong secara default)

Ketentuan assets/js/auth.js:
- Import { signInWithEmailAndPassword } dari firebase-auth.js dan `auth` dari firebase-config.js
- Saat form login disubmit (preventDefault), panggil signInWithEmailAndPassword(auth, email, password)
- Jika sukses: redirect ke beranda.html
- Jika gagal: tampilkan pesan error yang human-readable (contoh: "Email atau password salah" untuk error auth/invalid-credential, "Format email tidak valid" untuk auth/invalid-email) — JANGAN tampilkan raw error code Firebase ke user.
- Tambahkan proteksi: jika file ini di-load di halaman selain login.html, cek juga di setiap halaman lain (akan dibuat terpisah di task berikutnya) apakah user sudah login; jika belum, redirect paksa ke login.html.

Gunakan ES6 modules (type="module" di script tag).
```

**DoD:** Login dengan akun test berhasil redirect ke `beranda.html`; login dengan password salah menampilkan pesan error yang jelas, bukan error mentah Firebase.

### Task 3.1.2 — Auth Guard (Proteksi Halaman)

```
Buat file assets/js/auth-guard.js yang akan di-include di SEMUA halaman selain login.html dan index.html.

Ketentuan:
1. Import onAuthStateChanged dari firebase-auth.js dan `auth` dari firebase-config.js
2. Saat halaman dimuat, cek status auth:
   - Jika user TIDAK login → redirect paksa ke login.html
   - Jika user login → ambil dokumen users/{uid} dari Firestore, simpan datanya ke sessionStorage dengan key "userData" (nama, kelas, role) supaya halaman lain bisa pakai tanpa fetch ulang.
3. Export function getCurrentUserData() yang membaca dari sessionStorage untuk dipakai halaman lain.
4. Tambahkan juga function logout() yang memanggil signOut(auth), clear sessionStorage, lalu redirect ke login.html.

Setelah file ini dibuat, tambahkan <script type="module" src="assets/js/auth-guard.js"></script> ke beranda.html sebagai contoh implementasi pertama.
```

**DoD:** Buka `beranda.html` langsung tanpa login → otomatis redirect ke `login.html`. Setelah login, buka `beranda.html` → tidak redirect, dan `sessionStorage.getItem('userData')` berisi data user.

### Task 3.1.3 — Halaman Beranda

```
Lengkapi beranda.html dan buat assets/js/beranda.js.

Ketentuan beranda.html:
- Sertakan auth-guard.js
- Header dengan sapaan "Halo, [nama siswa]" (nama diambil dari getCurrentUserData())
- Tombol Logout di header (memanggil logout() dari auth-guard.js)
- Grid menu berisi 6 kartu navigasi ke: Panduan Penggunaan (panduan.html), CP/ATP (cp-atp.html), Kegiatan Belajar (kegiatan/kegiatan-1.html), Editor SQL (editor-sql.html), Evaluasi (evaluasi.html), Profil Pengembang (profil-pengembang.html)
- Setiap kartu menu ada icon sederhana (pakai emoji dulu sebagai placeholder, contoh 📘 untuk materi) dan label jelas

Ketentuan beranda.js:
- Fetch dokumen progres/{uid} dari Firestore
- Tampilkan badge kecil di kartu "Kegiatan Belajar" contoh teks "2/3 selesai" berdasarkan field kegiatan1Selesai, kegiatan2Selesai, kegiatan3Selesai
- Jika dokumen progres belum ada (user baru pertama kali login), buat dokumen baru dengan semua field false dan latihanSelesai: []
```

**DoD:** Setelah login, Beranda menampilkan nama siswa yang benar, badge progres muncul (awalnya "0/3 selesai" untuk user baru), tombol logout berfungsi kembali ke login.html.

### Task 3.1.4 — Script Seed Akun Siswa & Guru

```
Buat file terpisah `scripts/seed-users.js` (Node.js, BUKAN untuk dijalankan di browser) yang menggunakan Firebase Admin SDK untuk membuat akun massal.

Ketentuan:
1. Baca daftar siswa dari file scripts/data-siswa.json dengan format:
   [{ "nama": "...", "email": "...", "kelas": "XI RPL 1" }, ...]
2. Untuk setiap entri, buat akun Firebase Auth dengan password default "smk123456" (akan saya minta siswa ganti manual, atau saya reset manual per siswa).
3. Setelah akun Auth dibuat, buat juga dokumen di collection users dengan uid yang sama, field nama/kelas/role="siswa"/createdAt.
4. Tambahkan juga logic untuk 1 akun guru dari file scripts/data-guru.json dengan role="guru".
5. Tampilkan log progress di console (nama siswa yang berhasil dibuat / gagal beserta alasan gagal, misal jika email sudah terdaftar).

Sertakan juga scripts/data-siswa.json kosong (array kosong) sebagai template yang akan saya isi manual dengan 43 nama siswa asli.

Catatan: script ini pakai Firebase Admin SDK (npm install firebase-admin), butuh file service-account-key.json yang saya download manual dari Firebase Console — jangan buat file kredensial ini, cukup referensikan path-nya di kode.
```

**DoD:** Menjalankan `node scripts/seed-users.js` dengan `data-siswa.json` terisi 2-3 data uji coba berhasil membuat akun Auth + dokumen Firestore tanpa error.

---

## Sprint 3.2 — Konten Statis

### Task 3.2.1 — Panduan Penggunaan, CP/ATP, Profil Pengembang

```
Lengkapi tiga halaman berikut (semua sertakan auth-guard.js dan tombol "Kembali ke Beranda"):

1. panduan.html — berisi section-section penjelasan cara pakai e-modul:
   - Cara login
   - Cara mengakses materi & video
   - Cara menggunakan Editor SQL (jelaskan bahwa ini simulasi database, aman untuk dicoba-coba)
   - Cara mengerjakan evaluasi
   Gunakan struktur heading + paragraf + list, bukan wall of text.

2. cp-atp.html — berisi:
   - Section "Capaian Pembelajaran (CP)": [PLACEHOLDER TEXT - akan saya isi dari silabus guru]
   - Section "Alur Tujuan Pembelajaran (ATP)": daftar 3 tujuan pembelajaran sesuai 3 Kegiatan Belajar (buat sebagai numbered list, isi placeholder generik tentang SQL DDL/DML/DCL untuk sementara)

3. profil-pengembang.html — berisi:
   - Foto placeholder (gunakan <div> dengan background abu-abu ukuran 200x200px sebagai placeholder foto)
   - Nama: Okfiqha Risdawati
   - NIM: 2201100058
   - Program Studi: Pendidikan Informatika, Universitas PGRI Sumatera Barat
   - Deskripsi singkat placeholder: "Mahasiswa Pendidikan Informatika yang mengembangkan e-modul ini sebagai bagian dari penelitian skripsi."

Styling konsisten dengan style.css yang sudah ada di project.
```

**DoD:** Ketiga halaman bisa diakses dari menu Beranda, tampil rapi, tidak ada broken link.

---

## Sprint 3.3 — Kegiatan Belajar & Materi

### Task 3.3.1 — Materi Loader dari Firestore

```
Buat assets/js/materi-loader.js sebagai module yang bisa dipakai berulang di ketiga halaman kegiatan belajar.

Ketentuan:
1. Export async function loadMateri(kegiatanKe) yang query Firestore collection "materi" where kegiatanKe == kegiatanKe, order by "urutan"
2. Export async function loadVideo(materiId) yang query collection "video" where materiId == materiId
3. Export function renderMateriHtml(materiArray, containerId) yang inject kontenHtml tiap materi ke dalam elemen dengan id containerId, dipisah per section dengan judul masing-masing
4. Tambahkan syntax highlighting untuk blok kode: cari pattern <pre><code> di dalam kontenHtml dan bungkus dengan class untuk styling monospace + background berbeda (tidak perlu library eksternal, cukup CSS)

File ini akan diimport oleh kegiatan-1.html, kegiatan-2.html, kegiatan-3.html.
```

**DoD:** Function bisa dipanggil dari console browser dan berhasil fetch data materi (test dengan 1 dokumen dummy yang Anda buat manual di Firestore Console).

### Task 3.3.2 — Halaman Kegiatan Belajar 1 & 2

```
Lengkapi kegiatan/kegiatan-1.html dan kegiatan/kegiatan-2.html (struktur sama, beda kegiatanKe).

Ketentuan tiap halaman:
- Sertakan auth-guard.js dan materi-loader.js
- Section "Tujuan Pembelajaran" (ambil dari data materi atau hardcode sementara)
- Section "Materi" — render pakai renderMateriHtml() ke dalam <div id="materi-container">
- Section "Video Pembelajaran" — embed iframe YouTube menggunakan data dari loadVideo(), tampilkan pesan "Belum ada video" jika kosong
- Section "Latihan" — tombol "Kerjakan Latihan" yang scroll ke bagian latihan di bawah, berisi 3-5 soal pilihan ganda hardcode dulu (akan disambungkan ke Firestore di task terpisah), setiap soal ada 4 opsi radio button
- Tombol "Tandai Selesai" di akhir halaman yang update progres/{uid} field kegiatan1Selesai (atau kegiatan2Selesai) jadi true, lalu tampilkan konfirmasi visual (bukan alert() browser, buat toast/notif sederhana)
- Tombol navigasi "Lanjut ke Kegiatan Berikutnya" di akhir halaman
```

**DoD:** Buka kegiatan-1.html, semua section muncul, klik "Tandai Selesai" berhasil update Firestore (cek manual di Firestore Console progresnya berubah true), badge di Beranda ikut update saat kembali ke Beranda.

### Task 3.3.3 — Halaman Kegiatan Belajar 3 (dengan Simulasi SQL)

```
Lengkapi kegiatan/kegiatan-3.html dengan struktur sama seperti kegiatan-1.html DAN tambahan:

Section "Simulasi SQL" di akhir sebelum tombol "Tandai Selesai":
- Embed iframe atau link tombol "Buka Editor SQL" yang mengarah ke editor-sql.html?context=kegiatan3
- Jelaskan singkat instruksi: "Coba praktikkan perintah SQL yang sudah dipelajari di Editor SQL sebelum menyelesaikan kegiatan ini."

Tombol "Tandai Selesai" di sini update field kegiatan3Selesai di progres/{uid}.
```

**DoD:** Halaman kegiatan-3 lengkap, link ke Editor SQL berfungsi.

---

## Sprint 3.4 — Editor SQL (Fitur Inti)

### Task 3.4.1 — UI Editor SQL

```
Lengkapi editor-sql.html dan buat assets/css/editor-sql.css.

Ketentuan HTML:
- Sertakan auth-guard.js
- Layout 2 kolom (desktop) / stack (mobile):
  Kolom kiri: <textarea id="query-input"> untuk menulis query, tombol "Jalankan Query" (id="btn-run"), tombol "Reset Database" (id="btn-reset")
  Kolom kanan: area hasil <div id="hasil-output"> untuk menampilkan tabel hasil ATAU pesan error
- Section kecil di atas textarea: "Database contoh: tabel `siswa` (id, nama, kelas, nilai) dan tabel `mapel` (id, nama_mapel)" sebagai panduan konteks siswa
- Section referensi cepat (collapsible/accordion) berisi contoh-contoh query dasar: SELECT, INSERT, UPDATE, DELETE, CREATE TABLE

Styling editor-sql.css: buat textarea terlihat seperti code editor (font monospace, background gelap opsional, line-height nyaman dibaca).
```

**DoD:** UI lengkap tampil rapi di desktop & mobile, belum perlu fungsional (itu task berikutnya).

### Task 3.4.2 — Logic Editor SQL dengan sql.js

```
Buat assets/js/editor-sql.js yang menjalankan simulasi database menggunakan sql.js.

Ketentuan:
1. Load sql.js dari CDN (referensi ke Task 0.2 yang sudah terbukti jalan), inisialisasi saat halaman dimuat.
2. Function initDatabase() yang membuat tabel awal dan mengisi data contoh:
   CREATE TABLE siswa (id INTEGER PRIMARY KEY, nama TEXT, kelas TEXT, nilai INTEGER);
   INSERT INTO siswa (nama, kelas, nilai) VALUES lima baris data dummy realistis (nama siswa Indonesia, kelas "XI RPL 1"/"XI RPL 2", nilai 60-100);
   CREATE TABLE mapel (id INTEGER PRIMARY KEY, nama_mapel TEXT);
   INSERT INTO mapel data 3-4 mapel contoh (Basis Data, Pemrograman Web, dst)
   Simpan instance database ini di variable global module-level.

3. Event listener tombol "Jalankan Query" (btn-run):
   - Ambil isi textarea query-input
   - Jalankan via db.exec(query) dibungkus try-catch
   - Jika sukses dan hasil berupa SELECT (ada return rows): render sebagai tabel HTML di hasil-output (header kolom dari result[0].columns, baris dari result[0].values)
   - Jika sukses tapi bukan SELECT (INSERT/UPDATE/DELETE/CREATE tanpa return rows): tampilkan pesan sukses "Query berhasil dijalankan" beserta jumlah baris terpengaruh jika ada (db.getRowsModified())
   - Jika error: tampilkan pesan error dari exception.message dengan styling merah, JANGAN crash halaman

4. Event listener tombol "Reset Database" (btn-reset):
   - Hapus instance database lama, panggil initDatabase() lagi
   - Clear textarea dan hasil-output
   - Tampilkan konfirmasi visual singkat "Database direset ke kondisi awal"

5. Tangani loading state: tampilkan indikator "Memuat database..." saat sql.js masih inisialisasi, disable tombol Jalankan Query sampai database siap.
```

**DoD:** Buka editor-sql.html, ketik `SELECT * FROM siswa WHERE nilai > 75;` klik Jalankan Query → tabel hasil muncul benar. Ketik query salah sengaja (`SELET * FROM siswa`) → pesan error muncul rapi tanpa crash. Reset Database mengembalikan ke data awal.

---

## Sprint 3.5 — Evaluasi & Progres

### Task 3.5.1 — Halaman Evaluasi (Kuis)

```
Lengkapi evaluasi.html dan buat assets/js/evaluasi.js.

Ketentuan evaluasi.html:
- Sertakan auth-guard.js
- Tampilkan judul kuis, instruksi singkat, dan tombol "Mulai Kuis"
- Setelah "Mulai Kuis" diklik, tampilkan soal satu per satu (atau semua sekaligus dalam form panjang — pilih semua sekaligus untuk kesederhanaan) dengan radio button per opsi
- Tombol "Kumpulkan Jawaban" di akhir

Ketentuan evaluasi.js:
1. Fetch soal dari Firestore collection "kuis" (ambil 1 dokumen kuis yang sudah ditentukan ID-nya, hardcode ID dulu sebagai konstanta di atas file, saya akan isi manual dokumennya di Firestore Console)
2. Render soal dinamis dari data yang di-fetch
3. Saat "Kumpulkan Jawaban" diklik:
   - Validasi semua soal sudah dijawab (jika belum, tampilkan pesan "Masih ada soal yang belum dijawab" tanpa submit)
   - Hitung skor: jumlah jawaban benar / total soal * 100
   - Simpan dokumen ke hasilKuis/{uid}_{kuisId} dengan field uid, kuisId, skor, jawabanSiswa (array index jawaban), waktuSelesai (server timestamp)
   - Redirect ke hasil-evaluasi.html?kuisId={kuisId}
```

**DoD:** Kuis bisa dikerjakan penuh, submit berhasil menyimpan dokumen baru di collection hasilKuis dengan skor yang benar secara matematis.

### Task 3.5.2 — Halaman Hasil Evaluasi

```
Lengkapi hasil-evaluasi.html.

Ketentuan:
- Sertakan auth-guard.js
- Ambil parameter kuisId dari URL query string
- Fetch dokumen hasilKuis/{uid}_{kuisId} milik user yang login
- Tampilkan skor besar di tengah halaman (contoh visual: lingkaran/badge dengan angka skor)
- Tampilkan review jawaban: untuk tiap soal, tampilkan pertanyaan, jawaban yang dipilih siswa, jawaban yang benar, dengan indikator visual benar (hijau) / salah (merah)
- Tombol "Kembali ke Beranda"

Jika dokumen hasilKuis tidak ditemukan (user belum pernah mengerjakan / akses langsung tanpa submit), tampilkan pesan "Anda belum mengerjakan evaluasi ini" dengan tombol ke evaluasi.html, bukan halaman kosong/error.
```

**DoD:** Setelah submit kuis, halaman hasil menampilkan skor & review yang sesuai dengan jawaban yang tadi dipilih.

---

## Sprint 3.6 — Polish & QA Internal

### Task 3.6.1 — Responsif & Cross-Browser Pass

```
Review seluruh file HTML dan CSS di project ini (index.html, login.html, beranda.html, panduan.html, cp-atp.html, kegiatan/*.html, editor-sql.html, evaluasi.html, hasil-evaluasi.html, profil-pengembang.html).

Untuk setiap halaman, pastikan:
1. Ada meta viewport tag: <meta name="viewport" content="width=device-width, initial-scale=1.0">
2. Layout grid/flexbox yang dipakai punya breakpoint mobile (di bawah 768px) — ubah grid multi-kolom jadi 1 kolom, ubah layout 2-kolom Editor SQL jadi stack vertikal
3. Ukuran font minimal 14px di mobile agar tetap terbaca
4. Tombol punya area klik minimal 44x44px (touch-friendly) untuk penggunaan di smartphone
5. Tidak ada horizontal scroll yang tidak disengaja (cek elemen dengan width tetap dalam px yang bisa overflow di layar kecil)

Laporkan file mana saja yang Anda ubah dan perubahan spesifik apa yang dilakukan untuk tiap file.
```

**DoD:** Buka setiap halaman di Chrome DevTools mobile emulation (375px width) — tidak ada elemen terpotong/overflow, semua tombol bisa diklik nyaman.

### Task 3.6.2 — QA Checklist Berdasarkan Indikator Validitas Media & Materi

```
Berdasarkan indikator penilaian berikut dari instrumen validitas proposal, lakukan review menyeluruh terhadap seluruh halaman project dan laporkan temuan + perbaikan yang dilakukan:

INDIKATOR VALIDITAS MEDIA:
1. Tampilan e-modul menarik dan sesuai untuk siswa SMK
2. Navigasi antar halaman jelas dan konsisten
3. Teks terbaca dengan jelas (kontras warna cukup)
4. Elemen interaktif (tombol, editor SQL) berfungsi dengan baik
5. Tidak ada broken link atau elemen yang tidak berfungsi

INDIKATOR VALIDITAS MATERI:
6. Materi tersusun sistematis dari konsep dasar ke kompleks (urutan kegiatan 1→2→3 harus logis: pengenalan SQL dasar → DML → DDL/DCL atau sesuai urutan pedagogis yang wajar)
7. Contoh perintah SQL yang ditampilkan (baik di materi maupun database contoh Editor SQL) harus benar secara sintaks dan bisa dieksekusi tanpa error

Untuk tiap poin, cek kondisi aktual project ini dan lakukan perbaikan kecil jika ditemukan masalah (contoh: kontras warna kurang, link salah, dsb). Laporkan hasil temuan per poin.
```

**DoD:** Semua 7 poin ditinjau, ada laporan tertulis kondisi tiap poin (OK / diperbaiki / catatan untuk Anda review manual).

---

## LAMPIRAN — Checklist Manual (Bukan untuk Agent, untuk Anda)

Setelah semua task di atas selesai dieksekusi agent, ini yang **Anda kerjakan manual**, bukan agent:

- [ ] Buat project Firebase sungguhan di console.firebase.google.com, aktifkan Authentication (Email/Password) dan Firestore.
- [ ] Isi `firebase-config.js` dengan API key asli dari Firebase Console.
- [ ] Download `service-account-key.json` untuk script seed, simpan di luar folder yang ter-commit ke Git (tambahkan ke `.gitignore`).
- [ ] Minta konten materi SQL (teks lengkap DDL/DML/DCL) dari client/guru, input manual ke Firestore collection `materi` (atau buat 1 form admin sederhana kalau volume kontennya banyak — bisa jadi task tambahan).
- [ ] Minta daftar 43 nama siswa + kelas dari client, isi ke `scripts/data-siswa.json`, jalankan `node scripts/seed-users.js`.
- [ ] Buat 1 dokumen kuis manual di Firestore collection `kuis` sesuai ID yang di-hardcode di `evaluasi.js`.
- [ ] Deploy ke Firebase Hosting: `firebase deploy`.
- [ ] Test end-to-end dengan 1 akun siswa dummy sebelum diserahkan ke client untuk tahap validasi ahli.
