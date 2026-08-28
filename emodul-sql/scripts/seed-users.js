// ============================================
// seed-users.js — Script Seed Akun Siswa & Guru
// E-Modul Interaktif SQL
// ============================================
// Jalankan: node scripts/seed-users.js
// Pastikan sudah: npm install firebase-admin
// Pastikan file service-account-key.json sudah ada (download dari Firebase Console)
// ============================================

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// ---- Load Service Account ----
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "service-account-key.json");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ File service-account-key.json tidak ditemukan!");
  console.error("   Download dari Firebase Console → Project Settings → Service Accounts → Generate New Private Key");
  console.error(`   Simpan di: ${SERVICE_ACCOUNT_PATH}`);
  process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const authAdmin = admin.auth();
const dbAdmin = admin.firestore();

// ---- Default password untuk semua akun baru ----
const DEFAULT_PASSWORD = "smk123456";

// ---- Load data dari JSON ----
const DATA_SISWA_PATH = path.join(__dirname, "data-siswa.json");
const DATA_GURU_PATH = path.join(__dirname, "data-guru.json");

function loadJSON(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ File ${label} tidak ditemukan: ${filePath}`);
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      console.error(`❌ ${label} harus berupa array JSON.`);
      return [];
    }

    return data;
  } catch (err) {
    console.error(`❌ Gagal parse ${label}:`, err.message);
    return [];
  }
}

// ---- Buat satu akun Auth + dokumen Firestore ----
async function createUser(entry, role) {
  const { nama, email, kelas } = entry;

  if (!nama || !email) {
    console.warn(`  ⚠ SKIP — data tidak lengkap: ${JSON.stringify(entry)}`);
    return { success: false, nama, reason: "Data tidak lengkap (nama/email kosong)" };
  }

  try {
    // 1. Buat akun Firebase Auth
    const userRecord = await authAdmin.createUser({
      email: email,
      password: DEFAULT_PASSWORD,
      displayName: nama,
    });

    const uid = userRecord.uid;

    // 2. Buat dokumen Firestore di collection users
    await dbAdmin.collection("users").doc(uid).set({
      nama: nama,
      kelas: kelas || "-",
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  ✅ ${role.toUpperCase()} — ${nama} (${email}) → uid: ${uid}`);
    return { success: true, nama, uid };

  } catch (err) {
    // Handle error duplikat email
    if (err.code === "auth/email-already-exists") {
      console.warn(`  ⚠ SUDAH ADA — ${nama} (${email}): email sudah terdaftar`);
      return { success: false, nama, reason: "Email sudah terdaftar" };
    }

    console.error(`  ❌ GAGAL — ${nama} (${email}):`, err.message);
    return { success: false, nama, reason: err.message };
  }
}

// ---- Main ----
async function main() {
  console.log("==============================================");
  console.log("  SEED AKUN — E-Modul Interaktif SQL");
  console.log("  Password default: " + DEFAULT_PASSWORD);
  console.log("==============================================\n");

  const siswaList = loadJSON(DATA_SISWA_PATH, "data-siswa.json");
  const guruList = loadJSON(DATA_GURU_PATH, "data-guru.json");

  const results = { success: 0, failed: 0, skipped: 0 };

  // --- Seed Guru ---
  if (guruList.length > 0) {
    console.log(`📎 Membuat ${guruList.length} akun GURU...\n`);
    for (const guru of guruList) {
      const res = await createUser(guru, "guru");
      if (res.success) results.success++;
      else results.failed++;
    }
    console.log("");
  }

  // --- Seed Siswa ---
  if (siswaList.length > 0) {
    console.log(`📎 Membuat ${siswaList.length} akun SISWA...\n`);
    for (const siswa of siswaList) {
      const res = await createUser(siswa, "siswa");
      if (res.success) results.success++;
      else results.failed++;
    }
    console.log("");
  }

  if (siswaList.length === 0 && guruList.length === 0) {
    console.log("⚠ Tidak ada data untuk di-seed.");
    console.log("  Isi scripts/data-siswa.json dan/atau scripts/data-guru.json terlebih dahulu.\n");
  }

  // --- Ringkasan ---
  console.log("==============================================");
  console.log("  RINGKASAN");
  console.log(`  ✅ Berhasil : ${results.success}`);
  console.log(`  ❌ Gagal    : ${results.failed}`);
  console.log("==============================================");

  process.exit(0);
}

main();
