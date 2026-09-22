// Firebase web client for INDIE PORT / INDIE+ Pohang
// The Firebase Web API key is a public client identifier; access is enforced by Firebase Auth/Rules.
(() => {
  const config = {
    projectId: "indieplus-pohang-khs",
    appId: "1:953914697180:web:f7b2919342b348120edb19",
    storageBucket: "indieplus-pohang-khs.firebasestorage.app",
    apiKey: "AIzaSyCDCf3JP1rbM8csLQ0mo3qnS679vhK-f3E",
    authDomain: "indieplus-pohang-khs.firebaseapp.com",
    messagingSenderId: "953914697180"
  };

  window.INDIE_FIREBASE_CONFIG = config;

  window.indieFirebaseReady = new Promise((resolve) => {
    const finish = () => {
      try {
        if (!window.firebase) return resolve(null);
        const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config);
        const auth = window.firebase.auth();
        const db = window.firebase.firestore();
        window.IndieFirebase = { app, auth, db };
        resolve(window.IndieFirebase);
      } catch (error) {
        console.warn("[INDIE Firebase] init failed", error);
        resolve(null);
      }
    };
    if (window.firebase) return finish();
    window.addEventListener("indie-firebase-sdk-ready", finish, { once: true });
  });
})();
