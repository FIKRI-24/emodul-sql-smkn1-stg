// ============================================
// auth.js — Login & Student Self-Registration Logic
// E-Modul Interaktif SQL - SMK Negeri 1 Sintuk Toboh Gadang
// ============================================

import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
  serverTimestamp
} from "./firebase-config.js";

// Saat halaman login dimuat, bersihkan sisa session lama
sessionStorage.removeItem("userData");

// ---- Mapping error Firebase ke pesan ramah ----
const ERROR_MESSAGES = {
  "auth/invalid-credential":       "Email atau password salah. Silakan coba lagi.",
  "auth/invalid-email":            "Format email tidak valid.",
  "auth/user-disabled":            "Akun ini telah dinonaktifkan. Hubungi guru Anda.",
  "auth/user-not-found":           "Akun tidak ditemukan. Pastikan email sudah terdaftar.",
  "auth/wrong-password":           "Password salah. Silakan coba lagi.",
  "auth/email-already-in-use":     "Email ini sudah terdaftar. Silakan login atau gunakan email lain.",
  "auth/weak-password":            "Password terlalu lemah. Gunakan minimal 6 karakter.",
  "auth/too-many-requests":        "Terlalu banyak percobaan login. Coba lagi beberapa saat.",
  "auth/network-request-failed":   "Koneksi internet bermasalah. Periksa jaringan Anda.",
};

function getFriendlyError(errorCode) {
  return ERROR_MESSAGES[errorCode] || "Terjadi kesalahan. Silakan coba lagi.";
}

// ---- DOM Elements: Tabs & Panels ----
const tabBtnLogin = document.getElementById("tab-btn-login");
const tabBtnRegister = document.getElementById("tab-btn-register");
const panelLogin = document.getElementById("panel-login");
const panelRegister = document.getElementById("panel-register");
const linkToRegister = document.getElementById("link-to-register");
const linkToLogin = document.getElementById("link-to-login");

// ---- DOM Elements: Login Form ----
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginErrorDiv = document.getElementById("login-error");
const btnLogin = document.getElementById("btn-login");

// ---- DOM Elements: Register Form ----
const registerForm = document.getElementById("register-form");
const regNamaInput = document.getElementById("reg-nama");
const regKelasInput = document.getElementById("reg-kelas");
const regEmailInput = document.getElementById("reg-email");
const regPasswordInput = document.getElementById("reg-password");
const regConfirmPasswordInput = document.getElementById("reg-confirm-password");
const registerErrorDiv = document.getElementById("register-error");
const btnRegister = document.getElementById("btn-register");

// ---- Tab Switch Functions ----
function showLoginTab() {
  tabBtnLogin.classList.add("active");
  tabBtnLogin.setAttribute("aria-selected", "true");
  tabBtnRegister.classList.remove("active");
  tabBtnRegister.setAttribute("aria-selected", "false");

  panelLogin.classList.add("active");
  panelRegister.classList.remove("active");

  hideLoginError();
  hideRegisterError();
  if (emailInput) emailInput.focus();
}

function showRegisterTab() {
  tabBtnRegister.classList.add("active");
  tabBtnRegister.setAttribute("aria-selected", "true");
  tabBtnLogin.classList.remove("active");
  tabBtnLogin.setAttribute("aria-selected", "false");

  panelRegister.classList.add("active");
  panelLogin.classList.remove("active");

  hideLoginError();
  hideRegisterError();
  if (regNamaInput) regNamaInput.focus();
}

if (tabBtnLogin) tabBtnLogin.addEventListener("click", showLoginTab);
if (tabBtnRegister) tabBtnRegister.addEventListener("click", showRegisterTab);
if (linkToRegister) linkToRegister.addEventListener("click", showRegisterTab);
if (linkToLogin) linkToLogin.addEventListener("click", showLoginTab);

// ---- Login Helpers ----
function showLoginError(message) {
  if (!loginErrorDiv) return;
  loginErrorDiv.textContent = message;
  loginErrorDiv.classList.add("visible");
}

function hideLoginError() {
  if (!loginErrorDiv) return;
  loginErrorDiv.textContent = "";
  loginErrorDiv.classList.remove("visible");
}

function setLoginLoading(isLoading) {
  if (!btnLogin) return;
  if (isLoading) {
    btnLogin.disabled = true;
    btnLogin.textContent = "Memverifikasi akun…";
    btnLogin.style.opacity = "0.7";
  } else {
    btnLogin.disabled = false;
    btnLogin.textContent = "Masuk ke Modul Pembelajaran";
    btnLogin.style.opacity = "1";
  }
}

// ---- Register Helpers ----
function showRegisterError(message) {
  if (!registerErrorDiv) return;
  registerErrorDiv.textContent = message;
  registerErrorDiv.classList.add("visible");
}

function hideRegisterError() {
  if (!registerErrorDiv) return;
  registerErrorDiv.textContent = "";
  registerErrorDiv.classList.remove("visible");
}

function setRegisterLoading(isLoading) {
  if (!btnRegister) return;
  if (isLoading) {
    btnRegister.disabled = true;
    btnRegister.textContent = "Mendaftarkan akun siswa…";
    btnRegister.style.opacity = "0.7";
  } else {
    btnRegister.disabled = false;
    btnRegister.textContent = "🚀 Buat Akun & Mulai Belajar";
    btnRegister.style.opacity = "1";
  }
}

// ---- Login Form Submit ----
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideLoginError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      showLoginError("Silakan masukkan email akun Anda.");
      emailInput.focus();
      return;
    }

    if (!password) {
      showLoginError("Silakan masukkan password.");
      passwordInput.focus();
      return;
    }

    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Login berhasil → ganti riwayat halaman ke beranda (replace history)
      window.location.replace("beranda.html");
    } catch (error) {
      console.error("[Auth] Login error:", error.code, error.message);
      showLoginError(getFriendlyError(error.code));
      setLoginLoading(false);
    }
  });
}

// ---- Register Form Submit ----
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideRegisterError();

    const nama = regNamaInput.value.trim();
    const kelas = regKelasInput.value;
    const email = regEmailInput.value.trim();
    const password = regPasswordInput.value;
    const confirmPassword = regConfirmPasswordInput.value;

    // Validasi
    if (!nama) {
      showRegisterError("Nama lengkap siswa wajib diisi.");
      regNamaInput.focus();
      return;
    }

    if (!kelas || (kelas !== "XI RPL 1" && kelas !== "XI RPL 2")) {
      showRegisterError("Silakan pilih kelas RPL Anda (XI RPL 1 atau XI RPL 2).");
      regKelasInput.focus();
      return;
    }

    if (!email) {
      showRegisterError("Alamat email siswa wajib diisi.");
      regEmailInput.focus();
      return;
    }

    if (!password || password.length < 6) {
      showRegisterError("Password harus minimal 6 karakter.");
      regPasswordInput.focus();
      return;
    }

    if (password !== confirmPassword) {
      showRegisterError("Konfirmasi password tidak cocok dengan password di atas.");
      regConfirmPasswordInput.focus();
      return;
    }

    setRegisterLoading(true);

    try {
      // 1. Buat akun di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Simpan profil siswa ke Firestore collection 'users'
      await setDoc(doc(db, "users", user.uid), {
        nama: nama,
        email: email,
        kelas: kelas,
        role: "siswa",
        createdAt: serverTimestamp()
      });

      // 3. Inisialisasi dokumen progres belajar siswa
      await setDoc(doc(db, "progres", user.uid), {
        cpatpSelesai: false,
        kegiatan1Selesai: false,
        kegiatan2Selesai: false,
        kegiatan3Selesai: false,
        latihanSelesai: []
      });

      console.log(`[Auth] Siswa ${nama} (${kelas}) berhasil registrasi!`);

      // Registrasi berhasil → langsung alihkan ke beranda pembelajaran
      window.location.replace("beranda.html");
    } catch (error) {
      console.error("[Auth] Register error:", error.code, error.message);
      showRegisterError(getFriendlyError(error.code));
      setRegisterLoading(false);
    }
  });
}
