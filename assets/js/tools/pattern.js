/* tool: pattern — pattern generator (dots/stripes/grid) */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "pattern-state";
  var STORAGE_PRESETS = "pattern-presets";

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }

  function defaultState() {
    return {
      type: "dots", // dots | stripes | grid
      base: "#0b1220",
      color: "#22d3ee",
      opacity: 28, // 0-100
      size: 6, // px (dot radius-ish / line thickness)
      gap: 22, // px
      angle: 45, // stripes only
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    return {
      type: st.type === "stripes" || st.type === "grid" || st.type === "dots" ? st.type : "dots",
      base: typeof st.base === "string" ? st.base : "#0b1220",
      color: typeof st.color === "string" ? st.color : "#22d3ee",
      opacity: clamp(Number(st.opacity), 0, 100),
      size: clamp(Number(st.size), 1, 24),
      gap: clamp(Number(st.gap), 4, 80),
      angle: clamp(Number(st.angle), 0, 180),
    };
  }

  function buildPattern(st) {
    st = normalizeState(st);
    var a = clamp(st.opacity / 100, 0, 1);
    var ink = rgba(st.color, a);

    // We output background-color + background-image + background-size (and position if needed).
    if (st.type === "dots") {
      // Use radial gradient dot placed at top-left with repeating background-size.
      // dot diameter = size*2, but we treat size as radius-ish.
      var r = Math.max(1, Math.round(st.size));
      var cell = Math.max(r * 2 + 4, Math.round(st.gap));
      return {
        image:
          "radial-gradient(circle, " +
          ink +
          " " +
          r +
          "px, transparent " +
          (r + 1) +
          "px)",
        size: cell + "px " + cell + "px",
        position: "0 0",
      };
    }

    if (st.type === "stripes") {
      // repeating linear stripes: thickness=size, gap controls spacing
      var thick = Math.max(1, Math.round(st.size));
      var cell2 = Math.max(thick + 2, Math.round(st.gap));
      return {
        image:
          "repeating-linear-gradient(" +
          Math.round(st.angle) +
          "deg, " +
          ink +
          " 0 " +
          thick +
          "px, transparent " +
          thick +
          "px " +
          cell2 +
          "px)",
        size: "auto",
        position: "0 0",
      };
    }

    // grid
    var w = Math.max(1, Math.round(st.size));
    var cell3 = Math.max(w + 2, Math.round(st.gap));
    // Two perpendicular repeating gradients.
    return {
      image:
        "linear-gradient(to right, " +
        ink +
        " " +
        w +
        "px, transparent " +
        w +
        "px), " +
        "linear-gradient(to bottom, " +
        ink +
        " " +
        w +
        "px, transparent " +
        w +
        "px)",
      size: cell3 + "px " + cell3 + "px",
      position: "0 0",
    };
  }

  function buildCss(st) {
    st = normalizeState(st);
    var p = buildPattern(st);
    var css =
      ".pattern-bg {\n" +
      "  background-color: " +
      st.base +
      ";\n" +
      "  background-image: " +
      p.image +
      ";\n";
    if (p.size !== "auto") {
      css += "  background-size: " + p.size + ";\n";
    }
    if (p.position) {
      css += "  background-position: " + p.position + ";\n";
    }
    css += "}\n";
    return css;
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="패턴 생성기">' +
      '<header class="page-hero page-hero--compact">' +
      "<h2>패턴 생성기</h2>" +
      "<p>Dots / Stripes / Grid 패턴을 만들고 CSS를 복사하거나 프리셋으로 저장하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="pat-controls-heading">' +
      '<h2 id="pat-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="pat-type">타입</label>' +
      '<select id="pat-type" class="hub-select">' +
      '<option value="dots">Dots</option>' +
      '<option value="stripes">Stripes</option>' +
      '<option value="grid">Grid</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group">' +
      '<label for="pat-base">베이스 배경색</label>' +
      '<input type="color" id="pat-base" value="#0b1220" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="pat-color">패턴 색상</label>' +
      '<input type="color" id="pat-color" value="#22d3ee" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="pat-opacity">투명도 <span class="value" id="out-pat-opacity">28%</span></label>' +
      '<input type="range" id="pat-opacity" min="0" max="100" value="28" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="pat-size">두께/크기 <span class="value" id="out-pat-size">6px</span></label>' +
      '<input type="range" id="pat-size" min="1" max="24" value="6" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="pat-gap">간격 <span class="value" id="out-pat-gap">22px</span></label>' +
      '<input type="range" id="pat-gap" min="4" max="80" value="22" step="1" />' +
      "</div>" +
      '<div class="control-group" data-pat-only="stripes">' +
      '<label for="pat-angle">각도 <span class="value" id="out-pat-angle">45°</span></label>' +
      '<input type="range" id="pat-angle" min="0" max="180" value="45" step="1" />' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="pat-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="pat-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="pat-preview-heading">' +
      '<h2 id="pat-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="pat-stage" id="pat-stage">' +
      '<div class="pat-card" id="pat-card">' +
      '<div class="pat-card__badge">Preview</div>' +
      '<div class="pat-card__title">Pattern</div>' +
      '<div class="pat-card__sub">background-image</div>' +
      "</div>" +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="pat-code-heading">' +
      '<h2 id="pat-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="pat-copy">복사</button></div>' +
      '<pre><code id="pat-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="pat-presets-heading">' +
      '<h2 id="pat-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="pat-presets" class="pat-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("pattern-inline-style")) return;
    var style = document.createElement("style");
    style.id = "pattern-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".pat-stage{position:relative;min-height:300px;display:flex;align-items:center;justify-content:center;padding:var(--space-8);border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid);overflow:hidden;isolation:isolate}" +
      ".pat-card{position:relative;z-index:1;width:min(100%,360px);min-height:180px;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:var(--space-5);border:1px solid rgba(255,255,255,.18);box-shadow:0 24px 60px rgba(0,0,0,.35);background:rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}" +
      "html[data-theme=\"light\"] .pat-card{border-color:rgba(15,23,42,.12);box-shadow:0 24px 60px rgba(15,23,42,.12);background:rgba(255,255,255,.65)}" +
      ".pat-card__badge{align-self:flex-start;font-size:var(--text-xs);font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.18);color:#fff}" +
      "html[data-theme=\"light\"] .pat-card__badge{background:rgba(255,255,255,.55);color:rgba(15,23,42,.85);border-color:rgba(15,23,42,.10)}" +
      ".pat-card__title{font-size:var(--text-xl);font-weight:900;letter-spacing:var(--tracking-tight);color:var(--color-text-primary)}" +
      ".pat-card__sub{font-size:var(--text-sm);color:var(--color-text-secondary)}" +
      ".pat-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".pat-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".pat-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".pat-preset__swatch{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.16);flex:0 0 auto}" +
      "html[data-theme=\"light\"] .pat-preset__swatch{border-color:rgba(15,23,42,.12)}" +
      ".pat-preset__name{font-size:var(--text-sm);font-weight:800;color:var(--color-text-primary)}" +
      ".pat-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".pat-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".pat-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
    document.head.appendChild(style);
  }

  function loadPresets() {
    var list = loadJson(STORAGE_PRESETS, []);
    return Array.isArray(list) ? list : [];
  }

  function savePresets(list) {
    saveJson(STORAGE_PRESETS, list);
  }

  function renderPresets(host, list) {
    if (!host) return;
    if (!list.length) {
      host.innerHTML =
        '<p class="presets-empty" role="status">저장된 프리셋이 없습니다. 좌측에서 「프리셋 저장」을 눌러 추가해 보세요.</p>';
      return;
    }
    host.innerHTML = list
      .map(function (p) {
        var st = normalizeState(p.state);
        var pat = buildPattern(st);
        var bg = escapeHtml(st.base);
        var img = escapeHtml(pat.image);
        var sz = pat.size && pat.size !== "auto" ? ";background-size:" + escapeHtml(pat.size) : "";
        var pos = pat.position ? ";background-position:" + escapeHtml(pat.position) : "";
        return (
          '<div class="pat-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="pat-preset__swatch" style="background-color:' +
          bg +
          ";background-image:" +
          img +
          sz +
          pos +
          '"></div>' +
          '<div class="pat-preset__body">' +
          '<div class="pat-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="pat-preset__meta">' +
          escapeHtml(st.type) +
          " · opacity " +
          Math.round(st.opacity) +
          "%</div>" +
          "</div>" +
          '<button type="button" class="pat-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.pattern = {
    id: "pattern",
    title: "패턴 생성기",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elType = root.querySelector("#pat-type");
      var elBase = root.querySelector("#pat-base");
      var elColor = root.querySelector("#pat-color");
      var elOpacity = root.querySelector("#pat-opacity");
      var elSize = root.querySelector("#pat-size");
      var elGap = root.querySelector("#pat-gap");
      var elAngle = root.querySelector("#pat-angle");

      var outOpacity = root.querySelector("#out-pat-opacity");
      var outSize = root.querySelector("#out-pat-size");
      var outGap = root.querySelector("#out-pat-gap");
      var outAngle = root.querySelector("#out-pat-angle");

      var stage = root.querySelector("#pat-stage");
      var cssOut = root.querySelector("#pat-css");
      var presetsHost = root.querySelector("#pat-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function setModeVisibility() {
        var mode = elType.value;
        root.querySelectorAll("[data-pat-only]").forEach(function (el) {
          el.style.display = el.getAttribute("data-pat-only") === mode ? "" : "none";
        });
      }

      function syncControls() {
        elType.value = st.type;
        elBase.value = st.base;
        elColor.value = st.color;
        elOpacity.value = st.opacity;
        elSize.value = st.size;
        elGap.value = st.gap;
        elAngle.value = st.angle;
        setModeVisibility();
      }

      function readControls() {
        st = normalizeState({
          type: elType.value,
          base: elBase.value,
          color: elColor.value,
          opacity: Number(elOpacity.value),
          size: Number(elSize.value),
          gap: Number(elGap.value),
          angle: Number(elAngle.value),
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderAll() {
        if (outOpacity) outOpacity.textContent = Math.round(st.opacity) + "%";
        if (outSize) outSize.textContent = Math.round(st.size) + "px";
        if (outGap) outGap.textContent = Math.round(st.gap) + "px";
        if (outAngle) outAngle.textContent = Math.round(st.angle) + "°";

        var pat = buildPattern(st);
        if (stage) {
          stage.style.backgroundColor = st.base;
          stage.style.backgroundImage = pat.image;
          stage.style.backgroundPosition = pat.position || "0 0";
          if (pat.size && pat.size !== "auto") stage.style.backgroundSize = pat.size;
          else stage.style.backgroundSize = "";
        }
        if (cssOut) cssOut.textContent = buildCss(st);
      }

      function applyState(next) {
        st = normalizeState(next);
        saveJson(STORAGE_STATE, st);
        syncControls();
        renderAll();
      }

      function onChange() {
        readControls();
        setModeVisibility();
        renderAll();
      }

      [elType, elBase, elColor, elOpacity, elSize, elGap, elAngle].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#pat-copy").addEventListener(
        "click",
        function () {
          var text = cssOut ? cssOut.textContent : "";
          if (!text) return;
          var copy = Hub.copyText ? Hub.copyText(text) : Promise.reject(new Error("no copy"));
          copy.then(function () {
            toast("클립보드에 복사했습니다");
          }).catch(function () {
            toast("복사에 실패했습니다.");
          });
        },
        { signal: ac.signal }
      );

      root.querySelector("#pat-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("패턴 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#pat-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);

          var list = loadPresets();
          list.unshift({ id: "p-" + Date.now(), name: name, state: normalizeState(st) });
          if (list.length > 40) list = list.slice(0, 40);
          savePresets(list);
          renderPresets(presetsHost, list);
          toast("「" + name + "」 프리셋을 저장했습니다.");
        },
        { signal: ac.signal }
      );

      presetsHost.addEventListener(
        "click",
        function (e) {
          var del = e.target.closest("[data-preset-del]");
          var cardEl = e.target.closest("[data-preset-id]");
          if (!cardEl) return;
          var id = cardEl.getAttribute("data-preset-id");

          if (del) {
            e.preventDefault();
            e.stopPropagation();
            if (!window.confirm("이 프리셋을 삭제할까요?")) return;
            var next = loadPresets().filter(function (p) {
              return p.id !== id;
            });
            savePresets(next);
            renderPresets(presetsHost, next);
            toast("프리셋을 삭제했습니다.");
            return;
          }

          var list = loadPresets();
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
              applyState(list[i].state);
              toast("프리셋을 불러왔습니다.");
              return;
            }
          }
        },
        { signal: ac.signal }
      );

      syncControls();
      renderAll();
      renderPresets(presetsHost, loadPresets());

      return function cleanup() {
        try {
          ac.abort();
        } catch (e) {}
        container.innerHTML = "";
      };
    },
  };
})();

