// ============================================
// Firebase Configuration — E-Modul Interaktif SQL
// Menggunakan Bundle Lokal Firebase Modular ES
// ============================================

import {
  initializeApp,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp
} from "../lib/firebase-bundle.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBOMqCT0xj0Fz_cJYeo48z3Ock2U98_K14",
  authDomain:        "emodul-sql-client.firebaseapp.com",
  projectId:         "emodul-sql-client",
  storageBucket:     "emodul-sql-client.firebasestorage.app",
  messagingSenderId: "666834401871",
  appId:             "1:666834401871:web:dd5d486fca2625835cc83a",
  measurementId:     "G-8M44G00ES3"
};

// Inisialisasi Firebase App
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export {
  app,
  auth,
  db,
  firebaseConfig,
  initializeApp,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp
};
