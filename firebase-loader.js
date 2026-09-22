(() => {
  const urls = [
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"
  ];
  let i = 0;
  const next = () => {
    if (i >= urls.length) {
      window.dispatchEvent(new Event("indie-firebase-sdk-ready"));
      return;
    }
    const s = document.createElement("script");
    s.src = urls[i++];
    s.onload = next;
    s.onerror = () => {
      console.warn("[INDIE Firebase] SDK load failed:", s.src);
      window.dispatchEvent(new Event("indie-firebase-sdk-ready"));
    };
    document.head.appendChild(s);
  };
  next();
})();
