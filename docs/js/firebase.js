// SmartLife SPA Firebase Configuration & Services Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateEmail,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcKULD1hSoq1ZigJ1HKZISSO98LZcKhIQ",
  authDomain: "webtumeng.firebaseapp.com",
  projectId: "webtumeng",
  storageBucket: "webtumeng.firebasestorage.app",
  messagingSenderId: "259650513500",
  appId: "1:259650513500:web:653093bf536c2789409499",
  measurementId: "G-69DKY2QRJH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Auth functions
export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateEmail,
  sendPasswordResetEmail
};

// Export Firestore functions
export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  query,
  where,
  onSnapshot
};

// Export Storage functions
export {
  ref,
  uploadString,
  getDownloadURL
};
