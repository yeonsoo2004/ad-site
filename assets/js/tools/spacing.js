/* tool: spacing — spacing scale generator */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "spacing-state";
  var STORAGE_PRESETS = "spacing-presets";

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
      base: 4, // px
      steps: 12, // number of tokens
      naming: "number", // number | rem
      remBase: 16, // px per 1rem
      generateUtilities: true,
      prefix: "space",
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    return {
      base: clamp(Number(st.base), 2, 16),
      steps: clamp(Number(st.steps), 6, 24),
      naming: st.naming === "rem" ? "rem" : "number",
      remBase: clamp(Number(st.remBase), 10, 24),
      generateUtilities: !!st.generateUtilities,
      prefix: String(st.prefix || "space").trim() || "space",
    };
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function toRem(px, remBase) {
    return round2(px / remBase) + "rem";
  }

  function buildTokens(st) {
    st = normalizeState(st);
    var tokens = [];
    for (var i = 0; i <= st.steps; i++) {
      var px = i * st.base;
      var key;
      if (st.naming === "rem") key = toRem(px, st.remBase);
      else key = String(i);
      tokens.push({ i: i, key: key, px: px });
    }
    return tokens;
  }

  function buildCss(st) {
    st = normalizeState(st);
    var tokens = buildTokens(st);
    var prefix = st.prefix;

    var vars =
      ":root {\n" +
      tokens
        .map(function (t) {
          return "  --" + prefix + "-" + t.i + ": " + t.px + "px;";
        })
        .join("\n") +
      "\n}\n";

    if (!st.generateUtilities) return vars;

    // Minimal utility set: p/m/gap with axis variants.
    var utilHeader = "\n/* utilities */\n";
    var utils = tokens
      .map(function (t) {
        var v = "var(--" + prefix + "-" + t.i + ")";
        return (
          ".p-" +
          t.i +
          "{padding:" +
          v +
          "}\n" +
          ".px-" +
          t.i +
          "{padding-left:" +
          v +
          ";padding-right:" +
          v +
          "}\n" +
          ".py-" +
          t.i +
          "{padding-top:" +
          v +
          ";padding-bottom:" +
          v +
          "}\n" +
          ".m-" +
          t.i +
          "{margin:" +
          v +
          "}\n" +
          ".mx-" +
          t.i +
          "{margin-left:" +
          v +
          ";margin-right:" +
          v +
          "}\n" +
          ".my-" +
          t.i +
          "{margin-top:" +
          v +
          ";margin-bottom:" +
          v +
          "}\n" +
          ".gap-" +
          t.i +
          "{gap:" +
          v +
          "}\n"
        );
      })
      .join("\n");

    return vars + utilHeader + utils;
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="스페이싱 스케일">' +
      '<header class="page-hero">' +
      "<h1>스페이싱 스케일</h1>" +
      "<p>스페이싱 토큰(--space-*)과 간단한 유틸 클래스(p-/m-/gap-)를 자동 생성합니다.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="sp-controls-heading">' +
      '<h2 id="sp-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="sp-prefix">CSS 변수 prefix</label>' +
      '<input type="text" id="sp-prefix" value="space" autocomplete="off" spellcheck="false" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="sp-base">base(px) <span class="value" id="out-sp-base">4px</span></label>' +
      '<input type="range" id="sp-base" min="2" max="16" value="4" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="sp-steps">steps <span class="value" id="out-sp-steps">12</span></label>' +
      '<input type="range" id="sp-steps" min="6" max="24" value="12" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="sp-naming">라벨 방식</label>' +
      '<select id="sp-naming" class="hub-select">' +
      '<option value="number">숫자(0..n)</option>' +
      '<option value="rem">참고값(rem 표시)</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group" data-sp-only="rem">' +
      '<label for="sp-rem-base">1rem 기준(px) <span class="value" id="out-sp-rem-base">16px</span></label>' +
      '<input type="range" id="sp-rem-base" min="10" max="24" value="16" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="sp-utils">유틸 클래스</label>' +
      '<label class="sp-check"><input type="checkbox" id="sp-utils" /> p-/m-/gap- 생성</label>' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="sp-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="sp-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="sp-preview-heading">' +
      '<h2 id="sp-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="sp-preview" id="sp-preview"></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="sp-code-heading">' +
      '<h2 id="sp-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="sp-copy">복사</button></div>' +
      '<pre><code id="sp-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="sp-presets-heading">' +
      '<h2 id="sp-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="sp-presets" class="sp-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("spacing-inline-style")) return;
    var style = document.createElement("style");
    style.id = "spacing-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".sp-check{display:flex;align-items:center;gap:10px;margin-top:6px;color:var(--color-text-secondary);font-size:var(--text-sm)}" +
      ".sp-preview{display:grid;grid-template-columns:1fr;gap:var(--space-4)}" +
      ".sp-row{display:flex;align-items:center;gap:var(--space-4);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface)}" +
      ".sp-chip{min-width:52px;padding:6px 10px;border-radius:999px;border:1px solid var(--color-border-subtle);background:var(--color-bg-mid);font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-secondary);text-align:center}" +
      ".sp-bar{height:10px;border-radius:999px;background:linear-gradient(90deg, var(--color-accent-soft), var(--color-accent));opacity:.9}" +
      ".sp-meta{margin-left:auto;font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".sp-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".sp-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".sp-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".sp-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".sp-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".sp-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".sp-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
          '<div class="sp-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="sp-preset__body">' +
          '<div class="sp-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="sp-preset__meta">base ' +
          Math.round(st.base) +
          "px · steps " +
          Math.round(st.steps) +
          " · prefix --" +
          escapeHtml(st.prefix) +
          "-*</div>" +
          "</div>" +
          '<button type="button" class="sp-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.spacing = {
    id: "spacing",
    title: "스페이싱 스케일",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elPrefix = root.querySelector("#sp-prefix");
      var elBase = root.querySelector("#sp-base");
      var elSteps = root.querySelector("#sp-steps");
      var elNaming = root.querySelector("#sp-naming");
      var elRemBase = root.querySelector("#sp-rem-base");
      var elUtils = root.querySelector("#sp-utils");

      var outBase = root.querySelector("#out-sp-base");
      var outSteps = root.querySelector("#out-sp-steps");
      var outRemBase = root.querySelector("#out-sp-rem-base");

      var preview = root.querySelector("#sp-preview");
      var cssOut = root.querySelector("#sp-css");
      var presetsHost = root.querySelector("#sp-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function setModeVisibility() {
        var mode = elNaming.value;
        root.querySelectorAll("[data-sp-only]").forEach(function (el) {
          el.style.display = el.getAttribute("data-sp-only") === mode ? "" : "none";
        });
      }

      function syncControls() {
        elPrefix.value = st.prefix;
        elBase.value = st.base;
        elSteps.value = st.steps;
        elNaming.value = st.naming;
        elRemBase.value = st.remBase;
        elUtils.checked = st.generateUtilities;
        setModeVisibility();
      }

      function readControls() {
        st = normalizeState({
          prefix: elPrefix.value,
          base: Number(elBase.value),
          steps: Number(elSteps.value),
          naming: elNaming.value,
          remBase: Number(elRemBase.value),
          generateUtilities: !!elUtils.checked,
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderPreview() {
        if (!preview) return;
        var tokens = buildTokens(st);
        var show = tokens.slice(0, Math.min(tokens.length, 13)); // keep compact
        preview.innerHTML = show
          .map(function (t) {
            var w = clamp(t.px * 6, 12, 360);
            var label = st.naming === "rem" ? t.key : st.prefix + "-" + t.i;
            var meta = t.px + "px" + (st.naming === "rem" ? " (" + t.key + ")" : "");
            return (
              '<div class="sp-row">' +
              '<div class="sp-chip">' +
              escapeHtml(String(t.i)) +
              "</div>" +
              '<div class="sp-bar" style="width:' +
              w +
              'px"></div>' +
              '<div class="sp-meta">' +
              escapeHtml(label) +
              " · " +
              escapeHtml(meta) +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      }

      function renderAll() {
        if (outBase) outBase.textContent = Math.round(st.base) + "px";
        if (outSteps) outSteps.textContent = String(Math.round(st.steps));
        if (outRemBase) outRemBase.textContent = Math.round(st.remBase) + "px";
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

      [elPrefix, elBase, elSteps, elNaming, elRemBase, elUtils].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#sp-copy").addEventListener(
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

      root.querySelector("#sp-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("스페이싱 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#sp-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "s-" + Date.now(), name: name, state: normalizeState(st) });
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

