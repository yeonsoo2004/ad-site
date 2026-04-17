/* tool: shadow — box-shadow builder (multi-layer) */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "shadow-state";
  var STORAGE_PRESETS = "shadow-presets";

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
      bg: "#0b1220",
      card: "#111827",
      radius: 20,
      layers: [
        { x: 0, y: 10, blur: 30, spread: -10, opacity: 35, color: "#000000" },
        { x: 0, y: 18, blur: 50, spread: -18, opacity: 22, color: "#000000" },
      ],
    };
  }

  function normalizeLayer(l) {
    l = l && typeof l === "object" ? l : {};
    return {
      x: clamp(Number(l.x), -60, 60),
      y: clamp(Number(l.y), -60, 60),
      blur: clamp(Number(l.blur), 0, 120),
      spread: clamp(Number(l.spread), -60, 60),
      opacity: clamp(Number(l.opacity), 0, 100),
      color: typeof l.color === "string" ? l.color : "#000000",
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    var layers = Array.isArray(st.layers) ? st.layers.slice(0, 6).map(normalizeLayer) : defaultState().layers;
    if (layers.length < 1) layers = [normalizeLayer(defaultState().layers[0])];
    return {
      bg: typeof st.bg === "string" ? st.bg : "#0b1220",
      card: typeof st.card === "string" ? st.card : "#111827",
      radius: clamp(Number(st.radius), 0, 48),
      layers: layers,
    };
  }

  function layerToCss(l) {
    l = normalizeLayer(l);
    var a = clamp(l.opacity / 100, 0, 1);
    return (
      Math.round(l.x) +
      "px " +
      Math.round(l.y) +
      "px " +
      Math.round(l.blur) +
      "px " +
      Math.round(l.spread) +
      "px " +
      rgba(l.color, a)
    );
  }

  function buildShadowCss(st) {
    st = normalizeState(st);
    return st.layers.map(layerToCss).join(",\n    ");
  }

  function buildCss(st) {
    st = normalizeState(st);
    return (
      ".shadow-card {\n" +
      "  border-radius: " +
      Math.round(st.radius) +
      "px;\n" +
      "  box-shadow:\n" +
      "    " +
      buildShadowCss(st) +
      ";\n" +
      "}\n"
    );
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="섀도우 프리셋">' +
      '<header class="page-hero">' +
      "<h1>섀도우 프리셋</h1>" +
      "<p>여러 레이어의 box-shadow를 조절하고 CSS를 복사하거나 프리셋으로 저장하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="sh-controls-heading">' +
      '<h2 id="sh-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group"><label for="sh-bg">배경</label><input type="color" id="sh-bg" value="#0b1220" /></div>' +
      '<div class="control-group"><label for="sh-card">카드</label><input type="color" id="sh-card" value="#111827" /></div>' +
      '<div class="control-group"><label for="sh-radius">라운드 <span class="value" id="out-sh-radius">20px</span></label><input type="range" id="sh-radius" min="0" max="48" value="20" step="1" /></div>' +
      '<div class="sh-layers">' +
      '<div class="sh-layers__head">' +
      '<div class="sh-layers__title">레이어</div>' +
      '<button type="button" class="btn btn--ghost sh-mini" id="sh-add">+ 추가</button>' +
      "</div>" +
      '<div id="sh-layer-list"></div>' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="sh-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="sh-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="sh-preview-heading">' +
      '<h2 id="sh-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="sh-stage" id="sh-stage">' +
      '<div class="sh-card" id="sh-card-preview"><div class="sh-card__txt">Shadow Card</div></div>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="sh-code-heading">' +
      '<h2 id="sh-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="sh-copy">복사</button></div>' +
      '<pre><code id="sh-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="sh-presets-heading">' +
      '<h2 id="sh-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="sh-presets" class="sh-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("shadow-inline-style")) return;
    var style = document.createElement("style");
    style.id = "shadow-inline-style";
    style.textContent =
      ".sh-mini{padding:var(--space-2) var(--space-4)}" +
      ".sh-layers{margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--color-border-subtle)}" +
      ".sh-layers__head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-3)}" +
      ".sh-layers__title{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".sh-layer{border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);padding:var(--space-3);background:var(--color-surface);margin-bottom:var(--space-3)}" +
      ".sh-row{display:grid;grid-template-columns:48px 1fr auto;gap:var(--space-3);align-items:center;margin-bottom:var(--space-3)}" +
      ".sh-row:last-child{margin-bottom:0}" +
      ".sh-row input[type=color]{height:40px;border-radius:var(--radius-md)}" +
      ".sh-meta{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".sh-del{padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".sh-del:hover{background:var(--color-surface-hover);color:var(--color-danger)}" +
      ".sh-stage{position:relative;min-height:300px;display:flex;align-items:center;justify-content:center;padding:var(--space-8);border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid)}" +
      ".sh-card{width:min(100%,360px);min-height:180px;border-radius:24px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}" +
      "html[data-theme=\"light\"] .sh-card{border-color:rgba(15,23,42,.12);background:rgba(255,255,255,.75)}" +
      ".sh-card__txt{font-weight:900;letter-spacing:var(--tracking-tight);color:var(--color-text-primary)}" +
      ".sh-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".sh-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".sh-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".sh-preset__sw{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.16);flex:0 0 auto;background:rgba(255,255,255,.06)}" +
      "html[data-theme=\"light\"] .sh-preset__sw{border-color:rgba(15,23,42,.12);background:rgba(255,255,255,.75)}" +
      ".sh-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".sh-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".sh-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".sh-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
        var shadow = buildShadowCss(st).replace(/\n\s*/g, " ");
        return (
          '<div class="sh-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="sh-preset__sw" style="border-radius:' +
          Math.round(st.radius) +
          "px;box-shadow:" +
          escapeHtml(shadow) +
          ";background:" +
          escapeHtml(st.card) +
          '"></div>' +
          '<div class="sh-preset__body">' +
          '<div class="sh-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="sh-preset__meta">' +
          st.layers.length +
          " layers · r " +
          Math.round(st.radius) +
          "px</div>" +
          "</div>" +
          '<button type="button" class="sh-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.shadow = {
    id: "shadow",
    title: "섀도우 프리셋",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elBg = root.querySelector("#sh-bg");
      var elCard = root.querySelector("#sh-card");
      var elRadius = root.querySelector("#sh-radius");
      var outRadius = root.querySelector("#out-sh-radius");
      var listHost = root.querySelector("#sh-layer-list");

      var stage = root.querySelector("#sh-stage");
      var cardPrev = root.querySelector("#sh-card-preview");
      var cssOut = root.querySelector("#sh-css");
      var presetsHost = root.querySelector("#sh-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function saveState() {
        saveJson(STORAGE_STATE, st);
      }

      function renderLayers() {
        listHost.innerHTML = st.layers
          .map(function (l, idx) {
            l = normalizeLayer(l);
            return (
              '<div class="sh-layer" data-layer-idx="' +
              idx +
              '">' +
              '<div class="sh-row">' +
              '<input type="color" value="' +
              escapeHtml(l.color) +
              '" data-l-color />' +
              '<div><input type="range" min="-60" max="60" value="' +
              Math.round(l.x) +
              '" step="1" data-l-x /><div class="sh-meta">x: <span data-ox>' +
              Math.round(l.x) +
              "px</span></div></div>" +
              (st.layers.length > 1
                ? '<button type="button" class="sh-del" data-l-del aria-label="레이어 삭제">삭제</button>'
                : "<span></span>") +
              "</div>" +
              '<div class="sh-row"><span></span><div><input type="range" min="-60" max="60" value="' +
              Math.round(l.y) +
              '" step="1" data-l-y /><div class="sh-meta">y: <span data-oy>' +
              Math.round(l.y) +
              "px</span></div></div><span></span></div>" +
              '<div class="sh-row"><span></span><div><input type="range" min="0" max="120" value="' +
              Math.round(l.blur) +
              '" step="1" data-l-blur /><div class="sh-meta">blur: <span data-ob>' +
              Math.round(l.blur) +
              "px</span></div></div><span></span></div>" +
              '<div class="sh-row"><span></span><div><input type="range" min="-60" max="60" value="' +
              Math.round(l.spread) +
              '" step="1" data-l-spread /><div class="sh-meta">spread: <span data-os>' +
              Math.round(l.spread) +
              "px</span></div></div><span></span></div>" +
              '<div class="sh-row"><span></span><div><input type="range" min="0" max="100" value="' +
              Math.round(l.opacity) +
              '" step="1" data-l-opacity /><div class="sh-meta">opacity: <span data-oo>' +
              Math.round(l.opacity) +
              "%</span></div></div><span></span></div>" +
              "</div>"
            );
          })
          .join("");
      }

      function renderAll() {
        if (outRadius) outRadius.textContent = Math.round(st.radius) + "px";
        if (elBg) elBg.value = st.bg;
        if (elCard) elCard.value = st.card;
        if (elRadius) elRadius.value = st.radius;

        var shadow = buildShadowCss(st);

        if (stage) stage.style.background = st.bg;
        if (cardPrev) {
          cardPrev.style.background = st.card;
          cardPrev.style.borderRadius = Math.round(st.radius) + "px";
          cardPrev.style.boxShadow = shadow.replace(/\n\s*/g, " ");
        }
        if (cssOut) cssOut.textContent = buildCss(st);
      }

      function applyState(next) {
        st = normalizeState(next);
        saveState();
        renderLayers();
        renderAll();
      }

      function updateLayerFromTarget(target) {
        var row = target.closest("[data-layer-idx]");
        if (!row) return;
        var idx = Number(row.getAttribute("data-layer-idx"));
        if (!st.layers[idx]) return;
        var l = normalizeLayer(st.layers[idx]);

        if (target.matches("[data-l-color]")) l.color = target.value;
        if (target.matches("[data-l-x]")) {
          l.x = clamp(Number(target.value), -60, 60);
          var ox = row.querySelector("[data-ox]");
          if (ox) ox.textContent = Math.round(l.x) + "px";
        }
        if (target.matches("[data-l-y]")) {
          l.y = clamp(Number(target.value), -60, 60);
          var oy = row.querySelector("[data-oy]");
          if (oy) oy.textContent = Math.round(l.y) + "px";
        }
        if (target.matches("[data-l-blur]")) {
          l.blur = clamp(Number(target.value), 0, 120);
          var ob = row.querySelector("[data-ob]");
          if (ob) ob.textContent = Math.round(l.blur) + "px";
        }
        if (target.matches("[data-l-spread]")) {
          l.spread = clamp(Number(target.value), -60, 60);
          var os = row.querySelector("[data-os]");
          if (os) os.textContent = Math.round(l.spread) + "px";
        }
        if (target.matches("[data-l-opacity]")) {
          l.opacity = clamp(Number(target.value), 0, 100);
          var oo = row.querySelector("[data-oo]");
          if (oo) oo.textContent = Math.round(l.opacity) + "%";
        }

        st.layers[idx] = l;
        saveState();
        renderAll();
      }

      elBg.addEventListener(
        "input",
        function () {
          st.bg = elBg.value;
          saveState();
          renderAll();
        },
        { signal: ac.signal }
      );

      elCard.addEventListener(
        "input",
        function () {
          st.card = elCard.value;
          saveState();
          renderAll();
        },
        { signal: ac.signal }
      );

      elRadius.addEventListener(
        "input",
        function () {
          st.radius = clamp(Number(elRadius.value), 0, 48);
          saveState();
          renderAll();
        },
        { signal: ac.signal }
      );

      listHost.addEventListener(
        "input",
        function (e) {
          updateLayerFromTarget(e.target);
        },
        { signal: ac.signal }
      );

      listHost.addEventListener(
        "click",
        function (e) {
          var del = e.target.closest("[data-l-del]");
          if (!del) return;
          var row = e.target.closest("[data-layer-idx]");
          if (!row) return;
          if (st.layers.length <= 1) return;
          var idx = Number(row.getAttribute("data-layer-idx"));
          st.layers.splice(idx, 1);
          applyState(st);
        },
        { signal: ac.signal }
      );

      root.querySelector("#sh-add").addEventListener(
        "click",
        function () {
          if (st.layers.length >= 6) return toast("레이어는 최대 6개까지 추가할 수 있어요.");
          st.layers.push({ x: 0, y: 12, blur: 32, spread: -12, opacity: 18, color: "#000000" });
          applyState(st);
        },
        { signal: ac.signal }
      );

      root.querySelector("#sh-copy").addEventListener(
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

      root.querySelector("#sh-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("섀도우 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#sh-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "sh-" + Date.now(), name: name, state: normalizeState(st) });
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

      applyState(st);
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

