/**
 * 공통 헤더 컴포넌트 — SPA: data-spa-section 으로 섹션 전환 (component.js)
 */
(function () {
  var mount = document.getElementById("site-header-mount");
  if (!mount) return;

  var current = mount.getAttribute("data-current") || "generator";

  var links = [
    { id: "generator", label: "생성기", section: "generator" },
    { id: "presets", label: "프리셋", section: "presets" },
    { id: "showcase", label: "쇼케이스", section: "showcase" },
    { id: "guide", label: "가이드", section: "guide" },
  ];

  var navHtml = links
    .map(function (item) {
      var isCurrent = item.id === current;
      var attrs = 'class="site-header__link"';
      if (isCurrent) attrs += ' aria-current="page"';
      attrs += ' data-spa-section="' + item.section + '"';
      attrs += ' href="#' + item.section + '"';
      return "<a " + attrs + ">" + item.label + "</a>";
    })
    .join("");

  var themeBtn =
    '<button type="button" class="site-header__theme" id="theme-toggle" aria-label="테마 전환">' +
    '<span class="sr-only theme-toggle-label">테마 전환</span>' +
    '<svg class="theme-icon--moon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
    "</svg>" +
    '<svg class="theme-icon--sun" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    "<circle cx=\"12\" cy=\"12\" r=\"4\"/>" +
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>' +
    "</svg>" +
    "</button>";

  mount.outerHTML =
    '<header class="site-header" id="site-header">' +
    '<div class="site-header__inner">' +
    '<a class="site-header__brand" href="#generator" data-spa-section="generator">' +
    '<span class="site-header__logo" aria-hidden="true"></span>' +
    "<span>Glass CSS Gen</span>" +
    "</a>" +
    '<nav class="site-header__nav" id="site-header-nav" aria-label="주요 메뉴">' +
    navHtml +
    "</nav>" +
    '<div class="site-header__cluster">' +
    themeBtn +
    '<button type="button" class="site-header__toggle" aria-expanded="false" aria-controls="site-header-nav" id="site-header-toggle">' +
    '<span class="sr-only">메뉴 열기</span>' +
    '<span class="site-header__toggle-icon" aria-hidden="true">' +
    "<span></span><span></span><span></span>" +
    "</span>" +
    "</button>" +
    "</div>" +
    "</div>" +
    "</header>";

  var header = document.getElementById("site-header");
  var toggle = document.getElementById("site-header-toggle");
  var nav = document.getElementById("site-header-nav");

  function setOpen(open) {
    if (!header || !toggle) return;
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    var sr = toggle.querySelector(".sr-only");
    if (sr) sr.textContent = open ? "메뉴 닫기" : "메뉴 열기";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("is-open"));
    });
    nav.querySelectorAll("a[data-spa-section]").forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  var brand = document.querySelector(".site-header__brand");
  if (brand)
    brand.addEventListener("click", function () {
      setOpen(false);
    });

  window.addEventListener(
    "resize",
    function () {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    },
    { passive: true }
  );
})();
