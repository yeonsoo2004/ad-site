/* tool: border — border / radius / outline builder */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "border-state";
  var STORAGE_PRESETS = "border-presets";

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
      bg: "#0b1220",
      fill: "#111827",
      borderOn: true,
      borderW: 1,
      borderStyle: "solid",
      borderColor: "#94a3b8",
      borderAlpha: 35,
      radiusMode: "all", // all | corners
      radius: 20,
      rTL: 20,
      rTR: 20,
      rBR: 20,
      rBL: 20,
      outlineOn: false,
      outlineW: 2,
      outlineOffset: 2,
      outlineColor: "#22d3ee",
      outlineAlpha: 55,
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    var m = st.radiusMode === "corners" ? "corners" : "all";
    return {
      bg: typeof st.bg === "string" ? st.bg : "#0b1220",
      fill: typeof st.fill === "string" ? st.fill : "#111827",
      borderOn: !!st.borderOn,
      borderW: clamp(Number(st.borderW), 0, 16),
      borderStyle:
        st.borderStyle === "dashed" || st.borderStyle === "dotted" || st.borderStyle === "double"
          ? st.borderStyle
          : "solid",
      borderColor: typeof st.borderColor === "string" ? st.borderColor : "#94a3b8",
      borderAlpha: clamp(Number(st.borderAlpha), 0, 100),
      radiusMode: m,
      radius: clamp(Number(st.radius), 0, 48),
      rTL: clamp(Number(st.rTL), 0, 48),
      rTR: clamp(Number(st.rTR), 0, 48),
      rBR: clamp(Number(st.rBR), 0, 48),
      rBL: clamp(Number(st.rBL), 0, 48),
      outlineOn: !!st.outlineOn,
      outlineW: clamp(Number(st.outlineW), 0, 12),
      outlineOffset: clamp(Number(st.outlineOffset), 0, 16),
      outlineColor: typeof st.outlineColor === "string" ? st.outlineColor : "#22d3ee",
      outlineAlpha: clamp(Number(st.outlineAlpha), 0, 100),
    };
  }

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgba(hex, a01) {
    var c = hexToRgb(hex);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a01 + ")";
  }

  function borderCss(st) {
    st = normalizeState(st);
    if (!st.borderOn || st.borderW <= 0) return "none";
    return (
      Math.round(st.borderW) +
      "px " +
      st.borderStyle +
      " " +
      rgba(st.borderColor, clamp(st.borderAlpha / 100, 0, 1))
    );
  }

  function outlineCss(st) {
    st = normalizeState(st);
    if (!st.outlineOn || st.outlineW <= 0) return { outline: "none", offset: "0px" };
    return {
      outline:
        Math.round(st.outlineW) +
        "px solid " +
        rgba(st.outlineColor, clamp(st.outlineAlpha / 100, 0, 1)),
      offset: Math.round(st.outlineOffset) + "px",
    };
  }

  function radiusCss(st) {
    st = normalizeState(st);
    if (st.radiusMode === "corners") {
      return (
        Math.round(st.rTL) +
        "px " +
        Math.round(st.rTR) +
        "px " +
        Math.round(st.rBR) +
        "px " +
        Math.round(st.rBL) +
        "px"
      );
    }
    return Math.round(st.radius) + "px";
  }

  function buildCss(st) {
    st = normalizeState(st);
    var ol = outlineCss(st);
    var css =
      ".box {\n" +
      "  border-radius: " +
      radiusCss(st) +
      ";\n" +
      "  border: " +
      borderCss(st) +
      ";\n" +
      "  outline: " +
      ol.outline +
      ";\n" +
      "  outline-offset: " +
      ol.offset +
      ";\n" +
      "}\n";
    return css;
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="보더/라디우스">' +
      '<header class="page-hero">' +
      "<h1>보더/라디우스</h1>" +
      "<p>border, border-radius(모서리 개별 포함), outline을 조절하고 CSS를 복사/저장하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="bd-controls-heading">' +
      '<h2 id="bd-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group"><label for="bd-bg">배경</label><input type="color" id="bd-bg" value="#0b1220" /></div>' +
      '<div class="control-group"><label for="bd-fill">박스 배경</label><input type="color" id="bd-fill" value="#111827" /></div>' +
      '<div class="control-group"><label for="bd-border-on">Border</label><label class="bd-check"><input type="checkbox" id="bd-border-on" /> border 사용</label></div>' +
      '<div class="control-group" data-bd-only="border">' +
      '<label for="bd-border-w">두께 <span class="value" id="out-bd-border-w">1px</span></label>' +
      '<input type="range" id="bd-border-w" min="0" max="16" value="1" step="1" />' +
      "</div>" +
      '<div class="control-group" data-bd-only="border">' +
      '<label for="bd-border-style">스타일</label>' +
      '<select id="bd-border-style" class="hub-select">' +
      '<option value="solid">solid</option>' +
      '<option value="dashed">dashed</option>' +
      '<option value="dotted">dotted</option>' +
      '<option value="double">double</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group" data-bd-only="border">' +
      '<label for="bd-border-color">색상</label>' +
      '<input type="color" id="bd-border-color" value="#94a3b8" />' +
      "</div>" +
      '<div class="control-group" data-bd-only="border">' +
      '<label for="bd-border-alpha">투명도 <span class="value" id="out-bd-border-alpha">35%</span></label>' +
      '<input type="range" id="bd-border-alpha" min="0" max="100" value="35" step="1" />' +
      "</div>" +
      '<div class="bd-split"></div>' +
      '<div class="control-group"><label for="bd-radius-mode">Radius 모드</label>' +
      '<select id="bd-radius-mode" class="hub-select"><option value="all">All corners</option><option value="corners">Per-corner</option></select>' +
      "</div>" +
      '<div class="control-group" data-bd-only="radius-all">' +
      '<label for="bd-radius">radius <span class="value" id="out-bd-radius">20px</span></label>' +
      '<input type="range" id="bd-radius" min="0" max="48" value="20" step="1" />' +
      "</div>" +
      '<div class="bd-corners" data-bd-only="radius-corners">' +
      cornerRow("TL", "bd-rtl", "out-bd-rtl", 20) +
      cornerRow("TR", "bd-rtr", "out-bd-rtr", 20) +
      cornerRow("BR", "bd-rbr", "out-bd-rbr", 20) +
      cornerRow("BL", "bd-rbl", "out-bd-rbl", 20) +
      "</div>" +
      '<div class="bd-split"></div>' +
      '<div class="control-group"><label for="bd-outline-on">Outline</label><label class="bd-check"><input type="checkbox" id="bd-outline-on" /> outline 사용</label></div>' +
      '<div class="control-group" data-bd-only="outline">' +
      '<label for="bd-outline-w">두께 <span class="value" id="out-bd-outline-w">2px</span></label>' +
      '<input type="range" id="bd-outline-w" min="0" max="12" value="2" step="1" />' +
      "</div>" +
      '<div class="control-group" data-bd-only="outline">' +
      '<label for="bd-outline-offset">offset <span class="value" id="out-bd-outline-offset">2px</span></label>' +
      '<input type="range" id="bd-outline-offset" min="0" max="16" value="2" step="1" />' +
      "</div>" +
      '<div class="control-group" data-bd-only="outline"><label for="bd-outline-color">색상</label><input type="color" id="bd-outline-color" value="#22d3ee" /></div>' +
      '<div class="control-group" data-bd-only="outline">' +
      '<label for="bd-outline-alpha">투명도 <span class="value" id="out-bd-outline-alpha">55%</span></label>' +
      '<input type="range" id="bd-outline-alpha" min="0" max="100" value="55" step="1" />' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="bd-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="bd-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="bd-preview-heading">' +
      '<h2 id="bd-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="bd-stage" id="bd-stage"><div class="bd-box" id="bd-box"><div class="bd-box__txt">Border + Radius</div></div></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="bd-code-heading">' +
      '<h2 id="bd-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block"><div class="code-block__actions"><button type="button" class="btn btn--primary" id="bd-copy">복사</button></div><pre><code id="bd-css"></code></pre></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="bd-presets-heading">' +
      '<h2 id="bd-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="bd-presets" class="bd-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function cornerRow(label, id, outId, val) {
    return (
      '<div class="control-group">' +
      '<label for="' +
      id +
      '">Radius ' +
      label +
      ' <span class="value" id="' +
      outId +
      '">' +
      val +
      "px</span></label>" +
      '<input type="range" id="' +
      id +
      '" min="0" max="48" value="' +
      val +
      '" step="1" />' +
      "</div>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("border-inline-style")) return;
    var style = document.createElement("style");
    style.id = "border-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".bd-check{display:flex;align-items:center;gap:10px;margin-top:6px;color:var(--color-text-secondary);font-size:var(--text-sm)}" +
      ".bd-split{height:1px;background:var(--color-border-subtle);margin:var(--space-4) 0}" +
      ".bd-stage{min-height:300px;display:flex;align-items:center;justify-content:center;padding:var(--space-8);border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid)}" +
      ".bd-box{width:min(100%,360px);min-height:180px;display:flex;align-items:center;justify-content:center;border-radius:22px;background:rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}" +
      "html[data-theme=\"light\"] .bd-box{background:rgba(255,255,255,.75)}" +
      ".bd-box__txt{font-weight:900;letter-spacing:var(--tracking-tight);color:var(--color-text-primary)}" +
      ".bd-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".bd-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".bd-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".bd-preset__sw{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.16);flex:0 0 auto;display:flex;align-items:center;justify-content:center}" +
      "html[data-theme=\"light\"] .bd-preset__sw{border-color:rgba(15,23,42,.12)}" +
      ".bd-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".bd-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".bd-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".bd-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
        var b = borderCss(st);
        var r = radiusCss(st);
        var ol = outlineCss(st);
        return (
          '<div class="bd-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="bd-preset__sw" style="background:' +
          escapeHtml(st.fill) +
          ";border:" +
          escapeHtml(b) +
          ";border-radius:" +
          escapeHtml(r) +
          ";outline:" +
          escapeHtml(ol.outline) +
          ";outline-offset:" +
          escapeHtml(ol.offset) +
          '">Aa</div>' +
          '<div class="bd-preset__body">' +
          '<div class="bd-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="bd-preset__meta">r ' +
          escapeHtml(r) +
          " · " +
          (st.borderOn ? "border" : "no border") +
          "</div>" +
          "</div>" +
          '<button type="button" class="bd-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.border = {
    id: "border",
    title: "보더/라디우스",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elBg = root.querySelector("#bd-bg");
      var elFill = root.querySelector("#bd-fill");

      var elBorderOn = root.querySelector("#bd-border-on");
      var elBorderW = root.querySelector("#bd-border-w");
      var elBorderStyle = root.querySelector("#bd-border-style");
      var elBorderColor = root.querySelector("#bd-border-color");
      var elBorderAlpha = root.querySelector("#bd-border-alpha");

      var elRadiusMode = root.querySelector("#bd-radius-mode");
      var elRadius = root.querySelector("#bd-radius");
      var elRtl = root.querySelector("#bd-rtl");
      var elRtr = root.querySelector("#bd-rtr");
      var elRbr = root.querySelector("#bd-rbr");
      var elRbl = root.querySelector("#bd-rbl");

      var elOutlineOn = root.querySelector("#bd-outline-on");
      var elOutlineW = root.querySelector("#bd-outline-w");
      var elOutlineOffset = root.querySelector("#bd-outline-offset");
      var elOutlineColor = root.querySelector("#bd-outline-color");
      var elOutlineAlpha = root.querySelector("#bd-outline-alpha");

      var outBorderW = root.querySelector("#out-bd-border-w");
      var outBorderAlpha = root.querySelector("#out-bd-border-alpha");
      var outRadius = root.querySelector("#out-bd-radius");
      var outRtl = root.querySelector("#out-bd-rtl");
      var outRtr = root.querySelector("#out-bd-rtr");
      var outRbr = root.querySelector("#out-bd-rbr");
      var outRbl = root.querySelector("#out-bd-rbl");
      var outOutlineW = root.querySelector("#out-bd-outline-w");
      var outOutlineOffset = root.querySelector("#out-bd-outline-offset");
      var outOutlineAlpha = root.querySelector("#out-bd-outline-alpha");

      var stage = root.querySelector("#bd-stage");
      var box = root.querySelector("#bd-box");
      var cssOut = root.querySelector("#bd-css");
      var presetsHost = root.querySelector("#bd-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function setVisibility() {
        // border
        var borderOn = !!elBorderOn.checked;
        root.querySelectorAll('[data-bd-only="border"]').forEach(function (el) {
          el.style.display = borderOn ? "" : "none";
        });
        // outline
        var outlineOn = !!elOutlineOn.checked;
        root.querySelectorAll('[data-bd-only="outline"]').forEach(function (el) {
          el.style.display = outlineOn ? "" : "none";
        });
        // radius mode
        var mode = elRadiusMode.value;
        root.querySelectorAll('[data-bd-only="radius-all"]').forEach(function (el) {
          el.style.display = mode === "all" ? "" : "none";
        });
        root.querySelectorAll('[data-bd-only="radius-corners"]').forEach(function (el) {
          el.style.display = mode === "corners" ? "" : "none";
        });
      }

      function syncControls() {
        elBg.value = st.bg;
        elFill.value = st.fill;
        elBorderOn.checked = st.borderOn;
        elBorderW.value = st.borderW;
        elBorderStyle.value = st.borderStyle;
        elBorderColor.value = st.borderColor;
        elBorderAlpha.value = st.borderAlpha;
        elRadiusMode.value = st.radiusMode;
        elRadius.value = st.radius;
        elRtl.value = st.rTL;
        elRtr.value = st.rTR;
        elRbr.value = st.rBR;
        elRbl.value = st.rBL;
        elOutlineOn.checked = st.outlineOn;
        elOutlineW.value = st.outlineW;
        elOutlineOffset.value = st.outlineOffset;
        elOutlineColor.value = st.outlineColor;
        elOutlineAlpha.value = st.outlineAlpha;
        setVisibility();
      }

      function readControls() {
        st = normalizeState({
          bg: elBg.value,
          fill: elFill.value,
          borderOn: !!elBorderOn.checked,
          borderW: Number(elBorderW.value),
          borderStyle: elBorderStyle.value,
          borderColor: elBorderColor.value,
          borderAlpha: Number(elBorderAlpha.value),
          radiusMode: elRadiusMode.value,
          radius: Number(elRadius.value),
          rTL: Number(elRtl.value),
          rTR: Number(elRtr.value),
          rBR: Number(elRbr.value),
          rBL: Number(elRbl.value),
          outlineOn: !!elOutlineOn.checked,
          outlineW: Number(elOutlineW.value),
          outlineOffset: Number(elOutlineOffset.value),
          outlineColor: elOutlineColor.value,
          outlineAlpha: Number(elOutlineAlpha.value),
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderAll() {
        if (outBorderW) outBorderW.textContent = Math.round(st.borderW) + "px";
        if (outBorderAlpha) outBorderAlpha.textContent = Math.round(st.borderAlpha) + "%";
        if (outRadius) outRadius.textContent = Math.round(st.radius) + "px";
        if (outRtl) outRtl.textContent = Math.round(st.rTL) + "px";
        if (outRtr) outRtr.textContent = Math.round(st.rTR) + "px";
        if (outRbr) outRbr.textContent = Math.round(st.rBR) + "px";
        if (outRbl) outRbl.textContent = Math.round(st.rBL) + "px";
        if (outOutlineW) outOutlineW.textContent = Math.round(st.outlineW) + "px";
        if (outOutlineOffset) outOutlineOffset.textContent = Math.round(st.outlineOffset) + "px";
        if (outOutlineAlpha) outOutlineAlpha.textContent = Math.round(st.outlineAlpha) + "%";

        var b = borderCss(st);
        var r = radiusCss(st);
        var ol = outlineCss(st);

        if (stage) stage.style.background = st.bg;
        if (box) {
          box.style.background = st.fill;
          box.style.border = b;
          box.style.borderRadius = r;
          box.style.outline = ol.outline;
          box.style.outlineOffset = ol.offset;
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
        setVisibility();
        renderAll();
      }

      [
        elBg,
        elFill,
        elBorderOn,
        elBorderW,
        elBorderStyle,
        elBorderColor,
        elBorderAlpha,
        elRadiusMode,
        elRadius,
        elRtl,
        elRtr,
        elRbr,
        elRbl,
        elOutlineOn,
        elOutlineW,
        elOutlineOffset,
        elOutlineColor,
        elOutlineAlpha,
      ].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#bd-copy").addEventListener(
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

      root.querySelector("#bd-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("보더 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#bd-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "bd-" + Date.now(), name: name, state: normalizeState(st) });
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

