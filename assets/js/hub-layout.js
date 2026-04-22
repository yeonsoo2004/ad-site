/* hub-layout — 셸 HTML(단일 소스) + 사이드바/푸터 마운트 */
(function () {
  var NAV_GROUPS = [
    {
      title: "트렌디 UI",
      items: [
        { id: "glass", label: "글래스모피즘" },
        { id: "neumorphism", label: "뉴모피즘" },
        { id: "gradient", label: "그라디언트 메이커" },
        { id: "mesh", label: "메쉬 그라디언트" },
        { id: "pattern", label: "패턴 생성기" },
      ],
    },
    {
      title: "레이아웃",
      items: [
        { id: "grid", label: "그리드 빌더" },
        { id: "flex", label: "플렉스박스 빌더" },
        { id: "spacing", label: "스페이싱 스케일" },
        { id: "container", label: "컨테이너 계산기" },
      ],
    },
    {
      title: "타이포 / 컬러",
      items: [
        { id: "type", label: "타이포 스케일" },
        { id: "palette", label: "팔레트 생성기" },
        { id: "contrast", label: "대비 체크" },
      ],
    },
    {
      title: "CSS 도우미",
      items: [
        { id: "shadow", label: "섀도우 프리셋" },
        { id: "border", label: "보더/라디우스" },
        { id: "animation", label: "애니메이션" },
      ],
    },
  ];

  function navHref(mode, id) {
    if (mode === "mpa-subpage") return "./" + id + ".html";
    return "subpage/" + id + ".html";
  }

  function sidebarHtml(options) {
    options = options || {};
    var mode =
      options.mode === "spa" ? "spa" : options.mode === "mpa-subpage" ? "mpa-subpage" : "mpa-index";
    var activeId = options.activeId ? String(options.activeId).trim().toLowerCase() : "";
    var brandHref = mode === "mpa-subpage" ? "../index.html" : "index.html";

    var top =
      '<div class="hub-sidebar__top">' +
      '<a class="hub-brand" role="banner" href="' +
      brandHref +
      '" aria-label="메인으로 이동">' +
      '<span class="hub-brand__logo" aria-hidden="true"></span>' +
      '<div class="hub-brand__text">' +
      '<div class="hub-brand__name">CSS Utility Hub</div>' +
      '<div class="hub-brand__sub">Design tools</div>' +
      "</div>" +
      "</a>" +
      "</div>";

    var navParts = [];
    navParts.push('<nav class="hub-nav" aria-label="카테고리별 도구 목록">');

    NAV_GROUPS.forEach(function (g) {
      navParts.push('<div class="hub-nav__group">');
      navParts.push('<div class="hub-nav__title">' + g.title + "</div>");
      g.items.forEach(function (it) {
        var isActive = it.id === activeId;
        if (mode === "spa") {
          navParts.push(
            '<button class="hub-nav__item' +
              (isActive ? " is-active" : "") +
              '" type="button" data-tool="' +
              it.id +
              '">' +
              it.label +
              "</button>"
          );
        } else {
          navParts.push(
            '<a class="hub-nav__item' +
              (isActive ? " is-active" : "") +
              '" href="' +
              navHref(mode, it.id) +
              '" data-tool="' +
              it.id +
              '">' +
              it.label +
              "</a>"
          );
        }
      });
      navParts.push("</div>");
    });

    navParts.push("</nav>");
    return top + navParts.join("");
  }

  function shellHtml() {
    return (
      '<div class="hub-shell" id="hub-shell">' +
      '<div class="hub-drawer-backdrop" id="hub-backdrop" hidden></div>' +
      '<aside class="hub-sidebar" id="hub-sidebar" aria-label="도구 메뉴"></aside>' +
      '<div class="hub-main">' +
      '<header class="hub-topbar" aria-label="상단 바">' +
      '<button type="button" class="hub-topbar__icon" id="hub-menu-btn" aria-label="메뉴 열기" aria-controls="hub-sidebar" aria-expanded="false">' +
      '<span class="hub-burger" aria-hidden="true"><span></span><span></span><span></span></span>' +
      "</button>" +
      '<div class="hub-topbar__title">' +
      '<div class="hub-topbar__kicker">선택된 도구</div>' +
      '<div class="hub-topbar__name" id="current-tool-title">CSS Utility Hub</div>' +
      "</div>" +
      '<div class="hub-topbar__actions">' +
      '<button type="button" class="hub-topbar__icon" id="theme-toggle" aria-label="테마 전환">' +
      '<span class="sr-only theme-toggle-label">테마 전환</span>' +
      '<svg class="theme-icon--moon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />' +
      "</svg>" +
      '<svg class="theme-icon--sun" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4" />' +
      '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />' +
      "</svg>" +
      "</button>" +
      "</div>" +
      "</header>" +
      '<div class="hub-adfit">' +
      '<ins class="kakao_ad_area" style="display:none;" ' +
      'data-ad-unit = "DAN-jkh7ej49xA8VLGiE" ' +
      'data-ad-width = "300" ' +
      'data-ad-height = "250"></ins>' +
      "</div>" +
      '<main class="hub-content" id="hub-content">' +
      '<div id="tool-container" class="tool-container" aria-live="polite"></div>' +
      "</main>" +
      "</div>" +
      "</div>" +
      '<footer class="site-footer" id="site-footer"></footer>'
    );
  }

  function footerHtml() {
    return (
      '<div class="site-footer__inner">' +
      '<div class="site-footer__col">' +
      '<p class="site-footer__meta">Glass CSS Gen</p>' +
      '<p class="site-footer__credit">' +
      "Designed &amp; Developed by <span lang=\"en\">Studio Glass</span>" +
      "</p>" +
      "</div>" +
      '<a class="site-footer__link" href="mailto:hello@glasscss.example">yspark004@naver.com</a>' +
      "</div>"
    );
  }

  function mountSidebar(options) {
    var el = document.getElementById("hub-sidebar");
    if (!el) return null;
    el.innerHTML = sidebarHtml(options);
    return el;
  }

  function mountFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.innerHTML = footerHtml();
  }

  window.HubLayout = {
    shellHtml: shellHtml,
    sidebarHtml: sidebarHtml,
    mountSidebar: mountSidebar,
    mountFooter: mountFooter,
    NAV_GROUPS: NAV_GROUPS,
  };
})();
