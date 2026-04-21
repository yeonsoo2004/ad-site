/* hub-bootstrap — 주입 셸 + 사이드바/푸터 마운트 (index·subpage 공통) */
(function () {
  function injectShellIfNeeded() {
    var root = document.getElementById("hub-root");
    if (!root || document.getElementById("hub-shell")) return;
    if (!window.HubLayout || typeof window.HubLayout.shellHtml !== "function") return;
    var preserved = Array.prototype.slice.call(root.childNodes);
    root.innerHTML = window.HubLayout.shellHtml();
    if (preserved && preserved.length) {
      var host = document.getElementById("hub-content");
      if (host) {
        preserved.forEach(function (n) {
          host.appendChild(n);
        });
      }
    }
  }

  function navOptions() {
    var p = window.__HUB_PAGE__ || {};
    if (p.spa) {
      return { mode: "spa", activeId: null };
    }
    if (p.tool) {
      return { mode: "mpa-subpage", activeId: String(p.tool).trim().toLowerCase() };
    }
    return { mode: "mpa-index", activeId: null };
  }

  function boot() {
    injectShellIfNeeded();
    if (!window.HubLayout) return;
    var opt = navOptions();
    if (typeof window.HubLayout.mountSidebar === "function") {
      window.HubLayout.mountSidebar(opt);
    }
    if (typeof window.HubLayout.mountFooter === "function") {
      window.HubLayout.mountFooter();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
