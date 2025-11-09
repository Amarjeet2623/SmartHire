import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ✅ Safe & free

const api = import.meta.env.VITE_FIREBASE_API_KEY;

// Firebase config pulled from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
console.log(firebaseConfig);

// Validate required values
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error("❌ Missing Firebase configuration values.");
  console.error("Ensure .env contains: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID");
}

// Initialize Firebase App (only once)
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized (Free Tier).");
} catch (error) {
  console.error("🔥 Firebase initialization error:", error);
  throw error;
}

// Firebase services (Free-tier safe)
const auth: Auth = getAuth(app);
const db = getFirestore(app);

// Export for use in your components and context
export { app, auth, db };
