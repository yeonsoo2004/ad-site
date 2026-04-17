/* tool: palette — palette generator (tints/shades) */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "palette-state";
  var STORAGE_PRESETS = "palette-presets";

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

  function rgbToHex(c) {
    function to2(x) {
      return clamp(Math.round(x), 0, 255).toString(16).padStart(2, "0");
    }
    return "#" + to2(c.r) + to2(c.g) + to2(c.b);
  }

  function mixRgb(a, b, t) {
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
    };
  }

  function luminance(c) {
    function srgbToLin(u) {
      u /= 255;
      return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
    }
    var r = srgbToLin(c.r);
    var g = srgbToLin(c.g);
    var b = srgbToLin(c.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(hexA, hexB) {
    var a = hexToRgb(hexA);
    var b = hexToRgb(hexB);
    var L1 = luminance(a);
    var L2 = luminance(b);
    var hi = Math.max(L1, L2);
    var lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function defaultState() {
    return {
      base: "#6366f1",
      steps: 10, // e.g. 50..900
      include50: true,
      prefix: "primary",
      bgForText: "#0b1220",
      mode: "mix", // mix
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    return {
      base: typeof st.base === "string" ? st.base : "#6366f1",
      steps: clamp(Number(st.steps), 6, 12),
      include50: !!st.include50,
      prefix: String(st.prefix || "primary").trim() || "primary",
      bgForText: typeof st.bgForText === "string" ? st.bgForText : "#0b1220",
      mode: "mix",
    };
  }

  function buildScaleKeys(st) {
    st = normalizeState(st);
    // Tailwind-ish keys
    var keys = st.steps === 10 ? [100,200,300,400,500,600,700,800,900] : null;
    if (!keys) {
      // distribute 100..900
      keys = [];
      var count = st.steps;
      for (var i = 0; i < count; i++) keys.push(100 + Math.round((800 * i) / Math.max(1, count - 1)));
    }
    if (st.include50) keys = [50].concat(keys);
    // ensure unique + sorted
    keys = Array.from(new Set(keys)).sort(function (a, b) { return a - b; });
    return keys;
  }

  function buildPalette(st) {
    st = normalizeState(st);
    var base = hexToRgb(st.base);
    var white = { r: 255, g: 255, b: 255 };
    var black = { r: 0, g: 0, b: 0 };
    var keys = buildScaleKeys(st);

    // map keys so that 500 is base; <500 mixes toward white, >500 mixes toward black
    return keys.map(function (k) {
      var t;
      var rgb;
      if (k === 500) {
        rgb = base;
      } else if (k < 500) {
        // 50..400 => toward white
        // normalized t: 0 at 500, 1 at 50
        t = clamp((500 - k) / 450, 0, 1);
        rgb = mixRgb(base, white, 0.12 + 0.68 * t);
      } else {
        // 600..900 => toward black
        t = clamp((k - 500) / 400, 0, 1);
        rgb = mixRgb(base, black, 0.10 + 0.70 * t);
      }
      var hex = rgbToHex(rgb);
      return { key: k, hex: hex };
    });
  }

  function buildCss(st) {
    st = normalizeState(st);
    var prefix = st.prefix;
    var pal = buildPalette(st);
    var lines = pal
      .map(function (p) {
        return "  --" + prefix + "-" + p.key + ": " + p.hex + ";";
      })
      .join("\n");
    return ":root {\n" + lines + "\n}\n";
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="팔레트 생성기">' +
      '<header class="page-hero">' +
      "<h1>팔레트 생성기</h1>" +
      "<p>기준 색상으로 50~900 스케일을 만들고, CSS 변수로 복사하거나 프리셋으로 저장하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="pal-controls-heading">' +
      '<h2 id="pal-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group"><label for="pal-base">기준 색상</label><input type="color" id="pal-base" value="#6366f1" /></div>' +
      '<div class="control-group"><label for="pal-prefix">변수 prefix</label><input type="text" id="pal-prefix" value="primary" autocomplete="off" spellcheck="false" /></div>' +
      '<div class="control-group"><label for="pal-steps">스텝 수 <span class="value" id="out-pal-steps">10</span></label><input type="range" id="pal-steps" min="6" max="12" value="10" step="1" /></div>' +
      '<div class="control-group"><label for="pal-50">50 포함</label><label class="pal-check"><input type="checkbox" id="pal-50" /> 50 스텝 포함</label></div>' +
      '<div class="control-group"><label for="pal-bg">대비 확인 배경</label><input type="color" id="pal-bg" value="#0b1220" /></div>' +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="pal-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="pal-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="pal-preview-heading">' +
      '<h2 id="pal-preview-heading" class="generator__panel-title">팔레트</h2>' +
      '<div class="pal-grid" id="pal-grid"></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="pal-code-heading">' +
      '<h2 id="pal-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="pal-copy">복사</button></div>' +
      '<pre><code id="pal-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="pal-presets-heading">' +
      '<h2 id="pal-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="pal-presets" class="pal-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("palette-inline-style")) return;
    var style = document.createElement("style");
    style.id = "palette-inline-style";
    style.textContent =
      ".pal-check{display:flex;align-items:center;gap:10px;margin-top:6px;color:var(--color-text-secondary);font-size:var(--text-sm)}" +
      ".pal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-3)}" +
      "@media(min-width:640px){.pal-grid{grid-template-columns:repeat(3,1fr)}}@media(min-width:1024px){.pal-grid{grid-template-columns:repeat(4,1fr)}}" +
      ".pal-swatch{border-radius:var(--radius-lg);border:1px solid rgba(255,255,255,.16);overflow:hidden;background:var(--color-surface)}" +
      "html[data-theme=\"light\"] .pal-swatch{border-color:rgba(15,23,42,.12)}" +
      ".pal-swatch__top{height:76px}" +
      ".pal-swatch__body{padding:var(--space-3);display:flex;align-items:center;justify-content:space-between;gap:var(--space-3)}" +
      ".pal-k{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".pal-v{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-secondary)}" +
      ".pal-cta{padding:6px 10px;border-radius:999px;border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary);font-size:var(--text-xs);font-weight:800}" +
      ".pal-cta:hover{background:var(--color-surface-hover);color:var(--color-text-primary)}" +
      ".pal-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".pal-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".pal-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".pal-preset__swatch{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.16);flex:0 0 auto}" +
      "html[data-theme=\"light\"] .pal-preset__swatch{border-color:rgba(15,23,42,.12)}" +
      ".pal-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".pal-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".pal-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".pal-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
        return (
          '<div class="pal-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="pal-preset__swatch" style="background:' +
          escapeHtml(st.base) +
          '"></div>' +
          '<div class="pal-preset__body">' +
          '<div class="pal-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="pal-preset__meta">--' +
          escapeHtml(st.prefix) +
          "-50..900</div>" +
          "</div>" +
          '<button type="button" class="pal-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.palette = {
    id: "palette",
    title: "팔레트 생성기",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elBase = root.querySelector("#pal-base");
      var elPrefix = root.querySelector("#pal-prefix");
      var elSteps = root.querySelector("#pal-steps");
      var el50 = root.querySelector("#pal-50");
      var elBg = root.querySelector("#pal-bg");

      var outSteps = root.querySelector("#out-pal-steps");
      var grid = root.querySelector("#pal-grid");
      var cssOut = root.querySelector("#pal-css");
      var presetsHost = root.querySelector("#pal-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function syncControls() {
        elBase.value = st.base;
        elPrefix.value = st.prefix;
        elSteps.value = st.steps;
        el50.checked = st.include50;
        elBg.value = st.bgForText;
      }

      function readControls() {
        st = normalizeState({
          base: elBase.value,
          prefix: elPrefix.value,
          steps: Number(elSteps.value),
          include50: !!el50.checked,
          bgForText: elBg.value,
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderGrid() {
        var pal = buildPalette(st);
        grid.innerHTML = pal
          .map(function (p) {
            var cr = contrastRatio(p.hex, st.bgForText);
            var ok = cr >= 4.5;
            var badge = ok ? "AA" : cr >= 3 ? "AA Large" : "Low";
            return (
              '<div class="pal-swatch" data-hex="' +
              escapeHtml(p.hex) +
              '">' +
              '<div class="pal-swatch__top" style="background:' +
              escapeHtml(p.hex) +
              '"></div>' +
              '<div class="pal-swatch__body">' +
              '<div>' +
              '<div class="pal-k">' +
              escapeHtml(String(p.key)) +
              "</div>" +
              '<div class="pal-v">' +
              escapeHtml(p.hex) +
              " · " +
              escapeHtml(badge) +
              " (" +
              round2(cr) +
              ")</div>" +
              "</div>" +
              '<button type="button" class="pal-cta" data-copy="' +
              escapeHtml(p.hex) +
              '">복사</button>' +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      }

      function renderAll() {
        if (outSteps) outSteps.textContent = String(Math.round(st.steps));
        if (cssOut) cssOut.textContent = buildCss(st);
        renderGrid();
      }

      function applyState(next) {
        st = normalizeState(next);
        saveJson(STORAGE_STATE, st);
        syncControls();
        renderAll();
      }

      function onChange() {
        readControls();
        renderAll();
      }

      [elBase, elPrefix, elSteps, el50, elBg].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      grid.addEventListener(
        "click",
        function (e) {
          var btn = e.target.closest("[data-copy]");
          if (!btn) return;
          var hex = btn.getAttribute("data-copy");
          var copy = Hub.copyText ? Hub.copyText(hex) : Promise.reject(new Error("no copy"));
          copy.then(function () {
            toast("색상 값을 복사했습니다");
          }).catch(function () {
            toast("복사에 실패했습니다.");
          });
        },
        { signal: ac.signal }
      );

      root.querySelector("#pal-copy").addEventListener(
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

      root.querySelector("#pal-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("팔레트를 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#pal-save").addEventListener(
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

