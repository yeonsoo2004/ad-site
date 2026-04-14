/**
 * SPA 섹션 네비게이션 — 헤더 data-spa-section 과 main .spa-section 연동
 */
(function () {
  var SECTION_IDS = ["generator", "presets", "showcase", "guide"];

  function getSections() {
    return SECTION_IDS.map(function (id) {
      return document.getElementById(id + "-section");
    });
  }

  function getNavLinks() {
    var nav = document.getElementById("site-header-nav");
    return nav ? nav.querySelectorAll("a[data-spa-section]") : [];
  }

  function setActiveSection(activeId) {
    var sections = getSections();
    sections.forEach(function (el) {
      if (!el) return;
      var id = el.id.replace("-section", "");
      var isActive = id === activeId;
      el.classList.toggle("is-active", isActive);
    });

    getNavLinks().forEach(function (link) {
      var sid = link.getAttribute("data-spa-section");
      if (link.getAttribute("aria-disabled") === "true") return;
      if (sid === activeId) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + activeId);
    }
  }

  function initFromHash() {
    var hash = (window.location.hash || "").replace(/^#/, "");
    if (SECTION_IDS.indexOf(hash) !== -1) {
      setActiveSection(hash);
    } else {
      setActiveSection("generator");
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-spa-section]");
    if (!t) return;
    if (t.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      return;
    }
    var sid = t.getAttribute("data-spa-section");
    if (!sid || SECTION_IDS.indexOf(sid) === -1) return;
    e.preventDefault();
    setActiveSection(sid);

    var header = document.getElementById("site-header");
    if (header && header.classList.contains("is-open")) {
      var toggle = document.getElementById("site-header-toggle");
      header.classList.remove("is-open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        var sr = toggle.querySelector(".sr-only");
        if (sr) sr.textContent = "메뉴 열기";
      }
    }
  });

  window.addEventListener("hashchange", initFromHash);

  window.SpaNav = {
    go: setActiveSection,
    sectionIds: SECTION_IDS,
  };

  document.addEventListener("DOMContentLoaded", initFromHash);
})();

