// ============================================
// update-materi-detailed.js
// Script untuk mengupdate materi pembelajaran SQL menjadi sangat komprehensif
// ============================================

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_PATH = path.join(__dirname, "service-account-key.json");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ File service-account-key.json tidak ditemukan!");
  process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const DETAILED_MATERI = [
  // ==========================================
  // --- KEGIATAN BELAJAR 1 ---
  // ==========================================
  {
    id: "materi_keg1_1",
    judul: "Mengenal SQL, Sistem Basis Data (RDBMS), dan XAMPP",
    urutan: 1,
    kegiatanKe: 1,
    kontenHtml: `
      <p><strong>SQL (Structured Query Language)</strong> adalah bahasa komputer standar internasional yang dirancang khusus untuk menyimpan, mengolah, memanipulasi, dan mengambil data di dalam <strong>Sistem Manajemen Basis Data Relasional (RDBMS)</strong>.</p>
      
      <p>Konsep SQL pertama kali dikembangkan oleh para peneliti dari IBM pada tahun 1970-an berdasarkan teori model relasional dari Dr. Edgar F. Codd. Awalnya bahasa ini dinamakan <strong>SEQUEL</strong> (<em>Structured English Query Language</em>), kemudian disederhanakan menjadi <strong>SQL</strong> dan distandarisasi oleh <strong>ANSI</strong> (<em>American National Standards Institute</em>) serta <strong>ISO</strong> (<em>International Organization for Standardization</em>).</p>

      <h3>Perbedaan File Datar (Spreadsheet) vs Sistem Basis Data Relasional (RDBMS)</h3>
      <p>Banyak pemula bertanya: <em>"Mengapa kita tidak menyimpan data menggunakan Microsoft Excel saja?"</em></p>
      <div style="overflow-x:auto; margin:var(--space-md) 0;">
        <table class="guru-table" style="width:100%; font-size:var(--fs-xs);">
          <thead>
            <tr>
              <th>Aspek Pembanding</th>
              <th>Spreadsheet (Excel / Google Sheets)</th>
              <th>RDBMS (MySQL, MariaDB, PostgreSQL)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Kapasitas Data</strong></td>
              <td>Terbatas (maksimal ±1 juta baris per sheet).</td>
              <td>Mampu mengolah miliaran baris data dengan performa stabil.</td>
            </tr>
            <tr>
              <td><strong>Akses Multi-user</strong></td>
              <td>Rentan konflik data (*concurrency issue*) jika diedit banyak orang bersamaan.</td>
              <td>Mendukung ribuan pengguna/koneksi transaksi secara bersamaan (*multi-threading*).</td>
            </tr>
            <tr>
              <td><strong>Integritas & Relasi</strong></td>
              <td>Tidak ada validasi relasi otomatis antartabel.</td>
              <td>Memiliki *Foreign Key* dan aturan integritas referensial yang sangat ketat.</td>
            </tr>
            <tr>
              <td><strong>Keamanan (Security)</strong></td>
              <td>Proteksi file terbatas (password file).</td>
              <td>Hak akses bertingkat per akun pengguna (DCL: CREATE USER, GRANT, REVOKE).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>3 Kategori Utama Perintah SQL</h3>
      <p>Dalam rekayasa perangkat lunak, perintah-perintah SQL dikelompokkan ke dalam 3 kelompok besar:</p>
      <ul>
        <li><strong>1. DDL (Data Definition Language):</strong> Perintah untuk mendefinisikan dan mengelola struktur objek database (database, tabel, kolom, tipe data). <em>Contoh: <code>CREATE</code>, <code>ALTER</code>, <code>RENAME</code>, <code>DROP</code>, <code>TRUNCATE</code>.</em></li>
        <li><strong>2. DML (Data Manipulation Language):</strong> Perintah untuk memanipulasi dan mengolah isi baris data (record) di dalam tabel. <em>Contoh: <code>INSERT</code>, <code>SELECT</code>, <code>UPDATE</code>, <code>DELETE</code>.</em></li>
        <li><strong>3. DCL (Data Control Language):</strong> Perintah untuk mengontrol izin keamanan dan hak akses pengguna ke database. <em>Contoh: <code>CREATE USER</code>, <code>GRANT</code>, <code>REVOKE</code>.</em></li>
      </ul>

      <h3>Aplikasi Pembuat Database & Paket Perangkat Lunak XAMPP</h3>
      <p>Untuk menjalankan server database lokal di komputer pengembang, kita menggunakan paket perangkat lunak server. Paket yang paling populer di sekolah dan industri pemula adalah <strong>XAMPP</strong>.</p>

      <p><strong>XAMPP</strong> adalah perangkat lunak <em>open-source</em> yang menggabungkan beberapa modul penting dalam satu paket instalasi. Arti singkatan huruf pada XAMPP:</p>
      <ul>
        <li><strong>X (Cross-Platform):</strong> Dapat berjalan di berbagai sistem operasi (Windows, Linux, macOS).</li>
        <li><strong>A (Apache):</strong> Web server yang bertugas melayani dan memproses permintaan halaman web.</li>
        <li><strong>M (MySQL / MariaDB):</strong> Server sistem database relasional untuk mengolah basis data.</li>
        <li><strong>P (PHP):</strong> Bahasa pemrograman web *server-side* yang menghubungkan aplikasi web ke database.</li>
        <li><strong>P (Perl):</strong> Bahasa pemrograman skrip untuk berbagai keperluan administrasi sistem.</li>
      </ul>

      <h3>Kelebihan & Kekurangan DBMS MySQL</h3>
      <p><strong>Kelebihan MySQL:</strong></p>
      <ol>
        <li><em>Portabilitas:</em> Berjalan lancar di berbagai sistem operasi server dan klien.</li>
        <li><em>Open Source & Gratis:</em> Bebas digunakan untuk keperluan belajar dan non-komersial.</li>
        <li><em>Kecepatan Tinggi:</em> Sangat optimal dan responsif dalam memproses query baca/tulis (*read-write*).</li>
        <li><em>Dukungan Tipe Data Luas:</em> Mendukung integer, floating-point, varchar, text, date, datetime, enum, json, dan blob.</li>
        <li><em>Kompatibilitas Luas:</em> Terintegrasi secara native dengan berbagai bahasa pemrograman (PHP, Python, Java, JavaScript/Node.js, C#, Dart).</li>
      </ol>

      <p><strong>Kekurangan MySQL:</strong></p>
      <ol>
        <li><em>Dukungan Teknis:</em> Komunitas besar, namun layanan bantuan berbayar resmi tidak seluas vendor komersial seperti Oracle Database.</li>
        <li><em>Fitur Analitik Kompleks:</em> Untuk kebutuhan data warehouse berskala petabyte (Big Data), diperlukan konfigurasi arsitektur khusus atau DBMS analitik (seperti ClickHouse / BigQuery).</li>
      </ol>

      <h3>Panduan Langkah Kerja: Masuk ke MySQL via XAMPP Shell</h3>
      <ol>
        <li>Buka aplikasi <strong>XAMPP Control Panel</strong>.</li>
        <li>Klik tombol <strong>Start</strong> pada modul <strong>Apache</strong> dan <strong>MySQL</strong> hingga kedua indikator berubah menjadi hijau.</li>
        <li>Klik tombol <strong>Shell</strong> pada panel sebelah kanan XAMPP.</li>
        <li>Ketik perintah berikut untuk login sebagai administrator (root):
          <pre class="code-block"><code class="code-sql">mysql -u root -p</code></pre>
        </li>
        <li>Saat muncul tulisan <code>Enter password:</code>, langsung tekan tombol <strong>Enter</strong> (karena default user root XAMPP tidak memiliki password).</li>
        <li>Jika berhasil, Anda akan melihat baris perintah <code>MariaDB [(none)]></code> atau <code>mysql></code>.</li>
        <li>Untuk memeriksa informasi status koneksi server, ketik:
          <pre class="code-block"><code class="code-sql">STATUS;</code></pre>
        </li>
        <li>Untuk keluar dari command line MySQL, ketik perintah:
          <pre class="code-block"><code class="code-sql">EXIT;</code></pre>
        </li>
      </ol>
    `
  },
  {
    id: "materi_keg1_2",
    judul: "Tipe Data MySQL, Aturan Integritas, dan Pembuatan Tabel (CREATE TABLE)",
    urutan: 2,
    kegiatanKe: 1,
    kontenHtml: `
      <p><strong>Data Definition Language (DDL)</strong> adalah fondasi dari seluruh arsitektur basis data. Sebelum kita dapat menyimpan data siswa atau barang, kita harus merancang struktur tabel dan menentukan tipe data yang tepat untuk setiap kolom.</p>

      <div class="note-box alert-info">
        <p><strong>💡 Kaidah Penulisan SQL:</strong></p>
        <ul style="margin:0; padding-left:18px;">
          <li>Setiap pernyataan perintah SQL wajib diakhiri dengan tanda titik koma (<code>;</code>).</li>
          <li>Kata kunci SQL bersifat <em>case-insensitive</em> (huruf besar/kecil dianggap sama: <code>CREATE</code> sama dengan <code>create</code>), namun secara konvensi penulisan standar, kata kunci SQL ditulis dengan <strong>HURUF KAPITAL</strong> agar mudah dibedakan dari nama tabel dan kolom.</li>
        </ul>
      </div>

      <h3>Tabel Rangkuman Tipe Data MySQL yang Sering Digunakan</h3>
      <div style="overflow-x:auto; margin:var(--space-md) 0;">
        <table class="guru-table" style="width:100%; font-size:var(--fs-xs);">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Tipe Data</th>
              <th>Rentang / Kapasitas</th>
              <th>Contoh Penggunaan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowspan="3"><strong>Numeric (Angka)</strong></td>
              <td><code>INT / INTEGER</code></td>
              <td>-2.147.483.648 s/d 2.147.483.647 (4 Byte)</td>
              <td>Jumlah stok, nomor urut, id transaksi.</td>
            </tr>
            <tr>
              <td><code>BIGINT</code></td>
              <td>Angka integer raksasa (8 Byte)</td>
              <td>ID pengguna aplikasi skala global.</td>
            </tr>
            <tr>
              <td><code>DECIMAL(p, s)</code></td>
              <td>Angka pecahan presisi tinggi (tanpa rounding error)</td>
              <td><code>DECIMAL(10,2)</code> untuk nominal uang/harga: <code>150000.50</code>.</td>
            </tr>
            <tr>
              <td rowspan="3"><strong>String (Teks)</strong></td>
              <td><code>CHAR(n)</code></td>
              <td>Teks panjang tetap (*fixed length*), max 255 karakter</td>
              <td>Kode pos (5 digit), kode jurusan (3 digit): <code>RPL</code>, <code>TKJ</code>.</td>
            </tr>
            <tr>
              <td><code>VARCHAR(n)</code></td>
              <td>Teks panjang dinamis (*variable length*), max 65.535 karakter</td>
              <td>Nama siswa (<code>VARCHAR(50)</code>), email, alamat.</td>
            </tr>
            <tr>
              <td><code>TEXT</code></td>
              <td>Teks panjang hingga 65.535 karakter</td>
              <td>Deskripsi artikel, catatan guru, keluhan pasien.</td>
            </tr>
            <tr>
              <td rowspan="3"><strong>Date & Time (Waktu)</strong></td>
              <td><code>DATE</code></td>
              <td>Format standar: <code>YYYY-MM-DD</code></td>
              <td>Tanggal lahir: <code>'2008-05-14'</code>.</td>
            </tr>
            <tr>
              <td><code>TIME</code></td>
              <td>Format standar: <code>HH:MM:SS</code></td>
              <td>Jam masuk sekolah: <code>'07:15:00'</code>.</td>
            </tr>
            <tr>
              <td><code>DATETIME</code></td>
              <td>Format standar: <code>YYYY-MM-DD HH:MM:SS</code></td>
              <td>Waktu login pengguna: <code>'2026-08-19 14:30:00'</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="note-box alert-warning">
        <p><strong>⚠️ Tips Pemilihan Tipe Data (Penting untuk Ujian RPL):</strong></p>
        <p>Mengapa nomor NISN, NIK, dan Nomor Telepon <strong>TIDAK BOLEH</strong> menggunakan tipe data <code>INT</code> melainkan harus menggunakan <code>VARCHAR</code>?</p>
        <ol style="margin:0; padding-left:20px;">
          <li>Nomor telepon sering diawali angka nol (<code>0812...</code>). Jika menggunakan <code>INT</code>, angka nol di depan akan <strong>dihapus secara otomatis</strong> oleh database menjadi <code>812...</code>.</li>
          <li>NISN dan No HP tidak pernah digunakan untuk operasi matematika (tidak pernah dijumlahkan atau dikalikan).</li>
        </ol>
      </div>

      <h3>1. Pengelolaan Database</h3>
      <p><strong>a. Membuat Database Baru:</strong></p>
      <pre class="code-block"><code class="code-sql">-- Membuat database bernama 'db_sekolah'
CREATE DATABASE db_sekolah;

-- Membuat database dengan proteksi jika belum ada (mencegah pesan error)
CREATE DATABASE IF NOT EXISTS db_sekolah;</code></pre>

      <p><strong>b. Menampilkan Daftar Database:</strong></p>
      <pre class="code-block"><code class="code-sql">SHOW DATABASES;</code></pre>

      <p><strong>c. Membuka / Mengaktifkan Database (USE):</strong></p>
      <pre class="code-block"><code class="code-sql">USE db_sekolah;</code></pre>
      <p>Untuk memastikan database mana yang sedang aktif saat ini, ketik: <code>SELECT DATABASE();</code>.</p>

      <h3>2. Atribut Kolom & Constraint Integritas Data</h3>
      <ul>
        <li><strong>PRIMARY KEY:</strong> Kunci primer unik yang mengidentifikasi setiap baris data secara tunggal. Tidak boleh bernilai <code>NULL</code> dan tidak boleh ada nilai kembar.</li>
        <li><strong>NOT NULL:</strong> Menandakan kolom tersebut wajib diisi (tidak boleh dibiarkan kosong).</li>
        <li><strong>AUTO_INCREMENT:</strong> Fitur MySQL untuk mengisi nilai nomor urut integer secara otomatis bertambah 1 (1, 2, 3, ...) pada setiap penambahan baris baru.</li>
        <li><strong>UNIQUE:</strong> Menjamin bahwa nilai dalam kolom tersebut tidak boleh ada yang sama (misal: kolom <code>email</code> atau <code>nisn</code>).</li>
        <li><strong>DEFAULT 'nilai':</strong> Memberikan nilai bawaan secara otomatis apabila pengguna tidak menginput nilai pada kolom tersebut.</li>
        <li><strong>FOREIGN KEY:</strong> Kunci tamu yang mereferensikan primary key pada tabel lain untuk menciptakan relasi data (1-to-many).</li>
      </ul>

      <h3>3. Contoh Pembuatan Tabel Lengkap (CREATE TABLE)</h3>
      <p>Berikut adalah contoh pembuatan 2 tabel yang saling berelasi: tabel <code>jurusan</code> dan tabel <code>murid</code>:</p>
      
      <pre class="code-block"><code class="code-sql">-- 1. Membuat tabel referensi 'jurusan'
CREATE TABLE jurusan (
  id_jurusan VARCHAR(5) NOT NULL,
  nama_jurusan VARCHAR(50) NOT NULL,
  PRIMARY KEY (id_jurusan)
);

-- 2. Membuat tabel utama 'murid' dengan Primary Key dan Foreign Key
CREATE TABLE murid (
  nisn VARCHAR(10) NOT NULL,
  nama VARCHAR(50) NOT NULL,
  alamat VARCHAR(100) DEFAULT 'Sintuk Toboh Gadang',
  jenis_kel ENUM('Laki-laki', 'Perempuan') NOT NULL,
  id_jurusan VARCHAR(5),
  PRIMARY KEY (nisn),
  FOREIGN KEY (id_jurusan) REFERENCES jurusan(id_jurusan)
);</code></pre>

      <h3>4. Menampilkan Daftar & Memeriksa Struktur Tabel</h3>
      <p>Untuk melihat semua tabel yang ada dalam database yang aktif:</p>
      <pre class="code-block"><code class="code-sql">SHOW TABLES;</code></pre>

      <p>Untuk melihat rincian tipe data dan struktur kolom dari tabel tertentu, gunakan perintah <code>DESCRIBE</code> atau <code>DESC</code>:</p>
      <pre class="code-block"><code class="code-sql">DESCRIBE murid;</code></pre>

      <p><em>Keterangan Kolom Output DESCRIBE:</em></p>
      <ul>
        <li><code>Field</code>: Nama kolom.</li>
        <li><code>Type</code>: Tipe data dan panjang alokasi memori.</li>
        <li><code>Null</code>: Menunjukkan apakah kolom boleh kosong (YES) atau wajib diisi (NO).</li>
        <li><code>Key</code>: Indikator kunci (<code>PRI</code> untuk Primary Key, <code>UNI</code> untuk Unique, <code>MUL</code> untuk Foreign Key).</li>
        <li><code>Default</code>: Nilai standar bawaan jika tidak diisi saat INSERT.</li>
        <li><code>Extra</code>: Atribut tambahan seperti <code>auto_increment</code>.</li>
      </ul>
    `
  },
  {
    id: "materi_keg1_3",
    judul: "Modifikasi Struktur Tabel (ALTER TABLE), RENAME, dan Penghapusan Objek (DROP & TRUNCATE)",
    urutan: 3,
    kegiatanKe: 1,
    kontenHtml: `
      <p>Dalam siklus pengembangan perangkat lunak nyata, struktur basis data sering kali mengalami perubahan seiring bertambahnya kebutuhan fitur sistem. SQL menyediakan perintah <strong>ALTER TABLE</strong> untuk mengubah struktur tabel tanpa harus menghapus data record yang sudah tersimpan.</p>

      <h3>1. Mengubah Nama Tabel (RENAME TABLE)</h3>
      <p>Perintah <code>RENAME TABLE</code> digunakan untuk mengganti nama tabel lama dengan nama baru:</p>
      <pre class="code-block"><code class="code-sql">RENAME TABLE nama_tabel_lama TO nama_tabel_baru;

-- Contoh: Mengubah nama tabel 'siswa' menjadi 'murid'
RENAME TABLE siswa TO murid;</code></pre>

      <h3>2. Memodifikasi Struktur Kolom (ALTER TABLE)</h3>
      <p>Perintah <code>ALTER TABLE</code> memiliki beberapa variasi aksi utama:</p>

      <p><strong>a. Menambah Kolom Baru (ADD):</strong></p>
      <pre class="code-block"><code class="code-sql">-- Menambahkan kolom 'telepon' bertipe VARCHAR(15)
ALTER TABLE murid ADD telepon VARCHAR(15);

-- Menambahkan kolom 'email' tepat setelah kolom 'nama'
ALTER TABLE murid ADD email VARCHAR(50) AFTER nama;

-- Menambahkan kolom 'id_siswa' di posisi kolom pertama
ALTER TABLE murid ADD id_siswa INT AUTO_INCREMENT FIRST;</code></pre>

      <p><strong>b. Mengubah Nama Kolom Beserta Tipe Datanya (CHANGE):</strong></p>
      <pre class="code-block"><code class="code-sql">-- Mengubah kolom 'telepon' menjadi 'no_hp' dengan tipe VARCHAR(20)
ALTER TABLE murid CHANGE COLUMN telepon no_hp VARCHAR(20);</code></pre>

      <p><strong>c. Mengubah Tipe Data Kolom Saja Tanpa Mengganti Namanya (MODIFY):</strong></p>
      <pre class="code-block"><code class="code-sql">-- Mengubah panjang tipe data 'nama' menjadi VARCHAR(100) dan wajib diisi
ALTER TABLE murid MODIFY COLUMN nama VARCHAR(100) NOT NULL;</code></pre>

      <p><strong>d. Menghapus Kolom dari Tabel (DROP COLUMN):</strong></p>
      <pre class="code-block"><code class="code-sql">-- Menghapus kolom 'no_hp' dari tabel murid
ALTER TABLE murid DROP COLUMN no_hp;</code></pre>

      <p><strong>e. Menambah atau Menghapus Primary Key:</strong></p>
      <pre class="code-block"><code class="code-sql">-- Menambahkan Primary Key pada kolom nisn
ALTER TABLE murid ADD PRIMARY KEY (nisn);

-- Menghapus Primary Key dari tabel
ALTER TABLE murid DROP PRIMARY KEY;</code></pre>

      <h3>3. Menghapus Objek Basis Data (DROP)</h3>
      <p>Perintah <code>DROP</code> digunakan untuk menghapus total suatu objek dari memori server basis data:</p>
      <pre class="code-block"><code class="code-sql">-- Menghapus tabel murid secara permanen
DROP TABLE murid;

-- Menghapus tabel dengan proteksi pengecekan keberadaan tabel
DROP TABLE IF EXISTS murid;

-- Menghapus seluruh database 'db_sekolah' beserta seluruh tabel di dalamnya
DROP DATABASE IF EXISTS db_sekolah;</code></pre>

      <h3>4. Perbedaan Kritis: DROP TABLE vs TRUNCATE TABLE vs DELETE</h3>
      <div style="overflow-x:auto; margin:var(--space-md) 0;">
        <table class="guru-table" style="width:100%; font-size:var(--fs-xs);">
          <thead>
            <tr>
              <th>Perintah</th>
              <th>Kategori</th>
              <th>Apa yang Terjadi?</th>
              <th>Status Struktur Tabel</th>
              <th>Reset Auto-Increment?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>DROP TABLE</code></td>
              <td>DDL</td>
              <td>Menghapus tabel, seluruh data baris, dan skema definisinya dari database.</td>
              <td>Hilang total (Tabel tidak ada lagi).</td>
              <td>Tidak berlaku.</td>
            </tr>
            <tr>
              <td><code>TRUNCATE TABLE</code></td>
              <td>DDL</td>
              <td>Mengosongkan seluruh baris data secara instan dengan cara membuat ulang tabel kosong.</td>
              <td>Tabel tetap ada (struktur utuh).</td>
              <td><strong>Ya (kembali ke 1)</strong>.</td>
            </tr>
            <tr>
              <td><code>DELETE FROM</code></td>
              <td>DML</td>
              <td>Menghapus baris data satu per satu berdasarkan kondisi klausa WHERE.</td>
              <td>Tabel tetap ada (struktur utuh).</td>
              <td><strong>Tidak</strong> (melanjutkan ID terakhir).</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  },

  // ==========================================
  // --- KEGIATAN BELAJAR 2 ---
  // ==========================================
  {
    id: "materi_keg2_1",
    judul: "Pengenalan DML & Menyisipkan Data ke Tabel (INSERT INTO)",
    urutan: 1,
    kegiatanKe: 2,
    kontenHtml: `
      <p><strong>Data Manipulation Language (DML)</strong> adalah kelompok perintah SQL yang berfokus pada pengolahan isi baris data (record) di dalam tabel yang telah didefinisikan oleh perintah DDL.</p>

      <p>DML mencakup 4 operasi fundamental yang dikenal sebagai <strong>CRUD</strong> dalam rekayasa aplikasi:</p>
      <ul>
        <li><strong>Create:</strong> Menyisipkan data baru ke dalam tabel menggunakan perintah <code>INSERT</code>.</li>
        <li><strong>Read / Retrieve:</strong> Menampilkan dan mencari data menggunakan perintah <code>SELECT</code>.</li>
        <li><strong>Update:</strong> Memperbarui atau mengubah nilai data yang sudah ada menggunakan perintah <code>UPDATE</code>.</li>
        <li><strong>Delete:</strong> Menghapus baris data dari tabel menggunakan perintah <code>DELETE</code>.</li>
      </ul>

      <h3>Menyisipkan Data Baru (INSERT INTO)</h3>
      <p>Terdapat dua format utama dalam menuliskan perintah <code>INSERT</code>:</p>

      <p><strong>Format 1: Menyebutkan Nama Kolom Secara Spesifik (Direkomendasikan)</strong></p>
      <p>Format ini sangat aman dan fleksibel karena urutan pengisian nilai mengikuti daftar nama kolom yang kita tuliskan di dalam tanda kurung:</p>
      <pre class="code-block"><code class="code-sql">INSERT INTO nama_tabel (kolom1, kolom2, kolom3) 
VALUES ('nilai1', 'nilai2', 'nilai3');</code></pre>

      <p><strong>Format 2: Mengisi Seluruh Kolom Tanpa Menyebutkan Nama Kolom</strong></p>
      <p>Pada format ini, nilai di dalam klausa <code>VALUES</code> wajib diurutkan <strong>persis sama</strong> dengan urutan kolom pada struktur tabel asli:</p>
      <pre class="code-block"><code class="code-sql">INSERT INTO nama_tabel 
VALUES ('nilai1', 'nilai2', 'nilai3', 'nilai4');</code></pre>

      <h3>Contoh Praktik Menyisipkan Data Siswa</h3>
      <p>Misalkan kita memiliki tabel <code>murid</code> dengan kolom: <code>nisn</code>, <code>nama</code>, <code>alamat</code>, <code>jenis_kel</code>, dan <code>kelas</code>:</p>

      <pre class="code-block"><code class="code-sql">-- Menyisipkan data murid satu per satu
INSERT INTO murid (nisn, nama, alamat, jenis_kel, kelas) 
VALUES ('10001', 'Adil Wicaksono', 'Jalan Solo no 3', 'Laki-laki', 'XI RPL 1');

INSERT INTO murid (nisn, nama, alamat, jenis_kel, kelas) 
VALUES ('10002', 'Budi Santoso', 'Jalan Merdeka no 12', 'Laki-laki', 'XI RPL 1');</code></pre>

      <h3>Menyisipkan Banyak Baris Data Sekaligus (Multi-Row / Bulk Insert)</h3>
      <p>Untuk menghemat waktu eksekusi dan meningkatkan performa query, SQL memungkinkan kita menyisipkan banyak baris data dalam satu pernyataan <code>INSERT</code> cukup dengan memisahkan blok nilai dengan tanda koma (<code>,</code>):</p>

      <pre class="code-block"><code class="code-sql">INSERT INTO murid (nisn, nama, alamat, jenis_kel, kelas) VALUES
('10003', 'Citra Lestari', 'Jalan Solo no 45', 'Perempuan', 'XI RPL 2'),
('10004', 'Dewi Anggraini', 'Jalan Sudirman no 7', 'Perempuan', 'XI RPL 2'),
('10005', 'Rizky Fadillah', 'Padang Pariaman', 'Laki-laki', 'XI RPL 1');</code></pre>

      <div class="note-box alert-info">
        <p><strong>💡 Aturan Penulisan Nilai Data pada SQL:</strong></p>
        <ul>
          <li>Nilai bertipe <strong>Teks (String)</strong> dan <strong>Tanggal (Date)</strong> wajib diapit oleh tanda petik tunggal, contoh: <code>'Budi Santoso'</code>, <code>'2008-11-20'</code>.</li>
          <li>Nilai bertipe <strong>Angka (Integer / Decimal)</strong> <strong>TIDAK PERLU</strong> diapit tanda petik, contoh: <code>85</code>, <code>150000.50</code>.</li>
          <li>Jika kolom memiliki sifat <code>AUTO_INCREMENT</code>, pada perintah INSERT kolom tersebut cukup diisi nilai <code>NULL</code> atau diabaikan, dan database akan otomatis mengisikan nomor urut berikutnya.</li>
        </ul>
      </div>
    `
  },
  {
    id: "materi_keg2_2",
    judul: "Menampilkan, Menyaring, dan Mengurutkan Data (SELECT, WHERE, LIKE, ORDER BY, & LIMIT)",
    urutan: 2,
    kegiatanKe: 2,
    kontenHtml: `
      <p>Perintah <code>SELECT</code> adalah perintah yang paling kaya dan paling sering dieksekusi dalam dunia basis data. Perintah ini berfungsi untuk mengekstrak dan menampilkan informasi dari tabel sesuai dengan kriteria yang ditentukan.</p>

      <h3>1. Menampilkan Semua Kolom vs Kolom Spesifik</h3>
      <p>Gunakan simbol asterisk (<code>*</code>) untuk mengambil seluruh kolom pada tabel:</p>
      <pre class="code-block"><code class="code-sql">SELECT * FROM murid;</code></pre>

      <p>Untuk efisiensi memori (terutama pada aplikasi produksi berkecepatan tinggi), sebutkan nama kolom tertentu yang benar-benar dibutuhkan:</p>
      <pre class="code-block"><code class="code-sql">SELECT nisn, nama, kelas FROM murid;</code></pre>

      <p><strong>Memberikan Nama Alias pada Kolom (AS):</strong></p>
      <pre class="code-block"><code class="code-sql">SELECT nisn AS 'Nomor Induk Siswa', nama AS 'Nama Lengkap Siswa' FROM murid;</code></pre>

      <h3>2. Menyaring Data dengan Klausa WHERE & Operator Perbandingan</h3>
      <p>Klausa <code>WHERE</code> digunakan untuk memfilter baris data yang memenuhi kondisi tertentu.</p>
      
      <p><em>Daftar Operator Perbandingan:</em></p>
      <ul>
        <li><code>=</code> : Sama dengan (Contoh: <code>WHERE kelas = 'XI RPL 1'</code>)</li>
        <li><code>!=</code> atau <code><></code> : Tidak sama dengan (Contoh: <code>WHERE jenis_kel != 'Laki-laki'</code>)</li>
        <li><code>></code> dan <code><</code> : Lebih besar dari dan Lebih kecil dari (Contoh: <code>WHERE nilai > 80</code>)</li>
        <li><code>>=</code> dan <code><=</code> : Lebih besar sama dengan dan Lebih kecil sama dengan</li>
      </ul>

      <h3>3. Menggabungkan Banyak Kondisi (Operator Logika AND, OR, NOT, IN, BETWEEN)</h3>
      <pre class="code-block"><code class="code-sql">-- 1. Operator AND: Kedua kondisi wajib benar
SELECT * FROM murid WHERE kelas = 'XI RPL 1' AND jenis_kel = 'Laki-laki';

-- 2. Operator OR: Salah satu kondisi bernilai benar
SELECT * FROM murid WHERE alamat = 'Padang' OR alamat = 'Pariaman';

-- 3. Operator IN: Mencocokkan nilai dengan salah satu anggota daftar
SELECT * FROM murid WHERE kelas IN ('XI RPL 1', 'XI RPL 2');

-- 4. Operator BETWEEN: Mencari nilai dalam rentang inklusif (antara batas awal dan akhir)
SELECT * FROM nilai_siswa WHERE nilai_akhir BETWEEN 80 AND 100;</code></pre>

      <h3>4. Pencarian Pola String dengan Klausa LIKE & Wildcard</h3>
      <p>Klausa <code>LIKE</code> digunakan untuk mencari teks yang cocok dengan suatu pola (*pattern*). MySQL menyediakan 2 karakter wildcard:</p>
      <ul>
        <li><strong>Simbol Persen (<code>%</code>):</strong> Mewakili nol, satu, atau banyak karakter sembarang.</li>
        <li><strong>Simbol Underscore (<code>_</code>):</strong> Mewakili tepat <strong>satu karakter tunggal</strong> sembarang.</li>
      </ul>

      <pre class="code-block"><code class="code-sql">-- Mencari murid yang alamatnya MENGANDUNG kata 'Solo' di posisi mana saja
SELECT * FROM murid WHERE alamat LIKE '%Solo%';

-- Mencari murid yang namanya DIAWALI huruf 'A'
SELECT * FROM murid WHERE nama LIKE 'A%';

-- Mencari murid yang namanya BERAKHIRAN huruf 'i'
SELECT * FROM murid WHERE nama LIKE '%i';

-- Mencari kode 4 karakter yang diawali huruf 'R' dan berakhiran 'L' (misal: 'RP_L')
SELECT * FROM jurusan WHERE id_jurusan LIKE 'R__L';</code></pre>

      <h3>5. Mengurutkan Data dengan ORDER BY (ASC & DESC)</h3>
      <p>Secara default, data ditampilkan sesuai urutan input. Gunakan klausa <code>ORDER BY</code> untuk mengurutkan tampilan data:</p>
      <ul>
        <li><strong>ASC (Ascending):</strong> Mengurutkan dari kecil ke besar (A ke Z, atau 0 ke 9). Nilai default jika tidak ditulis.</li>
        <li><strong>DESC (Descending):</strong> Mengurutkan dari besar ke kecil (Z ke A, atau 9 ke 0).</li>
      </ul>

      <pre class="code-block"><code class="code-sql">-- Mengurutkan nama murid dari abjad A sampai Z
SELECT * FROM murid ORDER BY nama ASC;

-- Mengurutkan data berdasarkan kelas terlebih dahulu, kemudian nama murid
SELECT * FROM murid ORDER BY kelas ASC, nama ASC;</code></pre>

      <h3>6. Membatasi Jumlah Baris Data dengan LIMIT & OFFSET</h3>
      <p>Klausa <code>LIMIT</code> digunakan untuk membatasi jumlah baris record yang dikembalikan query. Fitur ini sangat penting saat membangun sistem penomoran halaman (<em>pagination</em>) di web:</p>
      <pre class="code-block"><code class="code-sql">-- Menampilkan hanya 3 baris data pertama
SELECT * FROM murid LIMIT 3;

-- Mengambil 5 baris data, dimulai dari baris ke-10 (Halaman 2 pagination)
SELECT * FROM murid LIMIT 5 OFFSET 10;</code></pre>
    `
  },
  {
    id: "materi_keg2_3",
    judul: "Memperbarui Data (UPDATE), Menghapus Data (DELETE), & Fungsi Agregasi SQL",
    urutan: 3,
    kegiatanKe: 2,
    kontenHtml: `
      <h3>1. Memperbarui Nilai Data yang Ada (UPDATE)</h3>
      <p>Perintah <code>UPDATE</code> digunakan untuk mengubah nilai data record yang sudah tersimpan di dalam tabel.</p>

      <p><strong>Bentuk Umum Sintaks:</strong></p>
      <pre class="code-block"><code class="code-sql">UPDATE nama_tabel 
SET kolom1 = 'nilai_baru', kolom2 = 'nilai_baru' 
WHERE kondisi_filter;</code></pre>

      <p><strong>Contoh 1: Mengubah satu kolom pada record spesifik</strong></p>
      <pre class="code-block"><code class="code-sql">-- Mengubah alamat murid yang memiliki NISN 10004 menjadi 'Kota Padang'
UPDATE murid SET alamat = 'Kota Padang' WHERE nisn = '10004';</code></pre>

      <p><strong>Contoh 2: Mengubah beberapa kolom sekaligus dalam satu perintah</strong></p>
      <pre class="code-block"><code class="code-sql">-- Mengubah alamat dan kelas sekaligus untuk murid bernama 'Budi Santoso'
UPDATE murid 
SET alamat = 'Jalan Sudirman No 45', kelas = 'XI RPL 2' 
WHERE nisn = '10002';</code></pre>

      <div class="note-box alert-warning">
        <p><strong>⚠️ PERINGATAN KRITIS OPERASI UPDATE:</strong></p>
        <p>Perintah <code>UPDATE</code> selalu memperbarui setiap baris yang memenuhi kondisi <code>WHERE</code>. <strong>Jika Anda lupa menuliskan klausa WHERE</strong>, contoh: <code>UPDATE murid SET alamat = 'Padang';</code>, maka <strong>SELURUH BARIS DATA SISWA DI TABEL AKAN BERUBAH MENJADI ALAMAT PADANG!</strong></p>
      </div>

      <h3>2. Menghapus Baris Data (DELETE)</h3>
      <p>Perintah <code>DELETE</code> digunakan untuk menghapus satu atau beberapa baris data record dari dalam tabel.</p>

      <p><strong>Bentuk Umum Sintaks:</strong></p>
      <pre class="code-block"><code class="code-sql">DELETE FROM nama_tabel WHERE kondisi_filter;</code></pre>

      <p><strong>Contoh Praktik:</strong></p>
      <pre class="code-block"><code class="code-sql">-- Menghapus baris data murid yang memiliki NISN 10003
DELETE FROM murid WHERE nisn = '10003';

-- Menghapus seluruh murid yang berada di kelas 'XII RPL 1' (misal siswa sudah lulus)
DELETE FROM murid WHERE kelas = 'XII RPL 1';</code></pre>

      <div class="note-box alert-danger">
        <p><strong>🚨 PERINGATAN BAHAYA DATA LOSS PADA DELETE:</strong></p>
        <p>Jika Anda menjalankan perintah <code>DELETE FROM murid;</code> tanpa menyertakan klausa <code>WHERE</code>, maka <strong>SELURUH RECORD DATA MURID AKAN TERHAPUS BERSIH</strong> seketika dan tidak dapat dibatalkan (*undo*).</p>
      </div>

      <h3>3. Fungsi Agregasi SQL (Summary Statistics)</h3>
      <p>Dalam pengolahan data aplikasi, kita sering membutuhkan ringkasan statistik angka. SQL menyediakan 5 fungsi agregasi standar:</p>

      <div style="overflow-x:auto; margin:var(--space-md) 0;">
        <table class="guru-table" style="width:100%; font-size:var(--fs-xs);">
          <thead>
            <tr>
              <th>Fungsi Agregasi</th>
              <th>Deskripsi Kegunaan</th>
              <th>Contoh Sintaks Query</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>COUNT(*)</code></td>
              <td>Menghitung total jumlah baris record.</td>
              <td><code>SELECT COUNT(*) AS total_siswa FROM murid;</code></td>
            </tr>
            <tr>
              <td><code>SUM(kolom)</code></td>
              <td>Menghitung total penjumlahan nilai angka.</td>
              <td><code>SELECT SUM(nominal_spp) FROM pembayaran;</code></td>
            </tr>
            <tr>
              <td><code>AVG(kolom)</code></td>
              <td>Menghitung nilai rata-rata (*average*).</td>
              <td><code>SELECT AVG(nilai_kuis) FROM hasil_evaluasi;</code></td>
            </tr>
            <tr>
              <td><code>MAX(kolom)</code></td>
              <td>Mencari nilai tertinggi / maksimum.</td>
              <td><code>SELECT MAX(nilai_kuis) AS skor_tertinggi FROM hasil_evaluasi;</code></td>
            </tr>
            <tr>
              <td><code>MIN(kolom)</code></td>
              <td>Mencari nilai terendah / minimum.</td>
              <td><code>SELECT MIN(nilai_kuis) AS skor_terendah FROM hasil_evaluasi;</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  },

  // ==========================================
  // --- KEGIATAN BELAJAR 3 ---
  // ==========================================
  {
    id: "materi_keg3_1",
    judul: "Keamanan Basis Data, Pembuatan Pengguna (CREATE USER), & Modifikasi Akun",
    urutan: 1,
    kegiatanKe: 3,
    kontenHtml: `
      <p><strong>Data Control Language (DCL)</strong> adalah pilar keamanan dalam administrasi basis data. Di lingkungan industri dan instansi sekolah, tidak semua orang boleh memiliki akses penuh ke server database.</p>

      <p>Prinsip utama keamanan database mengacu pada standar <strong>CIA Triad</strong>:</p>
      <ul>
        <li><strong>Confidentiality (Kerahasiaan):</strong> Hanya pihak yang berwenang yang boleh membaca data sensitif (misal: password dan data pribadi siswa).</li>
        <li><strong>Integrity (Keutuhan Data):</strong> Data harus terlindungi dari modifikasi atau penghapusan yang tidak sah atau tidak disengaja.</li>
        <li><strong>Availability (Ketersediaan):</strong> Data harus selalu dapat diakses secara cepat dan andal oleh pengguna yang sah kapan pun dibutuhkan.</li>
      </ul>

      <h3>Peran Administrator Basis Data (DBA) vs Pengguna Aplikasi</h3>
      <p>Seorang <strong>Database Administrator (DBA)</strong> memegang akun tertinggi (<code>root</code>). Untuk keamanan, aplikasi web atau staf kasir/guru tidak boleh menggunakan akun <code>root</code>, melainkan dibuatkan akun khusus dengan izin terbatas sesuai tugasnya masing-masing (*Principle of Least Privilege*).</p>

      <h3>Anatomi Akun Pengguna MySQL</h3>
      <p>Dalam MySQL, identitas sebuah akun pengguna terdiri dari dua komponen yang dipisahkan simbol <code>@</code>:</p>
      <pre class="code-block"><code class="code-sql">'nama_pengguna'@'host_asal'</code></pre>
      
      <p><em>Penjelasan Host Asal:</em></p>
      <ul>
        <li><code>'localhost'</code>: Pengguna hanya diizinkan terhubung dari komputer server itu sendiri.</li>
        <li><code>'%'</code> (Wildcard Any Host): Pengguna diizinkan terhubung secara jarak jauh (*remote*) dari komputer/IP mana pun di jaringan.</li>
        <li><code>'192.168.1.%'</code>: Pengguna hanya diizinkan terhubung dari komputer yang berada dalam subnet jaringan lokal sekolah tertentu.</li>
      </ul>

      <h3>1. Membuat Akun Pengguna Baru (CREATE USER)</h3>
      <p><strong>Sintaks Umum:</strong></p>
      <pre class="code-block"><code class="code-sql">CREATE USER 'nama_user'@'host_asal' IDENTIFIED BY 'kata_sandi';</code></pre>

      <p><strong>Contoh Praktik:</strong></p>
      <pre class="code-block"><code class="code-sql">-- Membuat user 'guru_rpl' yang hanya bisa login dari komputer lokal dengan password 'smk12345'
CREATE USER 'guru_rpl'@'localhost' IDENTIFIED BY 'smk12345';

-- Membuat user 'aplikasi_web' yang bisa terhubung dari server mana saja
CREATE USER 'aplikasi_web'@'%' IDENTIFIED BY 'RahasiaWeb2026!';</code></pre>

      <h3>2. Mengubah Kata Sandi Pengguna Database (ALTER USER)</h3>
      <p>Apabila pengguna ingin mengganti kata sandi atau administrator ingin mereset password user:</p>
      <pre class="code-block"><code class="code-sql">-- Mengubah password akun 'guru_rpl' menjadi password baru
ALTER USER 'guru_rpl'@'localhost' IDENTIFIED BY 'GuruBaru#2026';</code></pre>

      <h3>3. Menghapus Akun Pengguna Database (DROP USER)</h3>
      <p>Apabila seorang staf sudah tidak bertugas, akun database miliknya dapat dihapus secara permanen beserta seluruh izin aksesnya:</p>
      <pre class="code-block"><code class="code-sql">-- Menghapus akun user 'guru_rpl'
DROP USER 'guru_rpl'@'localhost';

-- Menghapus user dengan proteksi pengecekan
DROP USER IF EXISTS 'guru_rpl'@'localhost';</code></pre>

      <h3>4. Menampilkan Daftar Pengguna yang Terdaftar di Server MySQL</h3>
      <p>Seluruh akun pengguna MySQL disimpan di dalam tabel sistem <code>mysql.user</code>. Administrator dapat melihat daftarnya dengan query:</p>
      <pre class="code-block"><code class="code-sql">SELECT User, Host FROM mysql.user;</code></pre>
    `
  },
  {
    id: "materi_keg3_2",
    judul: "Manajemen Hak Akses Pengguna (GRANT, REVOKE, SHOW GRANTS, & FLUSH PRIVILEGES)",
    urutan: 2,
    kegiatanKe: 3,
    kontenHtml: `
      <p>Ketika akun pengguna baru pertama kali dibuat dengan <code>CREATE USER</code>, akun tersebut <strong>sama sekali belum memiliki hak akses (*zero privileges*)</strong>. Akun tersebut tidak dapat membuat database, melihat tabel, maupun membaca data sampai administrator memberikan izin eksplisit menggunakan perintah <strong>GRANT</strong>.</p>

      <h3>1. Macam-Macam Hak Akses (*Privileges*) di MySQL</h3>
      <div style="overflow-x:auto; margin:var(--space-md) 0;">
        <table class="guru-table" style="width:100%; font-size:var(--fs-xs);">
          <thead>
            <tr>
              <th>Nama Privilege</th>
              <th>Izin Tindakan yang Diberikan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>SELECT</code></td>
              <td>Membaca dan menampilkan data tabel.</td>
            </tr>
            <tr>
              <td><code>INSERT</code></td>
              <td>Menyisipkan baris data baru ke tabel.</td>
            </tr>
            <tr>
              <td><code>UPDATE</code></td>
              <td>Mengubah/memperbarui isi data yang sudah ada.</td>
            </tr>
            <tr>
              <td><code>DELETE</code></td>
              <td>Menghapus baris data dari tabel.</td>
            </tr>
            <tr>
              <td><code>CREATE</code></td>
              <td>Membuat database baru atau tabel baru.</td>
            </tr>
            <tr>
              <td><code>DROP</code></td>
              <td>Menghapus database atau tabel.</td>
            </tr>
            <tr>
              <td><code>ALTER</code></td>
              <td>Mengubah struktur kolom tabel (tambah/hapus kolom).</td>
            </tr>
            <tr>
              <td><code>ALL PRIVILEGES</code></td>
              <td>Memberikan seluruh hak akses penuh pada level objek yang ditentukan.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>2. Memberikan Hak Akses (GRANT)</h3>
      <p><strong>Bentuk Umum Sintaks:</strong></p>
      <pre class="code-block"><code class="code-sql">GRANT daftar_hak_akses ON nama_database.nama_tabel TO 'nama_user'@'host_asal';</code></pre>

      <p><strong>Contoh 1: Memberikan hak akses baca (SELECT) dan tambah (INSERT) pada tabel murid</strong></p>
      <pre class="code-block"><code class="code-sql">GRANT SELECT, INSERT ON db_sekolah.murid TO 'guru_rpl'@'localhost';</code></pre>

      <p><strong>Contoh 2: Memberikan hak akses penuh pada SELURUH tabel di database db_sekolah</strong></p>
      <pre class="code-block"><code class="code-sql">GRANT ALL PRIVILEGES ON db_sekolah.* TO 'guru_rpl'@'localhost';</code></pre>

      <p><strong>Contoh 3: Memberikan izin hak akses hanya pada kolom tertentu (Column-level Privilege)</strong></p>
      <pre class="code-block"><code class="code-sql">-- Pengguna hanya boleh melihat kolom nama dan kelas (tidak bisa melihat alamat atau NISN)
GRANT SELECT (nama, kelas) ON db_sekolah.murid TO 'petugas_piket'@'localhost';</code></pre>

      <h3>3. Memeriksa Hak Akses Aktif Pengguna (SHOW GRANTS)</h3>
      <p>Untuk melihat rincian daftar hak akses apa saja yang saat ini dimiliki oleh seorang pengguna:</p>
      <pre class="code-block"><code class="code-sql">-- Memeriksa hak akses user guru_rpl
SHOW GRANTS FOR 'guru_rpl'@'localhost';

-- Memeriksa hak akses user yang sedang login saat ini
SHOW GRANTS;</code></pre>

      <h3>4. Mencabut Hak Akses Pengguna (REVOKE)</h3>
      <p>Perintah <code>REVOKE</code> adalah kebalikan dari <code>GRANT</code>, digunakan untuk menarik kembali hak akses yang sebelumnya pernah diberikan tanpa menghapus akun penggunanya:</p>
      <pre class="code-block"><code class="code-sql">REVOKE hak_akses ON nama_database.nama_tabel FROM 'nama_user'@'host_asal';</code></pre>

      <p><strong>Contoh: Mencabut hak hapus (DELETE) dari akun guru_rpl:</strong></p>
      <pre class="code-block"><code class="code-sql">-- Mencabut izin DELETE pada seluruh tabel database db_sekolah
REVOKE DELETE ON db_sekolah.* FROM 'guru_rpl'@'localhost';</code></pre>

      <h3>5. Menyegarkan Cache Hak Akses (FLUSH PRIVILEGES)</h3>
      <p>Perintah <code>FLUSH PRIVILEGES;</code> bertugas memerintahkan server MySQL untuk segera memuat ulang (*reload*) tabel hak akses dari disk ke memori RAM server.</p>

      <pre class="code-block"><code class="code-sql">FLUSH PRIVILEGES;</code></pre>

      <div class="note-box alert-info">
        <p><strong>💡 Mengapa FLUSH PRIVILEGES penting?</strong></p>
        <p>Ketika administrator melakukan modifikasi hak akses pengguna secara manual (terutama jika memodifikasi tabel <code>mysql.user</code> secara langsung), MySQL membaca hak akses dari memori cache. Menjalankan <code>FLUSH PRIVILEGES;</code> memastikan seluruh perubahan izin langsung aktif 100% seketika tanpa perlu merestart service MySQL di XAMPP.</p>
      </div>
    `
  }
];

async function updateAllMateri() {
  console.log("🚀 Memulai pembaruan komprehensif materi pembelajaran SQL di Firestore...");

  for (const item of DETAILED_MATERI) {
    try {
      await db.collection("materi").doc(item.id).set({
        judul: item.judul,
        kontenHtml: item.kontenHtml,
        kegiatanKe: item.kegiatanKe,
        urutan: item.urutan,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`✅ Berhasil update materi: [Kegiatan ${item.kegiatanKe} - #${item.urutan}] ${item.judul}`);
    } catch (err) {
      console.error(`❌ Gagal update materi ${item.id}:`, err);
    }
  }

  console.log("\n🎉 SELURUH MATERI PEMBELAJARAN (KEGIATAN 1, 2, 3) BERHASIL DIPERBARUI SECARA MENDALAM DI FIRESTORE!");
  process.exit(0);
}

updateAllMateri();
