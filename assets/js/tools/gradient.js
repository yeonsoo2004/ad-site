/* tool: gradient — gradient maker (linear/radial/conic) */
(function () {
  var Hub = window.Hub || {};
  var showToast = Hub.toast || function () {};

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

  var STORAGE_STATE = "gradient-state";
  var STORAGE_PRESETS = "gradient-presets";
  var loadJson = Hub.loadJson || function (key, fallback) { return fallback; };
  var saveJson = Hub.saveJson || function () {};

  function defaultState() {
    return {
      type: "linear", // linear | radial | conic
      angle: 135,
      size: "closest-side", // radial size
      position: "center", // radial position
      conicFrom: 0,
      stops: [
        { color: "#22d3ee", pos: 0 },
        { color: "#a855f7", pos: 55 },
        { color: "#fb7185", pos: 100 },
      ],
    };
  }

  function normalizeStops(stops) {
    var list = Array.isArray(stops) ? stops.slice() : [];
    list = list
      .filter(function (s) {
        return s && typeof s.color === "string" && s.color.trim();
      })
      .map(function (s) {
        var pos = Number(s.pos);
        if (!Number.isFinite(pos)) pos = 0;
        return { color: s.color, pos: clamp(Math.round(pos), 0, 100) };
      });

    if (list.length < 2) {
      return defaultState().stops.slice(0, 2);
    }
    if (list.length > 5) list = list.slice(0, 5);

    // keep sorted for nicer output
    list.sort(function (a, b) {
      return a.pos - b.pos;
    });
    return list;
  }

  function buildGradientCss(st) {
    var stops = normalizeStops(st.stops);
    var stopCss = stops
      .map(function (s) {
        return s.color + " " + s.pos + "%";
      })
      .join(", ");

    if (st.type === "radial") {
      return "radial-gradient(" + st.size + " at " + st.position + ", " + stopCss + ")";
    }
    if (st.type === "conic") {
      return "conic-gradient(from " + Number(st.conicFrom || 0) + "deg at center, " + stopCss + ")";
    }
    // linear
    return "linear-gradient(" + Number(st.angle || 0) + "deg, " + stopCss + ")";
  }

  function toolTemplate() {
    return (
      '<section class="tool-root" aria-label="그라디언트 메이커">' +
      '<header class="page-hero page-hero--compact">' +
      "<h2>그라디언트 메이커</h2>" +
      "<p>Linear / Radial / Conic 그라디언트를 만들고 CSS를 복사하거나 프리셋으로 저장하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="grad-controls-heading">' +
      '<h2 id="grad-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="grad-type">타입</label>' +
      '<select id="grad-type" class="hub-select">' +
      '<option value="linear">Linear</option>' +
      '<option value="radial">Radial</option>' +
      '<option value="conic">Conic</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group" data-grad-only="linear">' +
      '<label for="grad-angle">각도 <span class="value" id="out-grad-angle">135°</span></label>' +
      '<input type="range" id="grad-angle" min="0" max="360" value="135" step="1" />' +
      "</div>" +
      '<div class="control-group" data-grad-only="radial">' +
      '<label for="grad-size">Radial size</label>' +
      '<select id="grad-size" class="hub-select">' +
      '<option value="closest-side">closest-side</option>' +
      '<option value="closest-corner">closest-corner</option>' +
      '<option value="farthest-side">farthest-side</option>' +
      '<option value="farthest-corner">farthest-corner</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group" data-grad-only="radial">' +
      '<label for="grad-position">Position</label>' +
      '<select id="grad-position" class="hub-select">' +
      '<option value="center">center</option>' +
      '<option value="top">top</option>' +
      '<option value="bottom">bottom</option>' +
      '<option value="left">left</option>' +
      '<option value="right">right</option>' +
      '<option value="top left">top left</option>' +
      '<option value="top right">top right</option>' +
      '<option value="bottom left">bottom left</option>' +
      '<option value="bottom right">bottom right</option>' +
      "</select>" +
      "</div>" +
      '<div class="control-group" data-grad-only="conic">' +
      '<label for="grad-conic-from">Conic from <span class="value" id="out-grad-conic-from">0°</span></label>' +
      '<input type="range" id="grad-conic-from" min="0" max="360" value="0" step="1" />' +
      "</div>" +
      '<div class="grad-stops">' +
      '<div class="grad-stops__head">' +
      '<div class="grad-stops__title">컬러 스톱</div>' +
      '<button type="button" class="btn btn--ghost grad-stops__add" id="grad-add-stop">+ 추가</button>' +
      "</div>" +
      '<div id="grad-stops-list"></div>' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="grad-save-preset">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="grad-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="grad-preview-heading">' +
      '<h2 id="grad-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="grad-stage" id="grad-stage">' +
      '<div class="grad-card" id="grad-card">' +
      '<div class="grad-card__badge">Preview</div>' +
      '<div class="grad-card__meta"><div class="grad-card__name">Gradient</div><div class="grad-card__sub">background-image</div></div>' +
      "</div>" +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="grad-code-heading">' +
      '<h2 id="grad-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="grad-copy">복사</button></div>' +
      '<pre><code id="grad-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="grad-presets-heading">' +
      '<h2 id="grad-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="grad-presets" class="grad-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("gradient-inline-style")) return;
    var style = document.createElement("style");
    style.id = "gradient-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".grad-stops{margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--color-border-subtle)}" +
      ".grad-stops__head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-3)}" +
      ".grad-stops__title{font-size:var(--text-sm);font-weight:700;color:var(--color-text-primary)}" +
      ".grad-stops__add{padding:var(--space-2) var(--space-4)}" +
      ".grad-stop{display:grid;grid-template-columns:48px 1fr auto;gap:var(--space-3);align-items:center;margin-bottom:var(--space-3)}" +
      ".grad-stop input[type=color]{height:40px;border-radius:var(--radius-md)}" +
      ".grad-stop input[type=range]{width:100%}" +
      ".grad-stop__pos{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-accent)}" +
      ".grad-stop__del{padding:var(--space-2) var(--space-3);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text-secondary)}" +
      ".grad-stop__del:hover{background:var(--color-surface-hover);color:var(--color-text-primary)}" +
      ".grad-stage{position:relative;min-height:300px;display:flex;align-items:center;justify-content:center;padding:var(--space-8);border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid);overflow:hidden}" +
      ".grad-stage::before{content:\"\";position:absolute;inset:-30%;filter:blur(30px);opacity:.35;background:radial-gradient(circle at 25% 20%, rgba(255,255,255,.18), transparent 55%),radial-gradient(circle at 85% 75%, rgba(255,255,255,.12), transparent 55%)}" +
      ".grad-card{position:relative;z-index:1;width:min(100%,360px);min-height:180px;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:var(--space-5);border:1px solid rgba(255,255,255,.18);box-shadow:0 24px 60px rgba(0,0,0,.35)}" +
      "html[data-theme=\"light\"] .grad-card{border-color:rgba(15,23,42,.12);box-shadow:0 24px 60px rgba(15,23,42,.12)}" +
      ".grad-card__badge{align-self:flex-start;font-size:var(--text-xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.18);color:#fff}" +
      "html[data-theme=\"light\"] .grad-card__badge{background:rgba(255,255,255,.55);color:rgba(15,23,42,.85);border-color:rgba(15,23,42,.10)}" +
      ".grad-card__name{font-size:var(--text-xl);font-weight:800;letter-spacing:var(--tracking-tight);color:#fff}" +
      ".grad-card__sub{margin-top:2px;font-size:var(--text-sm);color:rgba(255,255,255,.82)}" +
      "html[data-theme=\"light\"] .grad-card__name{color:rgba(15,23,42,.92)}" +
      "html[data-theme=\"light\"] .grad-card__sub{color:rgba(15,23,42,.6)}" +
      ".grad-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".grad-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".grad-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".grad-preset__swatch{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.16);flex:0 0 auto}" +
      "html[data-theme=\"light\"] .grad-preset__swatch{border-color:rgba(15,23,42,.12)}" +
      ".grad-preset__name{font-size:var(--text-sm);font-weight:750;color:var(--color-text-primary)}" +
      ".grad-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".grad-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".grad-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
    document.head.appendChild(style);
  }

  window.Tools = window.Tools || {};
  window.Tools.gradient = {
    id: "gradient",
    title: "그라디언트 메이커",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = toolTemplate();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elType = root.querySelector("#grad-type");
      var elAngle = root.querySelector("#grad-angle");
      var outAngle = root.querySelector("#out-grad-angle");
      var elSize = root.querySelector("#grad-size");
      var elPos = root.querySelector("#grad-position");
      var elConicFrom = root.querySelector("#grad-conic-from");
      var outConicFrom = root.querySelector("#out-grad-conic-from");
      var stopsList = root.querySelector("#grad-stops-list");

      var stage = root.querySelector("#grad-stage");
      var card = root.querySelector("#grad-card");
      var cssOut = root.querySelector("#grad-css");
      var presetsHost = root.querySelector("#grad-presets");

      var st = loadJson(STORAGE_STATE, null) || defaultState();
      st.stops = normalizeStops(st.stops);

      function setModeVisibility() {
        var mode = elType.value;
        root.querySelectorAll("[data-grad-only]").forEach(function (el) {
          el.style.display = el.getAttribute("data-grad-only") === mode ? "" : "none";
        });
      }

      function renderStops() {
        var stops = normalizeStops(st.stops);
        st.stops = stops;
        stopsList.innerHTML = stops
          .map(function (s, idx) {
            return (
              '<div class="grad-stop" data-stop-idx="' +
              idx +
              '">' +
              '<input type="color" value="' +
              escapeHtml(s.color) +
              '" data-stop-color />' +
              '<div>' +
              '<input type="range" min="0" max="100" step="1" value="' +
              s.pos +
              '" data-stop-pos />' +
              '<div class="grad-stop__pos"><span>' +
              s.pos +
              "%</span></div>" +
              "</div>" +
              (stops.length > 2
                ? '<button type="button" class="grad-stop__del" data-stop-del aria-label="스톱 삭제">삭제</button>'
                : "<span></span>") +
              "</div>"
            );
          })
          .join("");
      }

      function readControls() {
        st.type = elType.value;
        st.angle = Number(elAngle.value);
        st.size = elSize.value;
        st.position = elPos.value;
        st.conicFrom = Number(elConicFrom.value);
        saveJson(STORAGE_STATE, st);
      }

      function renderAll() {
        if (outAngle) outAngle.textContent = Number(elAngle.value) + "°";
        if (outConicFrom) outConicFrom.textContent = Number(elConicFrom.value) + "°";

        var gradient = buildGradientCss(st);
        if (stage) stage.style.backgroundImage = gradient;
        if (card) card.style.backgroundImage = gradient;

        var css =
          ".gradient-bg {\n" +
          "  background-image: " +
          gradient +
          ";\n" +
          "}\n";
        if (cssOut) cssOut.textContent = css;
      }

      function loadPresets() {
        var list = loadJson(STORAGE_PRESETS, []);
        return Array.isArray(list) ? list : [];
      }

      function savePresets(list) {
        saveJson(STORAGE_PRESETS, list);
      }

      function renderPresets() {
        var list = loadPresets();
        if (!presetsHost) return;
        if (list.length === 0) {
          presetsHost.innerHTML =
            '<p class="presets-empty" role="status">저장된 프리셋이 없습니다. 좌측에서 「프리셋 저장」을 눌러 추가해 보세요.</p>';
          return;
        }
        presetsHost.innerHTML = list
          .map(function (p) {
            var swatch = escapeHtml(buildGradientCss(p.state));
            return (
              '<div class="grad-preset" data-preset-id="' +
              escapeHtml(p.id) +
              '">' +
              '<div class="grad-preset__swatch" style="background-image:' +
              swatch +
              '"></div>' +
              '<div class="grad-preset__body">' +
              '<div class="grad-preset__name">' +
              escapeHtml(p.name) +
              "</div>" +
              '<div class="grad-preset__meta">' +
              escapeHtml(p.state.type) +
              " · " +
              normalizeStops(p.state.stops).length +
              " stops</div>" +
              "</div>" +
              '<button type="button" class="grad-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
              "</div>"
            );
          })
          .join("");
      }

      function applyState(next) {
        st = next || defaultState();
        st.stops = normalizeStops(st.stops);
        elType.value = st.type;
        elAngle.value = Number(st.angle || 0);
        elSize.value = st.size || "closest-side";
        elPos.value = st.position || "center";
        elConicFrom.value = Number(st.conicFrom || 0);
        setModeVisibility();
        renderStops();
        saveJson(STORAGE_STATE, st);
        renderAll();
      }

      elType.addEventListener(
        "change",
        function () {
          readControls();
          setModeVisibility();
          renderAll();
        },
        { signal: ac.signal }
      );

      [elAngle, elSize, elPos, elConicFrom].forEach(function (el) {
        el.addEventListener(
          "input",
          function () {
            readControls();
            renderAll();
          },
          { signal: ac.signal }
        );
        el.addEventListener(
          "change",
          function () {
            readControls();
            renderAll();
          },
          { signal: ac.signal }
        );
      });

      root.querySelector("#grad-add-stop").addEventListener(
        "click",
        function () {
          var stops = normalizeStops(st.stops);
          if (stops.length >= 5) return showToast("스톱은 최대 5개까지 추가할 수 있어요.");
          var last = stops[stops.length - 1];
          var nextPos = clamp((last ? last.pos : 100) - 10, 0, 100);
          stops.splice(stops.length - 1, 0, { color: "#ffffff", pos: nextPos });
          st.stops = normalizeStops(stops);
          saveJson(STORAGE_STATE, st);
          renderStops();
          renderAll();
        },
        { signal: ac.signal }
      );

      stopsList.addEventListener(
        "input",
        function (e) {
          var row = e.target.closest("[data-stop-idx]");
          if (!row) return;
          var idx = Number(row.getAttribute("data-stop-idx"));
          var stops = normalizeStops(st.stops);
          if (!stops[idx]) return;
          if (e.target.matches("[data-stop-color]")) {
            stops[idx].color = e.target.value;
          }
          if (e.target.matches("[data-stop-pos]")) {
            stops[idx].pos = clamp(Number(e.target.value), 0, 100);
            var posOut = row.querySelector(".grad-stop__pos span");
            if (posOut) posOut.textContent = stops[idx].pos + "%";
          }
          st.stops = normalizeStops(stops);
          saveJson(STORAGE_STATE, st);
          renderAll();
        },
        { signal: ac.signal }
      );

      stopsList.addEventListener(
        "click",
        function (e) {
          var del = e.target.closest("[data-stop-del]");
          if (!del) return;
          var row = e.target.closest("[data-stop-idx]");
          if (!row) return;
          var idx = Number(row.getAttribute("data-stop-idx"));
          var stops = normalizeStops(st.stops);
          if (stops.length <= 2) return;
          stops.splice(idx, 1);
          st.stops = normalizeStops(stops);
          saveJson(STORAGE_STATE, st);
          renderStops();
          renderAll();
        },
        { signal: ac.signal }
      );

      root.querySelector("#grad-copy").addEventListener(
        "click",
        function () {
          var text = cssOut ? cssOut.textContent : "";
          if (!text) return;
          var copy = Hub.copyText ? Hub.copyText(text) : Promise.reject(new Error("no copy"));
          copy.then(function () {
            showToast("클립보드에 복사했습니다");
          }).catch(function () {
            showToast("복사에 실패했습니다.");
          });
        },
        { signal: ac.signal }
      );

      root.querySelector("#grad-save-preset").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return showToast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);

          var list = loadPresets();
          list.unshift({
            id: "g-" + Date.now(),
            name: name,
            state: {
              type: st.type,
              angle: st.angle,
              size: st.size,
              position: st.position,
              conicFrom: st.conicFrom,
              stops: normalizeStops(st.stops),
            },
          });
          if (list.length > 40) list = list.slice(0, 40);
          savePresets(list);
          renderPresets();
          showToast("「" + name + "」 프리셋을 저장했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#grad-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          showToast("그라디언트 값을 초기화했습니다.");
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
            renderPresets();
            showToast("프리셋을 삭제했습니다.");
            return;
          }

          var list = loadPresets();
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
              applyState(list[i].state);
              showToast("프리셋을 불러왔습니다.");
              return;
            }
          }
        },
        { signal: ac.signal }
      );

      applyState(st);
      renderPresets();

      return function cleanup() {
        try {
          ac.abort();
        } catch (e) {}
        container.innerHTML = "";
      };
    },
  };
})();

