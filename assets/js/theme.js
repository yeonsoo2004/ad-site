(function () {
  var STORAGE_KEY = "glass-theme";
  var root = document.documentElement;

  function getStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStored(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function isLight() {
    return root.getAttribute("data-theme") === "light";
  }

  function applyTheme(mode) {
    if (mode === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    setStored(mode === "light" ? "light" : "dark");
    updateToggleUi();
  }

  function updateToggleUi() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var light = isLight();
    var label = light ? "다크 모드로 전환" : "라이트 모드로 전환";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
    var sr = btn.querySelector(".theme-toggle-label");
    if (sr) sr.textContent = label;
  }

  function toggle() {
    applyTheme(isLight() ? "dark" : "light");
  }

  function syncFromStorage() {
    var s = getStored();
    if (s === "light") applyTheme("light");
    else if (s === "dark") applyTheme("dark");
    else updateToggleUi();
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncFromStorage();
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", toggle);
  });

  window.ThemeToggle = { applyTheme: applyTheme, toggle: toggle };
})();
