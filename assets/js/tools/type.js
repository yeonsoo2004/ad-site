/* tool: type — typography scale generator */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "type-state";
  var STORAGE_PRESETS = "type-presets";

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

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function defaultState() {
    return {
      mode: "static", // static | fluid
      prefix: "text",
      basePx: 16,
      ratio: 1.2,
      stepsUp: 6,
      stepsDown: 2,
      lineHeightBase: 1.55,
      lineHeightTight: 1.15,
      remBase: 16,
      minVp: 360,
      maxVp: 1200,
      minScale: 0.92,
      maxScale: 1.12,
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    return {
      mode: st.mode === "fluid" ? "fluid" : "static",
      prefix: String(st.prefix || "text").trim() || "text",
      basePx: clamp(Number(st.basePx), 12, 22),
      ratio: clamp(Number(st.ratio), 1.05, 1.6),
      stepsUp: clamp(Number(st.stepsUp), 3, 10),
      stepsDown: clamp(Number(st.stepsDown), 0, 6),
      lineHeightBase: clamp(Number(st.lineHeightBase), 1.2, 2.0),
      lineHeightTight: clamp(Number(st.lineHeightTight), 1.0, 1.4),
      remBase: clamp(Number(st.remBase), 10, 24),
      minVp: clamp(Number(st.minVp), 280, 900),
      maxVp: clamp(Number(st.maxVp), 640, 1920),
      minScale: clamp(Number(st.minScale), 0.75, 1.2),
      maxScale: clamp(Number(st.maxScale), 0.8, 1.4),
    };
  }

  function toRem(px, remBase) {
    return round2(px / remBase) + "rem";
  }

  function tokenName(prefix, step) {
    if (step === 0) return prefix + "-base";
    if (step > 0) return prefix + "-+" + step;
    return prefix + "-" + step;
  }

  function buildScale(st) {
    st = normalizeState(st);
    var out = [];
    for (var d = st.stepsDown; d >= 1; d--) out.push({ step: -d, px: st.basePx / Math.pow(st.ratio, d) });
    out.push({ step: 0, px: st.basePx });
    for (var u = 1; u <= st.stepsUp; u++) out.push({ step: u, px: st.basePx * Math.pow(st.ratio, u) });
    return out.map(function (t) { return { step: t.step, px: round2(t.px) }; });
  }

  function buildFontSizeExpr(st, px) {
    st = normalizeState(st);
    if (st.mode !== "fluid") return toRem(px, st.remBase);
    var denom = Math.max(1, Math.round(st.maxVp - st.minVp));
    var factor =
      "clamp(" +
      round2(st.minScale) +
      ", calc((" +
      round2(st.maxScale) +
      " - " +
      round2(st.minScale) +
      ") * ((100vw - " +
      Math.round(st.minVp) +
      "px) / " +
      denom +
      ") + " +
      round2(st.minScale) +
      "), " +
      round2(st.maxScale) +
      ")";
    return "calc(" + toRem(px, st.remBase) + " * " + factor + ")";
  }

  function pickLineHeight(st, step) {
    st = normalizeState(st);
    return step >= 3 ? st.lineHeightTight : st.lineHeightBase;
  }

  function buildCss(st) {
    st = normalizeState(st);
    var scale = buildScale(st);
    var prefix = st.prefix;

    var vars =
      ":root {\n" +
      "  --" +
      prefix +
      "-lh-base: " +
      round2(st.lineHeightBase) +
      ";\n" +
      "  --" +
      prefix +
      "-lh-tight: " +
      round2(st.lineHeightTight) +
      ";\n" +
      scale
        .map(function (t) {
          var name = tokenName(prefix, t.step);
          return "  --" + name + ": " + buildFontSizeExpr(st, t.px) + ";";
        })
        .join("\n") +
      "\n}\n";

    var classes =
      "\n/* utility classes */\n" +
      scale
        .map(function (t) {
          var name = tokenName(prefix, t.step);
          return "." + name + " { font-size: var(--" + name + "); line-height: " + round2(pickLineHeight(st, t.step)) + "; }";
        })
        .join("\n") +
      "\n";

    return vars + classes;
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="타이포 스케일">' +
      '<header class="page-hero">' +
      "<h1>타이포 스케일</h1>" +
      "<p>모듈러 스케일 기반 폰트 사이즈 토큰(--text-*)과 유틸 클래스를 자동 생성합니다.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="ty-controls-heading">' +
      '<h2 id="ty-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group"><label for="ty-prefix">prefix</label><input type="text" id="ty-prefix" value="text" autocomplete="off" spellcheck="false" /></div>' +
      '<div class="control-group"><label for="ty-mode">모드</label><select id="ty-mode" class="hub-select"><option value="static">Static (rem)</option><option value="fluid">Fluid (calc * clamp)</option></select></div>' +
      '<div class="control-group"><label for="ty-base">base(px) <span class="value" id="out-ty-base">16px</span></label><input type="range" id="ty-base" min="12" max="22" value="16" step="1" /></div>' +
      '<div class="control-group"><label for="ty-ratio">ratio <span class="value" id="out-ty-ratio">1.2</span></label><input type="range" id="ty-ratio" min="1.05" max="1.6" value="1.2" step="0.01" /></div>' +
      '<div class="control-group"><label for="ty-up">위로 steps <span class="value" id="out-ty-up">6</span></label><input type="range" id="ty-up" min="3" max="10" value="6" step="1" /></div>' +
      '<div class="control-group"><label for="ty-down">아래로 steps <span class="value" id="out-ty-down">2</span></label><input type="range" id="ty-down" min="0" max="6" value="2" step="1" /></div>' +
      '<div class="control-group"><label for="ty-lh-base">line-height(base) <span class="value" id="out-ty-lh-base">1.55</span></label><input type="range" id="ty-lh-base" min="1.2" max="2.0" value="1.55" step="0.01" /></div>' +
      '<div class="control-group"><label for="ty-lh-tight">line-height(tight) <span class="value" id="out-ty-lh-tight">1.15</span></label><input type="range" id="ty-lh-tight" min="1.0" max="1.4" value="1.15" step="0.01" /></div>' +
      '<div class="control-group"><label for="ty-rem-base">1rem 기준(px) <span class="value" id="out-ty-rem-base">16px</span></label><input type="range" id="ty-rem-base" min="10" max="24" value="16" step="1" /></div>' +
      '<div class="ty-fluid" data-ty-only="fluid">' +
      '<div class="ty-fluid__title">Fluid 설정</div>' +
      '<div class="control-group"><label for="ty-min-vp">min viewport <span class="value" id="out-ty-min-vp">360px</span></label><input type="range" id="ty-min-vp" min="280" max="900" value="360" step="10" /></div>' +
      '<div class="control-group"><label for="ty-max-vp">max viewport <span class="value" id="out-ty-max-vp">1200px</span></label><input type="range" id="ty-max-vp" min="640" max="1920" value="1200" step="10" /></div>' +
      '<div class="control-group"><label for="ty-min-scale">min scale <span class="value" id="out-ty-min-scale">0.92</span></label><input type="range" id="ty-min-scale" min="0.75" max="1.2" value="0.92" step="0.01" /></div>' +
      '<div class="control-group"><label for="ty-max-scale">max scale <span class="value" id="out-ty-max-scale">1.12</span></label><input type="range" id="ty-max-scale" min="0.8" max="1.4" value="1.12" step="0.01" /></div>' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="ty-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="ty-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="ty-preview-heading"><h2 id="ty-preview-heading" class="generator__panel-title">미리보기</h2><div class="ty-preview" id="ty-preview"></div></section>' +
      '<section class="generator__panel" aria-labelledby="ty-code-heading"><h2 id="ty-code-heading" class="generator__panel-title">생성된 CSS</h2><div class="code-block"><div class="code-block__actions"><button type="button" class="btn btn--primary" id="ty-copy">복사</button></div><pre><code id="ty-css"></code></pre></div></section>' +
      '<section class="generator__panel" aria-labelledby="ty-presets-heading"><h2 id="ty-presets-heading" class="generator__panel-title">내 프리셋</h2><div id="ty-presets" class="ty-presets"></div></section>' +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("type-inline-style")) return;
    var style = document.createElement("style");
    style.id = "type-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".ty-fluid{margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--color-border-subtle)}" +
      ".ty-fluid__title{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary);margin-bottom:var(--space-3)}" +
      ".ty-preview{display:flex;flex-direction:column;gap:var(--space-4)}" +
      ".ty-row{border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);background:var(--color-surface);padding:var(--space-5)}" +
      ".ty-k{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".ty-sample{margin-top:10px;color:var(--color-text-primary);font-weight:800;letter-spacing:var(--tracking-tight)}" +
      ".ty-meta{margin-top:6px;font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".ty-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".ty-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".ty-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".ty-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".ty-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".ty-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".ty-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
          '<div class="ty-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="ty-preset__body">' +
          '<div class="ty-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="ty-preset__meta">' +
          escapeHtml(st.mode) +
          " · base " +
          Math.round(st.basePx) +
          "px · ratio " +
          round2(st.ratio) +
          "</div>" +
          "</div>" +
          '<button type="button" class="ty-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.type = {
    id: "type",
    title: "타이포 스케일",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elPrefix = root.querySelector("#ty-prefix");
      var elMode = root.querySelector("#ty-mode");
      var elBase = root.querySelector("#ty-base");
      var elRatio = root.querySelector("#ty-ratio");
      var elUp = root.querySelector("#ty-up");
      var elDown = root.querySelector("#ty-down");
      var elLhBase = root.querySelector("#ty-lh-base");
      var elLhTight = root.querySelector("#ty-lh-tight");
      var elRemBase = root.querySelector("#ty-rem-base");
      var elMinVp = root.querySelector("#ty-min-vp");
      var elMaxVp = root.querySelector("#ty-max-vp");
      var elMinScale = root.querySelector("#ty-min-scale");
      var elMaxScale = root.querySelector("#ty-max-scale");

      var outBase = root.querySelector("#out-ty-base");
      var outRatio = root.querySelector("#out-ty-ratio");
      var outUp = root.querySelector("#out-ty-up");
      var outDown = root.querySelector("#out-ty-down");
      var outLhBase = root.querySelector("#out-ty-lh-base");
      var outLhTight = root.querySelector("#out-ty-lh-tight");
      var outRemBase = root.querySelector("#out-ty-rem-base");
      var outMinVp = root.querySelector("#out-ty-min-vp");
      var outMaxVp = root.querySelector("#out-ty-max-vp");
      var outMinScale = root.querySelector("#out-ty-min-scale");
      var outMaxScale = root.querySelector("#out-ty-max-scale");

      var cssOut = root.querySelector("#ty-css");
      var preview = root.querySelector("#ty-preview");
      var presetsHost = root.querySelector("#ty-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function setModeVisibility() {
        var mode = elMode.value;
        root.querySelectorAll("[data-ty-only]").forEach(function (el) {
          el.style.display = el.getAttribute("data-ty-only") === mode ? "" : "none";
        });
      }

      function syncControls() {
        elPrefix.value = st.prefix;
        elMode.value = st.mode;
        elBase.value = st.basePx;
        elRatio.value = st.ratio;
        elUp.value = st.stepsUp;
        elDown.value = st.stepsDown;
        elLhBase.value = st.lineHeightBase;
        elLhTight.value = st.lineHeightTight;
        elRemBase.value = st.remBase;
        elMinVp.value = st.minVp;
        elMaxVp.value = st.maxVp;
        elMinScale.value = st.minScale;
        elMaxScale.value = st.maxScale;
        setModeVisibility();
      }

      function readControls() {
        st = normalizeState({
          prefix: elPrefix.value,
          mode: elMode.value,
          basePx: Number(elBase.value),
          ratio: Number(elRatio.value),
          stepsUp: Number(elUp.value),
          stepsDown: Number(elDown.value),
          lineHeightBase: Number(elLhBase.value),
          lineHeightTight: Number(elLhTight.value),
          remBase: Number(elRemBase.value),
          minVp: Number(elMinVp.value),
          maxVp: Number(elMaxVp.value),
          minScale: Number(elMinScale.value),
          maxScale: Number(elMaxScale.value),
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderPreview() {
        var scale = buildScale(st);
        var show = scale.slice(Math.max(0, scale.length - 9));
        preview.innerHTML = show
          .map(function (t) {
            var name = tokenName(st.prefix, t.step);
            var size = buildFontSizeExpr(st, t.px);
            var lh = pickLineHeight(st, t.step);
            return (
              '<div class="ty-row">' +
              '<div class="ty-k">--' +
              escapeHtml(name) +
              "</div>" +
              '<div class="ty-sample" style="font-size:' +
              escapeHtml(size) +
              ";line-height:" +
              round2(lh) +
              '">타이포 스케일 Sample</div>' +
              '<div class="ty-meta">' +
              escapeHtml(round2(t.px) + "px") +
              " · " +
              escapeHtml(size) +
              " · lh " +
              round2(lh) +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      }

      function renderAll() {
        if (outBase) outBase.textContent = Math.round(st.basePx) + "px";
        if (outRatio) outRatio.textContent = String(round2(st.ratio));
        if (outUp) outUp.textContent = String(Math.round(st.stepsUp));
        if (outDown) outDown.textContent = String(Math.round(st.stepsDown));
        if (outLhBase) outLhBase.textContent = String(round2(st.lineHeightBase));
        if (outLhTight) outLhTight.textContent = String(round2(st.lineHeightTight));
        if (outRemBase) outRemBase.textContent = Math.round(st.remBase) + "px";
        if (outMinVp) outMinVp.textContent = Math.round(st.minVp) + "px";
        if (outMaxVp) outMaxVp.textContent = Math.round(st.maxVp) + "px";
        if (outMinScale) outMinScale.textContent = String(round2(st.minScale));
        if (outMaxScale) outMaxScale.textContent = String(round2(st.maxScale));
        if (cssOut) cssOut.textContent = buildCss(st);
        renderPreview();
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

      [
        elPrefix,
        elMode,
        elBase,
        elRatio,
        elUp,
        elDown,
        elLhBase,
        elLhTight,
        elRemBase,
        elMinVp,
        elMaxVp,
        elMinScale,
        elMaxScale,
      ].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#ty-copy").addEventListener(
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

      root.querySelector("#ty-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("타이포 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#ty-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "t-" + Date.now(), name: name, state: normalizeState(st) });
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

