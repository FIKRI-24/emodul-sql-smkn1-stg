// ============================================
// materi-loader.js — Fetch & Render Materi dari Firestore
// E-Modul Interaktif SQL - SMK Negeri 1 Sintuk Toboh Gadang
// ============================================

import {
  db,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc
} from "./firebase-config.js";

/**
 * Fetch semua materi untuk kegiatan tertentu, diurutkan.
 * @param {number} kegiatanKe — 1, 2, atau 3
 * @returns {Promise<Array>} array dokumen materi
 */
export async function loadMateri(kegiatanKe) {
  try {
    const q = query(
      collection(db, "materi"),
      where("kegiatanKe", "==", kegiatanKe)
    );
    const snapshot = await getDocs(q);

    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });

    list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    return list;
  } catch (err) {
    console.error(`[MateriLoader] Gagal load materi kegiatan ${kegiatanKe}:`, err);
    return [];
  }
}

/**
 * Fetch video untuk materi tertentu.
 * @param {string} materiId
 * @returns {Promise<Array>}
 */
export async function loadVideos(materiId) {
  try {
    const q = query(
      collection(db, "video"),
      where("materiId", "==", materiId)
    );
    const snapshot = await getDocs(q);

    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  } catch (err) {
    console.error(`[MateriLoader] Gagal load video untuk materi ${materiId}:`, err);
    return [];
  }
}

/**
 * Fetch semua video untuk seluruh materi dalam satu kegiatan.
 * Mendukung query kegiatanKe, fallback materiId, dan fallback scan ID dokumen.
 * @param {number} kegiatanKe
 * @param {Array} materiArray
 * @returns {Promise<Array>}
 */
export async function loadAllVideos(kegiatanKe, materiArray = []) {
  const kNum = Number(kegiatanKe) || 1;
  const videoMap = new Map();

  // 1. Query utama: where("kegiatanKe", "==", kNum)
  try {
    const qKeg = query(
      collection(db, "video"),
      where("kegiatanKe", "==", kNum)
    );
    const snapKeg = await getDocs(qKeg);
    snapKeg.forEach((docSnap) => {
      videoMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    });
  } catch (err) {
    console.warn("[MateriLoader] Query video by kegiatanKe error:", err);
  }

  // 2. Query fallback: Berdasarkan ID materi yang aktif dalam kegiatan ini
  if (materiArray && materiArray.length > 0) {
    for (const materi of materiArray) {
      try {
        const vids = await loadVideos(materi.id);
        if (vids && vids.length > 0) {
          vids.forEach((v) => {
            if (!videoMap.has(v.id)) {
              videoMap.set(v.id, v);
            }
          });
        }
      } catch (err) {
        console.warn(`[MateriLoader] Fallback loadVideos(${materi.id}) error:`, err);
      }
    }
  }

  // 3. Query fallback darurat: Scan seluruh koleksi video jika masih kosong
  if (videoMap.size === 0) {
    try {
      const snapAll = await getDocs(collection(db, "video"));
      snapAll.forEach((docSnap) => {
        const data = docSnap.data();
        const dId = docSnap.id.toLowerCase();
        const mId = String(data.materiId || "").toLowerCase();
        const kVal = Number(data.kegiatanKe);

        if (
          kVal === kNum ||
          dId.includes(`keg${kNum}`) ||
          dId.includes(`kegiatan${kNum}`) ||
          mId.includes(`keg${kNum}`) ||
          mId.includes(`kegiatan${kNum}`)
        ) {
          if (!videoMap.has(docSnap.id)) {
            videoMap.set(docSnap.id, { id: docSnap.id, ...data });
          }
        }
      });
    } catch (err) {
      console.warn("[MateriLoader] Emergency fallback video load error:", err);
    }
  }

  const result = Array.from(videoMap.values());
  result.sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
  return result;
}

/**
 * Fetch latihan untuk materi tertentu.
 * @param {string} materiId
 * @returns {Promise<Object|null>}
 */
export async function loadLatihan(materiId) {
  try {
    const q = query(
      collection(db, "latihan"),
      where("materiId", "==", materiId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error(`[MateriLoader] Gagal load latihan untuk materi ${materiId}:`, err);
    return null;
  }
}

/**
 * Fetch semua latihan untuk seluruh sub-materi dalam satu kegiatan.
 * @param {number} kegiatanKe
 * @param {Array} materiArray
 * @returns {Promise<Array>} array objek latihan
 */
export async function loadAllLatihan(kegiatanKe, materiArray) {
  const allLatihan = [];
  for (const materi of materiArray) {
    const lat = await loadLatihan(materi.id);
    if (lat && lat.soal && lat.soal.length > 0) {
      allLatihan.push({
        ...lat,
        materiJudul: materi.judul
      });
    }
  }
  return allLatihan;
}

/**
 * Render array materi ke dalam container HTML.
 * Otomatis menambahkan tombol salin kode dan styling.
 * @param {Array} materiArray
 * @param {string} containerId
 */
export function renderMateriHtml(materiArray, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (materiArray.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);">
        <img src="../assets/images/3d-icons/book.png" class="header-3d-icon" alt="" style="margin-bottom:1rem;">
        <p style="font-weight:700;font-size:var(--fs-md);margin:0 0 4px 0;color:var(--text-primary);">Belum ada materi untuk kegiatan ini.</p>
        <p style="font-size:var(--fs-sm);margin:0;">Materi akan diperbarui secara berkala oleh guru.</p>
      </div>
    `;
    return;
  }

  let html = "";

  materiArray.forEach((materi, index) => {
    html += `
      <article class="materi-item" id="materi-${materi.id}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-md);">
          <span class="badge badge-primary" style="font-size:11px;font-weight:800;padding:4px 10px;">SUB-MATERI ${index + 1}</span>
          <h3 style="margin:0;font-size:var(--fs-lg);color:var(--text-primary);font-weight:800;">${escapeHtml(materi.judul)}</h3>
        </div>
        <div class="materi-body" style="font-size:var(--fs-base);line-height:1.75;">
          ${enhanceCodeBlocks(materi.kontenHtml)}
        </div>
      </article>
    `;
  });

  container.innerHTML = html;

  // Pasang event listener untuk tombol Copy Code
  attachCopyCodeListeners(container);
}

/**
 * Render video embed YouTube dengan normalisasi URL dan link langsung.
 * @param {Array} videoArray
 * @param {string} containerId
 */
export function renderVideoHtml(videoArray, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!videoArray || videoArray.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);">
        <img src="../assets/images/3d-icons/video.png" class="header-3d-icon" alt="" style="margin-bottom:1rem;">
        <p style="font-weight:700;color:var(--text-primary);font-size:var(--fs-base);margin:0 0 4px 0;">Belum ada video untuk kegiatan ini.</p>
        <p style="font-size:var(--fs-sm);margin:0;">Video pembelajaran akan diperbarui secara berkala oleh guru.</p>
      </div>
    `;
    return;
  }

  let html = `<div style="display:grid;grid-template-columns:1fr;gap:var(--space-xl);">`;
  videoArray.forEach((video, idx) => {
    const rawUrl = video.urlYoutube || "";
    const embedUrl = parseYouTubeEmbedUrl(rawUrl);
    const watchUrl = getYouTubeWatchUrl(rawUrl);

    html += `
      <div class="card" style="padding:var(--space-lg);border-radius:var(--radius-xl);background:#ffffff;box-shadow:var(--shadow-sm);border:1px solid var(--border-light);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:var(--space-md);flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge badge-info" style="font-weight:800;font-size:11px;padding:4px 10px;">VIDEO #${idx + 1}</span>
            <h4 style="margin:0;font-size:var(--fs-base);font-weight:800;color:var(--text-primary);">${escapeHtml(video.judul || "Video Pembelajaran SQL")}</h4>
          </div>
          ${watchUrl ? `
            <a href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
              <span>↗</span> Buka di YouTube
            </a>
          ` : ""}
        </div>
        <div class="video-wrapper" style="border-radius:var(--radius-lg);overflow:hidden;background:#0f172a;">
          <iframe
            src="${escapeHtml(embedUrl)}"
            title="${escapeHtml(video.judul || 'Video Pembelajaran SQL')}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  container.innerHTML = html;
}

/**
 * Render semua kelompok soal latihan dari seluruh sub-materi.
 * @param {Array} latihanArray — array of { materiJudul, soal: [] }
 * @param {string} containerId
 * @param {number} kegiatanKe
 * @param {string} userId
 * @param {Function} onScoreEvaluated — callback(skor, isLolos)
 */
export function renderAllLatihanHtml(latihanArray, containerId, kegiatanKe = 1, userId = null, onScoreEvaluated = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!latihanArray || latihanArray.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);">
        <img src="../assets/images/3d-icons/pencil.png" class="header-3d-icon" alt="" style="margin-bottom:1rem;">
        <p style="font-weight:700;color:var(--text-primary);">Belum ada soal latihan untuk kegiatan ini.</p>
      </div>
    `;
    return;
  }

  let totalSoalCount = 0;
  let html = "";

  // Info KKM Banner
  html += `
    <div style="background:hsl(220,25%,97%);border:1.5px dashed var(--primary-light);padding:var(--space-md) var(--space-lg);border-radius:var(--radius-lg);margin-bottom:var(--space-xl);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-sm);">
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="../assets/images/3d-icons/trophy.png" style="width:28px;height:28px;object-fit:contain;" alt="">
        <div>
          <strong style="font-size:var(--fs-sm);color:var(--text-primary);">Syarat Kelulusan Latihan (KKM: 80)</strong>
          <p style="margin:0;font-size:var(--fs-xs);color:var(--text-secondary);">Raih nilai minimal <strong>80 / 100</strong> agar tahapan pembelajaran berikutnya dapat dibuka.</p>
        </div>
      </div>
      <span class="badge badge-warning" style="font-weight:800;font-size:11px;">Ambang Batas: 80%</span>
    </div>
  `;

  latihanArray.forEach((latGroup) => {
    latGroup.soal.forEach((soal) => {
      const qIndex = totalSoalCount;
      totalSoalCount++;

      html += `
        <div class="latihan-card" id="soal-card-${qIndex}">
          <div class="latihan-pertanyaan">
            <span style="color:var(--primary);font-weight:800;margin-right:6px;">${qIndex + 1}.</span>
            ${escapeHtml(soal.pertanyaan)}
          </div>
          <div class="opsi-list">
      `;

      soal.opsi.forEach((opsi, oIdx) => {
        html += `
          <label class="opsi-label" id="label-${qIndex}-${oIdx}">
            <input type="radio" name="soal-${qIndex}" value="${oIdx}" style="accent-color:var(--primary);width:18px;height:18px;">
            <span style="font-weight:800;color:var(--primary);min-width:20px;">${String.fromCharCode(65 + oIdx)}.</span>
            <span style="flex:1;">${escapeHtml(opsi)}</span>
          </label>
        `;
      });

      html += `
            <div class="feedback-box" id="feedback-${qIndex}"></div>
          </div>
        </div>
      `;
    });
  });

  html += `
    <div id="latihan-result-box" style="margin-top:var(--space-xl);"></div>

    <div style="display:flex;align-items:center;gap:var(--space-md);flex-wrap:wrap;margin-top:var(--space-lg);">
      <button class="btn btn-primary btn-lg" id="btn-cek-semua-latihan" type="button">
        <img src="../assets/images/3d-icons/rocket.png" class="btn-3d-icon" alt="">
        Periksa & Simpan Jawaban Latihan
      </button>
      <button class="btn btn-secondary btn-lg" id="btn-reset-latihan-all" type="button" style="display:none;">
        🔄 Ulangi Latihan
      </button>
    </div>
  `;

  container.innerHTML = html;

  // Interaktivitas pilih label
  container.querySelectorAll(".opsi-label input").forEach(input => {
    input.addEventListener("change", (e) => {
      const name = e.target.name;
      container.querySelectorAll(`input[name="${name}"]`).forEach(inp => {
        inp.closest(".opsi-label").classList.remove("selected");
      });
      e.target.closest(".opsi-label").classList.add("selected");
    });
  });

  // Handler reset latihan
  const btnReset = document.getElementById("btn-reset-latihan-all");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      resetLatihanUI(container);
    });
  }

  // Handler cek jawaban
  document.getElementById("btn-cek-semua-latihan").addEventListener("click", async () => {
    await checkAllLatihan(latihanArray, kegiatanKe, userId, onScoreEvaluated);
  });
}

function resetLatihanUI(container) {
  container.querySelectorAll(".opsi-label input").forEach(inp => {
    inp.checked = false;
    inp.disabled = false;
  });
  container.querySelectorAll(".opsi-label").forEach(lbl => {
    lbl.className = "opsi-label";
  });
  container.querySelectorAll(".feedback-box").forEach(fb => {
    fb.className = "feedback-box";
    fb.innerHTML = "";
  });
  const resBox = document.getElementById("latihan-result-box");
  if (resBox) resBox.innerHTML = "";

  const btnCek = document.getElementById("btn-cek-semua-latihan");
  if (btnCek) {
    btnCek.disabled = false;
    btnCek.innerHTML = '<img src="../assets/images/3d-icons/rocket.png" class="btn-3d-icon" alt=""> Periksa & Simpan Jawaban Latihan';
  }

  const btnReset = document.getElementById("btn-reset-latihan-all");
  if (btnReset) btnReset.style.display = "none";
}

async function checkAllLatihan(latihanArray, kegiatanKe, userId, onScoreEvaluated) {
  let benar = 0;
  let total = 0;
  let globalIndex = 0;
  let adaKosong = false;

  latihanArray.forEach(group => {
    group.soal.forEach(soal => {
      const qIndex = globalIndex;
      globalIndex++;
      total++;

      const selected = document.querySelector(`input[name="soal-${qIndex}"]:checked`);
      const feedback = document.getElementById(`feedback-${qIndex}`);

      if (!selected) {
        adaKosong = true;
        feedback.className = "feedback-box show note-box alert-warning";
        feedback.innerHTML = `
          <img src="../assets/images/3d-icons/warning.png" class="btn-3d-icon" alt="">
          <span>Soal ini belum Anda jawab.</span>
        `;
        return;
      }

      const jawaban = parseInt(selected.value);

      if (jawaban === soal.jawabanBenarIndex) {
        benar++;
      }
      
      // Sembunyikan feedback per butir soal agar siswa tidak melihat kunci jawaban
      feedback.className = "feedback-box";
      feedback.innerHTML = "";
    });
  });

  if (adaKosong) {
    showToast("Ada beberapa soal yang belum dijawab. Harap jawab semua soal!", "warning");
    return;
  }

  const skor = total > 0 ? Math.round((benar / total) * 100) : 0;
  const isLolos = skor >= 80;

  // Render Result Box
  const resBox = document.getElementById("latihan-result-box");
  const btnReset = document.getElementById("btn-reset-latihan-all");
  if (btnReset) btnReset.style.display = "inline-flex";

  if (resBox) {
    if (isLolos) {
      resBox.innerHTML = `
        <div class="card" style="border:2px solid var(--success);background:hsla(152,65%,40%,0.06);padding:var(--space-xl);border-radius:var(--radius-xl);text-align:center;">
          <img src="../assets/images/3d-icons/trophy.png" style="width:54px;height:54px;object-fit:contain;margin-bottom:8px;" alt="">
          <div>
            <span class="kkm-badge passed" style="font-size:12px;margin-bottom:6px;">✓ LULUS KKM (KKM ≥ 80)</span>
            <h3 style="font-size:var(--fs-2xl);font-weight:900;color:var(--text-primary);margin:6px 0;">Nilai Latihan: ${skor} / 100</h3>
            <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin:0 auto 14px auto;max-width:540px;">
              Luar biasa! Anda berhasil menjawab <strong>${benar} dari ${total}</strong> soal dengan benar. Syarat kelulusan telah terpenuhi dan tahapan berikutnya telah terbuka.
            </p>
          </div>
        </div>
      `;
    } else {
      resBox.innerHTML = `
        <div class="card" style="border:2px solid var(--warning);background:hsla(38,92%,50%,0.06);padding:var(--space-xl);border-radius:var(--radius-xl);text-align:center;">
          <img src="../assets/images/3d-icons/warning.png" style="width:54px;height:54px;object-fit:contain;margin-bottom:8px;" alt="">
          <div>
            <span class="kkm-badge failed" style="font-size:12px;margin-bottom:6px;">⚠️ BELUM LULUS KKM (KKM: 80)</span>
            <h3 style="font-size:var(--fs-2xl);font-weight:900;color:hsl(35,90%,38%);margin:6px 0;">Nilai Latihan: ${skor} / 100</h3>
            <p style="color:var(--text-secondary);font-size:var(--fs-sm);margin:0 auto 14px auto;max-width:540px;">
              Anda menjawab <strong>${benar} dari ${total}</strong> soal dengan benar. Untuk membuka kegiatan berikutnya, nilai minimal harus <strong>80</strong>. Silakan pelajari kembali materi dan klik tombol <em>"Ulangi Latihan"</em>.
            </p>
          </div>
        </div>
      `;
    }
  }

  // Simpan progres ke Firestore jika user ID tersedia
  if (userId) {
    try {
      const updateData = {
        [`kegiatan${kegiatanKe}`]: {
          nilaiLatihan: skor,
          benar: benar,
          totalSoal: total,
          lolos: isLolos,
          selesai: isLolos,
          updatedAt: new Date()
        },
        [`kegiatan${kegiatanKe}Selesai`]: isLolos,
        updatedAt: new Date()
      };

      await setDoc(doc(db, "progres", userId), updateData, { merge: true });
      console.log(`[MateriLoader] Progres kegiatan ${kegiatanKe} disimpan:`, updateData);
    } catch (err) {
      console.error("[MateriLoader] Gagal simpan nilai latihan ke Firestore:", err);
    }
  }

  if (onScoreEvaluated) {
    onScoreEvaluated(skor, isLolos);
  }

  showToast(
    isLolos ? `Selamat! Anda lulus latihan dengan nilai ${skor}/100!` : `Nilai Anda ${skor}/100. Belum mencapai KKM 80.`,
    isLolos ? "success" : "warning"
  );
}

// ---- Utility Functions ----

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function enhanceCodeBlocks(html) {
  if (!html) return "";
  // Bungkus pre code dengan header copy button
  return html.replace(
    /<pre class="code-block"><code class="code-sql">([\s\S]*?)<\/code><\/pre>/gi,
    (match, p1) => `
      <div class="code-box-wrapper" style="position:relative; margin:var(--space-lg) 0; box-shadow:0 4px 16px rgba(0,0,0,0.08); border-radius:12px; overflow:hidden;">
        <div style="display:flex; align-items:center; justify-content:space-between; background:#181d2d; padding:8px 16px; border-bottom:1px solid rgba(255,255,255,0.08); font-size:12px; color:#cbd5e1; font-family:var(--font-code);">
          <span style="font-weight:700; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--secondary);"></span>
            SQL QUERY SYNTAX
          </span>
          <button class="btn-copy-code" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); color:#f8fafc; padding:4px 12px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s ease;">
            📋 Salin Query
          </button>
        </div>
        <pre class="code-block" style="margin:0; border-radius:0; background:#1e2438; color:#f8fafc; font-size:14px; padding:var(--space-md) var(--space-lg); line-height:1.7;"><code class="code-sql">${p1}</code></pre>
      </div>
    `
  );
}

function attachCopyCodeListeners(container) {
  container.querySelectorAll(".code-box-wrapper").forEach(wrapper => {
    const btn = wrapper.querySelector(".btn-copy-code");
    const code = wrapper.querySelector("code");
    if (btn && code) {
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code.innerText);
          btn.innerHTML = "Tersalin!";
          btn.style.borderColor = "var(--success)";
          btn.style.color = "var(--success)";
          setTimeout(() => {
            btn.innerHTML = "Salin Query";
            btn.style.borderColor = "rgba(255,255,255,0.18)";
            btn.style.color = "#cbd5e1";
          }, 2000);
        } catch (err) {
          console.warn("Gagal copy text:", err);
        }
      });
    }
  });
}

/**
 * Tampilkan toast notification modern.
 */
export function showToast(message, type = "info") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

/**
 * Normalisasi segala format URL YouTube (watch, youtu.be, shorts, live, embed, iframe tag)
 * ke format embed aman: https://www.youtube-nocookie.com/embed/[ID]
 * @param {string} url
 * @returns {string}
 */
export function parseYouTubeEmbedUrl(url) {
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

/**
 * Mengambil link langsung YouTube (watch URL) dari format embed atau URL apa pun.
 * @param {string} url
 * @returns {string}
 */
export function getYouTubeWatchUrl(url) {
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
