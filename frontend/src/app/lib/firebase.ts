import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "verdict-e40d2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "verdict-e40d2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "verdict-e40d2.appspot.com",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:58607713103:web:verdict",
};

export const getFirebaseApp = () => {
  if (typeof window === "undefined") return null;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

// Auto-prefetch config as soon as client loads in browser
if (typeof window !== "undefined" && !firebaseConfig.apiKey) {
  fetch("/api/index?action=auth-config")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.apiKey) {
        firebaseConfig.apiKey = data.apiKey;
        if (data.authDomain) firebaseConfig.authDomain = data.authDomain;
        if (data.projectId) firebaseConfig.projectId = data.projectId;
        if (data.appId) firebaseConfig.appId = data.appId;
        if (getApps().length === 0) {
          initializeApp(firebaseConfig);
        }
      }
    })
    .catch(() => {});
}

export const getFirebaseAuthSync = (): Auth | null => {
  if (typeof window === "undefined") return null;
  const app = getApps().length > 0 ? getApp() : (firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null);
  return app ? getAuth(app) : null;
};

export const getFirebaseAuth = async (): Promise<Auth | null> => {
  if (typeof window === "undefined") return null;

  if (getApps().length > 0) {
    return getAuth(getApp());
  }

  // If apiKey was not inlined at build time, fetch it dynamically from backend
  if (!firebaseConfig.apiKey) {
    try {
      const res = await fetch("/api/index?action=auth-config");
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) {
          firebaseConfig.apiKey = data.apiKey;
          if (data.authDomain) firebaseConfig.authDomain = data.authDomain;
          if (data.projectId) firebaseConfig.projectId = data.projectId;
          if (data.appId) firebaseConfig.appId = data.appId;
        }
      }
    } catch (e) {
      console.warn("Could not load dynamic auth config:", e);
    }
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
};

export const getGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
};
