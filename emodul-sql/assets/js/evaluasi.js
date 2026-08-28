// ============================================
// evaluasi.js — Logic Kuis Evaluasi (PG & Esai)
// E-Modul Interaktif SQL - SMK Negeri 1 Sintuk Toboh Gadang
// ============================================

import { authReady, getCurrentUserData } from "./auth-guard.js";
import {
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "./firebase-config.js";

// ---- Konfigurasi ----
const KUIS_ID = "kuis-akhir";

// ---- State ----
let kuisData = null;
let userData = null;

// ---- DOM ----
const loadingScreen  = document.getElementById("loading-screen");
const appContent     = document.getElementById("app-content");
const evalIntro      = document.getElementById("eval-intro");
const evalForm       = document.getElementById("eval-form");
const evalError      = document.getElementById("eval-error");
const evalLocked     = document.getElementById("eval-locked");
const evalJudulText  = document.getElementById("eval-judul-text");
const evalProgress   = document.getElementById("eval-progress");
const soalContainer  = document.getElementById("soal-container");
const evalWarning    = document.getElementById("eval-warning");
const btnMulai       = document.getElementById("btn-mulai-kuis");
const btnSubmit      = document.getElementById("btn-submit");
const btnBatal       = document.getElementById("btn-batal-kuis");

if (btnBatal) {
  btnBatal.addEventListener("click", () => {
    if (confirm("Apakah Anda yakin ingin membatalkan evaluasi dan kembali ke Beranda?")) {
      window.location.href = "beranda.html";
    }
  });
}

// ---- Init ----
authReady
  .then(async (user) => {
    userData = user;

    // 1. Cek Prasyarat & Fetch Data Kuis secara PARALEL
    const progresRef = doc(db, "progres", user.uid);
    const kuisRef = doc(db, "kuis", KUIS_ID);

    const [progresSnap, kuisSnap] = await Promise.all([
      user.role !== "guru" ? getDoc(progresRef).catch(() => null) : Promise.resolve(null),
      getDoc(kuisRef).catch(() => null)
    ]);

    if (user.role !== "guru") {
      let k1 = false, k2 = false, k3 = false;
      if (progresSnap && progresSnap.exists()) {
        const pData = progresSnap.data();
        k1 = !!pData.kegiatan1Selesai;
        k2 = !!pData.kegiatan2Selesai;
        k3 = !!pData.kegiatan3Selesai;
      }

      if (!k1 || !k2 || !k3) {
        loadingScreen.style.display = "none";
        appContent.style.display = "block";
        evalIntro.style.display = "none";
        if (evalLocked) {
          evalLocked.style.display = "block";

          const badge1 = document.getElementById("lock-badge-keg1");
          const badge2 = document.getElementById("lock-badge-keg2");
          const badge3 = document.getElementById("lock-badge-keg3");
          const btnResume = document.getElementById("btn-lock-resume-eval");

          if (badge1) {
            badge1.className = k1 ? "badge badge-success" : "badge badge-danger";
            badge1.textContent = k1 ? "✓ Selesai" : "⏳ Belum";
          }
          if (badge2) {
            badge2.className = k2 ? "badge badge-success" : "badge badge-danger";
            badge2.textContent = k2 ? "✓ Selesai" : "⏳ Belum";
          }
          if (badge3) {
            badge3.className = k3 ? "badge badge-success" : "badge badge-danger";
            badge3.textContent = k3 ? "✓ Selesai" : "⏳ Belum";
          }

          if (btnResume) {
            if (!k1) btnResume.href = "kegiatan/kegiatan-1.html";
            else if (!k2) btnResume.href = "kegiatan/kegiatan-2.html";
            else btnResume.href = "kegiatan/kegiatan-3.html";
          }
        }
        return;
      }
    }

    loadingScreen.style.display = "none";
    appContent.style.display = "block";

    if (!kuisSnap || !kuisSnap.exists()) {
      evalIntro.style.display = "none";
      evalError.style.display = "block";
      return;
    }

    kuisData = { id: kuisSnap.id, ...kuisSnap.data() };

    // Cek jika status eksplisit draft
    if (kuisData.status === "draft") {
      evalIntro.style.display = "none";
      evalError.style.display = "block";
      
      const errorTitle = document.querySelector("#eval-error h2");
      const errorDesc = document.querySelector("#eval-error p");
      if (errorTitle) errorTitle.textContent = "🔒 Kuis Sedang Ditutup (Draft)";
      if (errorDesc) errorDesc.textContent = "Kuis evaluasi akhir sedang dalam penyiapan oleh Guru Anda. Silakan hubungi Guru Anda untuk mengaktifkannya.";
      return;
    }

    // Update judul
    if (kuisData.judul) {
      evalJudulText.textContent = kuisData.judul;
    }

    if (kuisData.soal && kuisData.soal.length > 0) {
      const pgCount = kuisData.soal.filter(s => s.tipe !== "esai").length;
      const esaiCount = kuisData.soal.filter(s => s.tipe === "esai").length;
      evalProgress.innerHTML = `<strong>${kuisData.soal.length}</strong> Butir Soal (${pgCount} Pilihan Ganda, ${esaiCount} Esai)`;
    }
  })
  .catch((err) => {
    console.error("[Evaluasi] Auth error:", err);
  });

// ---- Mulai Kuis ----
btnMulai.addEventListener("click", () => {
  if (!kuisData || !kuisData.soal) return;

  evalIntro.style.display = "none";
  evalForm.classList.add("active");

  renderSoal(kuisData.soal);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ---- Render Soal (PG & Esai) ----
function renderSoal(soalArray) {
  let html = "";

  soalArray.forEach((soal, idx) => {
    const isEsai = soal.tipe === "esai";

    html += `
      <div class="eval-soal" id="eval-soal-${idx}">
        <div class="eval-soal-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:var(--space-sm);">
            <div class="eval-soal-number">${idx + 1}</div>
            <span style="font-size:var(--fs-xs);font-weight:800;color:var(--text-secondary);text-transform:uppercase;">SOAL ${idx + 1} DARI ${soalArray.length}</span>
          </div>
          <span class="badge ${isEsai ? 'badge-info' : 'badge-primary'}" style="font-size:10px; font-weight:700;">
            ${isEsai ? '📝 Soal Esai / Uraian' : '🔘 Pilihan Ganda'}
          </span>
        </div>
        <div class="eval-soal-text">${escapeHtml(soal.pertanyaan)}</div>
    `;

    if (isEsai) {
      // Body for Essay Question
      html += `
        <div style="margin-top:var(--space-md);">
          <textarea
            class="form-input eval-esai-input"
            id="eval-esai-${idx}"
            rows="4"
            placeholder="Tuliskan penjelasan jawaban atau baris query SQL Anda secara lengkap di sini..."
            style="resize:vertical; line-height:1.6; padding:var(--space-md); font-family:inherit; background:hsl(220, 20%, 98.5%); font-size:var(--fs-sm);"
          ></textarea>
        </div>
      `;
    } else {
      // Body for Multiple Choice
      html += `<div class="eval-opsi-list">`;
      const opsiList = soal.opsi || ["", "", "", ""];
      opsiList.forEach((opsi, opsiIdx) => {
        const letter = String.fromCharCode(65 + opsiIdx);
        html += `
          <label class="eval-opsi" id="label-eval-${idx}-${opsiIdx}">
            <input type="radio" name="eval-${idx}" value="${opsiIdx}">
            <span class="eval-opsi-letter">${letter}.</span>
            <span class="eval-opsi-text" style="flex:1;">${escapeHtml(opsi)}</span>
          </label>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  soalContainer.innerHTML = html;

  // Interaktivitas label radio (PG)
  soalContainer.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const name = e.target.name;
      soalContainer.querySelectorAll(`input[name="${name}"]`).forEach(inp => {
        inp.closest(".eval-opsi").classList.remove("selected");
      });
      e.target.closest(".eval-opsi").classList.add("selected");

      const soalEl = e.target.closest(".eval-soal");
      if (soalEl) soalEl.classList.remove("unanswered-highlight");
      evalWarning.classList.remove("visible");
    });
  });

  // Interaktivitas textarea (Esai)
  soalContainer.querySelectorAll('.eval-esai-input').forEach((textarea) => {
    textarea.addEventListener("input", (e) => {
      const soalEl = e.target.closest(".eval-soal");
      if (e.target.value.trim().length > 0 && soalEl) {
        soalEl.classList.remove("unanswered-highlight");
        evalWarning.classList.remove("visible");
      }
    });
  });
}

// ---- Submit Kuis ----
btnSubmit.addEventListener("click", async () => {
  if (!kuisData || !userData) return;

  const totalSoal = kuisData.soal.length;
  const jawabanSiswa = [];
  let allAnswered = true;

  // Kumpulkan jawaban
  for (let i = 0; i < totalSoal; i++) {
    const soal = kuisData.soal[i];
    const isEsai = soal.tipe === "esai";

    if (isEsai) {
      const textarea = document.getElementById(`eval-esai-${i}`);
      const textVal = textarea ? textarea.value.trim() : "";
      if (!textVal) {
        allAnswered = false;
        const soalEl = document.getElementById(`eval-soal-${i}`);
        if (soalEl) soalEl.classList.add("unanswered-highlight");
        jawabanSiswa.push(""); // empty essay
      } else {
        jawabanSiswa.push(textVal);
      }
    } else {
      const selected = document.querySelector(`input[name="eval-${i}"]:checked`);
      if (!selected) {
        allAnswered = false;
        const soalEl = document.getElementById(`eval-soal-${i}`);
        if (soalEl) soalEl.classList.add("unanswered-highlight");
        jawabanSiswa.push(-1); // belum dijawab
      } else {
        jawabanSiswa.push(parseInt(selected.value));
      }
    }
  }

  // Validasi: semua harus dijawab
  if (!allAnswered) {
    evalWarning.classList.add("visible");

    // Scroll ke soal pertama yang belum dijawab
    const firstUnanswered = document.querySelector(".eval-soal.unanswered-highlight");
    if (firstUnanswered) {
      firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  // Konfirmasi submit
  if (!confirm("Apakah Anda yakin ingin mengumpulkan seluruh jawaban evaluasi sekarang?")) {
    return;
  }

  // Hitung skor objektif PG + esai completion
  let benar = 0;
  kuisData.soal.forEach((soal, idx) => {
    if (soal.tipe === "esai") {
      // For essay: awarded if student submitted non-empty answer
      if (typeof jawabanSiswa[idx] === "string" && jawabanSiswa[idx].trim().length > 0) {
        benar++;
      }
    } else {
      // For PG: check correct option index
      if (jawabanSiswa[idx] === soal.jawabanBenarIndex) {
        benar++;
      }
    }
  });

  const skor = Math.round((benar / totalSoal) * 100);

  // Disable tombol
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Menyimpan Hasil Evaluasi…";

  try {
    // Simpan ke Firestore
    const docId = `${userData.uid}_${KUIS_ID}`;
    await setDoc(doc(db, "hasilKuis", docId), {
      userId: userData.uid,
      uid: userData.uid,
      nama: userData.nama || "Siswa",
      kelas: userData.kelas || "-",
      nisn: userData.nisn || "-",
      kuisId: KUIS_ID,
      skor: skor,
      nilai: skor,
      totalSoal: totalSoal,
      jumlahBenar: benar,
      jawabanSiswa: jawabanSiswa,
      waktuSelesai: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    // Redirect ke halaman hasil
    window.location.href = `hasil-evaluasi.html?kuisId=${KUIS_ID}`;
  } catch (err) {
    console.error("[Evaluasi] Gagal simpan hasil:", err);
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<img src="assets/images/3d-icons/check.png" style="width:20px;height:20px;object-fit:contain;margin-right:6px;" alt=""> Kirim & Selesaikan Ujian`;

    evalWarning.textContent = "❌ Gagal menyimpan jawaban. Periksa koneksi internet Anda dan coba lagi.";
    evalWarning.classList.add("visible");
  }
});

// ---- Utility ----
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
