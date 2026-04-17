/* tool: neumorphism — soft UI shadow builder */
(function () {
  var Hub = window.Hub || {};
  var showToast = Hub.toast || function () {};

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixRgb(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  function rgbToCss(c) {
    return "rgb(" + c.r + " " + c.g + " " + c.b + ")";
  }

  function neumoTemplate() {
    return (
      '<section class="tool-root" aria-label="뉴모피즘">' +
      '<header class="page-hero">' +
      "<h1>뉴모피즘(Neumorphism) 빌더</h1>" +
      "<p>부드러운 플라스틱 질감의 이중 그림자(box-shadow)를 조절해 버튼/카드를 빠르게 만들어요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="neumo-controls-heading">' +
      '<h2 id="neumo-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="neumo-color">베이스 색상</label>' +
      '<input type="color" id="neumo-color" value="#1f2937" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="neumo-distance">거리 <span class="value" id="out-neumo-distance">16px</span></label>' +
      '<input type="range" id="neumo-distance" min="0" max="40" value="16" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="neumo-blur">블러 <span class="value" id="out-neumo-blur">28px</span></label>' +
      '<input type="range" id="neumo-blur" min="0" max="80" value="28" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="neumo-intensity">강도 <span class="value" id="out-neumo-intensity">22%</span></label>' +
      '<input type="range" id="neumo-intensity" min="0" max="60" value="22" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="neumo-radius">라운드 <span class="value" id="out-neumo-radius">20px</span></label>' +
      '<input type="range" id="neumo-radius" min="0" max="48" value="20" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="neumo-shape">볼륨 형태</label>' +
      '<select id="neumo-shape" class="neumo-select">' +
      '<option value="flat">Flat</option>' +
      '<option value="pressed">Pressed</option>' +
      '<option value="convex">Convex</option>' +
      '<option value="concave">Concave</option>' +
      "</select>" +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="neumo-reset">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="neumo-preview-heading">' +
      '<h2 id="neumo-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="neumo-stage" id="neumo-stage">' +
      '<div class="neumo-card" id="neumo-card"><span class="preview-card__label">Neumo Card</span></div>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="neumo-code-heading">' +
      '<h2 id="neumo-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="neumo-copy">복사</button></div>' +
      '<pre><code id="neumo-css"></code></pre>' +
      "</div>" +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureNeumoCss() {
    if (document.getElementById("neumo-inline-style")) return;
    var style = document.createElement("style");
    style.id = "neumo-inline-style";
    style.textContent =
      ".neumo-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".neumo-stage{position:relative;min-height:300px;display:flex;align-items:center;justify-content:center;padding:var(--space-8);border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid)}" +
      ".neumo-card{width:min(100%,340px);min-height:170px;display:flex;align-items:center;justify-content:center;border-radius:22px;position:relative;overflow:hidden}";
    document.head.appendChild(style);
  }

  function loadState() {
    return Hub.loadJson ? Hub.loadJson("neumo-state", null) : null;
  }

  function saveState(st) {
    if (Hub.saveJson) Hub.saveJson("neumo-state", st);
  }

  function buildCss(st) {
    var base = hexToRgb(st.color);
    var white = { r: 255, g: 255, b: 255 };
    var black = { r: 0, g: 0, b: 0 };
    var t = clamp(st.intensity / 100, 0, 1);

    var light = mixRgb(base, white, t);
    var dark = mixRgb(base, black, t);

    var dx = st.distance;
    var dy = st.distance;
    var blur = st.blur;

    var topLeft = dx * -1 + "px " + dy * -1 + "px " + blur + "px " + rgbToCss(light);
    var bottomRight = dx + "px " + dy + "px " + blur + "px " + rgbToCss(dark);

    var shadow;
    if (st.shape === "pressed") shadow = "inset " + bottomRight + ", inset " + topLeft;
    else shadow = bottomRight + ", " + topLeft;

    var bg = st.color;
    if (st.shape === "convex") {
      bg =
        "linear-gradient(145deg, " +
        rgbToCss(light) +
        ", " +
        rgbToCss(dark) +
        ")";
    } else if (st.shape === "concave") {
      bg =
        "linear-gradient(145deg, " +
        rgbToCss(dark) +
        ", " +
        rgbToCss(light) +
        ")";
    }

    var css =
      ".neumo-card {\n" +
      "  border-radius: " +
      st.radius +
      "px;\n" +
      "  background: " +
      bg +
      ";\n" +
      "  box-shadow: " +
      shadow +
      ";\n" +
      "}\n";

    return { css: css, shadow: shadow, bg: bg };
  }

  window.Tools = window.Tools || {};
  window.Tools.neumorphism = {
    id: "neumorphism",
    title: "뉴모피즘",
    render: function (container) {
      ensureNeumoCss();
      container.innerHTML = neumoTemplate();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elColor = root.querySelector("#neumo-color");
      var elDistance = root.querySelector("#neumo-distance");
      var elBlur = root.querySelector("#neumo-blur");
      var elIntensity = root.querySelector("#neumo-intensity");
      var elRadius = root.querySelector("#neumo-radius");
      var elShape = root.querySelector("#neumo-shape");

      var outDistance = root.querySelector("#out-neumo-distance");
      var outBlur = root.querySelector("#out-neumo-blur");
      var outIntensity = root.querySelector("#out-neumo-intensity");
      var outRadius = root.querySelector("#out-neumo-radius");

      var stage = root.querySelector("#neumo-stage");
      var card = root.querySelector("#neumo-card");
      var cssOut = root.querySelector("#neumo-css");

      var defaults = {
        color: "#1f2937",
        distance: 16,
        blur: 28,
        intensity: 22,
        radius: 20,
        shape: "flat",
      };

      var st = loadState() || defaults;

      function syncControls() {
        elColor.value = st.color;
        elDistance.value = st.distance;
        elBlur.value = st.blur;
        elIntensity.value = st.intensity;
        elRadius.value = st.radius;
        elShape.value = st.shape;
      }

      function readControls() {
        st = {
          color: elColor.value,
          distance: Number(elDistance.value),
          blur: Number(elBlur.value),
          intensity: Number(elIntensity.value),
          radius: Number(elRadius.value),
          shape: elShape.value,
        };
        saveState(st);
      }

      function render() {
        if (outDistance) outDistance.textContent = st.distance + "px";
        if (outBlur) outBlur.textContent = st.blur + "px";
        if (outIntensity) outIntensity.textContent = st.intensity + "%";
        if (outRadius) outRadius.textContent = st.radius + "px";

        var built = buildCss(st);
        if (stage) stage.style.background = st.color;
        if (card) {
          card.style.borderRadius = st.radius + "px";
          card.style.background = built.bg;
          card.style.boxShadow = built.shadow;
        }
        if (cssOut) cssOut.textContent = built.css;
      }

      function onAnyChange() {
        readControls();
        render();
      }

      [elColor, elDistance, elBlur, elIntensity, elRadius, elShape].forEach(function (el) {
        if (!el) return;
        el.addEventListener("input", onAnyChange, { signal: ac.signal });
        el.addEventListener("change", onAnyChange, { signal: ac.signal });
      });

      var btnReset = root.querySelector("#neumo-reset");
      if (btnReset) {
        btnReset.addEventListener(
          "click",
          function () {
            st = defaults;
            saveState(st);
            syncControls();
            render();
            showToast("뉴모피즘 값을 초기화했습니다.");
          },
          { signal: ac.signal }
        );
      }

      var btnCopy = root.querySelector("#neumo-copy");
      if (btnCopy) {
        btnCopy.addEventListener(
          "click",
          function () {
            var text = cssOut ? cssOut.textContent : "";
            if (!text) return;
            var copy = Hub.copyText ? Hub.copyText(text) : Promise.reject(new Error("no copy"));
            copy.then(function () {
              showToast("클립보드에 복사했습니다");
            }).catch(function () {
              showToast("복사에 실패했습니다.");
            });
          },
          { signal: ac.signal }
        );
      }

      syncControls();
      render();

      return function cleanup() {
        try {
          ac.abort();
        } catch (e) {}
        container.innerHTML = "";
      };
    },
  };
})();

