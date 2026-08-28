// ============================================
// auth-guard.js — Proteksi Halaman, Session & Instant Fast-Load
// E-Modul Interaktif SQL - SMK Negeri 1 Sintuk Toboh Gadang
// ============================================

import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc
} from "./firebase-config.js";

/**
 * Deteksi base path agar redirect benar dari subfolder (kegiatan/, dll).
 */
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/kegiatan/')) return '../';
  return '';
}

/**
 * Tangani Browser Back-Forward Cache (BFCache).
 */
window.addEventListener("pageshow", function (event) {
  const isBfCache = event.persisted || (window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType("navigation")[0]?.type === "back_forward");
  
  if (isBfCache) {
    const cachedData = sessionStorage.getItem("userData");
    if (!cachedData) {
      const appContent = document.getElementById("app-content");
      if (appContent) appContent.style.display = "none";
      const loadingScreen = document.getElementById("loading-screen");
      if (loadingScreen) loadingScreen.style.display = "flex";
      
      sessionStorage.clear();
      window.location.replace(getBasePath() + "login.html");
    }
  }
});

/**
 * Optimistic Fast-Load:
 * Jika sessionStorage sudah memiliki userData valid, langsung tampilkan halaman seketika (0ms delay),
 * lalu lakukan verifikasi token di background.
 */
function initAuthGuard() {
  return new Promise((resolve, reject) => {
    let hasResolved = false;

    // 1. FAST PATH: Cek cache session langsung (Instant Render)
    const cached = sessionStorage.getItem("userData");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.uid) {
          hasResolved = true;
          resolve(parsed);
        }
      } catch (e) {
        sessionStorage.removeItem("userData");
      }
    }

    // 2. NETWORK PATH: Firebase Auth observer
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Jika tidak ada user login → redirect
        const appContent = document.getElementById("app-content");
        if (appContent) appContent.style.display = "none";
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) loadingScreen.style.display = "flex";

        sessionStorage.clear();
        window.location.replace(getBasePath() + "login.html");
        if (!hasResolved) reject(new Error("Not authenticated"));
        return;
      }

      try {
        // Jika sudah di-resolve dari fast path dan uid cocok, tidak perlu fetch ulang
        if (hasResolved) {
          const currentCached = sessionStorage.getItem("userData");
          if (currentCached) {
            const parsed = JSON.parse(currentCached);
            if (parsed.uid === user.uid) return;
          }
        }

        // Fetch user data dari Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          const isGuruEmail = user.email && (user.email.toLowerCase().startsWith("guru") || user.email.toLowerCase().includes("@guru"));
          let role = userDoc.data().role || "siswa";

          if (isGuruEmail && role !== "guru") {
            role = "guru";
            try {
              await setDoc(doc(db, "users", user.uid), { role: "guru" }, { merge: true });
            } catch (e) { console.warn(e); }
          }

          const data = {
            uid: user.uid,
            email: user.email,
            nama: userDoc.data().nama || (isGuruEmail ? "Guru Basis Data" : "Siswa"),
            kelas: userDoc.data().kelas || "-",
            nisn: userDoc.data().nisn || "-",
            role: role,
          };

          sessionStorage.setItem("userData", JSON.stringify(data));
          if (!hasResolved) resolve(data);
        } else {
          const isGuruEmail = user.email && (user.email.toLowerCase().startsWith("guru") || user.email.toLowerCase().includes("@guru"));
          const role = isGuruEmail ? "guru" : "siswa";
          const nama = isGuruEmail ? "Guru Basis Data" : user.email.split("@")[0];

          const fallback = {
            uid: user.uid,
            email: user.email,
            nama: nama,
            kelas: isGuruEmail ? "-" : "XI RPL 1",
            nisn: "-",
            role: role,
          };

          try {
            await setDoc(doc(db, "users", user.uid), {
              nama: fallback.nama,
              email: fallback.email,
              kelas: fallback.kelas,
              role: fallback.role,
            }, { merge: true });
          } catch (e) {
            console.warn("[AuthGuard] Auto-create user doc warning:", e);
          }

          sessionStorage.setItem("userData", JSON.stringify(fallback));
          if (!hasResolved) resolve(fallback);
        }
      } catch (err) {
        console.error("[AuthGuard] Gagal fetch data user:", err);
        const isGuruEmail = user.email && (user.email.toLowerCase().startsWith("guru") || user.email.toLowerCase().includes("@guru"));
        const fallback = {
          uid: user.uid,
          email: user.email,
          nama: isGuruEmail ? "Guru Basis Data" : user.email.split("@")[0],
          kelas: "-",
          nisn: "-",
          role: isGuruEmail ? "guru" : "siswa",
        };
        sessionStorage.setItem("userData", JSON.stringify(fallback));
        if (!hasResolved) resolve(fallback);
      }
    });
  });
}

function getCurrentUserData() {
  const raw = sessionStorage.getItem("userData");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Logout pengguna dengan aman
 */
async function logout() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("[AuthGuard] Logout error:", err);
  }
  sessionStorage.clear();
  localStorage.clear();
  window.location.replace(getBasePath() + "login.html");
}

const authReady = initAuthGuard();

export { authReady, getCurrentUserData, logout };
