/* tool: flex — flexbox builder */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "flex-state";
  var STORAGE_PRESETS = "flex-presets";

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
      card: "#111827",
      direction: "row",
      wrap: "wrap",
      justify: "flex-start",
      align: "stretch",
      alignContent: "flex-start",
      gapMode: "single", // single | split
      gap: 12,
      rowGap: 12,
      colGap: 12,
      itemCount: 10,
      itemMinW: 92,
      itemMinH: 54,
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    var gapMode = st.gapMode === "split" ? "split" : "single";
    var next = {
      bg: typeof st.bg === "string" ? st.bg : "#0b1220",
      card: typeof st.card === "string" ? st.card : "#111827",
      direction: st.direction === "column" ? "column" : "row",
      wrap: st.wrap === "nowrap" || st.wrap === "wrap-reverse" ? st.wrap : "wrap",
      justify: st.justify || "flex-start",
      align: st.align || "stretch",
      alignContent: st.alignContent || "flex-start",
      gapMode: gapMode,
      gap: clamp(Number(st.gap), 0, 48),
      rowGap: clamp(Number(st.rowGap), 0, 48),
      colGap: clamp(Number(st.colGap), 0, 48),
      itemCount: clamp(Number(st.itemCount), 1, 36),
      itemMinW: clamp(Number(st.itemMinW), 48, 220),
      itemMinH: clamp(Number(st.itemMinH), 28, 140),
    };
    if (gapMode === "single") {
      next.rowGap = next.gap;
      next.colGap = next.gap;
    }
    return next;
  }

  function buildCss(st) {
    st = normalizeState(st);
    var css =
      ".flex {\n" +
      "  display: flex;\n" +
      "  flex-direction: " +
      st.direction +
      ";\n" +
      "  flex-wrap: " +
      st.wrap +
      ";\n" +
      "  justify-content: " +
      st.justify +
      ";\n" +
      "  align-items: " +
      st.align +
      ";\n" +
      "  align-content: " +
      st.alignContent +
      ";\n";

    if (st.gapMode === "split") {
      css += "  row-gap: " + Math.round(st.rowGap) + "px;\n";
      css += "  column-gap: " + Math.round(st.colGap) + "px;\n";
    } else {
      css += "  gap: " + Math.round(st.gap) + "px;\n";
    }

    css += "}\n\n";
    css +=
      ".flex > .item {\n" +
      "  min-width: " +
      Math.round(st.itemMinW) +
      "px;\n" +
      "  min-height: " +
      Math.round(st.itemMinH) +
      "px;\n" +
      "}\n";
    return css;
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="플렉스박스 빌더">' +
      '<header class="page-hero">' +
      "<h1>플렉스박스 빌더</h1>" +
      "<p>flex 컨테이너 설정을 미리보고, CSS를 복사하거나 프리셋으로 저장하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="fx-controls-heading">' +
      '<h2 id="fx-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group"><label for="fx-bg">배경</label><input type="color" id="fx-bg" value="#0b1220" /></div>' +
      '<div class="control-group"><label for="fx-card">컨테이너 배경</label><input type="color" id="fx-card" value="#111827" /></div>' +
      '<div class="control-group"><label for="fx-direction">flex-direction</label>' +
      '<select id="fx-direction" class="hub-select"><option value="row">row</option><option value="column">column</option></select></div>' +
      '<div class="control-group"><label for="fx-wrap">flex-wrap</label>' +
      '<select id="fx-wrap" class="hub-select"><option value="wrap">wrap</option><option value="nowrap">nowrap</option><option value="wrap-reverse">wrap-reverse</option></select></div>' +
      '<div class="control-group"><label for="fx-justify">justify-content</label>' +
      '<select id="fx-justify" class="hub-select">' +
      '<option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option>' +
      '<option value="space-between">space-between</option><option value="space-around">space-around</option><option value="space-evenly">space-evenly</option>' +
      "</select></div>" +
      '<div class="control-group"><label for="fx-align">align-items</label>' +
      '<select id="fx-align" class="hub-select"><option value="stretch">stretch</option><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="baseline">baseline</option></select></div>' +
      '<div class="control-group"><label for="fx-align-content">align-content</label>' +
      '<select id="fx-align-content" class="hub-select"><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="space-between">space-between</option><option value="space-around">space-around</option><option value="space-evenly">space-evenly</option><option value="stretch">stretch</option></select></div>' +
      '<div class="control-group"><label for="fx-gap-mode">Gap 옵션</label>' +
      '<select id="fx-gap-mode" class="hub-select"><option value="single">gap</option><option value="split">row/column 분리</option></select></div>' +
      '<div class="control-group" data-fx-gap="single"><label for="fx-gap">gap <span class="value" id="out-fx-gap">12px</span></label><input type="range" id="fx-gap" min="0" max="48" value="12" step="1" /></div>' +
      '<div class="control-group" data-fx-gap="split"><label for="fx-row-gap">row-gap <span class="value" id="out-fx-row-gap">12px</span></label><input type="range" id="fx-row-gap" min="0" max="48" value="12" step="1" /></div>' +
      '<div class="control-group" data-fx-gap="split"><label for="fx-col-gap">column-gap <span class="value" id="out-fx-col-gap">12px</span></label><input type="range" id="fx-col-gap" min="0" max="48" value="12" step="1" /></div>' +
      '<div class="control-group"><label for="fx-items">아이템 수 <span class="value" id="out-fx-items">10</span></label><input type="range" id="fx-items" min="1" max="36" value="10" step="1" /></div>' +
      '<div class="control-group"><label for="fx-minw">min-width <span class="value" id="out-fx-minw">92px</span></label><input type="range" id="fx-minw" min="48" max="220" value="92" step="1" /></div>' +
      '<div class="control-group"><label for="fx-minh">min-height <span class="value" id="out-fx-minh">54px</span></label><input type="range" id="fx-minh" min="28" max="140" value="54" step="1" /></div>' +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="fx-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="fx-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="fx-preview-heading">' +
      '<h2 id="fx-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="fx-stage" id="fx-stage"><div class="fx-flex" id="fx-flex"></div></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="fx-code-heading">' +
      '<h2 id="fx-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block"><div class="code-block__actions"><button type="button" class="btn btn--primary" id="fx-copy">복사</button></div><pre><code id="fx-css"></code></pre></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="fx-presets-heading">' +
      '<h2 id="fx-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="fx-presets" class="fx-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("flex-inline-style")) return;
    var style = document.createElement("style");
    style.id = "flex-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".fx-stage{min-height:320px;display:flex;align-items:center;justify-content:center;padding:var(--space-6);border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid)}" +
      ".fx-flex{width:100%;max-width:760px;min-height:260px;border-radius:22px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);padding:var(--space-5);display:flex}" +
      "html[data-theme=\"light\"] .fx-flex{border-color:rgba(15,23,42,.12);background:rgba(255,255,255,.75)}" +
      ".fx-item{border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:var(--text-xs);color:rgba(255,255,255,.9)}" +
      "html[data-theme=\"light\"] .fx-item{background:rgba(15,23,42,.06);color:rgba(15,23,42,.8);border-color:rgba(15,23,42,.12)}" +
      ".fx-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".fx-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".fx-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".fx-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".fx-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".fx-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".fx-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
          '<div class="fx-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="fx-preset__body">' +
          '<div class="fx-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="fx-preset__meta">' +
          escapeHtml(st.direction) +
          " · " +
          escapeHtml(st.wrap) +
          " · gap " +
          Math.round(st.gapMode === "split" ? st.rowGap : st.gap) +
          "px</div>" +
          "</div>" +
          '<button type="button" class="fx-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.flex = {
    id: "flex",
    title: "플렉스박스 빌더",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elBg = root.querySelector("#fx-bg");
      var elCard = root.querySelector("#fx-card");
      var elDirection = root.querySelector("#fx-direction");
      var elWrap = root.querySelector("#fx-wrap");
      var elJustify = root.querySelector("#fx-justify");
      var elAlign = root.querySelector("#fx-align");
      var elAlignContent = root.querySelector("#fx-align-content");
      var elGapMode = root.querySelector("#fx-gap-mode");
      var elGap = root.querySelector("#fx-gap");
      var elRowGap = root.querySelector("#fx-row-gap");
      var elColGap = root.querySelector("#fx-col-gap");
      var elItems = root.querySelector("#fx-items");
      var elMinW = root.querySelector("#fx-minw");
      var elMinH = root.querySelector("#fx-minh");

      var outGap = root.querySelector("#out-fx-gap");
      var outRowGap = root.querySelector("#out-fx-row-gap");
      var outColGap = root.querySelector("#out-fx-col-gap");
      var outItems = root.querySelector("#out-fx-items");
      var outMinW = root.querySelector("#out-fx-minw");
      var outMinH = root.querySelector("#out-fx-minh");

      var stage = root.querySelector("#fx-stage");
      var flex = root.querySelector("#fx-flex");
      var cssOut = root.querySelector("#fx-css");
      var presetsHost = root.querySelector("#fx-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function setGapVisibility() {
        var m = elGapMode.value;
        root.querySelectorAll("[data-fx-gap]").forEach(function (el) {
          el.style.display = el.getAttribute("data-fx-gap") === m ? "" : "none";
        });
      }

      function syncControls() {
        elBg.value = st.bg;
        elCard.value = st.card;
        elDirection.value = st.direction;
        elWrap.value = st.wrap;
        elJustify.value = st.justify;
        elAlign.value = st.align;
        elAlignContent.value = st.alignContent;
        elGapMode.value = st.gapMode;
        elGap.value = st.gap;
        elRowGap.value = st.rowGap;
        elColGap.value = st.colGap;
        elItems.value = st.itemCount;
        elMinW.value = st.itemMinW;
        elMinH.value = st.itemMinH;
        setGapVisibility();
      }

      function readControls() {
        st = normalizeState({
          bg: elBg.value,
          card: elCard.value,
          direction: elDirection.value,
          wrap: elWrap.value,
          justify: elJustify.value,
          align: elAlign.value,
          alignContent: elAlignContent.value,
          gapMode: elGapMode.value,
          gap: Number(elGap.value),
          rowGap: Number(elRowGap.value),
          colGap: Number(elColGap.value),
          itemCount: Number(elItems.value),
          itemMinW: Number(elMinW.value),
          itemMinH: Number(elMinH.value),
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderItems() {
        flex.innerHTML = "";
        for (var i = 1; i <= st.itemCount; i++) {
          var div = document.createElement("div");
          div.className = "fx-item";
          div.textContent = String(i);
          div.style.minWidth = Math.round(st.itemMinW) + "px";
          div.style.minHeight = Math.round(st.itemMinH) + "px";
          flex.appendChild(div);
        }
      }

      function renderAll() {
        if (outGap) outGap.textContent = Math.round(st.gap) + "px";
        if (outRowGap) outRowGap.textContent = Math.round(st.rowGap) + "px";
        if (outColGap) outColGap.textContent = Math.round(st.colGap) + "px";
        if (outItems) outItems.textContent = String(Math.round(st.itemCount));
        if (outMinW) outMinW.textContent = Math.round(st.itemMinW) + "px";
        if (outMinH) outMinH.textContent = Math.round(st.itemMinH) + "px";

        if (stage) stage.style.background = st.bg;
        if (flex) {
          flex.style.background = st.card;
          flex.style.flexDirection = st.direction;
          flex.style.flexWrap = st.wrap;
          flex.style.justifyContent = st.justify;
          flex.style.alignItems = st.align;
          flex.style.alignContent = st.alignContent;
          if (st.gapMode === "split") {
            flex.style.rowGap = Math.round(st.rowGap) + "px";
            flex.style.columnGap = Math.round(st.colGap) + "px";
            flex.style.gap = "";
          } else {
            flex.style.gap = Math.round(st.gap) + "px";
            flex.style.rowGap = "";
            flex.style.columnGap = "";
          }
        }

        if (cssOut) cssOut.textContent = buildCss(st);
      }

      function applyState(next) {
        st = normalizeState(next);
        saveJson(STORAGE_STATE, st);
        syncControls();
        renderItems();
        renderAll();
      }

      function onChange() {
        readControls();
        setGapVisibility();
        renderItems();
        renderAll();
      }

      [
        elBg,
        elCard,
        elDirection,
        elWrap,
        elJustify,
        elAlign,
        elAlignContent,
        elGapMode,
        elGap,
        elRowGap,
        elColGap,
        elItems,
        elMinW,
        elMinH,
      ].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#fx-copy").addEventListener(
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

      root.querySelector("#fx-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("플렉스 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#fx-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "fx-" + Date.now(), name: name, state: normalizeState(st) });
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

