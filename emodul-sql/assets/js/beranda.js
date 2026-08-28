// ============================================
// beranda.js — Beranda Siswa Logic (Sequential Gating & KKM >= 80)
// E-Modul Interaktif SQL - SMK Negeri 1 Sintuk Toboh Gadang
// ============================================

import { db, doc, getDoc, setDoc, collection, query, where, getDocs } from "./firebase-config.js";
import { authReady, getCurrentUserData, logout } from "./auth-guard.js";

// ---- Tunggu auth selesai, lalu render UI ----
// ---- Tunggu auth selesai, lalu render UI ----
authReady
  .then(async (userData) => {
    // 1. Tampilkan Data Profil Pengguna
    const initial = (userData.nama || "S").trim().charAt(0).toUpperCase();
    document.getElementById("avatar-initial").textContent = initial;
    document.getElementById("greeting-name").textContent = userData.nama || "Siswa";
    document.getElementById("nav-username").textContent = userData.nama || "Siswa";

    // Info kelas/NISN
    if (userData.kelas || userData.nisn) {
      const kelasBadge = document.getElementById("hero-kelas-badge");
      if (kelasBadge) {
        const info = [];
        if (userData.nisn && userData.nisn !== "-") info.push(`NISN: ${userData.nisn}`);
        if (userData.kelas && userData.kelas !== "-") info.push(`Kelas: ${userData.kelas}`);
        kelasBadge.textContent = `🏫 ${info.join(" • ") || "SMKN 1 Sintuk Toboh Gadang"}`;
      }
    }

    // Role badge
    const roleBadge = document.getElementById("nav-role-badge");
    if (roleBadge) {
      if (userData.role === "guru") {
        roleBadge.className = "badge badge-warning";
        roleBadge.textContent = "Guru / Admin";
      } else {
        roleBadge.className = "badge badge-primary";
        roleBadge.textContent = "Siswa";
      }
    }

    // Cek jika user adalah Guru → tampilkan banner & tombol Dashboard Guru
    if (userData.role === "guru") {
      const guruBanner = document.getElementById("guru-banner");
      if (guruBanner) guruBanner.style.display = "block";
      const navGuruBtn = document.getElementById("nav-guru-btn");
      if (navGuruBtn) navGuruBtn.style.display = "inline-flex";
    }

    // Tampilkan konten seketika jika ada cache
    const cacheKey = `cache_progres_${userData.uid}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          renderProgresUI(parsed.pData || {}, parsed.maxNilai || 0, parsed.hasHasil || false, userData.role === "guru");
          document.getElementById("loading-screen").style.display = "none";
          document.getElementById("app-content").style.display = "block";
        }
      }
    } catch (e) {}

    // 2. Fetch progres & Hasil Kuis secara paralel
    await loadProgresDanEvaluasi(userData.uid, userData.role === "guru");

    // 3. Sembunyikan loading, pastikan konten tampil
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById("app-content").style.display = "block";
  })
  .catch((err) => {
    console.error("[Beranda] Auth error:", err);
  });

// ---- Tombol Logout ----
document.getElementById("btn-logout").addEventListener("click", logout);

// ---- Load Progres & Hasil Kuis dari Firestore secara Paralel ----
async function loadProgresDanEvaluasi(uid, isGuru = false) {
  try {
    const ref = doc(db, "progres", uid);
    const qHasil = query(collection(db, "hasilKuis"), where("userId", "==", uid));

    // Fetch paralel progres & hasil evaluasi
    const [snapProgres, snapHasil] = await Promise.all([
      getDoc(ref).catch(() => null),
      getDocs(qHasil).catch(() => null)
    ]);

    let pData = {};

    if (snapProgres && snapProgres.exists()) {
      pData = snapProgres.data();
    } else {
      // User baru — buat dokumen progres awal
      pData = {
        panduanSelesai: false,
        cpatpSelesai: false,
        kegiatan1Selesai: false,
        kegiatan2Selesai: false,
        kegiatan3Selesai: false,
      };
      setDoc(ref, pData).catch(console.warn);
    }

    let maxNilai = 0;
    let hasHasil = false;

    if (snapHasil && !snapHasil.empty) {
      hasHasil = true;
      snapHasil.forEach(docSnap => {
        const d = docSnap.data();
        if (d.nilai > maxNilai) maxNilai = d.nilai;
      });
    }

    // Render ke UI
    renderProgresUI(pData, maxNilai, hasHasil, isGuru);

    // Simpan ke cache lokal untuk fast load berikutnya
    try {
      sessionStorage.setItem(`cache_progres_${uid}`, JSON.stringify({ pData, maxNilai, hasHasil }));
    } catch (e) {}

  } catch (err) {
    console.error("[Beranda] Gagal load progres & evaluasi:", err);
  }
}

function renderProgresUI(pData, maxNilai = 0, hasHasil = false, isGuru = false) {
  // Parse status tiap tahap
  const isPanduanDone = !!pData.panduanSelesai || isGuru;
  const isCpatpDone = (isPanduanDone && !!pData.cpatpSelesai) || isGuru;

  const k1Score = pData.kegiatan1?.nilaiLatihan ?? (pData.kegiatan1Selesai ? 100 : 0);
  const k1Lolos = isCpatpDone && ((pData.kegiatan1?.lolos || k1Score >= 80) || isGuru);

  const k2Score = pData.kegiatan2?.nilaiLatihan ?? (pData.kegiatan2Selesai ? 100 : 0);
  const k2Lolos = k1Lolos && ((pData.kegiatan2?.lolos || k2Score >= 80) || isGuru);

  const k3Score = pData.kegiatan3?.nilaiLatihan ?? (pData.kegiatan3Selesai ? 100 : 0);
  const k3Lolos = k2Lolos && ((pData.kegiatan3?.lolos || k3Score >= 80) || isGuru);

  // Hitung total progres persentase (5 langkah: Panduan, CP/ATP, KB1, KB2, KB3)
  const stepsCompleted = [isPanduanDone, isCpatpDone, k1Lolos, k2Lolos, k3Lolos].filter(Boolean).length;
  const percent = Math.round((stepsCompleted / 5) * 100);

  // Update Progres Bar & Stat Card
  const heroBar = document.getElementById("hero-progress-bar");
  if (heroBar) heroBar.style.width = `${percent}%`;
  const percentText = document.getElementById("progress-percent-text");
  if (percentText) percentText.textContent = `${percent}% Selesai (${stepsCompleted}/5 Tahap)`;

  const completedKegiatanCount = [k1Lolos, k2Lolos, k3Lolos].filter(Boolean).length;
  const statKeg = document.getElementById("stat-kegiatan-text");
  if (statKeg) statKeg.textContent = `${completedKegiatanCount} / 3 Selesai`;

  // Update Badges & Locks di Roadmap
  updateRoadmapCard("roadmap-keg1", "badge-keg1", isCpatpDone, k1Lolos, k1Score, "Kegiatan 1: Pengenalan SQL & DDL", "kegiatan/kegiatan-1.html", "Selesaikan CP & ATP dahulu");
  updateRoadmapCard("roadmap-keg2", "badge-keg2", k1Lolos, k2Lolos, k2Score, "Kegiatan 2: Data Manipulation (DML)", "kegiatan/kegiatan-2.html", "Raih nilai latihan KB 1 ≥ 80");
  updateRoadmapCard("roadmap-keg3", "badge-keg3", k2Lolos, k3Lolos, k3Score, "Kegiatan 3: Data Control Language (DCL)", "kegiatan/kegiatan-3.html", "Raih nilai latihan KB 2 ≥ 80");

  // Update Tombol Lanjutkan Belajar Utama
  const btnResume = document.getElementById("btn-resume-learning");
  if (btnResume) {
    if (!isPanduanDone) {
      btnResume.href = "panduan.html";
      btnResume.innerHTML = '<img src="assets/images/3d-icons/book.png" class="btn-3d-icon" alt=""> Buka Petunjuk Penggunaan';
    } else if (!isCpatpDone) {
      btnResume.href = "cp-atp.html";
      btnResume.innerHTML = '<img src="assets/images/3d-icons/target.png" class="btn-3d-icon" alt=""> Pelajari CP & ATP';
    } else if (!k1Lolos) {
      btnResume.href = "kegiatan/kegiatan-1.html";
      btnResume.innerHTML = '<img src="assets/images/3d-icons/rocket.png" class="btn-3d-icon" alt=""> ' + (k1Score > 0 ? "Ulangi Latihan Kegiatan 1" : "Mulai Kegiatan 1");
    } else if (!k2Lolos) {
      btnResume.href = "kegiatan/kegiatan-2.html";
      btnResume.innerHTML = '<img src="assets/images/3d-icons/rocket.png" class="btn-3d-icon" alt=""> ' + (k2Score > 0 ? "Ulangi Latihan Kegiatan 2" : "Lanjut ke Kegiatan 2");
    } else if (!k3Lolos) {
      btnResume.href = "kegiatan/kegiatan-3.html";
      btnResume.innerHTML = '<img src="assets/images/3d-icons/rocket.png" class="btn-3d-icon" alt=""> ' + (k3Score > 0 ? "Ulangi Latihan Kegiatan 3" : "Lanjut ke Kegiatan 3");
    } else {
      btnResume.href = "evaluasi.html";
      btnResume.innerHTML = '<img src="assets/images/3d-icons/trophy.png" class="btn-3d-icon" alt=""> Ambil Evaluasi Akhir';
    }
  }

  // Tool Card SQL Playground: Selalu Terbuka & Aktif
  const badgeToolEditor = document.getElementById("badge-tool-editor");
  if (badgeToolEditor) {
    badgeToolEditor.className = "badge badge-success";
    badgeToolEditor.textContent = "🟢 Siap Praktik Bebas";
  }

  // Tool Card CP & ATP Status
  const badgeToolCpatp = document.getElementById("badge-tool-cpatp");
  if (badgeToolCpatp) {
    if (isCpatpDone) {
      badgeToolCpatp.className = "badge badge-success";
      badgeToolCpatp.textContent = "✓ Selesai";
    } else if (isPanduanDone) {
      badgeToolCpatp.className = "badge badge-warning";
      badgeToolCpatp.textContent = "🔓 Siap Dibaca";
    } else {
      badgeToolCpatp.className = "badge badge-neutral";
      badgeToolCpatp.textContent = "🔒 Terkunci";
    }
  }

  // Tool Card Panduan Status
  const badgeToolPanduan = document.getElementById("badge-tool-panduan");
  if (badgeToolPanduan) {
    badgeToolPanduan.className = isPanduanDone ? "badge badge-success" : "badge badge-warning";
    badgeToolPanduan.textContent = isPanduanDone ? "✓ Selesai" : "🟢 Wajib Dibaca";
  }

  // Status Hasil Evaluasi
  const badgeEval = document.getElementById("badge-eval");
  const statEval = document.getElementById("stat-evaluasi-text");
  const evalActionText = document.getElementById("eval-action-text");
  const cardEval = document.getElementById("roadmap-eval");

  if (hasHasil) {
    if (statEval) {
      statEval.textContent = `Nilai: ${maxNilai}/100`;
      statEval.style.color = maxNilai >= 75 ? "var(--success)" : "var(--warning)";
    }
    if (badgeEval) {
      badgeEval.className = maxNilai >= 75 ? "badge badge-success" : "badge badge-warning";
      badgeEval.textContent = `✓ Selesai (${maxNilai}/100)`;
    }
    if (evalActionText) evalActionText.textContent = "Lihat Pembahasan Hasil";
    if (cardEval) {
      cardEval.classList.remove("is-locked");
      cardEval.href = "evaluasi.html";
      cardEval.onclick = null;
    }
  } else {
    if (k3Lolos || isGuru) {
      if (statEval) {
        statEval.textContent = "Siap Dikerjakan";
        statEval.style.color = "";
      }
      if (badgeEval) {
        badgeEval.className = "badge badge-warning";
        badgeEval.textContent = "Siap Dikerjakan";
      }
      if (evalActionText) evalActionText.textContent = "Mulai Evaluasi Sekarang";
      if (cardEval) {
        cardEval.classList.remove("is-locked");
        cardEval.href = "evaluasi.html";
        cardEval.onclick = null;
      }
    } else {
      if (statEval) {
        statEval.textContent = "Terkunci (KKM KB3: 80)";
        statEval.style.color = "";
      }
      if (badgeEval) {
        badgeEval.className = "badge badge-neutral";
        badgeEval.textContent = "🔒 Terkunci (KB 3 Nilai ≥ 80)";
      }
      if (evalActionText) evalActionText.textContent = "🔒 Selesaikan Latihan KB 3 (≥ 80)";
      if (cardEval) {
        cardEval.classList.add("is-locked");
        cardEval.removeAttribute("href");
        cardEval.onclick = (e) => {
          e.preventDefault();
          alert("Evaluasi Akhir masih terkunci. Harap selesaikan Kegiatan Belajar 3 dan raih nilai latihan minimal 80 terlebih dahulu.");
        };
      }
    }
  }
}

function updateRoadmapCard(cardId, badgeId, isUnlocked, isDone, score, title, targetUrl, lockReason) {
  const card = document.getElementById(cardId);
  const badge = document.getElementById(badgeId);
  if (!card) return;

  if (isDone) {
    card.classList.remove("is-locked");
    card.href = targetUrl;
    card.onclick = null;
    if (badge) {
      badge.className = "badge badge-success";
      badge.textContent = `✓ Lulus (${score}/100)`;
    }
  } else if (isUnlocked) {
    card.classList.remove("is-locked");
    card.href = targetUrl;
    card.onclick = null;
    if (badge) {
      if (score > 0) {
        badge.className = "badge badge-warning";
        badge.textContent = `⚠️ Belum Lulus (${score}/100)`;
      } else {
        badge.className = "badge badge-primary";
        badge.textContent = "🔓 Siap Dipelajari";
      }
    }
  } else {
    card.classList.add("is-locked");
    card.removeAttribute("href");
    card.onclick = (e) => {
      e.preventDefault();
      alert(`Tahapan ini masih terkunci! Syarat: ${lockReason}.`);
    };
    if (badge) {
      badge.className = "badge badge-neutral";
      badge.textContent = "🔒 Terkunci";
    }
  }
}
