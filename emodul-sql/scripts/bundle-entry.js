// ============================================
// bundle-entry.js — Firebase Client Modular Exporter
// ============================================

export { initializeApp } from "firebase/app";
export {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "firebase/auth";
export {
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
} from "firebase/firestore";
