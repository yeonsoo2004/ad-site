/* hub — global utilities (toast/copy/storage) */
(function () {
  function toast(message) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message || "알림";
    el.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove("is-visible");
    }, 2200);
  }

  function copyText(text) {
    text = String(text || "");
    if (!text) return Promise.reject(new Error("empty"));

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "true");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (e) {
        reject(e);
      }
    });
  }

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  window.Hub = window.Hub || {};
  window.Hub.toast = toast;
  window.Hub.copyText = copyText;
  window.Hub.loadJson = loadJson;
  window.Hub.saveJson = saveJson;
})();

