/* tool: clamp-layout — fluid clamp() for layout properties (padding, gap, max-width, …) */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) {
    return fb;
  };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "clamp-layout-state";
  var STORAGE_PRESETS = "clamp-layout-presets";

  var PROPS = [
    { value: "padding-inline", label: "padding-inline (좌우 패딩)" },
    { value: "padding-block", label: "padding-block (상하 패딩)" },
    { value: "gap", label: "gap (Flex/Grid 간격)" },
    { value: "row-gap", label: "row-gap" },
    { value: "column-gap", label: "column-gap" },
    { value: "margin-block", label: "margin-block (섹션 간격)" },
    { value: "max-width", label: "max-width (유동 최대 너비)" },
  ];

  function clampNum(n, min, max) {
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
      property: "padding-inline",
      minPx: 16,
      maxPx: 48,
      minVp: 360,
      maxVp: 1200,
      selector: ".section",
      useVar: false,
      varName: "--section-pad-inline",
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    var allowed = PROPS.map(function (p) {
      return p.value;
    });
    var prop = allowed.indexOf(st.property) >= 0 ? st.property : "padding-inline";
    var minVp = clampNum(Number(st.minVp), 280, 900);
    var maxVp = clampNum(Number(st.maxVp), Math.max(minVp + 1, 600), 1920);
    var sel = String(st.selector || ".section").trim();
    if (!sel || sel.length > 80) sel = ".section";
    if (sel[0] !== "#" && sel[0] !== ".") sel = "." + sel.replace(/^\.+/, "");
    var varName = String(st.varName || "--fluid").trim();
    if (!/^--[a-zA-Z0-9-_]{1,48}$/.test(varName)) varName = "--section-pad-inline";
    return {
      property: prop,
      minPx: clampNum(Number(st.minPx), 0, 200),
      maxPx: clampNum(Number(st.maxPx), 0, 400),
      minVp: minVp,
      maxVp: maxVp,
      selector: sel,
      useVar: !!st.useVar,
      varName: varName,
    };
  }

  function buildClampValue(st) {
    st = normalizeState(st);
    var min = Math.round(st.minPx);
    var max = Math.round(st.maxPx);
    if (max < min) {
      var t = max;
      max = min;
      min = t;
    }
    var vmin = Math.round(st.minVp);
    var vmax = Math.round(st.maxVp);
    var denom = Math.max(1, vmax - vmin);
    return (
      "clamp(" +
      min +
      "px, calc(" +
      min +
      "px + (" +
      max +
      " - " +
      min +
      ") * ((100vw - " +
      vmin +
      "px) / " +
      denom +
      ")), " +
      max +
      "px)"
    );
  }

  function toCamel(prop) {
    return prop.replace(/-([a-z])/g, function (_, c) {
      return c.toUpperCase();
    });
  }

  function buildCss(st) {
    st = normalizeState(st);
    var val = buildClampValue(st);
    var prop = st.property;
    var lines = [];

    if (st.useVar) {
      lines.push(":root {");
      lines.push("  " + st.varName + ": " + val + ";");
      lines.push("}");
      lines.push("");
      lines.push(st.selector + " {");
      lines.push("  " + prop + ": var(" + st.varName + ");");
      lines.push("}");
    } else {
      lines.push(st.selector + " {");
      lines.push("  " + prop + ": " + val + ";");
      lines.push("}");
    }

    lines.push("");
    lines.push("/* viewport " + Math.round(st.minVp) + "px ~ " + Math.round(st.maxVp) + "px 구간에서 " + Math.round(st.minPx) + "px → " + Math.round(st.maxPx) + "px로 선형 보간 */");

    return lines.join("\n");
  }

  function propSelectOptions() {
    return PROPS.map(function (p) {
      return '<option value="' + escapeHtml(p.value) + '">' + escapeHtml(p.label) + "</option>";
    }).join("");
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="Fluid clamp 레이아웃 계산기">' +
      '<header class="page-hero page-hero--compact">' +
      "<h2>Fluid clamp 레이아웃</h2>" +
      "<p>뷰포트 구간에서 최소·최대 픽셀 값 사이를 선형으로 채우는 <code>clamp()</code>를 생성합니다. 패딩, 갭, max-width 등 레이아웃 속성에 바로 적용할 수 있습니다.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="cl-controls-heading">' +
      '<h2 id="cl-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="cl-property">CSS 속성</label>' +
      '<select id="cl-property" class="hub-select">' +
      propSelectOptions() +
      "</select>" +
      "</div>" +
      '<div class="control-group">' +
      '<label for="cl-selector">선택자 <span class="value" id="out-cl-selector-hint">.section</span></label>' +
      '<input type="text" id="cl-selector" class="cl-text-input" value=".section" maxlength="80" autocomplete="off" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label class="cl-check"><input type="checkbox" id="cl-use-var" /> CSS 변수로 출력 (:root + var)</label>' +
      "</div>" +
      '<div class="control-group" data-cl-only="var">' +
      '<label for="cl-var-name">변수 이름</label>' +
      '<input type="text" id="cl-var-name" class="cl-text-input" value="--section-pad-inline" maxlength="52" spellcheck="false" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="cl-min-px">최소 값 <span class="value" id="out-cl-min-px">16px</span></label>' +
      '<input type="range" id="cl-min-px" min="0" max="200" value="16" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="cl-max-px">최대 값 <span class="value" id="out-cl-max-px">48px</span></label>' +
      '<input type="range" id="cl-max-px" min="0" max="400" value="48" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="cl-min-vp">최소 뷰포트 <span class="value" id="out-cl-min-vp">360px</span></label>' +
      '<input type="range" id="cl-min-vp" min="280" max="900" value="360" step="10" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="cl-max-vp">최대 뷰포트 <span class="value" id="out-cl-max-vp">1200px</span></label>' +
      '<input type="range" id="cl-max-vp" min="640" max="1920" value="1200" step="10" />' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="cl-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="cl-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="cl-preview-heading">' +
      '<h2 id="cl-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<p class="cl-preview-hint" id="cl-preview-hint">브라우저 창 너비를 조절하면 값이 변합니다.</p>' +
      '<div class="cl-stage" id="cl-stage">' +
      '<div class="cl-ruler" aria-hidden="true"><span>좁은 화면</span><span>넓은 화면</span></div>' +
      '<div class="cl-preview-host" id="cl-preview-host">' +
      '<div class="cl-preview-inner" id="cl-preview-inner">' +
      '<div class="cl-preview-kicker">Preview</div>' +
      '<div class="cl-preview-title">Fluid clamp</div>' +
      '<div class="cl-preview-sub">선택한 속성이 이 박스에 적용됩니다.</div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="cl-code-heading">' +
      '<h2 id="cl-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="cl-copy">복사</button></div>' +
      '<pre><code id="cl-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="cl-presets-heading">' +
      '<h2 id="cl-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="cl-presets" class="cl-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("clamp-layout-inline-style")) return;
    var style = document.createElement("style");
    style.id = "clamp-layout-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".cl-text-input{width:100%;padding:10px 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:var(--color-input-bg);color:var(--color-text-primary);font-family:var(--font-mono, ui-monospace, monospace);font-size:13px}" +
      ".cl-check{display:flex;align-items:center;gap:10px;font-size:var(--text-sm);color:var(--color-text-secondary);cursor:pointer}" +
      ".cl-check input{width:18px;height:18px}" +
      ".cl-preview-hint{font-size:var(--text-sm);color:var(--color-text-muted);margin:0 0 var(--space-4)}" +
      ".cl-stage{border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid);padding:var(--space-5)}" +
      ".cl-ruler{display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--color-text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em}" +
      ".cl-preview-host{border-radius:20px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);min-height:120px}" +
      "html[data-theme=\"light\"] .cl-preview-host{border-color:rgba(15,23,42,.12);background:rgba(255,255,255,.65)}" +
      ".cl-preview-inner{flex:1;border-radius:16px;border:1px dashed rgba(255,255,255,.22);background:rgba(0,0,0,.12);padding:16px;display:flex;flex-direction:column;gap:6px;min-width:0}" +
      "html[data-theme=\"light\"] .cl-preview-inner{border-color:rgba(15,23,42,.18);background:rgba(15,23,42,.04)}" +
      ".cl-preview-kicker{font-size:var(--text-xs);font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:var(--color-text-muted)}" +
      ".cl-preview-title{font-size:var(--text-lg);font-weight:950;color:var(--color-text-primary)}" +
      ".cl-preview-sub{font-size:var(--text-sm);color:var(--color-text-secondary)}" +
      ".cl-preview-host.is-gap-mode{display:flex;flex-wrap:wrap;align-items:stretch}" +
      ".cl-preview-host.is-gap-mode .cl-preview-inner{flex:1 1 38%;max-width:48%;min-height:56px}" +
      ".cl-preview-host.is-gap-mode.is-row-gap{flex-direction:column;flex-wrap:nowrap}" +
      ".cl-preview-host.is-gap-mode.is-row-gap .cl-preview-inner,.cl-preview-host.is-gap-mode.is-row-gap .cl-gap-filler{flex:1;max-width:none;width:100%}" +
      ".cl-preview-host.is-gap-mode .cl-gap-filler{flex:1 1 38%;min-height:56px;border-radius:16px;border:1px dashed rgba(255,255,255,.18);background:rgba(255,255,255,.04)}" +
      ".cl-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".cl-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".cl-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".cl-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".cl-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".cl-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".cl-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
        '<p class="presets-empty" role="status">저장된 프리셋이 없습니다. 「프리셋 저장」으로 자주 쓰는 조합을 남겨 보세요.</p>';
      return;
    }
    host.innerHTML = list
      .map(function (p) {
        var st = normalizeState(p.state);
        var meta = st.property + " · " + Math.round(st.minPx) + "→" + Math.round(st.maxPx) + "px";
        return (
          '<div class="cl-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="cl-preset__body">' +
          '<div class="cl-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="cl-preset__meta">' +
          escapeHtml(meta) +
          "</div>" +
          "</div>" +
          '<button type="button" class="cl-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  function applyPreview(st, host, inner, hint) {
    if (!host || !inner) return;
    var val = buildClampValue(st);
    var prop = st.property;
    var camel = toCamel(prop);

    host.classList.remove("is-gap-mode", "is-row-gap");
    host.style.display = "";
    host.style.flexDirection = "";
    host.style.flexWrap = "";
    host.style.alignItems = "";
    host.style.gap = "";
    host.style.rowGap = "";
    host.style.columnGap = "";

    inner.style.paddingInline = "";
    inner.style.paddingBlock = "";
    inner.style.gap = "";
    inner.style.rowGap = "";
    inner.style.columnGap = "";
    inner.style.marginBlock = "";
    inner.style.maxWidth = "";
    inner.style.width = "";
    inner.style.marginInline = "";

    var filler = host.querySelector(".cl-gap-filler");
    if (filler) filler.remove();

    if (prop === "gap" || prop === "row-gap" || prop === "column-gap") {
      host.classList.add("is-gap-mode");
      if (prop === "row-gap") host.classList.add("is-row-gap");
      host.style.display = "flex";
      host.style.alignItems = "stretch";
      if (prop === "row-gap") {
        host.style.flexDirection = "column";
        host.style.flexWrap = "nowrap";
        host.style.rowGap = val;
      } else {
        host.style.flexDirection = "row";
        host.style.flexWrap = "wrap";
        if (prop === "column-gap") host.style.columnGap = val;
        else host.style.gap = val;
      }
      var f = document.createElement("div");
      f.className = "cl-gap-filler";
      f.setAttribute("aria-hidden", "true");
      host.appendChild(f);
    } else if (prop === "max-width") {
      host.style.display = "block";
      inner.style.width = "100%";
      inner.style.maxWidth = val;
      inner.style.marginInline = "auto";
    } else {
      host.style.display = "block";
      inner.style.width = "100%";
      inner.style[camel] = val;
    }

    if (hint) {
      var shortVal = val.replace(/\s+/g, " ");
      hint.textContent = "현재: " + prop + " = " + (shortVal.length > 80 ? shortVal.slice(0, 80) + "…" : shortVal);
    }
  }

  function setVarRowVisibility(root, useVar) {
    var row = root.querySelector("[data-cl-only=\"var\"]");
    if (row) row.style.display = useVar ? "" : "none";
  }

  window.Tools = window.Tools || {};
  window.Tools["clamp-layout"] = {
    id: "clamp-layout",
    title: "Fluid clamp 레이아웃",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elProp = root.querySelector("#cl-property");
      var elSel = root.querySelector("#cl-selector");
      var elUseVar = root.querySelector("#cl-use-var");
      var elVarName = root.querySelector("#cl-var-name");
      var elMinPx = root.querySelector("#cl-min-px");
      var elMaxPx = root.querySelector("#cl-max-px");
      var elMinVp = root.querySelector("#cl-min-vp");
      var elMaxVp = root.querySelector("#cl-max-vp");

      var outMinPx = root.querySelector("#out-cl-min-px");
      var outMaxPx = root.querySelector("#out-cl-max-px");
      var outMinVp = root.querySelector("#out-cl-min-vp");
      var outMaxVp = root.querySelector("#out-cl-max-vp");
      var outSelHint = root.querySelector("#out-cl-selector-hint");

      var cssOut = root.querySelector("#cl-css");
      var host = root.querySelector("#cl-preview-host");
      var inner = root.querySelector("#cl-preview-inner");
      var hint = root.querySelector("#cl-preview-hint");
      var presetsHost = root.querySelector("#cl-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function syncControls() {
        elProp.value = st.property;
        elSel.value = st.selector;
        elUseVar.checked = st.useVar;
        elVarName.value = st.varName;
        elMinPx.value = st.minPx;
        elMaxPx.value = st.maxPx;
        elMinVp.value = st.minVp;
        elMaxVp.value = st.maxVp;
        setVarRowVisibility(root, st.useVar);
      }

      function readControls() {
        st = normalizeState({
          property: elProp.value,
          selector: elSel.value,
          useVar: elUseVar.checked,
          varName: elVarName.value,
          minPx: Number(elMinPx.value),
          maxPx: Number(elMaxPx.value),
          minVp: Number(elMinVp.value),
          maxVp: Number(elMaxVp.value),
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderAll() {
        if (outMinPx) outMinPx.textContent = Math.round(st.minPx) + "px";
        if (outMaxPx) outMaxPx.textContent = Math.round(st.maxPx) + "px";
        if (outMinVp) outMinVp.textContent = Math.round(st.minVp) + "px";
        if (outMaxVp) outMaxVp.textContent = Math.round(st.maxVp) + "px";
        if (outSelHint) outSelHint.textContent = st.selector;
        if (cssOut) cssOut.textContent = buildCss(st);
        applyPreview(st, host, inner, hint);
      }

      function applyState(next) {
        st = normalizeState(next);
        saveJson(STORAGE_STATE, st);
        syncControls();
        renderAll();
      }

      function onChange() {
        readControls();
        setVarRowVisibility(root, st.useVar);
        renderAll();
      }

      [
        elProp,
        elMinPx,
        elMaxPx,
        elMinVp,
        elMaxVp,
      ].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });
      elSel.addEventListener("input", onChange, { signal: ac.signal });
      elUseVar.addEventListener("change", onChange, { signal: ac.signal });
      elVarName.addEventListener("input", onChange, { signal: ac.signal });

      root.querySelector("#cl-copy").addEventListener(
        "click",
        function () {
          var text = cssOut ? cssOut.textContent : "";
          if (!text) return;
          var copy = Hub.copyText ? Hub.copyText(text) : Promise.reject(new Error("no copy"));
          copy
            .then(function () {
              toast("클립보드에 복사했습니다");
            })
            .catch(function () {
              toast("복사에 실패했습니다.");
            });
        },
        { signal: ac.signal }
      );

      root.querySelector("#cl-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("초기값으로 되돌렸습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#cl-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "cl-" + Date.now(), name: name, state: normalizeState(st) });
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

          var plist = loadPresets();
          for (var i = 0; i < plist.length; i++) {
            if (plist[i].id === id) {
              applyState(plist[i].state);
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
