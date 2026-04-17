/* app — CSS Utility Hub SPA (tool loader) */
(function () {
  var shell = document.getElementById("hub-shell");
  var sidebar = document.getElementById("hub-sidebar");
  var backdrop = document.getElementById("hub-backdrop");
  var menuBtn = document.getElementById("hub-menu-btn");
  var toolTitle = document.getElementById("current-tool-title");
  var container = document.getElementById("tool-container");

  if (!shell || !sidebar || !container) return;

  var tools = (window.Tools = window.Tools || {});
  var activeCleanup = null;
  var activeToolId = null;

  function setDrawerOpen(open) {
    if (!shell) return;
    shell.classList.toggle("is-drawer-open", !!open);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (backdrop) backdrop.hidden = !open;
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function openDrawer() {
    setDrawerOpen(true);
  }

  function normalizeToolId(id) {
    return String(id || "")
      .trim()
      .toLowerCase();
  }

  function setActiveMenu(id) {
    var items = sidebar.querySelectorAll("[data-tool]");
    items.forEach(function (btn) {
      var tid = normalizeToolId(btn.getAttribute("data-tool"));
      btn.classList.toggle("is-active", tid === id);
    });
  }

  function getToolFromHash() {
    var hash = (window.location.hash || "").replace(/^#/, "");
    if (!hash) return "glass";
    return normalizeToolId(hash);
  }

  function go(id, options) {
    options = options || {};
    var toolId = normalizeToolId(id);
    if (!toolId) toolId = "glass";
    if (!tools[toolId]) {
      if (tools["coming-soon"]) {
        window.__COMING_SOON_PAYLOAD__ = window.__COMING_SOON_PAYLOAD__ || {};
        window.__COMING_SOON_PAYLOAD__.title = "준비 중: " + toolId;
        window.__COMING_SOON_PAYLOAD__.desc =
          "이 메뉴는 허브 구조만 먼저 연결해 둔 상태예요. 다음 단계에서 실제 생성기를 붙입니다.";
        window.__COMING_SOON_PAYLOAD__.todo = [
          "기능 정의 및 UI 스펙 확정",
          "컨트롤 + 미리보기 + CSS 출력",
          "프리셋 저장/불러오기",
          "접근성/반응형 마감",
        ];
        toolId = "coming-soon";
      } else {
        toolId = "glass";
      }
    }

    if (activeToolId === toolId) {
      closeDrawer();
      return;
    }

    if (typeof activeCleanup === "function") {
      try {
        activeCleanup();
      } catch (e) {}
      activeCleanup = null;
    }

    activeToolId = toolId;
    setActiveMenu(toolId);

    var tool = tools[toolId];
    if (toolTitle) toolTitle.textContent = tool && tool.title ? tool.title : toolId;

    container.innerHTML = "";
    if (tool && typeof tool.render === "function") {
      activeCleanup = tool.render(container) || null;
    }

    if (!options.skipHash && window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + toolId);
    } else {
      window.location.hash = "#" + toolId;
    }

    closeDrawer();
  }

  sidebar.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-tool]");
    if (!btn || !sidebar.contains(btn)) return;
    e.preventDefault();
    var id = btn.getAttribute("data-tool");
    go(id);
  });

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = shell.classList.contains("is-drawer-open");
      if (open) closeDrawer();
      else openDrawer();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      closeDrawer();
    });
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });

  window.addEventListener("hashchange", function () {
    go(getToolFromHash(), { skipHash: true });
  });

  document.addEventListener("DOMContentLoaded", function () {
    go(getToolFromHash(), { skipHash: true });
  });
})();

