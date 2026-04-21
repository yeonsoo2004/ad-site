/* app — CSS Utility Hub (index: 해시 SPA · subpage: 고정 도구) */
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
  var fixedToolId =
    window.__HUB_PAGE__ && window.__HUB_PAGE__.tool
      ? normalizeToolId(window.__HUB_PAGE__.tool)
      : null;

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

  function getInitialToolId() {
    if (fixedToolId) return fixedToolId;
    return getToolFromHash();
  }

  function resolveToolId(requested) {
    var toolId = normalizeToolId(requested);
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
    return toolId;
  }

  function go(id, options) {
    options = options || {};
    var toolId = resolveToolId(id);

    if (activeToolId === toolId && !options.force) {
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
    if (tool && tool.title) {
      document.title = tool.title + " — CSS Utility Hub";
    }

    container.innerHTML = "";
    if (tool && typeof tool.render === "function") {
      activeCleanup = tool.render(container) || null;
    }

    if (fixedToolId) {
      if (window.history && window.history.replaceState && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } else if (!options.skipHash) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#" + toolId);
      } else {
        window.location.hash = "#" + toolId;
      }
    }

    closeDrawer();
  }

  sidebar.addEventListener("click", function (e) {
    var link = e.target.closest("a.hub-nav__item[data-tool]");
    if (link && sidebar.contains(link)) {
      closeDrawer();
      return;
    }
    var btn = e.target.closest("button.hub-nav__item[data-tool]");
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

  if (!fixedToolId) {
    window.addEventListener("hashchange", function () {
      go(getToolFromHash(), { skipHash: true });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    go(getInitialToolId(), { skipHash: true });
  });
})();
