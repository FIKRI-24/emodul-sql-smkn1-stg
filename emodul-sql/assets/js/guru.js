// ============================================
// guru.js — Logic Dashboard Guru & Kelola Siswa
// E-Modul Interaktif SQL
// ============================================

import {
  initializeApp,
  getAuth,
  createUserWithEmailAndPassword,
  signOut as secondarySignOut,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  db,
  firebaseConfig
} from "./firebase-config.js";

import { authReady, getCurrentUserData, logout } from "./auth-guard.js";
import { showToast } from "./materi-loader.js";

// Tombol Logout Guru (Navbar & Sidebar)
const btnGuruLogout = document.getElementById("btn-guru-logout");
if (btnGuruLogout) btnGuruLogout.addEventListener("click", logout);

const btnGuruLogoutSidebar = document.getElementById("btn-guru-logout-sidebar");
if (btnGuruLogoutSidebar) btnGuruLogoutSidebar.addEventListener("click", logout);

// Firebase App Sekunder untuk membuat akun siswa tanpa melogout Guru yang sedang login
let secondaryAuth = null;

try {
  const secondaryApp = initializeApp(firebaseConfig, "SecondaryAppForTeacherStudentCreation");
  secondaryAuth = getAuth(secondaryApp);
} catch (e) {
  console.warn("[GuruJS] Secondary app initialization warning:", e.message);
}

// ---- DOM Elements ----
const loadingScreen    = document.getElementById("loading-screen");
const appContent       = document.getElementById("app-content");
const formAddStudent   = document.getElementById("form-add-student");
const btnAddStudent    = document.getElementById("btn-add-student");
const addStudentError  = document.getElementById("add-student-error");
const tableSiswaBody   = document.getElementById("table-siswa-body");
const tableProgresBody = document.getElementById("table-progres-body");
const tableHasilBody   = document.getElementById("table-hasil-body");

// Stats elements
const statTotalSiswa  = document.getElementById("stat-total-siswa");
const statSelesaiKeg1 = document.getElementById("stat-selesai-keg1");
const statSelesaiKuis = document.getElementById("stat-selesai-kuis");
const statRataSkor    = document.getElementById("stat-rata-skor");

let currentUserData = null;
let allSiswaList = [];
let allProgresMap = {};
let allHasilMap = {};

// Quiz variables & elements
const KUIS_ID = "kuis-akhir";
let kuisQuestions = [];
let savedQuestions = [];
let kuisStatus = "draft";
const kuisStatusDot      = document.getElementById("kuis-status-dot");
const kuisStatusText     = document.getElementById("kuis-status-text");
const summaryTotalSoal   = document.getElementById("summary-total-soal");
const summaryBobotSoal   = document.getElementById("summary-bobot-soal");
const btnToggleStatus    = document.getElementById("btn-toggle-status");
const inputCountPg       = document.getElementById("input-count-pg");
const inputCountEsai     = document.getElementById("input-count-esai");
const btnApplyComposition = document.getElementById("btn-apply-composition");
const btnAddPg          = document.getElementById("btn-add-pg");
const btnAddEsai        = document.getElementById("btn-add-esai");
const formManageKuis     = document.getElementById("form-manage-kuis");
const generatedContainer = document.getElementById("generated-questions-container");
const quizEditorActions  = document.getElementById("quiz-editor-actions");
const manageKuisError    = document.getElementById("manage-kuis-error");
const btnPublishKuis     = document.getElementById("btn-publish-kuis");
const btnDraftKuis       = document.getElementById("btn-draft-kuis");

// ---- Init Guard ----
authReady
  .then(async (user) => {
    currentUserData = user;

    // Proteksi: Hanya role "guru" yang boleh mengakses halaman ini
    if (user.role !== "guru") {
      alert("Halaman ini hanya dapat diakses oleh Guru / Admin.");
      window.location.href = "beranda.html";
      return;
    }

    // Setup tab navigation
    setupTabs();

    // Load data
    await loadAllData();

    loadingScreen.style.display = "none";
    appContent.style.display = "block";
  })
  .catch((err) => {
    console.error("[GuruJS] Auth error:", err);
  });

// ---- Load All Data ----
async function loadAllData() {

  try {
    // 1. Fetch all users
    const usersSnap = await getDocs(collection(db, "users"));
    allSiswaList = [];
    usersSnap.forEach((d) => {
      const u = { uid: d.id, ...d.data() };
      if (u.role === "siswa") {
        allSiswaList.push(u);
      }
    });

    // Sort by nama
    allSiswaList.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));

    // 2. Fetch all progres
    const progresSnap = await getDocs(collection(db, "progres"));
    allProgresMap = {};
    progresSnap.forEach((d) => {
      allProgresMap[d.id] = d.data();
    });

    // 3. Fetch all hasilKuis
    const hasilSnap = await getDocs(collection(db, "hasilKuis"));
    allHasilMap = {};
    hasilSnap.forEach((d) => {
      const data = d.data();
      if (data.uid) {
        allHasilMap[data.uid] = data;
      }
    });

    // Update UI
    renderStats();
    renderTableSiswa();
    renderTableProgres();
    renderTableHasil();

    // Load kuis, materi, video & listeners
    await loadKuisData();
    await loadMateriData();
    setupMateriEventListeners();
    await loadVideoData();
    setupVideoEventListeners();
    setupHasilEventListeners();

  } catch (err) {
    console.error("[GuruJS] Gagal load data:", err);
    showToast("Gagal memuat data dari Firestore.", "error");
  }
}

// ---- Render Stats ----
function renderStats() {
  statTotalSiswa.textContent = allSiswaList.length;

  let keg1DoneCount = 0;
  Object.values(allProgresMap).forEach((p) => {
    if (p.kegiatan1Selesai) keg1DoneCount++;
  });
  statSelesaiKeg1.textContent = keg1DoneCount;

  const kuisEntries = Object.values(allHasilMap);
  statSelesaiKuis.textContent = kuisEntries.length;

  if (kuisEntries.length > 0) {
    const totalSkor = kuisEntries.reduce((sum, h) => sum + (h.skor || 0), 0);
    const avg = (totalSkor / kuisEntries.length).toFixed(1);
    statRataSkor.textContent = avg;
  } else {
    statRataSkor.textContent = "0";
  }
}

// ---- Render Table Siswa ----
function renderTableSiswa() {
  if (allSiswaList.length === 0) {
    tableSiswaBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:var(--space-xl);color:var(--text-secondary);">
          Belum ada akun siswa terdaftar. Tambahkan siswa baru di atas.
        </td>
      </tr>
    `;
    return;
  }

  let html = "";
  allSiswaList.forEach((s, idx) => {
    const roleClass = escapeHtml(s.role) === 'guru' ? 'guru' : '';
    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escapeHtml(s.nama)}</strong></td>
        <td>${escapeHtml(s.email || "-")}</td>
        <td><span class="badge badge-info">${escapeHtml(s.kelas || "-")}</span></td>
        <td><span class="badge-role ${roleClass}">${escapeHtml(s.role)}</span></td>
        <td>
          <button class="btn btn-danger btn-sm btn-delete-siswa" data-uid="${s.uid}" data-nama="${escapeHtml(s.nama)}">
            🗑 Hapus
          </button>
        </td>
      </tr>
    `;
  });

  tableSiswaBody.innerHTML = html;

  // Add delete listeners
  tableSiswaBody.querySelectorAll(".btn-delete-siswa").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const uid = e.target.dataset.uid;
      const nama = e.target.dataset.nama;

      if (confirm(`Apakah Anda yakin ingin menghapus data siswa "${nama}" dari database?`)) {
        await deleteStudentDoc(uid, nama);
      }
    });
  });
}

// ---- Render Table Progres ----
function renderTableProgres() {
  if (allSiswaList.length === 0) {
    tableProgresBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:var(--space-xl);color:var(--text-secondary);">
          Belum ada data siswa.
        </td>
      </tr>
    `;
    return;
  }

  let html = "";
  allSiswaList.forEach((s, idx) => {
    const prog = allProgresMap[s.uid] || {};
    
    // KB1 status
    const k1Score = prog.kegiatan1?.nilaiLatihan ?? (prog.kegiatan1Selesai ? 100 : null);
    const k1 = k1Score !== null 
      ? `<span class="badge ${k1Score >= 80 ? 'badge-success' : 'badge-warning'}">${k1Score >= 80 ? '✓' : '⚠️'} ${k1Score}/100</span>` 
      : '<span class="status-dot belum">Belum</span>';

    // KB2 status
    const k2Score = prog.kegiatan2?.nilaiLatihan ?? (prog.kegiatan2Selesai ? 100 : null);
    const k2 = k2Score !== null 
      ? `<span class="badge ${k2Score >= 80 ? 'badge-success' : 'badge-warning'}">${k2Score >= 80 ? '✓' : '⚠️'} ${k2Score}/100</span>` 
      : '<span class="status-dot belum">Belum</span>';

    // KB3 status
    const k3Score = prog.kegiatan3?.nilaiLatihan ?? (prog.kegiatan3Selesai ? 100 : null);
    const k3 = k3Score !== null 
      ? `<span class="badge ${k3Score >= 80 ? 'badge-success' : 'badge-warning'}">${k3Score >= 80 ? '✓' : '⚠️'} ${k3Score}/100</span>` 
      : '<span class="status-dot belum">Belum</span>';

    const k1Lolos = (prog.kegiatan1?.lolos || k1Score >= 80) || !!prog.kegiatan1Selesai;
    const k2Lolos = (prog.kegiatan2?.lolos || k2Score >= 80) || !!prog.kegiatan2Selesai;
    const k3Lolos = (prog.kegiatan3?.lolos || k3Score >= 80) || !!prog.kegiatan3Selesai;

    const doneCount = [k1Lolos, k2Lolos, k3Lolos].filter(Boolean).length;
    const progressColor = doneCount === 3 ? 'var(--success)' : (doneCount > 0 ? 'var(--primary)' : 'var(--text-secondary)');

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escapeHtml(s.nama)}</strong></td>
        <td><span class="badge badge-info">${escapeHtml(s.kelas || "-")}</span></td>
        <td>${k1}</td>
        <td>${k2}</td>
        <td>${k3}</td>
        <td><strong style="color:${progressColor};">${doneCount}/3 Lulus KKM</strong></td>
      </tr>
    `;
  });

  tableProgresBody.innerHTML = html;
}

// ---- Render Table Hasil Kuis & PDF Export ----
let currentKelasHasilFilter = "all";

function renderTableHasil() {
  const filteredSiswa = allSiswaList.filter((s) => {
    if (currentKelasHasilFilter === "all") return true;
    return (s.kelas || "").trim() === currentKelasHasilFilter;
  });

  // Calculate stats for summary chips
  let totalPeserta = filteredSiswa.length;
  let tuntasCount = 0;
  let belumTuntasCount = 0;
  let totalSkor = 0;
  let skorCount = 0;

  filteredSiswa.forEach((s) => {
    const hasil = allHasilMap[s.uid];
    if (hasil && typeof hasil.skor === "number") {
      skorCount++;
      totalSkor += hasil.skor;
      if (hasil.skor >= 75) tuntasCount++;
      else belumTuntasCount++;
    } else {
      belumTuntasCount++;
    }
  });

  const rataSkor = skorCount > 0 ? (totalSkor / skorCount).toFixed(1) : 0;

  // Update summary chips
  const chipTotal = document.getElementById("chip-total-siswa");
  const chipTuntas = document.getElementById("chip-tuntas-siswa");
  const chipBelum = document.getElementById("chip-belum-tuntas");
  const chipRata = document.getElementById("chip-rata-skor");

  if (chipTotal) chipTotal.textContent = totalPeserta;
  if (chipTuntas) chipTuntas.textContent = tuntasCount;
  if (chipBelum) chipBelum.textContent = belumTuntasCount;
  if (chipRata) chipRata.textContent = rataSkor;

  if (filteredSiswa.length === 0) {
    tableHasilBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:var(--space-xl);color:var(--text-secondary);">
          Tidak ada data siswa untuk kelas ini.
        </td>
      </tr>
    `;
    return;
  }

  let html = "";
  filteredSiswa.forEach((s, idx) => {
    const hasil = allHasilMap[s.uid];
    const isDone = !!hasil;
    const skor = isDone ? hasil.skor : "-";
    
    let statusLulus = '<span class="status-dot belum">Belum Kuis</span>';
    if (isDone) {
      if (hasil.skor >= 85) {
        statusLulus = '<span class="status-dot selesai">Sangat Baik (Tuntas)</span>';
      } else if (hasil.skor >= 75) {
        statusLulus = '<span class="status-dot selesai">Lulus (Tuntas)</span>';
      } else if (hasil.skor >= 60) {
        statusLulus = '<span class="status-dot warning">Cukup (Remedial)</span>';
      } else {
        statusLulus = '<span class="status-dot danger">Perlu Remedial</span>';
      }
    }

    const waktu = isDone && hasil.waktuSelesai ? formatTimestamp(hasil.waktuSelesai) : "-";
    const actionBtn = isDone
      ? `<button class="btn btn-secondary btn-sm" onclick="window.viewStudentAnswers('${s.uid}', '${escapeHtml(s.nama)}')" style="padding:4px 10px; font-weight:700;">👁️ Lihat Jawaban</button>`
      : `<span style="color:var(--text-muted); font-size:var(--fs-xs);">-</span>`;

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escapeHtml(s.nama)}</strong></td>
        <td><span class="badge badge-info">${escapeHtml(s.kelas || "-")}</span></td>
        <td><strong style="font-size:var(--fs-md);">${skor}</strong></td>
        <td>${statusLulus}</td>
        <td>${waktu}</td>
        <td>${actionBtn}</td>
      </tr>
    `;
  });

  tableHasilBody.innerHTML = html;
}

// Setup Event Listeners for Hasil & PDF Export
function setupHasilEventListeners() {
  // Filter Kelas Buttons
  const filterBtns = document.querySelectorAll(".btn-filter-kelas-hasil");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.className = "btn btn-secondary btn-sm btn-filter-kelas-hasil";
      });
      btn.className = "btn btn-primary btn-sm btn-filter-kelas-hasil";
      currentKelasHasilFilter = btn.dataset.kelas;
      renderTableHasil();
    });
  });

  // Refresh Button
  const btnRefresh = document.getElementById("btn-refresh-hasil");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      btnRefresh.disabled = true;
      btnRefresh.textContent = "Memuat…";
      await loadAllData();
      btnRefresh.disabled = false;
      btnRefresh.textContent = "🔄 Segarkan";
      showToast("Data hasil evaluasi berhasil diperbarui.", "info");
    });
  }

  // Export PDF Button
  const btnExportPdf = document.getElementById("btn-export-pdf");
  if (btnExportPdf) {
    btnExportPdf.addEventListener("click", () => {
      exportRekapToPdf();
    });
  }
}

// Function to generate and print Official PDF Report with KOP SURAT
function exportRekapToPdf() {
  const filteredSiswa = allSiswaList.filter((s) => {
    if (currentKelasHasilFilter === "all") return true;
    return (s.kelas || "").trim() === currentKelasHasilFilter;
  });

  if (filteredSiswa.length === 0) {
    alert("Tidak ada data siswa untuk diekspor.");
    return;
  }

  // Calculate statistics
  const totalPeserta = filteredSiswa.length;
  let sudahKuisCount = 0;
  let tuntasCount = 0;
  let belumTuntasCount = 0;
  let totalSkor = 0;
  let maxSkor = 0;
  let minSkor = 100;

  filteredSiswa.forEach((s) => {
    const hasil = allHasilMap[s.uid];
    if (hasil && typeof hasil.skor === "number") {
      sudahKuisCount++;
      totalSkor += hasil.skor;
      if (hasil.skor > maxSkor) maxSkor = hasil.skor;
      if (hasil.skor < minSkor) minSkor = hasil.skor;
      if (hasil.skor >= 75) tuntasCount++;
      else belumTuntasCount++;
    } else {
      belumTuntasCount++;
    }
  });

  if (sudahKuisCount === 0) minSkor = 0;
  const rataRata = sudahKuisCount > 0 ? (totalSkor / sudahKuisCount).toFixed(1) : "0";
  const persenTuntas = totalPeserta > 0 ? ((tuntasCount / totalPeserta) * 100).toFixed(1) : "0";
  const persenBelumTuntas = totalPeserta > 0 ? ((belumTuntasCount / totalPeserta) * 100).toFixed(1) : "0";

  const dateNow = new Date();
  const optionsDate = { day: "numeric", month: "long", year: "numeric" };
  const tanggalCetak = dateNow.toLocaleDateString("id-ID", optionsDate);

  const kelasLabel = currentKelasHasilFilter === "all" ? "Semua Kelas (XI RPL)" : currentKelasHasilFilter;

  // Build Table Rows
  let tableRows = "";
  filteredSiswa.forEach((s, idx) => {
    const hasil = allHasilMap[s.uid];
    const isDone = !!hasil;
    const skor = isDone ? hasil.skor : "-";
    const statusText = isDone 
      ? (hasil.skor >= 75 ? '<strong style="color:#047857;">TUNTAS</strong>' : '<span style="color:#b91c1c;">BELUM TUNTAS</span>')
      : '<span style="color:#64748b;">BELUM KUIS</span>';
    const waktuText = isDone && hasil.waktuSelesai ? formatTimestamp(hasil.waktuSelesai) : "-";

    tableRows += `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${escapeHtml(s.nama)}</strong></td>
        <td style="text-align:center;">${escapeHtml(s.email || "-")}</td>
        <td style="text-align:center;">${escapeHtml(s.kelas || "-")}</td>
        <td style="text-align:center; font-size:11pt;"><strong>${skor}</strong></td>
        <td style="text-align:center;">${statusText}</td>
        <td style="text-align:center; font-size:8.5pt;">${waktuText}</td>
        <td style="text-align:center;"></td>
      </tr>
    `;
  });

  // Full Printable HTML Document with Official KOP SURAT
  const printContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rekap Hasil Evaluasi SQL - SMK Negeri 1 Sintuk Toboh Gadang</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Times, serif;
    }
    body {
      color: #000;
      background: #fff;
      font-size: 11pt;
      line-height: 1.3;
      padding: 10px 20px;
    }
    /* KOP SURAT RESMI */
    .kop-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      padding-bottom: 4px;
    }
    .kop-logo {
      width: 75px;
      height: 75px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .kop-text {
      text-align: center;
      flex: 1;
    }
    .kop-text h4 {
      font-size: 11.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }
    .kop-text h3 {
      font-size: 12.5pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .kop-text h2 {
      font-size: 15pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 2px 0;
    }
    .kop-text p {
      font-size: 8.5pt;
      margin: 2px 0 0 0;
      line-height: 1.35;
      font-style: italic;
    }
    /* Garis Ganda Kop Surat */
    .kop-divider {
      border-top: 3px solid #000;
      border-bottom: 1px solid #000;
      height: 3px;
      margin: 4px 0 16px 0;
    }

    /* JUDUL DOKUMEN */
    .doc-title-box {
      text-align: center;
      margin-bottom: 16px;
    }
    .doc-title {
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .doc-subtitle {
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* METADATA TABLE */
    .meta-table {
      width: 100%;
      margin-bottom: 14px;
      font-size: 10pt;
      border-collapse: collapse;
    }
    .meta-table td {
      padding: 3px 6px;
      vertical-align: top;
    }

    /* STATISTIK SUMMARY BOX */
    .stats-box {
      width: 100%;
      border: 1px solid #000;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 9.5pt;
    }
    .stats-box th, .stats-box td {
      border: 1px solid #000;
      padding: 5px 8px;
      text-align: center;
    }
    .stats-box th {
      background-color: #f1f5f9;
      font-weight: bold;
    }

    /* DATA TABLE */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 9pt;
    }
    .data-table th, .data-table td {
      border: 1px solid #000;
      padding: 5px 6px;
    }
    .data-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      font-size: 8.5pt;
    }

    /* TANDA TANGAN */
    .signature-container {
      width: 100%;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      font-size: 10.5pt;
    }
    .signature-block {
      width: 45%;
      text-align: center;
    }
    .signature-space {
      height: 65px;
    }
    .signature-name {
      font-weight: bold;
      text-decoration: underline;
    }

    /* ACTION BAR FOR PRINT PREVIEW */
    .no-print-bar {
      background: #1e293b;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1000;
      font-family: sans-serif;
      margin: -10px -20px 20px -20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .no-print-bar button {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 8px 18px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    .no-print-bar button:hover {
      background: #1d4ed8;
    }

    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <!-- No-Print Bar (Hanya tampil di preview layar, otomatis hilang saat diprint/save PDF) -->
  <div class="no-print-bar">
    <div>
      <strong>🖨️ Pratinjau Dokumen Rekap Evaluasi SQL</strong> — Siap dicetak atau disimpan sebagai file PDF resmi.
    </div>
    <div style="display:flex; gap:10px;">
      <button onclick="window.print()">📥 Cetak / Simpan PDF</button>
      <button onclick="window.close()" style="background:#64748b;">✕ Tutup</button>
    </div>
  </div>

  <!-- KOP SURAT RESMI SEKOLAH -->
  <div class="kop-container">
    <!-- Logo 1: Lambang Tut Wuri Handayani / Pemprov -->
    <svg class="kop-logo" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="#1e3a8a" stroke="#d97706" stroke-width="3"/>
      <polygon points="50,15 61,38 85,38 66,54 73,78 50,63 27,78 34,54 15,38 39,38" fill="#f59e0b"/>
      <circle cx="50" cy="50" r="16" fill="#ffffff"/>
      <text x="50" y="55" font-size="12" font-weight="bold" fill="#1e3a8a" text-anchor="middle" font-family="sans-serif">SMK</text>
    </svg>

    <div class="kop-text">
      <h4>PEMERINTAH PROVINSI SUMATERA BARAT</h4>
      <h3>DINAS PENDIDIKAN</h3>
      <h4>CABANG DINAS PENDIDIKAN WILAYAH II (PARIAMAN & PADANG PARIAMAN)</h4>
      <h2>SMK NEGERI 1 SINTUK TOBOH GADANG</h2>
      <p>
        Jl. Raya Padang - Bukittinggi Km. 39, Sintuk, Kec. Sintuk Toboh Gadang, Kab. Padang Pariaman, Sumbar 25584<br>
        Telepon: (0751) 96328 • NPSN: 10307730 • Email: smkn1sintuk@gmail.com • Laman: https://smkn1stg.sch.id
      </p>
    </div>

    <!-- Logo 2: Lambang RPL / SQL -->
    <svg class="kop-logo" viewBox="0 0 100 100">
      <rect x="8" y="8" width="84" height="84" rx="18" fill="#047857" stroke="#fbbf24" stroke-width="3"/>
      <path d="M30 35 L50 20 L70 35 L70 65 L50 80 L30 65 Z" fill="#ffffff" opacity="0.9"/>
      <text x="50" y="47" font-size="11" font-weight="900" fill="#047857" text-anchor="middle" font-family="sans-serif">SQL</text>
      <text x="50" y="60" font-size="9" font-weight="bold" fill="#047857" text-anchor="middle" font-family="sans-serif">RPL</text>
    </svg>
  </div>

  <div class="kop-divider"></div>

  <!-- JUDUL DOKUMEN -->
  <div class="doc-title-box">
    <h3 class="doc-title">LAPORAN REKAPITULASI HASIL EVALUASI PEMBELAJARAN SISWA</h3>
    <div class="doc-subtitle">MEDIA PEMBELAJARAN E-MODUL INTERAKTIF SQL (DDL, DML, DCL)</div>
    <div style="font-size:10pt; margin-top:2px;">TAHUN AJARAN 2025/2026</div>
  </div>

  <!-- INFORMASI ADMINISTRASI -->
  <table class="meta-table">
    <tr>
      <td width="22%"><strong>Mata Pelajaran</strong></td>
      <td width="35%">: Basis Data (Structured Query Language)</td>
      <td width="23%"><strong>Kriteria Ketuntasan (KKM)</strong></td>
      <td width="20%">: <strong>75 Poin</strong></td>
    </tr>
    <tr>
      <td><strong>Satuan Pendidikan</strong></td>
      <td>: SMK Negeri 1 Sintuk Toboh Gadang</td>
      <td><strong>Kelas / Rombel</strong></td>
      <td>: ${escapeHtml(kelasLabel)}</td>
    </tr>
    <tr>
      <td><strong>Program Keahlian</strong></td>
      <td>: Rekayasa Perangkat Lunak (RPL)</td>
      <td><strong>Tanggal Rekapitulasi</strong></td>
      <td>: ${tanggalCetak}</td>
    </tr>
  </table>

  <!-- RINGKASAN STATISTIK -->
  <table class="stats-box">
    <thead>
      <tr>
        <th>Total Siswa</th>
        <th>Sudah Evaluasi</th>
        <th>Tuntas (≥ 75)</th>
        <th>Belum Tuntas (&lt; 75)</th>
        <th>Nilai Rata-Rata</th>
        <th>Nilai Tertinggi</th>
        <th>Nilai Terendah</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${totalPeserta}</strong> Siswa</td>
        <td><strong>${sudahKuisCount}</strong> Siswa</td>
        <td><strong style="color:#047857;">${tuntasCount}</strong> (${persenTuntas}%)</td>
        <td><strong style="color:#b91c1c;">${belumTuntasCount}</strong> (${persenBelumTuntas}%)</td>
        <td><strong>${rataRata}</strong> / 100</td>
        <td><strong>${maxSkor}</strong></td>
        <td><strong>${minSkor}</strong></td>
      </tr>
    </tbody>
  </table>

  <!-- TABEL HASIL EVALUASI SISWA -->
  <table class="data-table">
    <thead>
      <tr>
        <th width="5%">No</th>
        <th width="24%">Nama Lengkap Siswa</th>
        <th width="18%">NISN / Email Login</th>
        <th width="10%">Kelas</th>
        <th width="10%">Nilai (0-100)</th>
        <th width="15%">Keterangan KKM</th>
        <th width="12%">Waktu Selesai</th>
        <th width="6%">Paraf</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- TANDA TANGAN & PENGESAHAN -->
  <div class="signature-container">
    <div class="signature-block">
      <div>Mengetahui,</div>
      <div>Kepala SMK Negeri 1 Sintuk Toboh Gadang</div>
      <div class="signature-space"></div>
      <div class="signature-name">Drs. Busraini, M.Pd</div>
      <div>NIP. 19680512 199403 1 004</div>
    </div>

    <div class="signature-block">
      <div>Sintuk Toboh Gadang, ${tanggalCetak}</div>
      <div>Guru Mata Pelajaran / Peneliti,</div>
      <div class="signature-space"></div>
      <div class="signature-name">Guru Basis Data / RPL</div>
      <div>NIP. ....................................................</div>
    </div>
  </div>

</body>
</html>
  `;

  // Open in dedicated printable window
  const printWindow = window.open("", "_blank", "width=950,height=800");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  } else {
    alert("Pop-up diblokir oleh browser. Silakan izinkan pop-up untuk mengunduh/mencetak dokumen PDF.");
  }
}

// Window helper to view student answer modal
window.viewStudentAnswers = function(uid, nama) {
  const hasil = allHasilMap[uid];
  if (!hasil) {
    alert("Siswa belum mengerjakan kuis.");
    return;
  }

  const modal = document.getElementById("modal-detail-jawaban");
  const modalName = document.getElementById("detail-student-name");
  const modalScore = document.getElementById("detail-student-score");
  const container = document.getElementById("detail-answers-container");

  modalName.textContent = nama;
  modalScore.textContent = `Skor Akhir: ${hasil.skor} • Kelas: ${hasil.kelas || '-'}`;

  const jawabanSiswa = hasil.jawabanSiswa || [];
  let html = "";

  kuisQuestions.forEach((q, i) => {
    const isEsai = q.tipe === "esai";
    const jwb = jawabanSiswa[i];

    if (isEsai) {
      html += `
        <div style="background:hsl(220, 20%, 98%); border-radius:var(--radius-lg); padding:var(--space-lg);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-sm);">
            <strong style="color:var(--primary); font-size:var(--fs-sm);">Soal #${i + 1} (Esai / Uraian)</strong>
            <span class="badge badge-info" style="font-size:10px;">Soal Esai</span>
          </div>
          <p style="font-weight:700; font-size:var(--fs-sm); margin-bottom:var(--space-md);">${escapeHtml(q.pertanyaan)}</p>
          
          <div style="background:#ffffff; border-radius:var(--radius-md); padding:var(--space-md); border:1px solid var(--border-light); margin-bottom:var(--space-sm);">
            <strong style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; display:block; margin-bottom:2px;">Jawaban Siswa:</strong>
            <p style="margin:0; font-size:var(--fs-sm); color:var(--text-primary); white-space:pre-wrap; line-height:1.6;">${escapeHtml(jwb || '(Kosong / Tidak Dijawab)')}</p>
          </div>

          <div style="background:hsla(152, 65%, 40%, 0.06); border-radius:var(--radius-md); padding:var(--space-md); border:1px solid hsla(152, 65%, 40%, 0.2);">
            <strong style="font-size:11px; color:var(--success); text-transform:uppercase; display:block; margin-bottom:2px;">Kunci Jawaban Acuan Guru:</strong>
            <p style="margin:0; font-size:var(--fs-sm); color:var(--text-primary); white-space:pre-wrap; line-height:1.6;">${escapeHtml(q.kunciJawaban || '-')}</p>
          </div>
        </div>
      `;
    } else {
      const isCorrect = jwb === q.jawabanBenarIndex;
      const opsiList = q.opsi || [];
      html += `
        <div style="background:hsl(220, 20%, 98%); border-radius:var(--radius-lg); padding:var(--space-lg);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-sm);">
            <strong style="color:var(--primary); font-size:var(--fs-sm);">Soal #${i + 1} (Pilihan Ganda)</strong>
            <span class="badge ${isCorrect ? 'badge-success' : 'badge-danger'}" style="font-size:10px;">
              ${isCorrect ? '✓ Benar' : '✗ Salah'}
            </span>
          </div>
          <p style="font-weight:700; font-size:var(--fs-sm); margin-bottom:var(--space-md);">${escapeHtml(q.pertanyaan)}</p>
          
          <div style="font-size:var(--fs-sm);">
            <div style="color:${isCorrect ? 'var(--success)' : 'var(--error)'}; margin-bottom:4px;">
              Jawaban Siswa: <strong>${jwb >= 0 ? `${String.fromCharCode(65 + jwb)}. ${escapeHtml(opsiList[jwb] || '')}` : '(Belum Dijawab)'}</strong>
            </div>
            ${!isCorrect ? `<div style="color:var(--success);">Kunci Benar: <strong>${String.fromCharCode(65 + (q.jawabanBenarIndex || 0))}. ${escapeHtml(opsiList[q.jawabanBenarIndex || 0] || '')}</strong></div>` : ''}
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
  modal.style.display = "flex";
};

// ---- Form Add Student Submit ----
formAddStudent.addEventListener("submit", async (e) => {
  e.preventDefault();
  addStudentError.classList.remove("visible");

  const nama = document.getElementById("new-nama").value.trim();
  const email = document.getElementById("new-email").value.trim();
  const kelas = document.getElementById("new-kelas").value;
  const password = document.getElementById("new-password").value.trim();

  if (!nama || !email || !password) {
    showAddError("Semua field wajib diisi.");
    return;
  }

  setAddLoading(true);


  try {
    // 1. Buat akun Auth via secondaryAuth agar Guru tidak ter-logout
    if (!secondaryAuth) {
      throw new Error("Secondary auth engine not ready.");
    }

    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUid = cred.user.uid;

    // Immediately sign out secondary auth
    await secondarySignOut(secondaryAuth);

    // 2. Simpan dokumen user ke Firestore via primary db
    await setDoc(doc(db, "users", newUid), {
      nama: nama,
      email: email,
      kelas: kelas,
      role: "siswa",
      createdAt: serverTimestamp()
    });

    // 3. Inisialisasi dokumen progres
    await setDoc(doc(db, "progres", newUid), {
      kegiatan1Selesai: false,
      kegiatan2Selesai: false,
      kegiatan3Selesai: false,
      latihanSelesai: []
    });

    showToast(`✅ Akun siswa "${nama}" berhasil dibuat!`, "success");

    // Reset form
    formAddStudent.reset();
    document.getElementById("new-password").value = "smk123456";

    // Reload list
    await loadAllData();

  } catch (err) {
    console.error("[GuruJS] Gagal buat akun siswa:", err);
    let msg = "Gagal membuat akun siswa: " + err.message;
    if (err.code === "auth/email-already-exists") {
      msg = "Email tersebut sudah terdaftar di sistem.";
    }
    showAddError(msg);
  } finally {
    setAddLoading(false);
  }
});

// ---- Event Listeners for Quiz Actions ----
if (btnApplyComposition) {
  btnApplyComposition.addEventListener("click", () => {
    const targetPg = parseInt(inputCountPg.value) || 0;
    const targetEsai = parseInt(inputCountEsai.value) || 0;

    if (targetPg < 0 || targetEsai < 0) {
      alert("Jumlah soal tidak boleh bernilai negatif.");
      return;
    }

    if (targetPg + targetEsai === 0) {
      alert("Jumlah total soal minimal 1 butir (Pilihan Ganda atau Esai).");
      return;
    }

    applyQuestionComposition(targetPg, targetEsai);
  });
}

if (btnAddPg) {
  btnAddPg.addEventListener("click", () => {
    addQuestion("pilihan_ganda");
  });
}

if (btnAddEsai) {
  btnAddEsai.addEventListener("click", () => {
    addQuestion("esai");
  });
}

if (btnToggleStatus) {
  btnToggleStatus.addEventListener("click", async () => {
    await toggleKuisStatus();
  });
}

// Form Manage Kuis Submit (Publish / Approve)
if (formManageKuis) {
  formManageKuis.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveKuisData("published");
  });
}

// Draft button handler
if (btnDraftKuis) {
  btnDraftKuis.addEventListener("click", async () => {
    await saveKuisData("draft");
  });
}

// ---- Delete Student Doc ----
async function deleteStudentDoc(uid, nama) {
  try {
    await deleteDoc(doc(db, "users", uid));
    await deleteDoc(doc(db, "progres", uid));

    showToast(`🗑 Data siswa "${nama}" telah dihapus dari database.`, "info");
    await loadAllData();
  } catch (err) {
    console.error("[GuruJS] Gagal hapus siswa:", err);
    showToast("Gagal menghapus data siswa.", "error");
  }
}

// ============================================
// LOGIC KELOLA SOAL KUIS (FIRESTORE)
// ============================================

// ---- Load Kuis Data ----
async function loadKuisData() {
  try {
    const kuisRef = doc(db, "kuis", KUIS_ID);
    const kuisSnap = await getDoc(kuisRef);
    if (kuisSnap.exists()) {
      const data = kuisSnap.data();
      savedQuestions = data.soal || [];
      kuisStatus = data.status || "draft";
    } else {
      savedQuestions = [];
      kuisStatus = "draft";
    }

    // Normalize saved questions without `tipe`
    savedQuestions.forEach((q) => {
      if (!q.tipe) {
        q.tipe = (q.opsi && q.opsi.length > 0) ? "pilihan_ganda" : "esai";
      }
    });

    // Biarkan editor kosong terlebih dahulu saat awal masuk
    kuisQuestions = [];

    updateKuisStatusUI();
    updateKuisSummaryUI();
    renderQuestionCards();

  } catch (err) {
    console.error("[GuruJS] Gagal load data kuis:", err);
    showKuisError("Gagal memuat data kuis: " + err.message);
  }
}

// ---- Update Kuis Status UI ----
function updateKuisStatusUI() {
  if (!kuisStatusDot || !kuisStatusText || !btnToggleStatus) return;

  if (kuisStatus === "published") {
    kuisStatusDot.style.background = "var(--success)";
    kuisStatusText.innerHTML = `
      <span style="color:var(--success); font-weight:800;">🟢 AKTIF / DIBUKA</span>
      <span style="font-size:11px; font-weight:600; color:var(--text-secondary);"> (Siswa dapat mengerjakan)</span>
    `;
    btnToggleStatus.textContent = "🔒 Tutup Ujian (Set Draft)";
    btnToggleStatus.className = "btn btn-secondary";
  } else {
    kuisStatusDot.style.background = "var(--error)";
    kuisStatusText.innerHTML = `
      <span style="color:var(--error); font-weight:800;">🔴 DRAFT / DITUTUP</span>
      <span style="font-size:11px; font-weight:600; color:var(--text-secondary);"> (Terkunci untuk siswa)</span>
    `;
    btnToggleStatus.textContent = "🚀 Buka Akses Ujian (Publish)";
    btnToggleStatus.className = "btn btn-primary btn-sm";
  }
}

// ---- Update Summary Chips & Inputs ----
function updateKuisSummaryUI() {
  const count = kuisQuestions.length;
  const pgCount = kuisQuestions.filter(q => q.tipe === "pilihan_ganda").length;
  const esaiCount = kuisQuestions.filter(q => q.tipe === "esai").length;

  if (summaryTotalSoal) {
    if (count === 0) {
      summaryTotalSoal.innerHTML = `<span>0 Butir</span><span style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block;">(Belum Digenerate)</span>`;
    } else {
      summaryTotalSoal.innerHTML = `
        <span>${count} Butir</span>
        <span style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block;">(${pgCount} PG, ${esaiCount} Esai)</span>
      `;
    }
  }
  if (summaryBobotSoal) {
    const bobot = count > 0 ? (100 / count).toFixed(100 % count === 0 ? 0 : 1) : 0;
    summaryBobotSoal.textContent = `${bobot} Poin / Soal`;
  }

  // Sync inputs with active questions if currently generated
  if (count > 0) {
    if (inputCountPg && document.activeElement !== inputCountPg) {
      inputCountPg.value = pgCount;
    }
    if (inputCountEsai && document.activeElement !== inputCountEsai) {
      inputCountEsai.value = esaiCount;
    }
  }
}

// ---- Apply Question Composition (Multi-Slot Generator untuk Input Manual) ----
function applyQuestionComposition(targetPg, targetEsai) {
  // Selalu buat slot kartu kosong yang baru untuk input manual guru
  const newPg = [];
  for (let i = 0; i < targetPg; i++) {
    newPg.push({
      tipe: "pilihan_ganda",
      pertanyaan: "",
      opsi: ["", "", "", ""],
      jawabanBenarIndex: 0
    });
  }

  const newEsai = [];
  for (let j = 0; j < targetEsai; j++) {
    newEsai.push({
      tipe: "esai",
      pertanyaan: "",
      kunciJawaban: ""
    });
  }

  kuisQuestions = [...newPg, ...newEsai];
  renderQuestionCards();
  updateKuisSummaryUI();

  // Scroll to first question smoothly
  setTimeout(() => {
    const firstCard = document.getElementById("q-card-0");
    if (firstCard) {
      firstCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);

  showToast(`📋 Berhasil menyiapkan ${targetPg + targetEsai} slot lembar soal kosong (${targetPg} PG & ${targetEsai} Esai). Silakan isi pertanyaan secara manual.`, "success");
}

// Global helper to load saved questions
window.loadSavedQuestionsIntoEditor = function() {
  if (!savedQuestions || savedQuestions.length === 0) {
    alert("Belum ada data butir soal yang tersimpan di database.");
    return;
  }
  kuisQuestions = JSON.parse(JSON.stringify(savedQuestions));
  renderQuestionCards();
  showToast(`📥 Berhasil memuat ${kuisQuestions.length} butir soal yang tersimpan di database.`, "info");
};

// Global helper to add a single question
window.addSingleQuestion = function(tipe) {
  addQuestion(tipe);
};

// ---- Toggle Kuis Status directly ----
async function toggleKuisStatus() {
  const newStatus = kuisStatus === "published" ? "draft" : "published";
  try {
    const kuisRef = doc(db, "kuis", KUIS_ID);
    await setDoc(kuisRef, { status: newStatus }, { merge: true });
    kuisStatus = newStatus;
    updateKuisStatusUI();
    showToast(newStatus === "published" ? "🚀 Kuis evaluasi telah AKTIF dan bisa diakses siswa!" : "🔒 Kuis evaluasi telah DITUTUP (Draft).", "success");
  } catch (err) {
    console.error("[GuruJS] Gagal ubah status:", err);
    showToast("Gagal mengubah status kuis: " + err.message, "error");
  }
}

// ---- Render All Question Cards ----
function renderQuestionCards() {
  if (!generatedContainer || !formManageKuis) return;

  // Empty state if 0 questions
  if (kuisQuestions.length === 0) {
    if (quizEditorActions) quizEditorActions.style.display = "none";

    const savedCount = savedQuestions.length;
    const savedPg = savedQuestions.filter(q => q.tipe !== "esai").length;
    const savedEsai = savedQuestions.filter(q => q.tipe === "esai").length;

    generatedContainer.innerHTML = `
      <div style="text-align:center; padding:var(--space-3xl) var(--space-xl); background:#ffffff; border-radius:var(--radius-xl); box-shadow:0 4px 20px -2px rgba(0,0,0,0.04); border:2px dashed var(--border-light); margin-bottom:var(--space-md);">
        <img src="assets/images/3d-icons/clipboard.png" style="width:68px; height:68px; object-fit:contain; margin-bottom:var(--space-md);" alt="">
        <h3 style="font-size:var(--fs-lg); font-weight:800; color:var(--text-primary); margin:0 0 6px 0;">Lembar Soal Masih Kosong</h3>
        <p style="color:var(--text-secondary); font-size:var(--fs-sm); max-width:560px; margin:0 auto var(--space-lg) auto; line-height:1.6;">
          Area pembuatan soal belum memiliki butir soal. Anda dapat menentukan jumlah slot soal pada kotak di atas lalu klik <strong>"📋 Buat Slot Lembar Soal"</strong>, atau langsung klik tombol tambah soal manual di bawah.
        </p>

        <div style="display:flex; justify-content:center; gap:var(--space-md); flex-wrap:wrap; margin-bottom:var(--space-lg);">
          <button type="button" class="btn btn-secondary" onclick="window.addSingleQuestion('pilihan_ganda')" style="font-weight:700; border:1.5px dashed var(--primary); color:var(--primary);">
            🔘 + Tambah 1 Soal Pilihan Ganda
          </button>
          <button type="button" class="btn btn-secondary" onclick="window.addSingleQuestion('esai')" style="font-weight:700; border:1.5px dashed var(--secondary-dark); color:var(--secondary-dark);">
            📝 + Tambah 1 Soal Esai
          </button>
        </div>

        ${savedCount > 0 ? `
          <div style="padding-top:var(--space-md); border-top:1px dashed var(--border-light); max-width:460px; margin:0 auto;">
            <button type="button" class="btn btn-ghost" onclick="window.loadSavedQuestionsIntoEditor()" style="font-weight:700; width:100%; display:flex; align-items:center; justify-content:center; gap:8px; border:1px solid var(--border); color:var(--text-secondary);">
              <span>📥</span> Muat ${savedCount} Soal yang Tersimpan Sebelumnya (${savedPg} PG, ${savedEsai} Esai)
            </button>
            <span style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;">Klik jika Anda ingin mengedit kuis yang sudah pernah disimpan di database</span>
          </div>
        ` : ''}
      </div>
    `;
    formManageKuis.style.display = "block";
    updateKuisSummaryUI();
    return;
  }

  // If questions exist, show actions & cards
  if (quizEditorActions) quizEditorActions.style.display = "block";

  const count = kuisQuestions.length;
  const bobotPerSoal = count > 0 ? (100 / count).toFixed(100 % count === 0 ? 0 : 1) : 0;

  let html = "";
  kuisQuestions.forEach((qData, i) => {
    const isEsai = qData.tipe === "esai";
    const letters = ["A", "B", "C", "D"];
    const kunci = qData.jawabanBenarIndex !== undefined ? qData.jawabanBenarIndex : 0;

    let bodyHtml = "";

    if (isEsai) {
      // Body for Essay
      bodyHtml = `
        <div style="background:hsla(165, 80%, 38%, 0.04); border-radius:var(--radius-lg); padding:var(--space-lg); border:1.5px dashed hsla(165, 80%, 38%, 0.25);">
          <label class="form-label" style="font-size:var(--fs-xs); font-weight:700; color:var(--secondary-dark); text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
            <span>📝 Kunci Jawaban / Rubrik Penilaian Acuan Guru:</span>
          </label>
          <textarea class="form-input" rows="3" placeholder="Tuliskan poin-poin kunci jawaban atau pembahasan benar sebagai acuan penilaian soal esai ini..." oninput="window.updateKunciEsaiText(${i}, this.value)" required style="resize:vertical; font-family:inherit; padding:var(--space-md); font-size:var(--fs-sm); line-height:1.6; background:#ffffff; border:1px solid var(--border-light);">${escapeHtml(qData.kunciJawaban || "")}</textarea>
          <span style="font-size:11px; color:var(--text-secondary); margin-top:4px; display:block;">
            💡 Kunci jawaban ini akan menjadi acuan pembahasan bagi siswa setelah mengumpulkan ujian.
          </span>
        </div>
      `;
    } else {
      // Body for Multiple Choice
      let opsiHtml = "";
      letters.forEach((letter, optIdx) => {
        const isSelectedKey = kunci === optIdx;
        const optVal = qData.opsi && qData.opsi[optIdx] !== undefined ? qData.opsi[optIdx] : "";

        opsiHtml += `
          <div class="q-option-box" style="padding:var(--space-md); border-radius:var(--radius-lg); background:${isSelectedKey ? 'hsla(152, 65%, 40%, 0.08)' : 'hsl(220, 20%, 98%)'}; border:1.5px solid ${isSelectedKey ? 'var(--success)' : 'transparent'}; transition:all 0.2s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-weight:700; font-size:var(--fs-sm); color:${isSelectedKey ? 'var(--success)' : 'var(--text-primary)'};">
                <input type="radio" name="kunci_radio_${i}" value="${optIdx}" ${isSelectedKey ? 'checked' : ''} onchange="window.selectKunciJawaban(${i}, ${optIdx})" style="width:18px; height:18px; accent-color:var(--success); cursor:pointer;">
                <span style="background:${isSelectedKey ? 'var(--success)' : 'var(--primary)'}; color:#fff; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:800;">${letter}</span>
                Pilihan ${letter}
              </label>
              ${isSelectedKey ? '<span style="font-size:11px; font-weight:800; color:var(--success); background:var(--success-subtle); padding:2px 8px; border-radius:var(--radius-full);">✓ KUNCI BENAR</span>' : '<span style="font-size:11px; color:var(--text-muted); cursor:pointer;" onclick="window.selectKunciJawaban(' + i + ', ' + optIdx + ')">Klik radio untuk kunci</span>'}
            </div>
            <input class="form-input q-opt-input" type="text" placeholder="Ketik isi pilihan jawaban ${letter}..." value="${escapeHtml(optVal)}" oninput="window.updateOpsiText(${i}, ${optIdx}, this.value)" required style="background:#ffffff; border:1px solid var(--border-light); font-size:var(--fs-sm);">
          </div>
        `;
      });

      bodyHtml = `
        <div>
          <div style="font-size:var(--fs-xs); font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:var(--space-sm);">
            Pilihan Jawaban & Kunci (Klik radio untuk menandai kunci benar):
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:var(--space-md);">
            ${opsiHtml}
          </div>
        </div>
      `;
    }

    html += `
      <div class="question-card" id="q-card-${i}" style="background:#ffffff; border-radius:var(--radius-xl); padding:var(--space-xl); box-shadow:0 4px 20px -2px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:var(--space-lg); position:relative;">
        
        <!-- Header Card -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-sm); border-bottom:1px solid var(--border-light); padding-bottom:var(--space-md);">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="background:linear-gradient(135deg, var(--primary), var(--primary-light)); color:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:var(--fs-xs);">${i + 1}</span>
            <strong style="font-size:var(--fs-base); color:var(--text-primary);">Soal #${i + 1}</strong>
            
            <!-- Type Selector Dropdown -->
            <select class="form-input" onchange="window.changeQuestionType(${i}, this.value)" style="width:auto; padding:4px 12px; font-size:var(--fs-xs); font-weight:700; border-radius:var(--radius-full); background:hsl(220, 20%, 96%); border:none; color:var(--text-primary); cursor:pointer;">
              <option value="pilihan_ganda" ${!isEsai ? 'selected' : ''}>🔘 Pilihan Ganda (Objektif)</option>
              <option value="esai" ${isEsai ? 'selected' : ''}>📝 Esai / Uraian</option>
            </select>

            <span class="badge badge-info" style="font-size:10px; font-weight:700;">+${bobotPerSoal} Poin</span>
          </div>

          <button type="button" class="btn btn-ghost" onclick="window.handleDeleteQuestion(${i})" style="color:var(--error); padding:4px 10px; font-size:var(--fs-xs); font-weight:700; border-radius:var(--radius-md);" title="Hapus butir soal ini">
            🗑️ Hapus Soal
          </button>
        </div>

        <!-- Pertanyaan Textarea -->
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:var(--fs-xs); font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Teks Soal Pertanyaan</label>
          <textarea class="form-input" rows="3" placeholder="Tuliskan pertanyaan soal #${i + 1} di sini..." oninput="window.updatePertanyaanText(${i}, this.value)" required style="resize:vertical; font-family:inherit; padding:var(--space-md); font-size:var(--fs-sm); line-height:1.6; background:hsl(220,20%,98.5%); border:1px solid var(--border-light);">${escapeHtml(qData.pertanyaan)}</textarea>
        </div>

        <!-- Dynamic Body (PG / Esai) -->
        ${bodyHtml}

      </div>
    `;
  });

  generatedContainer.innerHTML = html;
  formManageKuis.style.display = "block";
  updateKuisSummaryUI();
}

// Global window helpers for inline events
window.changeQuestionType = function(qIndex, newType) {
  if (!kuisQuestions[qIndex]) return;
  kuisQuestions[qIndex].tipe = newType;
  if (newType === "pilihan_ganda" && (!kuisQuestions[qIndex].opsi || kuisQuestions[qIndex].opsi.length < 4)) {
    kuisQuestions[qIndex].opsi = ["", "", "", ""];
    kuisQuestions[qIndex].jawabanBenarIndex = 0;
  }
  if (newType === "esai" && !kuisQuestions[qIndex].kunciJawaban) {
    kuisQuestions[qIndex].kunciJawaban = "";
  }
  renderQuestionCards();
};

window.selectKunciJawaban = function(qIndex, keyIndex) {
  if (kuisQuestions[qIndex]) {
    kuisQuestions[qIndex].jawabanBenarIndex = keyIndex;
    renderQuestionCards();
  }
};

window.updatePertanyaanText = function(qIndex, text) {
  if (kuisQuestions[qIndex]) {
    kuisQuestions[qIndex].pertanyaan = text;
  }
};

window.updateOpsiText = function(qIndex, optIndex, text) {
  if (kuisQuestions[qIndex] && kuisQuestions[qIndex].opsi) {
    kuisQuestions[qIndex].opsi[optIndex] = text;
  }
};

window.updateKunciEsaiText = function(qIndex, text) {
  if (kuisQuestions[qIndex]) {
    kuisQuestions[qIndex].kunciJawaban = text;
  }
};

window.handleDeleteQuestion = function(index) {
  if (kuisQuestions.length <= 1) {
    alert("Kuis harus memiliki minimal 1 butir soal.");
    return;
  }
  if (confirm(`Apakah Anda yakin ingin menghapus Soal #${index + 1}?`)) {
    kuisQuestions.splice(index, 1);
    renderQuestionCards();
    showToast(`🗑 Soal #${index + 1} telah dihapus.`, "info");
  }
};

// ---- Add New Question ----
function addQuestion(tipe = "pilihan_ganda") {
  if (tipe === "esai") {
    kuisQuestions.push({
      tipe: "esai",
      pertanyaan: "",
      kunciJawaban: ""
    });
  } else {
    kuisQuestions.push({
      tipe: "pilihan_ganda",
      pertanyaan: "",
      opsi: ["", "", "", ""],
      jawabanBenarIndex: 0
    });
  }

  renderQuestionCards();

  // Scroll to bottom question
  setTimeout(() => {
    const lastCard = document.getElementById(`q-card-${kuisQuestions.length - 1}`);
    if (lastCard) {
      lastCard.scrollIntoView({ behavior: "smooth", block: "center" });
      const textarea = lastCard.querySelector("textarea");
      if (textarea) textarea.focus();
    }
  }, 100);

  showToast(`✨ Soal baru (${tipe === 'esai' ? 'Esai / Uraian' : 'Pilihan Ganda'}) berhasil ditambahkan!`, "info");
}

// ---- Save Kuis Data ----
async function saveKuisData(status) {
  if (manageKuisError) manageKuisError.classList.remove("visible");

  try {
    // Validate
    if (kuisQuestions.length === 0) {
      throw new Error("Kuis harus memiliki minimal 1 butir soal.");
    }

    for (let i = 0; i < kuisQuestions.length; i++) {
      const q = kuisQuestions[i];
      if (!q.pertanyaan || !q.pertanyaan.trim()) {
        throw new Error(`Teks pertanyaan Soal #${i + 1} masih kosong.`);
      }

      if (q.tipe === "esai") {
        if (!q.kunciJawaban || !q.kunciJawaban.trim()) {
          throw new Error(`Kunci jawaban / rubrik acuan untuk Soal Esai #${i + 1} belum diisi.`);
        }
      } else {
        if (!q.opsi || q.opsi.length < 4) {
          throw new Error(`Soal #${i + 1} harus memiliki 4 pilihan jawaban (A, B, C, D).`);
        }
        for (let j = 0; j < 4; j++) {
          if (!q.opsi[j] || !q.opsi[j].trim()) {
            const letter = String.fromCharCode(65 + j);
            throw new Error(`Pilihan ${letter} pada Soal #${i + 1} belum diisi.`);
          }
        }
      }
    }

    setKuisButtonsLoading(true);

    const kuisRef = doc(db, "kuis", KUIS_ID);
    await setDoc(kuisRef, {
      judul: "Evaluasi Akhir — Mengenal Perintah SQL",
      soal: kuisQuestions,
      status: status
    }, { merge: true });

    kuisStatus = status;
    updateKuisStatusUI();

    showToast(status === "published" ? "🎉 Kuis berhasil di-publish & diaktifkan untuk siswa!" : "💾 Kuis berhasil disimpan sebagai draft.", "success");

  } catch (err) {
    console.error("[GuruJS] Gagal menyimpan kuis:", err);
    showKuisError(err.message);
  } finally {
    setKuisButtonsLoading(false);
  }
}

function showKuisError(msg) {
  if (manageKuisError) {
    manageKuisError.textContent = msg;
    manageKuisError.classList.add("visible");
    manageKuisError.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function setKuisButtonsLoading(isLoading) {
  if (!btnPublishKuis || !btnDraftKuis) return;
  if (isLoading) {
    btnPublishKuis.disabled = true;
    btnPublishKuis.innerHTML = "Menyimpan...";
    btnDraftKuis.disabled = true;
  } else {
    btnPublishKuis.disabled = false;
    btnPublishKuis.innerHTML = `
      <img src="assets/images/3d-icons/check.png" style="width:20px;height:20px;object-fit:contain;margin-right:6px;" alt="">
      Simpan & Aktifkan Ujian (Publish)
    `;
    btnDraftKuis.disabled = false;
    btnDraftKuis.textContent = "💾 Simpan Sebagai Draft";
  }
}

// ---- Helpers ----
function showAddError(msg) {
  addStudentError.textContent = msg;
  addStudentError.classList.add("visible");
}

function setAddLoading(isLoading) {
  if (isLoading) {
    btnAddStudent.disabled = true;
    btnAddStudent.textContent = "Membuat...";
  } else {
    btnAddStudent.disabled = false;
    btnAddStudent.textContent = "+ Buat Akun Siswa";
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll(".sidebar-link");
  const panels = document.querySelectorAll(".tab-panel");
  const pageTitle = document.getElementById("navbar-page-title");
  
  // Mobile elements
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const closeBtn = document.getElementById("sidebar-close-btn");

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      const targetPanel = document.getElementById("panel-" + tabName);

      if (!targetPanel) {
        console.warn("[GuruJS] Target panel tidak ditemukan: panel-" + tabName);
        return;
      }

      // Switch active class
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      targetPanel.classList.add("active");
      
      // Auto re-render specific tab contents
      if (tabName === "materi") {
        renderMateriList();
      } else if (tabName === "latihan_kegiatan") {
        initLatihanKegiatanManager();
      } else if (tabName === "video") {
        renderVideoList();
      }

      // Update Navbar Title
      if (pageTitle) {
        const textSpan = btn.querySelector(".menu-text");
        pageTitle.textContent = textSpan ? textSpan.textContent : "Dashboard";
      }

      // Auto close sidebar on mobile after clicking
      if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("show");
      }
    });
  });

  // Mobile sidebar triggers
  if (toggleBtn && sidebar && overlay) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("show");
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }

  if (closeBtn && sidebar && overlay) {
    closeBtn.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
const escapeHTML = escapeHtml;
window.escapeHtml = escapeHtml;
window.escapeHTML = escapeHtml;

function formatTimestamp(ts) {
  if (!ts) return "-";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "-";
  }
}

// ============================================
// MATERI MANAGEMENT LOGIC (CRUD & LIVE PREVIEW)
// ============================================
let allMateriList = [];
let currentMateriFilter = "all";
let materiListenersAttached = false;

function renderMateriLivePreview(html) {
  if (!html || !html.trim()) {
    return `<em style="color:var(--text-secondary);">Preview materi akan tampil di sini saat Anda mengetik konten di atas...</em>`;
  }
  let preview = html.replace(
    /<pre class="code-block"><code class="code-sql">([\s\S]*?)<\/code><\/pre>/gi,
    (match, p1) => `
      <div class="code-box-wrapper" style="position:relative; margin:var(--space-md) 0; box-shadow:0 4px 16px rgba(0,0,0,0.08); border-radius:12px; overflow:hidden;">
        <div style="display:flex; align-items:center; justify-content:space-between; background:#181d2d; padding:6px 14px; border-bottom:1px solid rgba(255,255,255,0.08); font-size:11px; color:#cbd5e1;">
          <span style="font-weight:700; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--secondary);"></span>
            SQL QUERY PREVIEW
          </span>
        </div>
        <pre class="code-block" style="margin:0; border-radius:0; background:#1e2438; color:#f8fafc; font-size:13px; padding:var(--space-md); line-height:1.6;"><code class="code-sql">${p1}</code></pre>
      </div>
    `
  );
  return preview;
}

async function loadMateriData() {
  try {
    const snap = await getDocs(collection(db, "materi"));
    allMateriList = [];
    snap.forEach((d) => {
      allMateriList.push({ id: d.id, ...d.data() });
    });

    // Urutkan berdasarkan kegiatanKe asc, lalu urutan asc
    allMateriList.sort((a, b) => {
      const kA = Number(a.kegiatanKe || 1);
      const kB = Number(b.kegiatanKe || 1);
      if (kA !== kB) return kA - kB;
      return (Number(a.urutan) || 0) - (Number(b.urutan) || 0);
    });

    renderMateriList();
  } catch (err) {
    console.error("[GuruJS] Gagal load materi:", err);
    showToast("Gagal memuat data materi: " + err.message, "error");
  }
}

function renderMateriList() {
  const container = document.getElementById("materi-grid-container");
  const countInfo = document.getElementById("materi-count-info");
  if (!container) return;

  const filtered = allMateriList.filter((m) => {
    if (currentMateriFilter === "all") return true;
    return String(m.kegiatanKe || 1) === String(currentMateriFilter);
  });

  if (countInfo) {
    countInfo.textContent = `Menampilkan ${filtered.length} dari total ${allMateriList.length} sub-materi`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem var(--space-xl); background:hsl(220, 20%, 98%); border-radius:var(--radius-xl); border:1.5px dashed var(--border);">
        <img src="assets/images/3d-icons/book.png" style="width:64px; height:64px; object-fit:contain; margin-bottom:var(--space-md);" alt="">
        <h3 style="font-size:var(--fs-base); font-weight:800; margin-bottom:4px; color:var(--text-primary);">Belum Ada Sub-Materi untuk Kategori Ini</h3>
        <p style="color:var(--text-secondary); font-size:var(--fs-xs); margin-bottom:var(--space-lg);">Klik tombol "Tambah Sub-Materi Baru" untuk menambahkan materi baru ke dalam modul.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.openAddMateriModal()">➕ Tambah Sub-Materi Sekarang</button>
      </div>
    `;
    return;
  }

  let html = "";
  filtered.forEach((materi, idx) => {
    const kNum = Number(materi.kegiatanKe || 1);
    const kLabels = {
      1: { name: "Kegiatan 1: Data Definition (DDL)", badge: "badge-primary" },
      2: { name: "Kegiatan 2: Data Manipulation (DML)", badge: "badge-success" },
      3: { name: "Kegiatan 3: Data Control (DCL)", badge: "badge-warning" }
    };
    const kInfo = kLabels[kNum] || { name: `Kegiatan ${kNum}`, badge: "badge-primary" };

    // Strip HTML tags for preview snippet
    const tmp = document.createElement("div");
    tmp.innerHTML = materi.kontenHtml || "";
    const rawText = tmp.textContent || tmp.innerText || "";
    const snippet = rawText.length > 220 ? rawText.substring(0, 220) + "..." : rawText;

    html += `
      <div class="card" style="padding:var(--space-xl); border-radius:var(--radius-xl); box-shadow:0 4px 18px rgba(0,0,0,0.05); border:1px solid var(--border-light); background:#ffffff; transition:all 0.2s ease;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-md);">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span class="badge ${kInfo.badge}" style="font-size:11px; font-weight:700;">${kInfo.name}</span>
              <span class="badge badge-neutral" style="font-size:11px; font-weight:700;">Urutan Sub-Materi #${materi.urutan || (idx + 1)}</span>
            </div>
            <h3 style="font-size:var(--fs-md); font-weight:800; color:var(--text-primary); margin:0 0 6px 0;">
              ${escapeHtml(materi.judul || "Sub-Materi")}
            </h3>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.editMateri('${materi.id}')" style="font-weight:700;">
              ✏️ Edit Materi
            </button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="window.deleteMateri('${materi.id}', '${escapeHtml(materi.judul || '')}')" style="color:var(--error); font-weight:700;">
              🗑️ Hapus
            </button>
          </div>
        </div>

        <div style="padding:var(--space-md); background:hsl(220, 20%, 98%); border-radius:var(--radius-md); border:1px solid var(--border-light); font-size:var(--fs-xs); color:var(--text-secondary); line-height:1.6; margin-bottom:var(--space-sm);">
          ${snippet || "<em>(Konten HTML tidak memiliki teks polos)</em>"}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function setupMateriEventListeners() {
  if (materiListenersAttached) return;
  materiListenersAttached = true;

  // Filter buttons
  const filterBtns = document.querySelectorAll(".btn-filter-materi");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.className = "btn btn-secondary btn-sm btn-filter-materi";
      });
      btn.className = "btn btn-primary btn-sm btn-filter-materi";
      currentMateriFilter = btn.dataset.kegiatan;
      renderMateriList();
    });
  });

  // Open add materi modal
  const btnOpenAdd = document.getElementById("btn-open-add-materi");
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener("click", () => {
      window.openAddMateriModal();
    });
  }

  // Close modal buttons
  const modalMateri = document.getElementById("modal-materi");
  const btnCloseModal = document.getElementById("btn-close-modal-materi");
  const btnCancelModal = document.getElementById("btn-cancel-modal-materi");

  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", () => {
      if (modalMateri) modalMateri.style.display = "none";
    });
  }
  if (btnCancelModal) {
    btnCancelModal.addEventListener("click", () => {
      if (modalMateri) modalMateri.style.display = "none";
    });
  }

  // Live preview on typing
  const inputKonten = document.getElementById("materi-input-konten");
  const previewBox = document.getElementById("materi-live-preview-box");

  if (inputKonten && previewBox) {
    inputKonten.addEventListener("input", () => {
      previewBox.innerHTML = renderMateriLivePreview(inputKonten.value);
    });
  }

  // Template insert helper buttons
  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end, textarea.value.length);
    textarea.value = before + text + after;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
    if (previewBox) {
      previewBox.innerHTML = renderMateriLivePreview(textarea.value);
    }
  }

  const btnH3 = document.getElementById("btn-insert-h3");
  const btnP = document.getElementById("btn-insert-p");
  const btnCode = document.getElementById("btn-insert-code");
  const btnAlert = document.getElementById("btn-insert-alert");
  const btnList = document.getElementById("btn-insert-list");
  const btnTable = document.getElementById("btn-insert-table");

  if (inputKonten) {
    if (btnH3) btnH3.addEventListener("click", () => insertAtCursor(inputKonten, `\n<h3>1. Judul Bagian Materi</h3>\n`));
    if (btnP) btnP.addEventListener("click", () => insertAtCursor(inputKonten, `\n<p>Tuliskan penjelasan materi atau teori SQL di sini secara terstruktur dan jelas.</p>\n`));
    if (btnCode) btnCode.addEventListener("click", () => insertAtCursor(inputKonten, `\n<pre class="code-block"><code class="code-sql">-- Contoh Sintaks SQL
CREATE TABLE siswa (
    nis VARCHAR(10) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jurusan VARCHAR(50)
);</code></pre>\n`));
    if (btnAlert) btnAlert.addEventListener("click", () => insertAtCursor(inputKonten, `\n<div class="note-box alert-info">\n  <strong>Catatan Penting:</strong> Setiap perintah SQL harus selalu diakhiri dengan tanda titik koma (<code>;</code>).\n</div>\n`));
    if (btnList) btnList.addEventListener("click", () => insertAtCursor(inputKonten, `\n<ul>\n  <li><strong>Poin 1:</strong> Penjelasan poin pertama.</li>\n  <li><strong>Poin 2:</strong> Penjelasan poin kedua.</li>\n</ul>\n`));
    if (btnTable) btnTable.addEventListener("click", () => insertAtCursor(inputKonten, `\n<table style="width:100%; border-collapse:collapse; margin:14px 0; border:1px solid #cbd5e1;">\n  <thead>\n    <tr style="background:#f1f5f9;">\n      <th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left;">Nama Kolom</th>\n      <th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left;">Tipe Data</th>\n      <th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left;">Keterangan</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style="border:1px solid #cbd5e1; padding:8px 12px;"><code>id_siswa</code></td>\n      <td style="border:1px solid #cbd5e1; padding:8px 12px;">INT</td>\n      <td style="border:1px solid #cbd5e1; padding:8px 12px;">Primary Key Auto Increment</td>\n    </tr>\n  </tbody>\n</table>\n`));
  }

  // Form submit handler (Add / Edit)
  const formMateri = document.getElementById("form-materi");
  const formError = document.getElementById("materi-form-error");
  const btnSave = document.getElementById("btn-save-materi");

  if (formMateri) {
    formMateri.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (formError) formError.style.display = "none";

      const docId = document.getElementById("materi-doc-id").value.trim();
      const kegiatanKe = Number(document.getElementById("materi-select-kegiatan").value) || 1;
      const urutan = Number(document.getElementById("materi-input-urutan").value) || 1;
      const judul = document.getElementById("materi-input-judul").value.trim();
      const kontenHtml = document.getElementById("materi-input-konten").value.trim();

      if (!judul || !kontenHtml) {
        if (formError) {
          formError.textContent = "Judul dan Konten HTML materi wajib diisi.";
          formError.style.display = "block";
        }
        return;
      }

      if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = "Menyimpan...";
      }

      try {
        const finalDocId = docId || `materi_keg${kegiatanKe}_${Date.now()}`;
        const materiRef = doc(db, "materi", finalDocId);

        await setDoc(materiRef, {
          judul,
          kegiatanKe,
          urutan,
          kontenHtml,
          updatedAt: serverTimestamp()
        }, { merge: true });

        showToast(docId ? "✅ Sub-materi berhasil diperbarui!" : "✅ Sub-materi baru berhasil ditambahkan!", "success");

        if (modalMateri) modalMateri.style.display = "none";
        await loadMateriData();
      } catch (err) {
        console.error("[GuruJS] Gagal simpan materi:", err);
        if (formError) {
          formError.textContent = "Gagal menyimpan materi: " + err.message;
          formError.style.display = "block";
        }
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.textContent = "💾 Simpan Materi";
        }
      }
    });
  }
}

// Global modal helpers
window.openAddMateriModal = function () {
  const modal = document.getElementById("modal-materi");
  const modalTitle = document.getElementById("modal-materi-title");
  const docIdInput = document.getElementById("materi-doc-id");
  const selectKegiatan = document.getElementById("materi-select-kegiatan");
  const inputUrutan = document.getElementById("materi-input-urutan");
  const inputJudul = document.getElementById("materi-input-judul");
  const inputKonten = document.getElementById("materi-input-konten");
  const previewBox = document.getElementById("materi-live-preview-box");
  const formError = document.getElementById("materi-form-error");

  if (modalTitle) modalTitle.textContent = "Tambah Sub-Materi Pembelajaran";
  if (docIdInput) docIdInput.value = "";
  if (inputJudul) inputJudul.value = "";
  if (inputKonten) inputKonten.value = "";
  if (formError) formError.style.display = "none";
  if (previewBox) {
    previewBox.innerHTML = renderMateriLivePreview("");
  }

  const kFilter = currentMateriFilter === "all" ? 1 : Number(currentMateriFilter);
  if (selectKegiatan) selectKegiatan.value = String(kFilter);

  const existingInKeg = allMateriList.filter((m) => Number(m.kegiatanKe) === kFilter);
  if (inputUrutan) inputUrutan.value = existingInKeg.length + 1;

  if (modal) modal.style.display = "flex";
};

window.editMateri = function (docId) {
  const materi = allMateriList.find((m) => m.id === docId);
  if (!materi) {
    alert("Data materi tidak ditemukan!");
    return;
  }

  const modal = document.getElementById("modal-materi");
  const modalTitle = document.getElementById("modal-materi-title");
  const docIdInput = document.getElementById("materi-doc-id");
  const selectKegiatan = document.getElementById("materi-select-kegiatan");
  const inputUrutan = document.getElementById("materi-input-urutan");
  const inputJudul = document.getElementById("materi-input-judul");
  const inputKonten = document.getElementById("materi-input-konten");
  const previewBox = document.getElementById("materi-live-preview-box");
  const formError = document.getElementById("materi-form-error");

  if (modalTitle) modalTitle.textContent = "Edit Sub-Materi Pembelajaran";
  if (docIdInput) docIdInput.value = materi.id;
  if (selectKegiatan) selectKegiatan.value = String(materi.kegiatanKe || 1);
  if (inputUrutan) inputUrutan.value = materi.urutan || 1;
  if (inputJudul) inputJudul.value = materi.judul || "";
  if (inputKonten) inputKonten.value = materi.kontenHtml || "";
  if (formError) formError.style.display = "none";
  if (previewBox) {
    previewBox.innerHTML = renderMateriLivePreview(materi.kontenHtml || "");
  }

  if (modal) modal.style.display = "flex";
};

window.deleteMateri = async function (docId, judul) {
  const ok = confirm(`Hapus sub-materi "${judul || docId}"?\n\nMateri yang dihapus tidak akan tampil lagi di halaman siswa.`);
  if (!ok) return;

  try {
    await deleteDoc(doc(db, "materi", docId));
    showToast("Sub-materi berhasil dihapus.", "success");
    await loadMateriData();
  } catch (err) {
    console.error("[GuruJS] Gagal hapus materi:", err);
    alert("Gagal menghapus materi: " + err.message);
  }
};

// ============================================
// VIDEO MANAGEMENT LOGIC (CRUD & YOUTUBE)
// ============================================
let allVideosList = [];
let currentVideoFilter = "all";
let videoListenersAttached = false;

function parseYouTubeEmbedUrl(url) {
  if (!url) return "";
  url = url.trim();

  // Jika URL berupa potongan iframe HTML
  const matchIframe = url.match(/src=["']([^"']+)["']/i);
  if (matchIframe && matchIframe[1]) {
    url = matchIframe[1].trim();
  }

  // Jika sudah dalam format embed youtube-nocookie atau youtube standar
  if (url.startsWith("https://www.youtube-nocookie.com/embed/") || url.startsWith("https://www.youtube.com/embed/")) {
    return url;
  }

  let videoId = "";

  // 1. Format: youtube.com/watch?v=VIDEO_ID (atau dengan parameter tambahan)
  const matchWatch = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|live\/))([a-zA-Z0-9_-]{11})/i);
  if (matchWatch && matchWatch[1]) {
    videoId = matchWatch[1];
  } else {
    // 2. Format: youtu.be/VIDEO_ID
    const matchShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (matchShort && matchShort[1]) {
      videoId = matchShort[1];
    } else {
      // 3. Format: youtube.com/shorts/VIDEO_ID
      const matchShorts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
      if (matchShorts && matchShorts[1]) {
        videoId = matchShorts[1];
      }
    }
  }

  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }

  return url;
}

function getYouTubeWatchUrl(url) {
  if (!url) return "";
  url = url.trim();

  const matchIframe = url.match(/src=["']([^"']+)["']/i);
  if (matchIframe && matchIframe[1]) {
    url = matchIframe[1].trim();
  }

  const matchId = url.match(/(?:embed\/|v\/|shorts\/|youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]{11})/i);
  if (matchId && matchId[1]) {
    return `https://www.youtube.com/watch?v=${matchId[1]}`;
  }
  return url;
}

async function loadVideoData() {
  try {
    const snap = await getDocs(collection(db, "video"));
    allVideosList = [];
    snap.forEach((d) => {
      const data = d.data();
      let kNum = Number(data.kegiatanKe);

      // Kompatibilitas mundur jika kegiatanKe kosong
      if (!kNum || isNaN(kNum)) {
        const idLower = d.id.toLowerCase();
        const matLower = String(data.materiId || "").toLowerCase();
        if (idLower.includes("keg1") || matLower.includes("keg1")) kNum = 1;
        else if (idLower.includes("keg2") || matLower.includes("keg2")) kNum = 2;
        else if (idLower.includes("keg3") || matLower.includes("keg3")) kNum = 3;
        else kNum = 1;
      }

      allVideosList.push({
        id: d.id,
        ...data,
        kegiatanKe: kNum,
        urutan: Number(data.urutan) || 1
      });
    });

    // Urutkan berdasarkan kegiatanKe lalu urutan
    allVideosList.sort((a, b) => {
      const kA = Number(a.kegiatanKe || 1);
      const kB = Number(b.kegiatanKe || 1);
      if (kA !== kB) return kA - kB;
      return (Number(a.urutan) || 0) - (Number(b.urutan) || 0);
    });

    renderVideoList();
  } catch (err) {
    console.error("[GuruJS] Gagal load data video:", err);
  }
}

function renderVideoList() {
  const container = document.getElementById("video-grid-container");
  const countInfo = document.getElementById("video-count-info");
  if (!container) return;

  // Filter
  const filtered = allVideosList.filter((v) => {
    if (currentVideoFilter === "all") return true;
    return String(v.kegiatanKe || 1) === String(currentVideoFilter);
  });

  if (countInfo) {
    countInfo.textContent = `Menampilkan ${filtered.length} dari total ${allVideosList.length} video`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:3rem var(--space-xl); background:hsl(220, 20%, 98%); border-radius:var(--radius-xl); border:1.5px dashed var(--border);">
        <img src="assets/images/3d-icons/video.png" style="width:64px; height:64px; object-fit:contain; margin-bottom:var(--space-md);" alt="">
        <h3 style="font-size:var(--fs-base); font-weight:800; margin-bottom:4px; color:var(--text-primary);">Belum Ada Video untuk Kategori Ini</h3>
        <p style="color:var(--text-secondary); font-size:var(--fs-xs); margin-bottom:var(--space-lg);">Klik tombol "Tambah Video Baru" untuk menambahkan video materi YouTube.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.openAddVideoModal()">➕ Tambah Video Sekarang</button>
      </div>
    `;
    return;
  }

  let html = "";
  filtered.forEach((vid, idx) => {
    const kNum = Number(vid.kegiatanKe || 1);
    const kLabels = {
      1: { name: "Kegiatan 1: Data Definition (DDL)", badge: "badge-primary" },
      2: { name: "Kegiatan 2: Data Manipulation (DML)", badge: "badge-success" },
      3: { name: "Kegiatan 3: Data Control (DCL)", badge: "badge-warning" }
    };
    const kInfo = kLabels[kNum] || { name: `Kegiatan ${kNum}`, badge: "badge-primary" };
    const embedUrl = parseYouTubeEmbedUrl(vid.urlYoutube || "");
    const directWatchUrl = getYouTubeWatchUrl(vid.urlYoutube || "");

    html += `
      <div class="card" style="padding:var(--space-lg); border-radius:var(--radius-xl); display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 4px 18px rgba(0,0,0,0.05); border:1px solid var(--border-light); background:#ffffff;">
        <div>
          <!-- Header Card Video -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-sm); gap:8px;">
            <span class="badge ${kInfo.badge}" style="font-size:11px; font-weight:700;">${kInfo.name}</span>
            <span style="font-size:11px; font-weight:700; color:var(--text-secondary);">Urutan #${vid.urutan || (idx + 1)}</span>
          </div>

          <h4 style="font-size:var(--fs-base); font-weight:800; color:var(--text-primary); margin-bottom:var(--space-md); line-height:1.4;">
            ${escapeHtml(vid.judul || "Video Materi")}
          </h4>

          <!-- Video Player Preview -->
          <div class="video-wrapper" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--radius-md); background:#0f172a; margin-bottom:var(--space-md);">
            <iframe
              src="${escapeHtml(embedUrl)}"
              title="${escapeHtml(vid.judul || 'Video')}"
              style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:var(--space-md); margin-top:var(--space-sm); flex-wrap:wrap; gap:8px;">
          <a href="${escapeHtml(directWatchUrl || vid.urlYoutube || '')}" target="_blank" rel="noopener noreferrer" style="font-size:12px; font-weight:700; color:var(--primary); display:flex; align-items:center; gap:4px;">
            ↗ Buka di YouTube
          </a>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.editVideo('${vid.id}')" style="font-weight:700;">
              ✏️ Edit
            </button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="window.deleteVideo('${vid.id}', '${escapeHtml(vid.judul)}')" style="color:var(--error); font-weight:700;">
              🗑️ Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function setupVideoEventListeners() {
  if (videoListenersAttached) return;
  videoListenersAttached = true;

  // Filter buttons
  const filterBtns = document.querySelectorAll(".btn-filter-video");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.className = "btn btn-secondary btn-sm btn-filter-video";
      });
      btn.className = "btn btn-primary btn-sm btn-filter-video";
      currentVideoFilter = btn.dataset.kegiatan;
      renderVideoList();
    });
  });

  // Open add video modal
  const btnOpenAdd = document.getElementById("btn-open-add-video");
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener("click", () => {
      window.openAddVideoModal();
    });
  }

  // Close modal buttons
  const modalVideo = document.getElementById("modal-video");
  const btnCloseModal = document.getElementById("btn-close-modal-video");
  const btnCancelModal = document.getElementById("btn-cancel-modal-video");

  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", () => {
      if (modalVideo) modalVideo.style.display = "none";
    });
  }
  if (btnCancelModal) {
    btnCancelModal.addEventListener("click", () => {
      if (modalVideo) modalVideo.style.display = "none";
    });
  }

  // Realtime Live Preview on YouTube URL input
  const inputUrl = document.getElementById("video-input-url");
  const previewIframe = document.getElementById("video-preview-iframe");
  const previewStatus = document.getElementById("preview-status");

  if (inputUrl) {
    inputUrl.addEventListener("input", () => {
      const val = inputUrl.value.trim();
      if (!val) {
        if (previewIframe) previewIframe.src = "";
        if (previewStatus) previewStatus.textContent = "Menunggu URL...";
        return;
      }
      const embed = parseYouTubeEmbedUrl(val);
      if (previewIframe) previewIframe.src = embed;
      if (previewStatus) previewStatus.textContent = "Preview Siap Ditonton";
    });
  }

  // Form submit handler (Add / Edit)
  const formVideo = document.getElementById("form-video");
  const formError = document.getElementById("video-form-error");
  const btnSave = document.getElementById("btn-save-video");

  if (formVideo) {
    formVideo.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (formError) formError.style.display = "none";

      const docId = document.getElementById("video-doc-id").value.trim();
      const judul = document.getElementById("video-input-judul").value.trim();
      const kegiatanKe = Number(document.getElementById("video-select-kegiatan").value) || 1;
      const urutan = Number(document.getElementById("video-input-urutan").value) || 1;
      const rawUrl = document.getElementById("video-input-url").value.trim();

      if (!judul || !rawUrl) {
        if (formError) {
          formError.textContent = "Judul dan Link URL YouTube wajib diisi.";
          formError.style.display = "block";
        }
        return;
      }

      const embedUrl = parseYouTubeEmbedUrl(rawUrl);

      if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = "Menyimpan...";
      }

      try {
        const idToSave = docId || `vid-keg${kegiatanKe}-${Date.now()}`;

        const payload = {
          judul,
          kegiatanKe: Number(kegiatanKe),
          materiId: `materi_keg${kegiatanKe}_${urutan}`,
          urlYoutube: embedUrl,
          urutan: Number(urutan),
          updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, "video", idToSave), payload, { merge: true });

        showToast(docId ? "Video berhasil diperbarui!" : "Video baru berhasil ditambahkan!", "success");

        if (modalVideo) modalVideo.style.display = "none";
        await loadVideoData();
      } catch (err) {
        console.error("[GuruJS] Gagal simpan video:", err);
        if (formError) {
          formError.textContent = "Gagal menyimpan video: " + err.message;
          formError.style.display = "block";
        }
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.textContent = "💾 Simpan Video";
        }
      }
    });
  }
}

// Window Globals for Video Management
window.openAddVideoModal = function () {
  const modal = document.getElementById("modal-video");
  const title = document.getElementById("modal-video-title");
  const inputDocId = document.getElementById("video-doc-id");
  const inputJudul = document.getElementById("video-input-judul");
  const selectKeg = document.getElementById("video-select-kegiatan");
  const inputUrutan = document.getElementById("video-input-urutan");
  const inputUrl = document.getElementById("video-input-url");
  const previewIframe = document.getElementById("video-preview-iframe");
  const previewStatus = document.getElementById("preview-status");
  const formError = document.getElementById("video-form-error");

  if (!modal) return;

  if (title) title.textContent = "Tambah Video Pembelajaran Baru";
  if (inputDocId) inputDocId.value = "";
  if (inputJudul) inputJudul.value = "";
  if (selectKeg) selectKeg.value = currentVideoFilter !== "all" ? currentVideoFilter : "1";
  if (inputUrutan) inputUrutan.value = allVideosList.length + 1;
  if (inputUrl) inputUrl.value = "";
  if (previewIframe) previewIframe.src = "";
  if (previewStatus) previewStatus.textContent = "Menunggu URL...";
  if (formError) formError.style.display = "none";

  modal.style.display = "flex";
};

window.editVideo = function (docId) {
  const video = allVideosList.find((v) => v.id === docId);
  if (!video) return;

  const modal = document.getElementById("modal-video");
  const title = document.getElementById("modal-video-title");
  const inputDocId = document.getElementById("video-doc-id");
  const inputJudul = document.getElementById("video-input-judul");
  const selectKeg = document.getElementById("video-select-kegiatan");
  const inputUrutan = document.getElementById("video-input-urutan");
  const inputUrl = document.getElementById("video-input-url");
  const previewIframe = document.getElementById("video-preview-iframe");
  const previewStatus = document.getElementById("preview-status");
  const formError = document.getElementById("video-form-error");

  if (!modal) return;

  if (title) title.textContent = "Edit Video Pembelajaran";
  if (inputDocId) inputDocId.value = video.id;
  if (inputJudul) inputJudul.value = video.judul || "";
  if (selectKeg) selectKeg.value = String(video.kegiatanKe || 1);
  if (inputUrutan) inputUrutan.value = video.urutan || 1;
  if (inputUrl) inputUrl.value = video.urlYoutube || "";
  if (formError) formError.style.display = "none";

  const embedUrl = parseYouTubeEmbedUrl(video.urlYoutube || "");
  if (previewIframe) previewIframe.src = embedUrl;
  if (previewStatus) previewStatus.textContent = "Preview Siap Ditonton";

  modal.style.display = "flex";
};

window.deleteVideo = async function (docId, videoTitle) {
  if (!confirm(`Apakah Anda yakin ingin menghapus video "${videoTitle || 'ini'}"?`)) {
    return;
  }

  try {
    await deleteDoc(doc(db, "video", docId));
    showToast("Video berhasil dihapus.", "success");
    await loadVideoData();
  } catch (err) {
    console.error("[GuruJS] Gagal hapus video:", err);
    alert("Gagal menghapus video: " + err.message);
  }
};

// ============================================
// ======== KELOLA LATIHAN SQL ========
// ============================================

let currentLatihanDocId = null;

async function loadLatihanSQLData() {
  const infoEl = document.getElementById("active-latihan-info");
  const btnNonaktifkan = document.getElementById("btn-nonaktifkan-latihan");
  
  if (!infoEl) return;

  try {
    const q = query(collection(db, "latihan_sql"), where("aktif", "==", true));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      currentLatihanDocId = docSnap.id;

      infoEl.innerHTML = `
        <div style="margin-bottom:6px;">
          <strong style="color:var(--text-primary);font-size:var(--fs-base);">${escapeHtml(data.judul || 'Tanpa judul')}</strong>
          ${data.pertemuan ? `<span style="background:hsl(152,60%,90%);color:hsl(152,60%,30%);padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;margin-left:8px;">${escapeHtml(data.pertemuan)}</span>` : ''}
        </div>
        <div style="font-size:12px;color:var(--text-secondary);">
          ${data.konten ? data.konten.substring(0, 120).replace(/\n/g, ' ') + '...' : ''}
        </div>
      `;

      // Populate form with existing data for editing
      const judulInput = document.getElementById("latihan-judul");
      const pertemuanInput = document.getElementById("latihan-pertemuan");
      const petunjukInput = document.getElementById("latihan-petunjuk");
      const kontenInput = document.getElementById("latihan-konten");

      if (judulInput) judulInput.value = data.judul || "";
      if (pertemuanInput) pertemuanInput.value = data.pertemuan || "";
      if (petunjukInput) petunjukInput.value = data.petunjuk || "";
      if (kontenInput) kontenInput.value = data.konten || "";

      if (btnNonaktifkan) btnNonaktifkan.style.display = "inline-flex";
    } else {
      currentLatihanDocId = null;
      infoEl.innerHTML = `<em style="color:var(--text-muted);">Belum ada latihan SQL aktif di Firestore (menampilkan default Database Perpustakaan). Anda dapat langsung mengedit dan klik "Simpan & Aktifkan Latihan".</em>`;
      if (btnNonaktifkan) btnNonaktifkan.style.display = "none";

      // Pre-fill form with default template
      const judulInput = document.getElementById("latihan-judul");
      const pertemuanInput = document.getElementById("latihan-pertemuan");
      const petunjukInput = document.getElementById("latihan-petunjuk");
      const kontenInput = document.getElementById("latihan-konten");

      if (judulInput && !judulInput.value) judulInput.value = "Latihan SQL — Database Perpustakaan";
      if (pertemuanInput && !pertemuanInput.value) pertemuanInput.value = "Praktik Terstruktur";
      if (petunjukInput && !petunjukInput.value) petunjukInput.value = "Ketik dan jalankan setiap perintah SQL secara berurutan pada terminal editor.";
      if (kontenInput && !kontenInput.value) {
        kontenInput.value = `-- Buat database\nCREATE DATABASE db_perpustakaan;\nUSE db_perpustakaan;\n\n-- 1. Tabel Anggota\nCREATE TABLE anggota (\n    id_anggota VARCHAR(10) PRIMARY KEY,\n    nim_nip VARCHAR(20) UNIQUE,\n    nama_lengkap VARCHAR(100) NOT NULL,\n    jenis_kelamin ENUM('L', 'P') NOT NULL,\n    alamat TEXT,\n    no_hp VARCHAR(15),\n    email VARCHAR(100),\n    tgl_daftar DATE DEFAULT (CURRENT_DATE),\n    status ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif'\n);\n\n-- 2. Tabel Kategori Buku\nCREATE TABLE kategori (\n    id_kategori INT AUTO_INCREMENT PRIMARY KEY,\n    nama_kategori VARCHAR(50) NOT NULL UNIQUE\n);\n\n-- 3. Tabel Rak\nCREATE TABLE rak (\n    id_rak VARCHAR(10) PRIMARY KEY,\n    lokasi VARCHAR(50) NOT NULL COMMENT 'Contoh: Lantai 2 Blok B'\n);\n\n-- 4. Tabel Buku\nCREATE TABLE buku (\n    id_buku VARCHAR(15) PRIMARY KEY,\n    isbn VARCHAR(20) UNIQUE,\n    judul VARCHAR(200) NOT NULL,\n    penulis VARCHAR(100) NOT NULL,\n    penerbit VARCHAR(100),\n    tahun_terbit YEAR,\n    id_kategori INT,\n    id_rak VARCHAR(10),\n    stok INT DEFAULT 1,\n    tersedia INT DEFAULT 1,\n    FOREIGN KEY (id_kategori) REFERENCES kategori(id_kategori) ON DELETE SET NULL,\n    FOREIGN KEY (id_rak) REFERENCES rak(id_rak) ON DELETE SET NULL\n);\n\n-- 5. Tabel Petugas\nCREATE TABLE petugas (\n    id_petugas VARCHAR(10) PRIMARY KEY,\n    nama_petugas VARCHAR(100) NOT NULL,\n    username VARCHAR(50) UNIQUE NOT NULL,\n    password VARCHAR(255) NOT NULL,\n    level ENUM('Admin', 'Pustakawan') DEFAULT 'Pustakawan'\n);\n\n-- 6. Tabel Peminjaman\nCREATE TABLE peminjaman (\n    id_pinjam INT AUTO_INCREMENT PRIMARY KEY,\n    id_buku VARCHAR(15) NOT NULL,\n    id_anggota VARCHAR(10) NOT NULL,\n    id_petugas VARCHAR(10) NOT NULL,\n    tgl_pinjam DATETIME DEFAULT CURRENT_TIMESTAMP,\n    tgl_jatuh_tempo DATE NOT NULL,\n    tgl_kembali DATETIME DEFAULT NULL,\n    denda INT DEFAULT 0,\n    status ENUM('Dipinjam', 'Dikembalikan', 'Terlambat') DEFAULT 'Dipinjam',\n    FOREIGN KEY (id_buku) REFERENCES buku(id_buku),\n    FOREIGN KEY (id_anggota) REFERENCES anggota(id_anggota),\n    FOREIGN KEY (id_petugas) REFERENCES petugas(id_petugas)\n);\n\n-- 7. Trigger: Kurangi stok saat pinjam\nDELIMITER $$\nCREATE TRIGGER kurangi_stok AFTER INSERT ON peminjaman\nFOR EACH ROW\nBEGIN\n    UPDATE buku SET tersedia = tersedia - 1 \n    WHERE id_buku = NEW.id_buku;\nEND$$\nDELIMITER ;\n\n-- 8. Trigger: Tambah stok saat kembali\nDELIMITER $$\nCREATE TRIGGER tambah_stok AFTER UPDATE ON peminjaman\nFOR EACH ROW\nBEGIN\n    IF NEW.tgl_kembali IS NOT NULL AND OLD.tgl_kembali IS NULL THEN\n        UPDATE buku SET tersedia = tersedia + 1 \n        WHERE id_buku = NEW.id_buku;\n        -- Update status jadi Dikembalikan\n        UPDATE peminjaman SET status = 'Dikembalikan' \n        WHERE id_pinjam = NEW.id_pinjam;\n    END IF;\nEND$$\nDELIMITER ;\n\n-- Contoh isi data awal\nINSERT INTO kategori (nama_kategori) VALUES \n('Teknologi'), ('Sastra'), ('Sejarah'), ('Agama'), ('Skripsi');\n\nINSERT INTO rak VALUES \n('R1A', 'Lantai 1 Rak A'), ('R2B', 'Lantai 2 Rak B');\n\nINSERT INTO petugas VALUES \n('P001', 'Admin Utama', 'admin', MD5('admin123'), 'Admin');`;
      }
    }
  } catch (err) {
    console.error("[GuruJS] Gagal load latihan SQL:", err);
    infoEl.innerHTML = `<em style="color:var(--error);">Gagal memuat data latihan.</em>`;
  }
}

// Form submit
const formLatihanSQL = document.getElementById("form-latihan-sql");
if (formLatihanSQL) {
  formLatihanSQL.addEventListener("submit", async (e) => {
    e.preventDefault();

    const judul = document.getElementById("latihan-judul").value.trim();
    const pertemuan = document.getElementById("latihan-pertemuan").value.trim();
    const petunjuk = document.getElementById("latihan-petunjuk").value.trim();
    const konten = document.getElementById("latihan-konten").value.trim();

    if (!judul || !konten) {
      showToast("Judul dan isi kode SQL wajib diisi!", "warning");
      return;
    }

    const btnSimpan = document.getElementById("btn-simpan-latihan");
    if (btnSimpan) {
      btnSimpan.disabled = true;
      btnSimpan.innerHTML = "⏳ Menyimpan...";
    }

    try {
      // Deactivate all existing latihan first
      const existingQ = query(collection(db, "latihan_sql"), where("aktif", "==", true));
      const existingSnap = await getDocs(existingQ);
      for (const d of existingSnap.docs) {
        await setDoc(doc(db, "latihan_sql", d.id), { aktif: false }, { merge: true });
      }

      // Save new or update existing
      const docId = currentLatihanDocId || ("latihan_" + Date.now());
      await setDoc(doc(db, "latihan_sql", docId), {
        judul,
        pertemuan,
        petunjuk,
        konten,
        aktif: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      showToast("✅ Latihan SQL berhasil disimpan dan diaktifkan!", "success");
      await loadLatihanSQLData();
    } catch (err) {
      console.error("[GuruJS] Gagal simpan latihan:", err);
      showToast("Gagal menyimpan: " + err.message, "error");
    } finally {
      if (btnSimpan) {
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = '<img src="assets/images/3d-icons/rocket.png" style="width:18px;height:18px;object-fit:contain;margin-right:6px;" alt=""> Simpan & Aktifkan Latihan';
      }
    }
  });
}

// Nonaktifkan latihan
const btnNonaktifkan = document.getElementById("btn-nonaktifkan-latihan");
if (btnNonaktifkan) {
  btnNonaktifkan.addEventListener("click", async () => {
    if (!currentLatihanDocId) return;
    if (!confirm("Nonaktifkan latihan SQL yang sedang aktif? Siswa tidak akan melihat latihan di Editor SQL.")) return;

    try {
      await setDoc(doc(db, "latihan_sql", currentLatihanDocId), { aktif: false }, { merge: true });
      showToast("Latihan SQL dinonaktifkan.", "success");
      currentLatihanDocId = null;

      // Clear form
      document.getElementById("latihan-judul").value = "";
      document.getElementById("latihan-pertemuan").value = "";
      document.getElementById("latihan-petunjuk").value = "";
      document.getElementById("latihan-konten").value = "";

      await loadLatihanSQLData();
    } catch (err) {
      console.error("[GuruJS] Gagal nonaktifkan:", err);
      showToast("Gagal menonaktifkan: " + err.message, "error");
    }
  });
}

// ============================================
// ---- KELOLA SOAL LATIHAN KEGIATAN BELAJAR ----
// ============================================
let currentLatihanKegiatanDoc = null;
let currentSelectedMateriId = null;
let latihanKegiatanListenersAttached = false;

async function initLatihanKegiatanManager() {
  const filterKegiatan = document.getElementById("filter-latihan-kegiatan");
  const filterMateri = document.getElementById("filter-latihan-materi");
  const btnTambah = document.getElementById("btn-tambah-soal-latihan");
  const modal = document.getElementById("modal-soal-latihan");
  const btnClose = document.getElementById("btn-close-modal-soal-latihan");
  const btnBatal = document.getElementById("btn-cancel-modal-soal-latihan");
  const form = document.getElementById("form-soal-latihan");

  if (!filterKegiatan || !filterMateri) return;

  // Pastikan data materi sudah dimuat
  if (!allMateriList || allMateriList.length === 0) {
    try {
      const snap = await getDocs(collection(db, "materi"));
      allMateriList = [];
      snap.forEach((d) => allMateriList.push({ id: d.id, ...d.data() }));
      allMateriList.sort((a, b) => {
        const kA = Number(a.kegiatanKe || 1);
        const kB = Number(b.kegiatanKe || 1);
        if (kA !== kB) return kA - kB;
        return (Number(a.urutan) || 0) - (Number(b.urutan) || 0);
      });
    } catch (err) {
      console.error("[GuruJS] Gagal load materi for latihan:", err);
    }
  }

  // Populate sub-materi dropdown sesuai Kegiatan yang dipilih
  function populateMateriDropdown() {
    const kegVal = Number(filterKegiatan.value) || 1;
    const matchingMateri = allMateriList.filter((m) => Number(m.kegiatanKe || 1) === kegVal);
    
    filterMateri.innerHTML = "";
    if (matchingMateri.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Belum ada sub-materi di kegiatan ini";
      filterMateri.appendChild(opt);
      currentSelectedMateriId = null;
      loadLatihanSoalList(null);
      return;
    }

    matchingMateri.forEach((m, idx) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `Sub-Materi ${m.urutan || idx + 1}: ${m.judul}`;
      filterMateri.appendChild(opt);
    });

    currentSelectedMateriId = filterMateri.value;
    loadLatihanSoalList(currentSelectedMateriId);
  }

  if (!latihanKegiatanListenersAttached) {
    latihanKegiatanListenersAttached = true;

    filterKegiatan.addEventListener("change", () => {
      populateMateriDropdown();
    });

    filterMateri.addEventListener("change", () => {
      currentSelectedMateriId = filterMateri.value;
      loadLatihanSoalList(currentSelectedMateriId);
    });

    if (btnTambah) {
      btnTambah.addEventListener("click", () => {
        if (!currentSelectedMateriId) {
          showToast("Pilih sub-materi terlebih dahulu!", "warning");
          return;
        }
        window.openModalSoalLatihan(-1);
      });
    }

    if (btnClose) {
      btnClose.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
      });
    }

    if (btnBatal) {
      btnBatal.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
      });
    }

    if (form) {
      form.addEventListener("submit", handleSaveSoalLatihan);
    }
  }

  populateMateriDropdown();
}

async function loadLatihanSoalList(materiId) {
  const container = document.getElementById("container-soal-latihan-list");
  const countSpan = document.getElementById("latihan-total-count");
  const infoHeader = document.getElementById("latihan-bank-info");

  if (!container) return;

  if (!materiId) {
    container.innerHTML = `
      <div style="text-align:center; padding:2.5rem var(--space-xl); background:#fff; border-radius:var(--radius-lg); border:1.5px dashed var(--border);">
        <p style="color:var(--text-secondary); margin:0;">Silakan pilih sub-materi terlebih dahulu untuk melihat bank soal latihan.</p>
      </div>
    `;
    if (countSpan) countSpan.textContent = "0 butir soal";
    return;
  }

  container.innerHTML = `
    <div style="text-align:center; padding:2rem; color:var(--text-secondary);">
      <div class="loading-spinner" style="margin:0 auto 10px auto;"></div>
      <p style="margin:0;">Memuat bank soal latihan...</p>
    </div>
  `;

  try {
    const q = query(collection(db, "latihan"), where("materiId", "==", materiId));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      currentLatihanKegiatanDoc = {
        id: "latihan_" + materiId.replace("materi_", ""),
        materiId: materiId,
        soal: []
      };
    } else {
      const docSnap = snap.docs[0];
      currentLatihanKegiatanDoc = {
        id: docSnap.id,
        ...docSnap.data()
      };
    }

    const soalList = currentLatihanKegiatanDoc.soal || [];
    if (countSpan) countSpan.textContent = `${soalList.length} butir soal aktif`;
    
    const matObj = allMateriList.find((m) => m.id === materiId);
    if (infoHeader && matObj) {
      infoHeader.textContent = `Bank Soal: ${matObj.judul}`;
    }

    if (soalList.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:3rem var(--space-xl); background:hsl(220, 20%, 98%); border-radius:var(--radius-xl); border:1.5px dashed var(--border);">
          <img src="assets/images/3d-icons/pencil.png" style="width:44px; height:44px; object-fit:contain; margin-bottom:var(--space-sm);" alt="">
          <h4 style="margin:0 0 6px 0; color:var(--text-primary); font-size:var(--fs-base); font-weight:800;">Belum Ada Butir Soal untuk Sub-Materi Ini</h4>
          <p style="color:var(--text-secondary); font-size:var(--fs-sm); max-width:460px; margin:0 auto var(--space-lg) auto;">
            Tambahkan soal latihan pilihan ganda agar siswa dapat menguji pemahaman materi ini.
          </p>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.openModalSoalLatihan(-1)">
            ➕ Tambah Soal Pertama Sekarang
          </button>
        </div>
      `;
      return;
    }

    let html = "";
    soalList.forEach((soal, idx) => {
      const correctIdx = typeof soal.jawabanBenarIndex === "number" ? soal.jawabanBenarIndex : 0;
      
      html += `
        <div class="card" style="padding:var(--space-xl); border-radius:var(--radius-lg); border:1.5px solid var(--border-light); background:#ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-md); gap:var(--space-md);">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="badge badge-primary" style="font-weight:800; font-size:12px; padding:3px 10px;">Soal #${idx + 1}</span>
            </div>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.openModalSoalLatihan(${idx})" style="padding:4px 10px; font-size:12px; font-weight:700;">
                ✏️ Edit
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.deleteSoalLatihan(${idx})" style="padding:4px 10px; font-size:12px; font-weight:700;">
                🗑️ Hapus
              </button>
            </div>
          </div>

          <div style="font-size:var(--fs-base); font-weight:700; color:var(--text-primary); line-height:1.5; margin-bottom:var(--space-md);">
            ${escapeHtml(soal.pertanyaan)}
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:8px;">
      `;

      (soal.opsi || []).forEach((op, oIdx) => {
        const isCorrect = oIdx === correctIdx;
        const letter = String.fromCharCode(65 + oIdx);
        
        if (isCorrect) {
          html += `
            <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:hsl(152, 60%, 94%); border:1.5px solid hsl(152, 60%, 40%); border-radius:var(--radius-md);">
              <span style="font-weight:900; color:hsl(152, 70%, 25%); min-width:22px;">${letter}.</span>
              <span style="font-size:var(--fs-xs); font-weight:700; color:hsl(152, 80%, 20%); flex:1;">${escapeHtml(op)}</span>
              <span style="font-size:11px; font-weight:800; background:hsl(152, 60%, 30%); color:#fff; padding:2px 6px; border-radius:4px;">Kunci Benar ✓</span>
            </div>
          `;
        } else {
          html += `
            <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:hsl(220, 20%, 98%); border:1px solid var(--border-light); border-radius:var(--radius-md);">
              <span style="font-weight:800; color:var(--text-secondary); min-width:22px;">${letter}.</span>
              <span style="font-size:var(--fs-xs); color:var(--text-secondary); flex:1;">${escapeHtml(op)}</span>
            </div>
          `;
        }
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error("[GuruJS] Gagal load soal latihan:", err);
    container.innerHTML = `
      <div class="note-box alert-danger">
        Gagal memuat bank soal latihan: ${err.message}
      </div>
    `;
  }
}

window.openModalSoalLatihan = function(index) {
  const modal = document.getElementById("modal-soal-latihan");
  const modalTitle = document.getElementById("modal-soal-latihan-title");
  const inputIndex = document.getElementById("soal-latihan-index");
  const inputMateriId = document.getElementById("soal-latihan-materi-id");
  const inputPertanyaan = document.getElementById("soal-latihan-pertanyaan");
  const inputOp0 = document.getElementById("soal-latihan-opsi-0");
  const inputOp1 = document.getElementById("soal-latihan-opsi-1");
  const inputOp2 = document.getElementById("soal-latihan-opsi-2");
  const inputOp3 = document.getElementById("soal-latihan-opsi-3");

  if (!modal) return;

  inputMateriId.value = currentSelectedMateriId;
  inputIndex.value = index;

  if (index >= 0 && currentLatihanKegiatanDoc && currentLatihanKegiatanDoc.soal && currentLatihanKegiatanDoc.soal[index]) {
    const item = currentLatihanKegiatanDoc.soal[index];
    modalTitle.textContent = `Edit Butir Soal #${index + 1}`;
    inputPertanyaan.value = item.pertanyaan || "";
    inputOp0.value = (item.opsi && item.opsi[0]) || "";
    inputOp1.value = (item.opsi && item.opsi[1]) || "";
    inputOp2.value = (item.opsi && item.opsi[2]) || "";
    inputOp3.value = (item.opsi && item.opsi[3]) || "";

    const correct = typeof item.jawabanBenarIndex === "number" ? item.jawabanBenarIndex : 0;
    const radio = document.querySelector(`input[name="soal-latihan-kunci"][value="${correct}"]`);
    if (radio) radio.checked = true;
  } else {
    modalTitle.textContent = "Tambah Butir Soal Latihan Baru";
    inputPertanyaan.value = "";
    inputOp0.value = "";
    inputOp1.value = "";
    inputOp2.value = "";
    inputOp3.value = "";
    const radio0 = document.querySelector('input[name="soal-latihan-kunci"][value="0"]');
    if (radio0) radio0.checked = true;
  }

  modal.style.display = "flex";
};

async function handleSaveSoalLatihan(e) {
  e.preventDefault();

  const inputIndex = parseInt(document.getElementById("soal-latihan-index").value, 10);
  const materiId = document.getElementById("soal-latihan-materi-id").value;
  const pertanyaan = document.getElementById("soal-latihan-pertanyaan").value.trim();
  const op0 = document.getElementById("soal-latihan-opsi-0").value.trim();
  const op1 = document.getElementById("soal-latihan-opsi-1").value.trim();
  const op2 = document.getElementById("soal-latihan-opsi-2").value.trim();
  const op3 = document.getElementById("soal-latihan-opsi-3").value.trim();
  const selectedRadio = document.querySelector('input[name="soal-latihan-kunci"]:checked');
  const jawabanBenarIndex = selectedRadio ? parseInt(selectedRadio.value, 10) : 0;
  const btnSave = document.getElementById("btn-save-modal-soal-latihan");

  if (!pertanyaan || !op0 || !op1 || !op2 || !op3) {
    showToast("Harap isi pertanyaan dan semua 4 pilihan jawaban!", "warning");
    return;
  }

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = "Menyimpan...";
  }

  try {
    const soalItem = {
      pertanyaan,
      opsi: [op0, op1, op2, op3],
      jawabanBenarIndex
    };

    let soalArr = (currentLatihanKegiatanDoc && currentLatihanKegiatanDoc.soal) ? [...currentLatihanKegiatanDoc.soal] : [];

    if (inputIndex >= 0 && inputIndex < soalArr.length) {
      soalArr[inputIndex] = soalItem;
    } else {
      soalArr.push(soalItem);
    }

    const docId = (currentLatihanKegiatanDoc && currentLatihanKegiatanDoc.id) 
      ? currentLatihanKegiatanDoc.id 
      : ("latihan_" + materiId.replace("materi_", ""));

    await setDoc(doc(db, "latihan", docId), {
      materiId: materiId,
      soal: soalArr,
      updatedAt: serverTimestamp()
    }, { merge: true });

    showToast("✅ Butir soal latihan berhasil disimpan!", "success");

    const modal = document.getElementById("modal-soal-latihan");
    if (modal) modal.style.display = "none";

    await loadLatihanSoalList(materiId);
  } catch (err) {
    console.error("[GuruJS] Gagal menyimpan soal latihan:", err);
    showToast("Gagal menyimpan: " + err.message, "error");
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = '<img src="assets/images/3d-icons/check.png" style="width:18px;height:18px;object-fit:contain;margin-right:6px;" alt=""> Simpan Butir Soal';
    }
  }
}

window.deleteSoalLatihan = async function(index) {
  if (!currentLatihanKegiatanDoc || !currentLatihanKegiatanDoc.soal || !currentLatihanKegiatanDoc.soal[index]) return;

  const item = currentLatihanKegiatanDoc.soal[index];
  if (!confirm(`Hapus butir soal #${index + 1}: "${item.pertanyaan.substring(0, 50)}..."?`)) return;

  try {
    let soalArr = [...currentLatihanKegiatanDoc.soal];
    soalArr.splice(index, 1);

    await setDoc(doc(db, "latihan", currentLatihanKegiatanDoc.id), {
      materiId: currentSelectedMateriId,
      soal: soalArr,
      updatedAt: serverTimestamp()
    }, { merge: true });

    showToast("Butir soal berhasil dihapus.", "success");
    await loadLatihanSoalList(currentSelectedMateriId);
  } catch (err) {
    console.error("[GuruJS] Gagal menghapus soal latihan:", err);
    showToast("Gagal menghapus: " + err.message, "error");
  }
};

// Load latihan data on page load
loadLatihanSQLData();

