/* hub-layout — shared shell components (sidebar + footer) */
(function () {
  function sidebarHtml() {
    return (
      '<div class="hub-sidebar__top">' +
      '<div class="hub-brand" role="banner">' +
      '<span class="hub-brand__logo" aria-hidden="true"></span>' +
      '<div class="hub-brand__text">' +
      '<div class="hub-brand__name">CSS Utility Hub</div>' +
      '<div class="hub-brand__sub">Design tools · SPA</div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<nav class="hub-nav" aria-label="카테고리별 도구 목록">' +
      '<div class="hub-nav__group">' +
      '<div class="hub-nav__title">트렌디 UI</div>' +
      '<button class="hub-nav__item is-active" type="button" data-tool="glass">글래스모피즘</button>' +
      '<button class="hub-nav__item" type="button" data-tool="neumorphism">뉴모피즘</button>' +
      '<button class="hub-nav__item" type="button" data-tool="gradient">그라디언트 메이커</button>' +
      '<button class="hub-nav__item" type="button" data-tool="mesh">메쉬 그라디언트</button>' +
      '<button class="hub-nav__item" type="button" data-tool="pattern">패턴 생성기</button>' +
      "</div>" +
      '<div class="hub-nav__group">' +
      '<div class="hub-nav__title">레이아웃</div>' +
      '<button class="hub-nav__item" type="button" data-tool="grid">그리드 빌더</button>' +
      '<button class="hub-nav__item" type="button" data-tool="flex">플렉스박스 빌더</button>' +
      '<button class="hub-nav__item" type="button" data-tool="spacing">스페이싱 스케일</button>' +
      '<button class="hub-nav__item" type="button" data-tool="container">컨테이너 계산기</button>' +
      "</div>" +
      '<div class="hub-nav__group">' +
      '<div class="hub-nav__title">타이포 / 컬러</div>' +
      '<button class="hub-nav__item" type="button" data-tool="type">타이포 스케일</button>' +
      '<button class="hub-nav__item" type="button" data-tool="palette">팔레트 생성기</button>' +
      '<button class="hub-nav__item" type="button" data-tool="contrast">대비 체크</button>' +
      "</div>" +
      '<div class="hub-nav__group">' +
      '<div class="hub-nav__title">CSS 도우미</div>' +
      '<button class="hub-nav__item" type="button" data-tool="shadow">섀도우 프리셋</button>' +
      '<button class="hub-nav__item" type="button" data-tool="border">보더/라디우스</button>' +
      '<button class="hub-nav__item" type="button" data-tool="animation">애니메이션</button>' +
      "</div>" +
      "</nav>"
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

  function mountSidebar() {
    var el = document.getElementById("hub-sidebar");
    if (!el) return null;
    el.innerHTML = sidebarHtml();
    return el;
  }

  function mountFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.innerHTML = footerHtml();
  }

  function mountAll() {
    mountSidebar();
    mountFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }

  window.HubLayout = {
    mountSidebar: mountSidebar,
    mountFooter: mountFooter,
  };
})();
