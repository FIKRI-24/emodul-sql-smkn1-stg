# 📚 E-Modul Interaktif SQL — SMK Negeri 1 Sintuk Toboh Gadang

E-Modul Pembelajaran Interaktif Berbasis Website untuk Materi **Mengenal Perintah SQL (DDL, DML, DCL)** pada Mata Pelajaran Basis Data Kelas XI Rekayasa Perangkat Lunak (RPL) SMK Negeri 1 Sintuk Toboh Gadang.

---

## 🌐 Akses Versi Online (Live Deployment)

Aplikasi ini sudah di-hosting secara publik dan dapat diakses langsung melalui peramban (browser) di tautan berikut:
- 🔗 **[https://emodul-sql-client.web.app](https://emodul-sql-client.web.app)**
- 🔗 **[https://emodul-sql-client.firebaseapp.com](https://emodul-sql-client.firebaseapp.com)**

---

## ✨ Fitur Utama

1. **Cover & Autentikasi Modern**: Sistem login dan registrasi terintegrasi Firebase Authentication untuk Siswa dan Guru.
2. **Dashboard Guru & Siswa**: 
   - Siswa: Memantau progres belajar, riwayat latihan, dan hasil evaluasi/kuis.
   - Guru: Mengelola data siswa, rekap nilai evaluasi, dan pemantauan aktivitas belajar.
3. **3 Kegiatan Belajar Terstruktur**:
   - **Kegiatan 1**: Pengenalan Basis Data & SQL + DDL (*Data Definition Language*)
   - **Kegiatan 2**: DML (*Data Manipulation Language*) & Query Data
   - **Kegiatan 3**: DCL (*Data Control Language*), Transaksi, & Studi Kasus Integratif
4. **Editor SQL Interaktif (In-Browser Sandbox)**:
   - Menjalankan perintah SQL secara langsung di browser menggunakan teknologi **SQLite WebAssembly (sql.js)** tanpa memerlukan instalasi server database MySQL/PostgreSQL tambahan.
5. **Kuis Evaluasi & Penilaian Otomatis**:
   - Soal evaluasi interaktif dengan kalkulasi skor otomatis dan penyimpanan langsung ke **Firebase Firestore Cloud Database**.
6. **Desain Modern & Responsif**: Tampilan bertema *Modern Tech Glassmorphism* dengan antarmuka yang ramah pengguna (*user-friendly*).

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6 Modules) | Ringan, cepat, dan terstruktur modular |
| **SQL Engine** | sql.js (SQLite via WebAssembly) | Berjalan 100% di browser klien (Zero-Config DB) |
| **Autentikasi** | Firebase Authentication | Mengelola login Siswa dan Guru |
| **Database** | Firebase Cloud Firestore | Menyimpan data progres, materi, dan nilai evaluasi |
| **Hosting** | Firebase Hosting | Deployment produksi |

---

## 💻 Panduan Menjalankan di Laptop (Secara Lokal)

Proyek ini dapat dijalankan secara lokal di laptop/komputer dengan mengikuti salah satu metode di bawah ini:

### ⚠️ Catatan Penting Sebelum Memulai:
> Karena aplikasi ini menggunakan **JavaScript ES Modules** (import/export) dan file **WebAssembly (.wasm)**, file **tidak dapat dibuka langsung dengan cara klik ganda (double-click) index.html** (akan diblokir oleh kebijakan keamanan CORS browser). Anda wajib menjalankannya melalui *local web server* seperti panduan di bawah.
> 
> Laptop tetap memerlukan **koneksi internet** saat login agar aplikasi dapat berkomunikasi dengan Firebase Cloud Database.

---

### 🔹 METODE 1: Menggunakan XAMPP (Paling Direkomendasikan)

1. **Unduh / Clone Proyek:**
   - Unduh file ZIP repositori ini dari GitHub, lalu ekstrak.
   - Atau gunakan Git:
     `ash
     git clone https://github.com/FIKRI-24/emodul-sql-smkn1-stg.git
     `
2. **Pindahkan Folder ke XAMPP:**
   - Salin folder emodul-sql ke dalam direktori htdocs XAMPP Anda.
   - Contoh path lokasi:  
     C:\xampp\htdocs\emodul-sql
3. **Jalankan Apache di XAMPP:**
   - Buka aplikasi **XAMPP Control Panel**.
   - Klik tombol **Start** pada modul **Apache** (modul MySQL tidak perlu dinyalakan karena database menggunakan Firebase).
4. **Buka di Browser:**
   - Buka Google Chrome / Microsoft Edge / Mozilla Firefox.
   - Ketik alamat berikut di URL bar:  
     👉 **http://localhost/emodul-sql**

---

### 🔹 METODE 2: Menggunakan Visual Studio Code (Live Server)

1. Buka aplikasi **Visual Studio Code**.
2. Pilih menu **File** → **Open Folder...** → Pilih folder emodul-sql.
3. Pastikan ekstensi **Live Server** (oleh *Ritwick Dey*) sudah terpasang di VS Code.
4. Klik kanan pada file index.html di panel Explorer.
5. Klik **"Open with Live Server"**.
6. Aplikasi akan otomatis terbuka di browser dengan alamat default:  
   👉 **http://127.0.0.1:5500** atau **http://localhost:5500**

---

### 🔹 METODE 3: Menggunakan Python (Simple HTTP Server)

Jika laptop sudah terinstal Python:
1. Buka terminal / Command Prompt (CMD).
2. Masuk ke folder emodul-sql:
   `ash
   cd emodul-sql
   `
3. Jalankan server lokal:
   `ash
   python -m http.server 8000
   `
4. Buka browser dan akses:  
   👉 **http://localhost:8000**

---

## 🔑 Akun Demo / Uji Coba

Untuk keperluan demonstrasi atau pengujian, Anda dapat menggunakan akun yang telah disediakan berikut:

### 👨‍🏫 Akun Guru:
* **Email:** guru@test.com
* **Password:** smk123456

### 👨‍🎓 Akun Siswa:
* **Email:** siswa1@test.com *(atau siswa2@test.com, siswa3@test.com)*
* **Password:** smk123456

*(Pengguna baru juga dapat melakukan pendaftaran akun mandiri melalui menu Registrasi).*

---

## 📁 Struktur Direktori Proyek

`	ext
emodul-sql-smkn1-stg/
├── README.md                          # Dokumentasi panduan proyek
└── emodul-sql/                        # Direktori aplikasi web utama
    ├── index.html                     # Halaman landing / cover e-modul
    ├── login.html                     # Halaman login & registrasi
    ├── beranda.html                   # Dashboard menu utama
    ├── cp-atp.html                    # Capaian Pembelajaran & ATP
    ├── editor-sql.html                # Simulator Editor SQL interaktif
    ├── evaluasi.html                  # Kuis evaluasi pemahaman materi
    ├── hasil-evaluasi.html            # Halaman hasil & pembahasan kuis
    ├── guru.html                      # Panel pengelolaan guru & rekap nilai
    ├── panduan.html                   # Petunjuk penggunaan e-modul
    ├── profil-pengembang.html         # Profil tim pengembang & pembimbing
    ├── firebase.json                  # Konfigurasi Firebase Hosting & Firestore
    ├── firestore.rules                # Aturan keamanan database Firestore
    ├── kegiatan/                      # Modul kegiatan belajar
    │   ├── kegiatan-1.html            # Kegiatan Belajar 1 (Pengenalan & DDL)
    │   ├── kegiatan-2.html            # Kegiatan Belajar 2 (DML & Query)
    │   └── kegiatan-3.html            # Kegiatan Belajar 3 (DCL & Integrasi)
    ├── assets/
    │   ├── css/                       # Stylesheet tampilan & layout
    │   ├── js/                        # Modul JavaScript logika aplikasi
    │   ├── img/                       # Aset gambar & ilustrasi 3D
    │   └── lib/                       # WebAssembly engine (sql.js) & bundle Firebase
    └── scripts/                       # Skrip seeding data awal
`

---

## 👤 Informasi Pengembang & Institusi

* **Peneliti / Pengembang:** Okfiqha Risdawati (NIM 2201100058)
* **Program Studi:** Pendidikan Informatika — Fakultas Sains & Teknologi, Universitas PGRI Sumatera Barat
* **Sekolah Mitra:** SMK Negeri 1 Sintuk Toboh Gadang
* **Dosen Pembimbing:**
  1. Dr. Adlia Alfiriani, M.Pd.
  2. Herisvan Hendra, S.Pd., M.Pd.T.
