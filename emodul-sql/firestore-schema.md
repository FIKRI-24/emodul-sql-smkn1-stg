# Skema Firestore — E-Modul Interaktif SQL

> Dokumen ini menjadi **acuan resmi** untuk semua task yang berhubungan dengan Firestore.
> Setiap kali membuat query, security rules, atau seed data — rujuk ke sini.

---

## 1. Collection: `users`

| Field       | Tipe        | Keterangan                              |
|-------------|-------------|-----------------------------------------|
| *(doc ID)*  | `string`    | Sama dengan `uid` dari Firebase Auth    |
| `nama`      | `string`    | Nama lengkap siswa/guru                 |
| `kelas`     | `string`    | Contoh: `"XI RPL 1"`, `"XI RPL 2"`     |
| `role`      | `string`    | Enum: `"siswa"` \| `"guru"`            |
| `createdAt` | `timestamp` | Waktu akun dibuat                       |

**Contoh dokumen:**
```json
// Document ID: "abc123uid"
{
  "nama": "Andi Saputra",
  "kelas": "XI RPL 1",
  "role": "siswa",
  "createdAt": "2025-07-01T08:00:00Z"
}
```

---

## 2. Collection: `materi`

| Field        | Tipe      | Keterangan                                         |
|--------------|-----------|-----------------------------------------------------|
| *(doc ID)*   | `string`  | Auto-generated                                      |
| `judul`      | `string`  | Judul materi                                        |
| `kontenHtml` | `string`  | Konten HTML aman untuk di-render                    |
| `urutan`     | `number`  | Urutan tampil dalam satu kegiatan (1, 2, 3, …)     |
| `kegiatanKe` | `number`  | Kegiatan belajar: `1`, `2`, atau `3`               |

**Contoh dokumen:**
```json
// Document ID: "materi001" (auto-generated)
{
  "judul": "Pengenalan SQL dan Jenis Perintah",
  "kontenHtml": "<h3>Apa itu SQL?</h3><p>SQL (Structured Query Language) adalah bahasa standar untuk mengelola database relasional.</p><pre><code>SELECT * FROM siswa;</code></pre>",
  "urutan": 1,
  "kegiatanKe": 1
}
```

---

## 3. Collection: `video`

| Field        | Tipe     | Keterangan                                |
|--------------|----------|-------------------------------------------|
| *(doc ID)*   | `string` | Auto-generated                            |
| `judul`      | `string` | Judul video                               |
| `urlYoutube` | `string` | URL embed YouTube (unlisted)              |
| `materiId`   | `string` | Reference ke document ID di collection `materi` |

**Contoh dokumen:**
```json
// Document ID: "video001"
{
  "judul": "Tutorial Perintah SELECT",
  "urlYoutube": "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "materiId": "materi001"
}
```

---

## 4. Collection: `latihan`

| Field      | Tipe     | Keterangan                                           |
|------------|----------|------------------------------------------------------|
| *(doc ID)* | `string` | Auto-generated                                       |
| `materiId` | `string` | Reference ke document ID di collection `materi`      |
| `soal`     | `array`  | Array of object soal (lihat struktur di bawah)       |

**Struktur tiap elemen `soal[]`:**
| Field               | Tipe       | Keterangan                            |
|---------------------|------------|----------------------------------------|
| `pertanyaan`        | `string`   | Teks pertanyaan                        |
| `opsi`              | `array`    | Array of `string` — 4 pilihan jawaban  |
| `jawabanBenarIndex` | `number`   | Index opsi yang benar (0-based)        |

**Contoh dokumen:**
```json
// Document ID: "latihan001"
{
  "materiId": "materi001",
  "soal": [
    {
      "pertanyaan": "Perintah SQL untuk menampilkan data dari tabel adalah…",
      "opsi": ["INSERT", "SELECT", "UPDATE", "DELETE"],
      "jawabanBenarIndex": 1
    },
    {
      "pertanyaan": "DDL adalah singkatan dari…",
      "opsi": [
        "Data Definition Language",
        "Data Description Language",
        "Database Definition Language",
        "Data Design Language"
      ],
      "jawabanBenarIndex": 0
    }
  ]
}
```

---

## 5. Collection: `kuis`

| Field      | Tipe     | Keterangan                                           |
|------------|----------|------------------------------------------------------|
| *(doc ID)* | `string` | Manual (contoh: `"kuis-akhir"`)                      |
| `judul`    | `string` | Judul kuis                                           |
| `soal`     | `array`  | Array of object soal (struktur sama dengan `latihan`) |

**Struktur tiap elemen `soal[]`:**
| Field               | Tipe       | Keterangan                            |
|---------------------|------------|----------------------------------------|
| `pertanyaan`        | `string`   | Teks pertanyaan                        |
| `opsi`              | `array`    | Array of `string` — 4 pilihan jawaban  |
| `jawabanBenarIndex` | `number`   | Index opsi yang benar (0-based)        |

**Contoh dokumen:**
```json
// Document ID: "kuis-akhir"
{
  "judul": "Evaluasi Akhir — Mengenal Perintah SQL",
  "soal": [
    {
      "pertanyaan": "Perintah untuk membuat tabel baru di database adalah…",
      "opsi": ["CREATE TABLE", "ADD TABLE", "NEW TABLE", "MAKE TABLE"],
      "jawabanBenarIndex": 0
    },
    {
      "pertanyaan": "Manakah yang termasuk perintah DML?",
      "opsi": ["CREATE", "DROP", "INSERT", "GRANT"],
      "jawabanBenarIndex": 2
    },
    {
      "pertanyaan": "Perintah untuk menghapus data dari tabel tanpa menghapus struktur tabel adalah…",
      "opsi": ["DROP TABLE", "DELETE FROM", "REMOVE", "TRUNCATE"],
      "jawabanBenarIndex": 1
    }
  ]
}
```

---

## 6. Collection: `hasilKuis`

| Field          | Tipe        | Keterangan                                            |
|----------------|-------------|-------------------------------------------------------|
| *(doc ID)*     | `string`    | Format: `"{uid}_{kuisId}"` (contoh: `"abc123_kuis-akhir"`) |
| `uid`          | `string`    | UID siswa dari Firebase Auth                          |
| `kuisId`       | `string`    | Reference ke document ID di collection `kuis`         |
| `skor`         | `number`    | Nilai 0–100                                           |
| `jawabanSiswa` | `array`     | Array of `number` — index jawaban yang dipilih siswa per soal |
| `waktuSelesai` | `timestamp` | Server timestamp saat submit                          |

**Contoh dokumen:**
```json
// Document ID: "abc123uid_kuis-akhir"
{
  "uid": "abc123uid",
  "kuisId": "kuis-akhir",
  "skor": 66.67,
  "jawabanSiswa": [0, 2, 0],
  "waktuSelesai": "2025-07-15T10:30:00Z"
}
```

---

## 7. Collection: `progres`

| Field              | Tipe      | Keterangan                                     |
|--------------------|-----------|-------------------------------------------------|
| *(doc ID)*         | `string`  | Sama dengan `uid` dari Firebase Auth            |
| `kegiatan1Selesai` | `boolean` | Apakah Kegiatan Belajar 1 sudah ditandai selesai |
| `kegiatan2Selesai` | `boolean` | Apakah Kegiatan Belajar 2 sudah ditandai selesai |
| `kegiatan3Selesai` | `boolean` | Apakah Kegiatan Belajar 3 sudah ditandai selesai |
| `latihanSelesai`   | `array`   | Array of `string` — berisi `latihanId` yang sudah dikerjakan |

**Contoh dokumen:**
```json
// Document ID: "abc123uid"
{
  "kegiatan1Selesai": true,
  "kegiatan2Selesai": true,
  "kegiatan3Selesai": false,
  "latihanSelesai": ["latihan001", "latihan002"]
}
```

---

## Ringkasan Relasi Antar Collection

```
users/{uid}
  └── progres/{uid}           (1:1, doc ID = uid)
  └── hasilKuis/{uid}_{kuisId} (1:N per kuis)

materi/{materiId}
  └── video/{videoId}          (1:N via field materiId)
  └── latihan/{latihanId}      (1:N via field materiId)

kuis/{kuisId}
  └── hasilKuis/{uid}_{kuisId} (1:N per siswa)
```
