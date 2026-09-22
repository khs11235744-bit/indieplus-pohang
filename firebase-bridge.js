// INDIE PORT Firebase/Firestore data bridge.
// Firebase Hosting auto-configures via /__/firebase/init.json.
// Other hosts may provide ./firebase-config.json. JSON files remain the fallback.
(() => {
  const SDK = "12.19.0";
  const noStore = { cache: "no-store" };

  async function readConfig() {
    for (const url of ["/__/firebase/init.json", "./firebase-config.json"]) {
      try {
        const res = await fetch(url, noStore);
        if (!res.ok) continue;
        const config = await res.json();
        if (config?.projectId && config?.apiKey) return config;
      } catch (_) {}
    }
    return null;
  }

  async function withTimeout(promise, ms = 2200) {
    let timer;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("firebase-timeout")), ms);
        })
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  window.indieFirebaseReady = (async () => {
    const config = await readConfig();
    if (!config) return { enabled: false, reason: "firebase-config-unavailable" };
    const [{ initializeApp }, fs] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`)
    ]);
    const db = fs.getFirestore(initializeApp(config));
    return {
      enabled: true,
      projectId: config.projectId,
      async publicDoc(name) {
        const snap = await fs.getDoc(fs.doc(db, "public", name));
        return snap.exists() ? snap.data() : null;
      }
    };
  })().catch(error => ({ enabled: false, reason: error?.message || String(error) }));

  window.indieData = {
    async publicDoc(name, fallbackUrl, required = true) {
      try {
        const bridge = await withTimeout(window.indieFirebaseReady);
        if (bridge?.enabled) {
          const data = await withTimeout(bridge.publicDoc(name));
          if (data) return data;
        }
      } catch (error) {
        console.warn("Firestore fallback", name, error);
      }
      if (!fallbackUrl) {
        if (required) throw new Error(`No Firebase document: public/${name}`);
        return null;
      }
      const glue = fallbackUrl.includes("?") ? "&" : "?";
      const res = await fetch(`${fallbackUrl}${glue}v=${Date.now()}`, noStore);
      if (!res.ok) {
        if (required) throw new Error(`${fallbackUrl} ${res.status}`);
        return null;
      }
      return res.json();
    }
  };
})();