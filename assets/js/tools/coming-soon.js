/* tool: coming-soon — generic placeholder for future tools */
(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function template(title, desc, items) {
    var list =
      Array.isArray(items) && items.length
        ? "<ul class=\"coming-list\">" +
          items
            .map(function (t) {
              return "<li>" + escapeHtml(t) + "</li>";
            })
            .join("") +
          "</ul>"
        : "";

    return (
      '<section class="tool-root" aria-label="준비 중">' +
      '<header class="page-hero">' +
      "<h1>" +
      escapeHtml(title || "준비 중") +
      "</h1>" +
      "<p>" +
      escapeHtml(desc || "이 도구는 다음 단계에서 구현됩니다. 우선 허브 구조는 이미 연결되어 있어요.") +
      "</p>" +
      "</header>" +
      '<div class="generator__panel">' +
      '<h2 class="generator__panel-title">다음 계획</h2>' +
      list +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("coming-soon-inline-style")) return;
    var style = document.createElement("style");
    style.id = "coming-soon-inline-style";
    style.textContent =
      ".coming-list{margin:0;padding-left:1.2rem;color:var(--color-text-secondary);line-height:var(--leading-normal)}" +
      ".coming-list li{margin-bottom:var(--space-2)}" +
      ".coming-list li:last-child{margin-bottom:0}";
    document.head.appendChild(style);
  }

  window.Tools = window.Tools || {};
  window.Tools["coming-soon"] = {
    id: "coming-soon",
    title: "준비 중",
    render: function (container) {
      ensureCssOnce();
      var payload = (window.__COMING_SOON_PAYLOAD__ = window.__COMING_SOON_PAYLOAD__ || {});
      container.innerHTML = template(payload.title, payload.desc, payload.todo);
      return function cleanup() {
        container.innerHTML = "";
      };
    },
  };
})();

