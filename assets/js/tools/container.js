/* tool: container — responsive container calculator */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "container-state";
  var STORAGE_PRESETS = "container-presets";

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

  function defaultState() {
    return {
      mode: "breakpoints", // breakpoints | clamp
      maxBase: 1100,
      gutter: 20,
      gutterMax: 32, // clamp mode only
      clampMinVp: 360, // px
      clampMaxVp: 1200, // px
      clampMinGutter: 16, // px
      clampMaxGutter: 32, // px
      // breakpoints
      bpSm: 640,
      bpMd: 768,
      bpLg: 1024,
      bpXl: 1280,
      maxSm: 640,
      maxMd: 720,
      maxLg: 960,
      maxXl: 1100,
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    var mode = st.mode === "clamp" ? "clamp" : "breakpoints";
    return {
      mode: mode,
      maxBase: clamp(Number(st.maxBase), 480, 1600),
      gutter: clamp(Number(st.gutter), 0, 64),
      gutterMax: clamp(Number(st.gutterMax), 0, 96),
      clampMinVp: clamp(Number(st.clampMinVp), 280, 900),
      clampMaxVp: clamp(Number(st.clampMaxVp), 640, 1920),
      clampMinGutter: clamp(Number(st.clampMinGutter), 0, 64),
      clampMaxGutter: clamp(Number(st.clampMaxGutter), 0, 96),
      bpSm: clamp(Number(st.bpSm), 360, 900),
      bpMd: clamp(Number(st.bpMd), 600, 1100),
      bpLg: clamp(Number(st.bpLg), 800, 1400),
      bpXl: clamp(Number(st.bpXl), 1024, 1920),
      maxSm: clamp(Number(st.maxSm), 360, 1200),
      maxMd: clamp(Number(st.maxMd), 360, 1400),
      maxLg: clamp(Number(st.maxLg), 360, 1600),
      maxXl: clamp(Number(st.maxXl), 360, 1800),
    };
  }

  function buildCss(st) {
    st = normalizeState(st);

    if (st.mode === "clamp") {
      var gutter =
        "clamp(" +
        Math.round(st.clampMinGutter) +
        "px, calc((" +
        Math.round(st.clampMaxGutter) +
        " - " +
        Math.round(st.clampMinGutter) +
        ") * ((100vw - " +
        Math.round(st.clampMinVp) +
        "px) / (" +
        Math.max(1, Math.round(st.clampMaxVp - st.clampMinVp)) +
        ")) + " +
        Math.round(st.clampMinGutter) +
        "px), " +
        Math.round(st.clampMaxGutter) +
        "px)";

      return (
        ".container {\n" +
        "  width: 100%;\n" +
        "  max-width: " +
        Math.round(st.maxBase) +
        "px;\n" +
        "  margin-inline: auto;\n" +
        "  padding-inline: " +
        gutter +
        ";\n" +
        "}\n"
      );
    }

    // breakpoints
    var css =
      ".container {\n" +
      "  width: 100%;\n" +
      "  margin-inline: auto;\n" +
      "  padding-inline: " +
      Math.round(st.gutter) +
      "px;\n" +
      "}\n\n";

    css +=
      "@media (min-width: " +
      Math.round(st.bpSm) +
      "px) {\n" +
      "  .container { max-width: " +
      Math.round(st.maxSm) +
      "px; }\n" +
      "}\n";
    css +=
      "@media (min-width: " +
      Math.round(st.bpMd) +
      "px) {\n" +
      "  .container { max-width: " +
      Math.round(st.maxMd) +
      "px; }\n" +
      "}\n";
    css +=
      "@media (min-width: " +
      Math.round(st.bpLg) +
      "px) {\n" +
      "  .container { max-width: " +
      Math.round(st.maxLg) +
      "px; }\n" +
      "}\n";
    css +=
      "@media (min-width: " +
      Math.round(st.bpXl) +
      "px) {\n" +
      "  .container { max-width: " +
      Math.round(st.maxXl) +
      "px; }\n" +
      "}\n";

    return css;
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="컨테이너 계산기">' +
      '<header class="page-hero">' +
      "<h1>컨테이너 계산기</h1>" +
      "<p>반응형 container(max-width + padding)을 breakpoints 방식 또는 clamp 방식으로 생성합니다.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="ct-controls-heading">' +
      '<h2 id="ct-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="ct-mode">모드</label>' +
      '<select id="ct-mode" class="hub-select">' +
      '<option value="breakpoints">Breakpoints (media queries)</option>' +
      '<option value="clamp">Fluid padding (clamp)</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group">' +
      '<label for="ct-max-base">기본 max-width <span class="value" id="out-ct-max-base">1100px</span></label>' +
      '<input type="range" id="ct-max-base" min="480" max="1600" value="1100" step="10" />' +
      "</div>" +
      '<div class="control-group" data-ct-only="breakpoints">' +
      '<label for="ct-gutter">padding-inline <span class="value" id="out-ct-gutter">20px</span></label>' +
      '<input type="range" id="ct-gutter" min="0" max="64" value="20" step="1" />' +
      "</div>" +
      '<div class="control-group" data-ct-only="clamp">' +
      '<label for="ct-min-gutter">min padding <span class="value" id="out-ct-min-gutter">16px</span></label>' +
      '<input type="range" id="ct-min-gutter" min="0" max="64" value="16" step="1" />' +
      "</div>" +
      '<div class="control-group" data-ct-only="clamp">' +
      '<label for="ct-max-gutter">max padding <span class="value" id="out-ct-max-gutter">32px</span></label>' +
      '<input type="range" id="ct-max-gutter" min="0" max="96" value="32" step="1" />' +
      "</div>" +
      '<div class="control-group" data-ct-only="clamp">' +
      '<label for="ct-min-vp">min viewport <span class="value" id="out-ct-min-vp">360px</span></label>' +
      '<input type="range" id="ct-min-vp" min="280" max="900" value="360" step="10" />' +
      "</div>" +
      '<div class="control-group" data-ct-only="clamp">' +
      '<label for="ct-max-vp">max viewport <span class="value" id="out-ct-max-vp">1200px</span></label>' +
      '<input type="range" id="ct-max-vp" min="640" max="1920" value="1200" step="10" />' +
      "</div>" +
      '<div class="ct-bps" data-ct-only="breakpoints">' +
      '<div class="ct-bps__title">Breakpoints</div>' +
      '<div class="ct-bp-grid">' +
      bpRow("sm", "ct-bp-sm", "ct-max-sm", 640, 640) +
      bpRow("md", "ct-bp-md", "ct-max-md", 768, 720) +
      bpRow("lg", "ct-bp-lg", "ct-max-lg", 1024, 960) +
      bpRow("xl", "ct-bp-xl", "ct-max-xl", 1280, 1100) +
      "</div>" +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="ct-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="ct-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="ct-preview-heading">' +
      '<h2 id="ct-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="ct-stage" id="ct-stage">' +
      '<div class="ct-frame">' +
      '<div class="ct-container" id="ct-preview">' +
      '<div class="ct-inner">' +
      '<div class="ct-kicker">Container</div>' +
      '<div class="ct-title">max-width + padding-inline</div>' +
      '<div class="ct-sub">가로 폭을 줄이거나 브라우저 크기를 조절해 보세요.</div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="ct-code-heading">' +
      '<h2 id="ct-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="ct-copy">복사</button></div>' +
      '<pre><code id="ct-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="ct-presets-heading">' +
      '<h2 id="ct-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="ct-presets" class="ct-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function bpRow(label, bpId, maxId, bpDefault, maxDefault) {
    return (
      '<div class="ct-bp">' +
      '<div class="ct-bp__tag">' +
      label.toUpperCase() +
      "</div>" +
      '<label class="ct-bp__label" for="' +
      bpId +
      '">min-width</label>' +
      '<input type="number" class="ct-bp__input" id="' +
      bpId +
      '" min="320" max="1920" step="1" value="' +
      bpDefault +
      '" />' +
      '<label class="ct-bp__label" for="' +
      maxId +
      '">max-width</label>' +
      '<input type="number" class="ct-bp__input" id="' +
      maxId +
      '" min="320" max="1920" step="1" value="' +
      maxDefault +
      '" />' +
      "</div>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("container-inline-style")) return;
    var style = document.createElement("style");
    style.id = "container-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".ct-bps{margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--color-border-subtle)}" +
      ".ct-bps__title{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary);margin-bottom:var(--space-3)}" +
      ".ct-bp-grid{display:flex;flex-direction:column;gap:var(--space-3)}" +
      ".ct-bp{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center;padding:var(--space-3);border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);background:var(--color-surface)}" +
      ".ct-bp__tag{grid-column:1/2;grid-row:1/span 4;align-self:stretch;display:flex;align-items:center;justify-content:center;border-radius:14px;border:1px solid var(--color-border-subtle);background:var(--color-bg-mid);font-weight:900;color:var(--color-text-primary);letter-spacing:.06em}" +
      ".ct-bp__label{font-size:var(--text-xs);font-weight:800;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.08em}" +
      ".ct-bp__input{width:100%;padding:10px 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".ct-stage{border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid);padding:var(--space-5)}" +
      ".ct-frame{border-radius:24px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);padding:18px}" +
      "html[data-theme=\"light\"] .ct-frame{border-color:rgba(15,23,42,.12);background:rgba(255,255,255,.6)}" +
      ".ct-container{margin-inline:auto;border-radius:20px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.18);overflow:hidden}" +
      "html[data-theme=\"light\"] .ct-container{border-color:rgba(15,23,42,.12);background:rgba(15,23,42,.04)}" +
      ".ct-inner{padding:22px;display:flex;flex-direction:column;gap:8px}" +
      ".ct-kicker{font-size:var(--text-xs);font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:var(--color-text-muted)}" +
      ".ct-title{font-size:var(--text-xl);font-weight:950;letter-spacing:var(--tracking-tight);color:var(--color-text-primary)}" +
      ".ct-sub{font-size:var(--text-sm);color:var(--color-text-secondary)}" +
      ".ct-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".ct-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".ct-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".ct-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".ct-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".ct-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".ct-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
        var meta =
          st.mode === "clamp"
            ? "clamp · max " + Math.round(st.maxBase) + "px"
            : "bps · xl " + Math.round(st.maxXl) + "px";
        return (
          '<div class="ct-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="ct-preset__body">' +
          '<div class="ct-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="ct-preset__meta">' +
          escapeHtml(meta) +
          "</div>" +
          "</div>" +
          '<button type="button" class="ct-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.container = {
    id: "container",
    title: "컨테이너 계산기",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elMode = root.querySelector("#ct-mode");
      var elMaxBase = root.querySelector("#ct-max-base");
      var elGutter = root.querySelector("#ct-gutter");

      var elMinGutter = root.querySelector("#ct-min-gutter");
      var elMaxGutter = root.querySelector("#ct-max-gutter");
      var elMinVp = root.querySelector("#ct-min-vp");
      var elMaxVp = root.querySelector("#ct-max-vp");

      var elBpSm = root.querySelector("#ct-bp-sm");
      var elBpMd = root.querySelector("#ct-bp-md");
      var elBpLg = root.querySelector("#ct-bp-lg");
      var elBpXl = root.querySelector("#ct-bp-xl");
      var elMaxSm = root.querySelector("#ct-max-sm");
      var elMaxMd = root.querySelector("#ct-max-md");
      var elMaxLg = root.querySelector("#ct-max-lg");
      var elMaxXl = root.querySelector("#ct-max-xl");

      var outMaxBase = root.querySelector("#out-ct-max-base");
      var outGutter = root.querySelector("#out-ct-gutter");
      var outMinGutter = root.querySelector("#out-ct-min-gutter");
      var outMaxGutter = root.querySelector("#out-ct-max-gutter");
      var outMinVp = root.querySelector("#out-ct-min-vp");
      var outMaxVp = root.querySelector("#out-ct-max-vp");

      var preview = root.querySelector("#ct-preview");
      var cssOut = root.querySelector("#ct-css");
      var presetsHost = root.querySelector("#ct-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function setModeVisibility() {
        var mode = elMode.value;
        root.querySelectorAll("[data-ct-only]").forEach(function (el) {
          el.style.display = el.getAttribute("data-ct-only") === mode ? "" : "none";
        });
      }

      function syncControls() {
        elMode.value = st.mode;
        elMaxBase.value = st.maxBase;
        elGutter.value = st.gutter;
        elMinGutter.value = st.clampMinGutter;
        elMaxGutter.value = st.clampMaxGutter;
        elMinVp.value = st.clampMinVp;
        elMaxVp.value = st.clampMaxVp;
        elBpSm.value = st.bpSm;
        elBpMd.value = st.bpMd;
        elBpLg.value = st.bpLg;
        elBpXl.value = st.bpXl;
        elMaxSm.value = st.maxSm;
        elMaxMd.value = st.maxMd;
        elMaxLg.value = st.maxLg;
        elMaxXl.value = st.maxXl;
        setModeVisibility();
      }

      function readControls() {
        st = normalizeState({
          mode: elMode.value,
          maxBase: Number(elMaxBase.value),
          gutter: Number(elGutter.value),
          clampMinGutter: Number(elMinGutter.value),
          clampMaxGutter: Number(elMaxGutter.value),
          clampMinVp: Number(elMinVp.value),
          clampMaxVp: Number(elMaxVp.value),
          bpSm: Number(elBpSm.value),
          bpMd: Number(elBpMd.value),
          bpLg: Number(elBpLg.value),
          bpXl: Number(elBpXl.value),
          maxSm: Number(elMaxSm.value),
          maxMd: Number(elMaxMd.value),
          maxLg: Number(elMaxLg.value),
          maxXl: Number(elMaxXl.value),
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderAll() {
        if (outMaxBase) outMaxBase.textContent = Math.round(st.maxBase) + "px";
        if (outGutter) outGutter.textContent = Math.round(st.gutter) + "px";
        if (outMinGutter) outMinGutter.textContent = Math.round(st.clampMinGutter) + "px";
        if (outMaxGutter) outMaxGutter.textContent = Math.round(st.clampMaxGutter) + "px";
        if (outMinVp) outMinVp.textContent = Math.round(st.clampMinVp) + "px";
        if (outMaxVp) outMaxVp.textContent = Math.round(st.clampMaxVp) + "px";

        if (cssOut) cssOut.textContent = buildCss(st);

        if (preview) {
          preview.style.maxWidth = Math.round(st.maxBase) + "px";
          preview.style.paddingLeft = st.mode === "clamp" ? Math.round(st.clampMinGutter) + "px" : Math.round(st.gutter) + "px";
          preview.style.paddingRight = preview.style.paddingLeft;
        }
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
        elMode,
        elMaxBase,
        elGutter,
        elMinGutter,
        elMaxGutter,
        elMinVp,
        elMaxVp,
        elBpSm,
        elBpMd,
        elBpLg,
        elBpXl,
        elMaxSm,
        elMaxMd,
        elMaxLg,
        elMaxXl,
      ].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#ct-copy").addEventListener(
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

      root.querySelector("#ct-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("컨테이너 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#ct-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "c-" + Date.now(), name: name, state: normalizeState(st) });
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

