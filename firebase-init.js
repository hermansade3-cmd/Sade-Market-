// firebase-init.js
// Faili hii inaunganisha ukurasa wako na mradi wako wa Firebase.
// Inatumiwa na index.html na login.html kupitia <script type="module">.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Kumbuka: Firebase Storage haitumiki tena kwenye mfumo huu (inahitaji Blaze plan).
// Picha za bidhaa sasa zinabanwa (compress) kwa JavaScript kisha kuhifadhiwa
// moja kwa moja ndani ya Firestore kama maandishi ya base64.

const firebaseConfig = {
  apiKey: "AIzaSyCqOQQbxa4QkmaxTh8QCaJ1EN_ORkKNWPE",
  authDomain: "world-technology-4d429.firebaseapp.com",
  projectId: "world-technology-4d429",
  storageBucket: "world-technology-4d429.firebasestorage.app",
  messagingSenderId: "979647621854",
  appId: "1:979647621854:web:bbac42ab1d8436ad71704f",
  measurementId: "G-5YPNMFRKZD"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
};
