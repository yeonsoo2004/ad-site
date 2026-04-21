/* tool: grid — CSS grid builder */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "grid-state";
  var STORAGE_PRESETS = "grid-presets";

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
      mode: "fixed", // fixed | auto
      columns: 3,
      minCol: 220, // auto mode only (px)
      rows: 2,
      itemCount: 8,
      gap: 16,
      rowGap: 16,
      colGap: 16,
      separateGaps: false,
      alignItems: "stretch", // stretch | start | center | end
      justifyItems: "stretch", // stretch | start | center | end
      alignContent: "start", // start | center | end | space-between | space-around | space-evenly | stretch
      justifyContent: "start",
      autoFlow: "row", // row | column | dense
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    var mode = st.mode === "auto" ? "auto" : "fixed";
    var separate = !!st.separateGaps;
    var next = {
      mode: mode,
      columns: clamp(Number(st.columns), 1, 12),
      minCol: clamp(Number(st.minCol), 120, 520),
      rows: clamp(Number(st.rows), 1, 8),
      itemCount: clamp(Number(st.itemCount), 1, 36),
      gap: clamp(Number(st.gap), 0, 64),
      rowGap: clamp(Number(st.rowGap), 0, 64),
      colGap: clamp(Number(st.colGap), 0, 64),
      separateGaps: separate,
      alignItems: st.alignItems || "stretch",
      justifyItems: st.justifyItems || "stretch",
      alignContent: st.alignContent || "start",
      justifyContent: st.justifyContent || "start",
      autoFlow: st.autoFlow || "row",
    };
    if (!separate) {
      next.rowGap = next.gap;
      next.colGap = next.gap;
    }
    return next;
  }

  function buildGridCss(st) {
    st = normalizeState(st);
    var tplCols =
      st.mode === "auto"
        ? "repeat(auto-fit, minmax(" + Math.round(st.minCol) + "px, 1fr))"
        : "repeat(" + Math.round(st.columns) + ", 1fr)";
    var tplRows = "repeat(" + Math.round(st.rows) + ", minmax(72px, auto))";

    var css =
      ".grid {\n" +
      "  display: grid;\n" +
      "  grid-template-columns: " +
      tplCols +
      ";\n" +
      "  grid-template-rows: " +
      tplRows +
      ";\n";

    if (st.separateGaps) {
      css += "  row-gap: " + Math.round(st.rowGap) + "px;\n";
      css += "  column-gap: " + Math.round(st.colGap) + "px;\n";
    } else {
      css += "  gap: " + Math.round(st.gap) + "px;\n";
    }

    css +=
      "  align-items: " +
      st.alignItems +
      ";\n" +
      "  justify-items: " +
      st.justifyItems +
      ";\n" +
      "  align-content: " +
      st.alignContent +
      ";\n" +
      "  justify-content: " +
      st.justifyContent +
      ";\n" +
      "  grid-auto-flow: " +
      st.autoFlow +
      ";\n" +
      "}\n";

    return { css: css, tplCols: tplCols, tplRows: tplRows };
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="그리드 빌더">' +
      '<header class="page-hero page-hero--compact">' +
      "<h2>그리드 빌더</h2>" +
      "<p>CSS Grid 레이아웃을 미리보고, 컨테이너 CSS를 바로 복사하거나 프리셋으로 저장하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="grid-controls-heading">' +
      '<h2 id="grid-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="grid-mode">모드</label>' +
      '<select id="grid-mode" class="hub-select">' +
      '<option value="fixed">Fixed columns (repeat n)</option>' +
      '<option value="auto">Auto-fit (minmax)</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group" data-grid-only="fixed">' +
      '<label for="grid-columns">컬럼 수 <span class="value" id="out-grid-columns">3</span></label>' +
      '<input type="range" id="grid-columns" min="1" max="12" value="3" step="1" />' +
      "</div>" +
      '<div class="control-group" data-grid-only="auto">' +
      '<label for="grid-min-col">최소 컬럼 폭 <span class="value" id="out-grid-min-col">220px</span></label>' +
      '<input type="range" id="grid-min-col" min="120" max="520" value="220" step="10" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="grid-rows">행 수(미리보기) <span class="value" id="out-grid-rows">2</span></label>' +
      '<input type="range" id="grid-rows" min="1" max="8" value="2" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="grid-items">아이템 수 <span class="value" id="out-grid-items">8</span></label>' +
      '<input type="range" id="grid-items" min="1" max="36" value="8" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="grid-sep-gaps">Gap 옵션</label>' +
      '<label class="grid-check"><input type="checkbox" id="grid-sep-gaps" /> row/column 분리</label>' +
      "</div>" +
      '<div class="control-group" data-gap-mode="single">' +
      '<label for="grid-gap">gap <span class="value" id="out-grid-gap">16px</span></label>' +
      '<input type="range" id="grid-gap" min="0" max="64" value="16" step="1" />' +
      "</div>" +
      '<div class="control-group" data-gap-mode="sep">' +
      '<label for="grid-row-gap">row-gap <span class="value" id="out-grid-row-gap">16px</span></label>' +
      '<input type="range" id="grid-row-gap" min="0" max="64" value="16" step="1" />' +
      "</div>" +
      '<div class="control-group" data-gap-mode="sep">' +
      '<label for="grid-col-gap">column-gap <span class="value" id="out-grid-col-gap">16px</span></label>' +
      '<input type="range" id="grid-col-gap" min="0" max="64" value="16" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="grid-align-items">align-items</label>' +
      '<select id="grid-align-items" class="hub-select">' +
      '<option value="stretch">stretch</option>' +
      '<option value="start">start</option>' +
      '<option value="center">center</option>' +
      '<option value="end">end</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group">' +
      '<label for="grid-justify-items">justify-items</label>' +
      '<select id="grid-justify-items" class="hub-select">' +
      '<option value="stretch">stretch</option>' +
      '<option value="start">start</option>' +
      '<option value="center">center</option>' +
      '<option value="end">end</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group">' +
      '<label for="grid-align-content">align-content</label>' +
      '<select id="grid-align-content" class="hub-select">' +
      '<option value="start">start</option>' +
      '<option value="center">center</option>' +
      '<option value="end">end</option>' +
      '<option value="space-between">space-between</option>' +
      '<option value="space-around">space-around</option>' +
      '<option value="space-evenly">space-evenly</option>' +
      '<option value="stretch">stretch</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group">' +
      '<label for="grid-justify-content">justify-content</label>' +
      '<select id="grid-justify-content" class="hub-select">' +
      '<option value="start">start</option>' +
      '<option value="center">center</option>' +
      '<option value="end">end</option>' +
      '<option value="space-between">space-between</option>' +
      '<option value="space-around">space-around</option>' +
      '<option value="space-evenly">space-evenly</option>' +
      '<option value="stretch">stretch</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group">' +
      '<label for="grid-auto-flow">grid-auto-flow</label>' +
      '<select id="grid-auto-flow" class="hub-select">' +
      '<option value="row">row</option>' +
      '<option value="column">column</option>' +
      '<option value="dense">dense</option>' +
      "</select>" +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="grid-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="grid-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="grid-preview-heading">' +
      '<h2 id="grid-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="grid-stage">' +
      '<div class="grid-preview" id="grid-preview" aria-label="그리드 미리보기"></div>' +
      "</div>" +
      '<div class="grid-meta" id="grid-meta"></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="grid-code-heading">' +
      '<h2 id="grid-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="grid-copy">복사</button></div>' +
      '<pre><code id="grid-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="grid-presets-heading">' +
      '<h2 id="grid-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="grid-presets" class="grid-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("grid-inline-style")) return;
    var style = document.createElement("style");
    style.id = "grid-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".grid-check{display:flex;align-items:center;gap:10px;margin-top:6px;color:var(--color-text-secondary);font-size:var(--text-sm)}" +
      ".grid-stage{border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid);padding:var(--space-5)}" +
      ".grid-preview{min-height:280px;display:grid;align-content:start;justify-content:start}" +
      ".grid-item{border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--color-text-primary)}" +
      "html[data-theme=\"light\"] .grid-item{border-color:rgba(15,23,42,.12);background:rgba(255,255,255,.7)}" +
      ".grid-item span{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".grid-meta{margin-top:var(--space-3);font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted);display:flex;flex-wrap:wrap;gap:10px}" +
      ".grid-chip{padding:6px 10px;border-radius:999px;border:1px solid var(--color-border-subtle);background:var(--color-surface)}" +
      ".grid-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".grid-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".grid-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".grid-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".grid-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".grid-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".grid-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
        var label =
          st.mode === "auto"
            ? "auto-fit · min " + Math.round(st.minCol) + "px"
            : Math.round(st.columns) + " cols";
        return (
          '<div class="grid-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="grid-preset__body">' +
          '<div class="grid-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="grid-preset__meta">' +
          escapeHtml(label) +
          " · gap " +
          Math.round(st.separateGaps ? st.rowGap : st.gap) +
          "px</div>" +
          "</div>" +
          '<button type="button" class="grid-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.grid = {
    id: "grid",
    title: "그리드 빌더",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elMode = root.querySelector("#grid-mode");
      var elColumns = root.querySelector("#grid-columns");
      var elMinCol = root.querySelector("#grid-min-col");
      var elRows = root.querySelector("#grid-rows");
      var elItems = root.querySelector("#grid-items");
      var elSep = root.querySelector("#grid-sep-gaps");
      var elGap = root.querySelector("#grid-gap");
      var elRowGap = root.querySelector("#grid-row-gap");
      var elColGap = root.querySelector("#grid-col-gap");
      var elAlignItems = root.querySelector("#grid-align-items");
      var elJustifyItems = root.querySelector("#grid-justify-items");
      var elAlignContent = root.querySelector("#grid-align-content");
      var elJustifyContent = root.querySelector("#grid-justify-content");
      var elAutoFlow = root.querySelector("#grid-auto-flow");

      var outColumns = root.querySelector("#out-grid-columns");
      var outMinCol = root.querySelector("#out-grid-min-col");
      var outRows = root.querySelector("#out-grid-rows");
      var outItems = root.querySelector("#out-grid-items");
      var outGap = root.querySelector("#out-grid-gap");
      var outRowGap = root.querySelector("#out-grid-row-gap");
      var outColGap = root.querySelector("#out-grid-col-gap");

      var preview = root.querySelector("#grid-preview");
      var meta = root.querySelector("#grid-meta");
      var cssOut = root.querySelector("#grid-css");
      var presetsHost = root.querySelector("#grid-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function setModeVisibility() {
        var mode = elMode.value;
        root.querySelectorAll("[data-grid-only]").forEach(function (el) {
          el.style.display = el.getAttribute("data-grid-only") === mode ? "" : "none";
        });
      }

      function setGapVisibility() {
        var sep = !!elSep.checked;
        root.querySelectorAll("[data-gap-mode]").forEach(function (el) {
          var mode = el.getAttribute("data-gap-mode");
          el.style.display = sep ? (mode === "sep" ? "" : "none") : mode === "single" ? "" : "none";
        });
      }

      function syncControls() {
        elMode.value = st.mode;
        elColumns.value = st.columns;
        elMinCol.value = st.minCol;
        elRows.value = st.rows;
        elItems.value = st.itemCount;
        elSep.checked = st.separateGaps;
        elGap.value = st.gap;
        elRowGap.value = st.rowGap;
        elColGap.value = st.colGap;
        elAlignItems.value = st.alignItems;
        elJustifyItems.value = st.justifyItems;
        elAlignContent.value = st.alignContent;
        elJustifyContent.value = st.justifyContent;
        elAutoFlow.value = st.autoFlow;
        setModeVisibility();
        setGapVisibility();
      }

      function readControls() {
        st = normalizeState({
          mode: elMode.value,
          columns: Number(elColumns.value),
          minCol: Number(elMinCol.value),
          rows: Number(elRows.value),
          itemCount: Number(elItems.value),
          separateGaps: !!elSep.checked,
          gap: Number(elGap.value),
          rowGap: Number(elRowGap.value),
          colGap: Number(elColGap.value),
          alignItems: elAlignItems.value,
          justifyItems: elJustifyItems.value,
          alignContent: elAlignContent.value,
          justifyContent: elJustifyContent.value,
          autoFlow: elAutoFlow.value,
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderPreviewItems() {
        if (!preview) return;
        preview.innerHTML = "";
        for (var i = 1; i <= st.itemCount; i++) {
          var div = document.createElement("div");
          div.className = "grid-item";
          div.innerHTML = "<span>" + i + "</span>";
          preview.appendChild(div);
        }
      }

      function renderAll() {
        if (outColumns) outColumns.textContent = String(st.columns);
        if (outMinCol) outMinCol.textContent = Math.round(st.minCol) + "px";
        if (outRows) outRows.textContent = String(st.rows);
        if (outItems) outItems.textContent = String(st.itemCount);
        if (outGap) outGap.textContent = Math.round(st.gap) + "px";
        if (outRowGap) outRowGap.textContent = Math.round(st.rowGap) + "px";
        if (outColGap) outColGap.textContent = Math.round(st.colGap) + "px";

        var built = buildGridCss(st);
        if (preview) {
          preview.style.gridTemplateColumns = built.tplCols;
          preview.style.gridTemplateRows = built.tplRows;
          if (st.separateGaps) {
            preview.style.rowGap = Math.round(st.rowGap) + "px";
            preview.style.columnGap = Math.round(st.colGap) + "px";
            preview.style.gap = "";
          } else {
            preview.style.gap = Math.round(st.gap) + "px";
            preview.style.rowGap = "";
            preview.style.columnGap = "";
          }
          preview.style.alignItems = st.alignItems;
          preview.style.justifyItems = st.justifyItems;
          preview.style.alignContent = st.alignContent;
          preview.style.justifyContent = st.justifyContent;
          preview.style.gridAutoFlow = st.autoFlow;
        }

        if (meta) {
          var chips = [];
          chips.push('<span class="grid-chip">cols: ' + escapeHtml(built.tplCols) + "</span>");
          chips.push('<span class="grid-chip">rows: ' + escapeHtml(built.tplRows) + "</span>");
          chips.push('<span class="grid-chip">items: ' + st.itemCount + "</span>");
          meta.innerHTML = chips.join("");
        }

        if (cssOut) cssOut.textContent = built.css;
      }

      function applyState(next) {
        st = normalizeState(next);
        saveJson(STORAGE_STATE, st);
        syncControls();
        renderPreviewItems();
        renderAll();
      }

      function onChange() {
        readControls();
        setModeVisibility();
        setGapVisibility();
        renderPreviewItems();
        renderAll();
      }

      [
        elMode,
        elColumns,
        elMinCol,
        elRows,
        elItems,
        elSep,
        elGap,
        elRowGap,
        elColGap,
        elAlignItems,
        elJustifyItems,
        elAlignContent,
        elJustifyContent,
        elAutoFlow,
      ].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#grid-copy").addEventListener(
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

      root.querySelector("#grid-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("그리드 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#grid-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "g-" + Date.now(), name: name, state: normalizeState(st) });
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
      renderPreviewItems();
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

