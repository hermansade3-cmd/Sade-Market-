/* ==========================================================================
   SADE MARKET — Phase 2 (Auth + Profile), vanilla JS, single-file version.

   SETUP:
   1. Create a Firebase project at https://console.firebase.google.com
   2. Enable Authentication → Email/Password AND Google sign-in providers.
   3. Create a Firestore database.
   4. Project settings → General → Your apps → Web app → copy the config
      values below into FIREBASE_CONFIG.
   Note: Firebase's client-side config (apiKey, etc.) is safe to expose in
   frontend code — it is not a secret. Access is controlled by Firestore
   Security Rules on the server, not by hiding this config.
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/* ==========================================================================
   VALIDATORS
   ========================================================================== */

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePhone(phone) {
  const cleaned = phone.replace(/\s+/g, "");
  return /^(?:\+255|0)[67]\d{8}$/.test(cleaned);
}

function normalizePhone(phone) {
  const cleaned = phone.replace(/\s+/g, "");
  return cleaned.startsWith("0") ? "+255" + cleaned.slice(1) : cleaned;
}

function validatePassword(password) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

/* ==========================================================================
   FIRESTORE USER PROFILE SERVICE
   ========================================================================== */

const USERS_COLLECTION = "users";

async function createUserProfile(uid, { fullName, email, phone, provider = "password" }) {
  const ref = doc(db, USERS_COLLECTION, uid);
  const profile = {
    uid,
    fullName,
    email,
    phone: phone || null,
    photoURL: null,
    location: { region: null, district: null },
    about: "",
    role: "user",
    verificationLevel: "unverified",
    responseRate: null,
    avgResponseTime: null,
    rating: null,
    reviewCount: 0,
    listingCount: 0,
    status: "active",
    authProvider: provider,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile, { merge: true });
  return profile;
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  return snap.exists() ? snap.data() : null;
}

async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, USERS_COLLECTION, uid), updates);
}

async function ensureProfileExists(firebaseUser) {
  const existing = await getUserProfile(firebaseUser.uid);
  if (existing) return existing;
  return createUserProfile(firebaseUser.uid, {
    fullName: firebaseUser.displayName || "",
    email: firebaseUser.email || "",
    phone: firebaseUser.phoneNumber || null,
    provider: "google",
  });
}

/* ==========================================================================
   AUTH ERROR MESSAGES (Swahili)
   ========================================================================== */

function authErrorToSwahili(error) {
  const map = {
    "auth/email-already-in-use": "Barua pepe hii tayari inatumika. Jaribu kuingia (Login).",
    "auth/invalid-email": "Barua pepe si sahihi.",
    "auth/weak-password": "Password ni dhaifu. Tumia angalau herufi 8.",
    "auth/user-not-found": "Hakuna akaunti na barua pepe hii.",
    "auth/wrong-password": "Password si sahihi.",
    "auth/invalid-credential": "Taarifa za kuingia si sahihi.",
    "auth/too-many-requests": "Majaribio mengi. Tafadhali subiri kidogo kisha jaribu tena.",
    "auth/popup-closed-by-user": "Umefunga dirisha la Google kabla ya kukamilisha.",
  };
  return map[error?.code] || "Hitilafu imetokea. Tafadhali jaribu tena.";
}

/* ==========================================================================
   VIEW ROUTING
   ========================================================================== */

const views = ["register", "login", "forgot", "dashboard", "profile", "loading"];
let currentProfile = null;

function showView(name) {
  views.forEach((v) => {
    document.getElementById(`view-${v}`).classList.toggle("active", v === name);
  });
}

document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-nav]");
  if (!target) return;
  e.preventDefault();
  showView(target.getAttribute("data-nav"));
});

/* ==========================================================================
   HELPERS: form errors
   ========================================================================== */

function clearFieldErrors(form) {
  form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
}

function setFieldError(form, fieldName, message) {
  const el = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (el) el.textContent = message;
}

function setButtonLoading(button, loading, loadingText, normalText) {
  button.disabled = loading;
  button.textContent = loading ? loadingText : normalText;
}

/* ==========================================================================
   REGISTER
   ========================================================================== */

const formRegister = document.getElementById("form-register");
const registerSubmitBtn = document.getElementById("register-submit");
const registerError = document.getElementById("register-error");

formRegister.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFieldErrors(formRegister);
  registerError.textContent = "";

  const data = new FormData(formRegister);
  const fullName = data.get("fullName").trim();
  const email = data.get("email").trim();
  const phone = data.get("phone").trim();
  const password = data.get("password");

  let hasError = false;
  if (fullName.length < 2) {
    setFieldError(formRegister, "fullName", "Tafadhali jaza jina lako kamili.");
    hasError = true;
  }
  if (!validateEmail(email)) {
    setFieldError(formRegister, "email", "Barua pepe si sahihi.");
    hasError = true;
  }
  if (!validatePhone(phone)) {
    setFieldError(formRegister, "phone", "Namba ya simu si sahihi. Mfano: 0712345678");
    hasError = true;
  }
  if (!validatePassword(password)) {
    setFieldError(formRegister, "password", "Password iwe angalau herufi 8, ikiwa na herufi na namba.");
    hasError = true;
  }
  if (hasError) return;

  setButtonLoading(registerSubmitBtn, true, "Inatuma...", "Jisajili");
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: fullName });
    await createUserProfile(credential.user.uid, { fullName, email, phone: normalizePhone(phone) });
    // onAuthStateChanged below will route to dashboard automatically.
  } catch (err) {
    registerError.textContent = authErrorToSwahili(err);
  } finally {
    setButtonLoading(registerSubmitBtn, false, "Inatuma...", "Jisajili");
  }
});

document.getElementById("register-google").addEventListener("click", async () => {
  registerError.textContent = "";
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    await ensureProfileExists(credential.user);
  } catch (err) {
    registerError.textContent = authErrorToSwahili(err);
  }
});

/* ==========================================================================
   LOGIN
   ========================================================================== */

const formLogin = document.getElementById("form-login");
const loginSubmitBtn = document.getElementById("login-submit");
const loginError = document.getElementById("login-error");

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFieldErrors(formLogin);
  loginError.textContent = "";

  const data = new FormData(formLogin);
  const email = data.get("email").trim();
  const password = data.get("password");

  let hasError = false;
  if (!validateEmail(email)) {
    setFieldError(formLogin, "email", "Barua pepe si sahihi.");
    hasError = true;
  }
  if (!password) {
    setFieldError(formLogin, "password", "Tafadhali jaza password.");
    hasError = true;
  }
  if (hasError) return;

  setButtonLoading(loginSubmitBtn, true, "Inatuma...", "Ingia");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = authErrorToSwahili(err);
  } finally {
    setButtonLoading(loginSubmitBtn, false, "Inatuma...", "Ingia");
  }
});

document.getElementById("login-google").addEventListener("click", async () => {
  loginError.textContent = "";
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    await ensureProfileExists(credential.user);
  } catch (err) {
    loginError.textContent = authErrorToSwahili(err);
  }
});

/* ==========================================================================
   FORGOT PASSWORD
   ========================================================================== */

const formForgot = document.getElementById("form-forgot");
const forgotSubmitBtn = document.getElementById("forgot-submit");
const forgotError = document.getElementById("forgot-error");
const forgotSentBox = document.getElementById("forgot-sent");

formForgot.addEventListener("submit", async (e) => {
  e.preventDefault();
  forgotError.textContent = "";

  const email = new FormData(formForgot).get("email").trim();
  if (!validateEmail(email)) {
    forgotError.textContent = "Barua pepe si sahihi.";
    return;
  }

  setButtonLoading(forgotSubmitBtn, true, "Inatuma...", "Tuma Link");
  try {
    await sendPasswordResetEmail(auth, email);
    formForgot.classList.add("hidden");
    forgotSentBox.classList.remove("hidden");
  } catch (err) {
    forgotError.textContent = authErrorToSwahili(err);
  } finally {
    setButtonLoading(forgotSubmitBtn, false, "Inatuma...", "Tuma Link");
  }
});

/* ==========================================================================
   DASHBOARD
   ========================================================================== */

function renderDashboard(profile) {
  const firstName = (profile?.fullName || "rafiki").split(" ")[0];
  document.getElementById("dash-greeting").textContent = `Karibu, ${firstName} 👋`;
}

/* ==========================================================================
   PROFILE (view + edit)
   ========================================================================== */

const VERIFICATION_LABELS = {
  unverified: { text: "Hajathibitishwa", verified: false },
  phone_verified: { text: "Simu Imethibitishwa", verified: false },
  identity_verified: { text: "✓ Utambulisho Umethibitishwa", verified: true },
  business_verified: { text: "✓ Biashara Imethibitishwa", verified: true },
};

const profileViewMode = document.getElementById("profile-view-mode");
const formProfileEdit = document.getElementById("form-profile-edit");

function renderProfile(profile) {
  document.getElementById("profile-avatar").textContent = (profile.fullName?.charAt(0) || "S").toUpperCase();
  document.getElementById("profile-name").textContent = profile.fullName || "—";

  const badge = VERIFICATION_LABELS[profile.verificationLevel] || VERIFICATION_LABELS.unverified;
  const badgeEl = document.getElementById("profile-badge");
  badgeEl.textContent = badge.text;
  badgeEl.classList.toggle("verified", badge.verified);

  document.getElementById("p-email").textContent = profile.email || "—";
  document.getElementById("p-phone").textContent = profile.phone || "—";
  document.getElementById("p-region").textContent = profile.location?.region || "—";
  document.getElementById("p-about").textContent = profile.about || "—";
  document.getElementById("p-listings").textContent = profile.listingCount ?? 0;
  document.getElementById("p-rating").textContent = profile.rating ? `${profile.rating} ★` : "Bado hakuna";
}

document.getElementById("profile-edit-btn").addEventListener("click", () => {
  formProfileEdit.fullName.value = currentProfile?.fullName || "";
  formProfileEdit.about.value = currentProfile?.about || "";
  formProfileEdit.region.value = currentProfile?.location?.region || "";
  formProfileEdit.district.value = currentProfile?.location?.district || "";
  profileViewMode.classList.add("hidden");
  formProfileEdit.classList.remove("hidden");
});

document.getElementById("profile-cancel-btn").addEventListener("click", () => {
  formProfileEdit.classList.add("hidden");
  profileViewMode.classList.remove("hidden");
});

formProfileEdit.addEventListener("submit", async (e) => {
  e.preventDefault();
  const saveBtn = document.getElementById("profile-save-btn");
  const data = new FormData(formProfileEdit);

  setButtonLoading(saveBtn, true, "Inahifadhi...", "Hifadhi");
  try {
    const updates = {
      fullName: data.get("fullName").trim(),
      about: data.get("about").trim(),
      location: { region: data.get("region").trim(), district: data.get("district").trim() },
    };
    await updateUserProfile(currentProfile.uid, updates);
    currentProfile = { ...currentProfile, ...updates };
    renderProfile(currentProfile);
    renderDashboard(currentProfile);
    formProfileEdit.classList.add("hidden");
    profileViewMode.classList.remove("hidden");
  } catch (err) {
    alert(authErrorToSwahili(err));
  } finally {
    setButtonLoading(saveBtn, false, "Inahifadhi...", "Hifadhi");
  }
});

document.getElementById("profile-logout-btn").addEventListener("click", async () => {
  await signOut(auth);
});

/* ==========================================================================
   AUTH STATE — the single source of truth for routing
   ========================================================================== */

onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    currentProfile = null;
    showView("login");
    return;
  }

  showView("loading");
  currentProfile = await getUserProfile(firebaseUser.uid);

  if (!currentProfile) {
    // Edge case: Auth account exists but profile doc failed to create earlier.
    currentProfile = await createUserProfile(firebaseUser.uid, {
      fullName: firebaseUser.displayName || "",
      email: firebaseUser.email || "",
      phone: firebaseUser.phoneNumber || null,
    });
  }

  renderDashboard(currentProfile);
  renderProfile(currentProfile);
  showView("dashboard");
});
