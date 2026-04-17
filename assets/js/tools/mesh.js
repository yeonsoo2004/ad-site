/* tool: mesh — mesh gradient builder (layered radial-gradients) */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "mesh-state";
  var STORAGE_PRESETS = "mesh-presets";

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
      base: "#0b1220",
      blur: 60,
      blobs: [
        { color: "#22d3ee", x: 22, y: 18, size: 42, opacity: 70 },
        { color: "#a855f7", x: 78, y: 30, size: 48, opacity: 62 },
        { color: "#fb7185", x: 55, y: 78, size: 58, opacity: 58 },
        { color: "#34d399", x: 18, y: 78, size: 45, opacity: 40 },
      ],
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    var next = {
      base: typeof st.base === "string" ? st.base : "#0b1220",
      blur: clamp(Number(st.blur || 60), 0, 120),
      blobs: Array.isArray(st.blobs) ? st.blobs.slice(0, 6) : defaultState().blobs.slice(),
    };
    next.blobs = next.blobs
      .filter(function (b) {
        return b && typeof b.color === "string";
      })
      .map(function (b) {
        return {
          color: b.color,
          x: clamp(Number(b.x), 0, 100),
          y: clamp(Number(b.y), 0, 100),
          size: clamp(Number(b.size), 10, 90),
          opacity: clamp(Number(b.opacity), 0, 100),
        };
      });
    if (next.blobs.length < 2) next.blobs = defaultState().blobs.slice(0, 2);
    return next;
  }

  function buildBackgroundImageCss(st) {
    st = normalizeState(st);
    var layers = st.blobs.map(function (b) {
      var a = clamp(b.opacity / 100, 0, 1);
      return (
        "radial-gradient(circle at " +
        Math.round(b.x) +
        "% " +
        Math.round(b.y) +
        "%, color-mix(in oklab, " +
        b.color +
        " " +
        Math.round(a * 100) +
        "%, transparent) 0%, transparent " +
        Math.round(b.size) +
        "%)"
      );
    });
    return layers.join(", ");
  }

  function buildCss(st) {
    st = normalizeState(st);
    var img = buildBackgroundImageCss(st);
    return (
      ".mesh-bg {\n" +
      "  background-color: " +
      st.base +
      ";\n" +
      "  background-image: " +
      img +
      ";\n" +
      "  filter: blur(" +
      Math.round(st.blur) +
      "px);\n" +
      "}\n"
    );
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="메쉬 그라디언트">' +
      '<header class="page-hero">' +
      "<h1>메쉬 그라디언트</h1>" +
      "<p>여러 개의 radial-gradient 레이어로 메쉬 느낌을 만들고, CSS를 복사하거나 프리셋으로 저장하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="mesh-controls-heading">' +
      '<h2 id="mesh-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="mesh-base">베이스 배경색</label>' +
      '<input type="color" id="mesh-base" value="#0b1220" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="mesh-blur">블러 <span class="value" id="out-mesh-blur">60px</span></label>' +
      '<input type="range" id="mesh-blur" min="0" max="120" value="60" step="1" />' +
      "</div>" +
      '<div class="mesh-blobs">' +
      '<div class="mesh-blobs__head">' +
      '<div class="mesh-blobs__title">블롭(레이어)</div>' +
      '<div class="mesh-blobs__actions">' +
      '<button type="button" class="btn btn--ghost mesh-mini" id="mesh-add">+ 추가</button>' +
      '<button type="button" class="btn btn--ghost mesh-mini" id="mesh-random">랜덤</button>' +
      "</div>" +
      "</div>" +
      '<div id="mesh-blob-list"></div>' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="mesh-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="mesh-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="mesh-preview-heading">' +
      '<h2 id="mesh-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="mesh-stage" id="mesh-stage">' +
      '<div class="mesh-surface" id="mesh-surface" aria-hidden="true"></div>' +
      '<div class="mesh-card" id="mesh-card">' +
      '<div class="mesh-card__title">Mesh</div>' +
      '<div class="mesh-card__sub">Layered radial-gradients</div>' +
      "</div>" +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="mesh-code-heading">' +
      '<h2 id="mesh-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="mesh-copy">복사</button></div>' +
      '<pre><code id="mesh-css"></code></pre>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="mesh-presets-heading">' +
      '<h2 id="mesh-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="mesh-presets" class="mesh-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("mesh-inline-style")) return;
    var style = document.createElement("style");
    style.id = "mesh-inline-style";
    style.textContent =
      ".mesh-mini{padding:var(--space-2) var(--space-4)}" +
      ".mesh-blobs{margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--color-border-subtle)}" +
      ".mesh-blobs__head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-3)}" +
      ".mesh-blobs__title{font-size:var(--text-sm);font-weight:800;color:var(--color-text-primary)}" +
      ".mesh-blobs__actions{display:flex;gap:var(--space-2)}" +
      ".mesh-blob{border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);padding:var(--space-3);background:var(--color-surface);margin-bottom:var(--space-3)}" +
      ".mesh-blob__row{display:grid;grid-template-columns:48px 1fr auto;gap:var(--space-3);align-items:center;margin-bottom:var(--space-3)}" +
      ".mesh-blob__row:last-child{margin-bottom:0}" +
      ".mesh-blob__row input[type=color]{height:40px;border-radius:var(--radius-md)}" +
      ".mesh-blob__meta{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".mesh-blob__del{padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".mesh-blob__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}" +
      ".mesh-stage{position:relative;min-height:320px;display:flex;align-items:center;justify-content:center;padding:var(--space-8);border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid);overflow:hidden;isolation:isolate}" +
      ".mesh-surface{position:absolute;inset:-18%;filter:blur(60px);transform:scale(1.1);opacity:1;z-index:0}" +
      ".mesh-card{position:relative;z-index:1;width:min(100%,380px);min-height:180px;border-radius:24px;padding:var(--space-6);border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 28px 60px rgba(0,0,0,.35)}" +
      "html[data-theme=\"light\"] .mesh-card{border-color:rgba(15,23,42,.12);background:rgba(255,255,255,.65);box-shadow:0 28px 60px rgba(15,23,42,.12)}" +
      ".mesh-card__title{font-size:var(--text-2xl);font-weight:900;letter-spacing:var(--tracking-tight);color:var(--color-text-primary)}" +
      ".mesh-card__sub{margin-top:6px;font-size:var(--text-sm);color:var(--color-text-secondary)}" +
      ".mesh-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".mesh-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".mesh-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".mesh-preset__swatch{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.16);flex:0 0 auto}" +
      "html[data-theme=\"light\"] .mesh-preset__swatch{border-color:rgba(15,23,42,.12)}" +
      ".mesh-preset__name{font-size:var(--text-sm);font-weight:800;color:var(--color-text-primary)}" +
      ".mesh-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".mesh-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".mesh-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
        var img = escapeHtml(buildBackgroundImageCss(p.state));
        var bg = escapeHtml(p.state.base);
        return (
          '<div class="mesh-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="mesh-preset__swatch" style="background-color:' +
          bg +
          ";background-image:" +
          img +
          '"></div>' +
          '<div class="mesh-preset__body">' +
          '<div class="mesh-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="mesh-preset__meta">' +
          normalizeState(p.state).blobs.length +
          " blobs · blur " +
          Math.round(normalizeState(p.state).blur) +
          "px</div>" +
          "</div>" +
          '<button type="button" class="mesh-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  function randomHex() {
    var n = Math.floor(Math.random() * 0xffffff);
    return "#" + n.toString(16).padStart(6, "0");
  }

  function randomize(st) {
    st = normalizeState(st);
    st.base = "#0b1220";
    st.blur = clamp(Math.round(40 + Math.random() * 70), 0, 120);
    st.blobs = st.blobs.map(function (b) {
      return {
        color: randomHex(),
        x: Math.round(Math.random() * 100),
        y: Math.round(Math.random() * 100),
        size: Math.round(28 + Math.random() * 52),
        opacity: Math.round(35 + Math.random() * 45),
      };
    });
    return st;
  }

  window.Tools = window.Tools || {};
  window.Tools.mesh = {
    id: "mesh",
    title: "메쉬 그라디언트",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elBase = root.querySelector("#mesh-base");
      var elBlur = root.querySelector("#mesh-blur");
      var outBlur = root.querySelector("#out-mesh-blur");
      var listHost = root.querySelector("#mesh-blob-list");

      var surface = root.querySelector("#mesh-surface");
      var cssOut = root.querySelector("#mesh-css");
      var presetsHost = root.querySelector("#mesh-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function saveState() {
        saveJson(STORAGE_STATE, st);
      }

      function renderBlobs() {
        listHost.innerHTML = st.blobs
          .map(function (b, idx) {
            return (
              '<div class="mesh-blob" data-blob-idx="' +
              idx +
              '">' +
              '<div class="mesh-blob__row">' +
              '<input type="color" value="' +
              escapeHtml(b.color) +
              '" data-blob-color />' +
              '<div>' +
              '<label class="sr-only" for="mesh-x-' +
              idx +
              '">X</label>' +
              '<input type="range" id="mesh-x-' +
              idx +
              '" min="0" max="100" step="1" value="' +
              Math.round(b.x) +
              '" data-blob-x />' +
              '<div class="mesh-blob__meta">X: <span data-out-x>' +
              Math.round(b.x) +
              "%</span></div>" +
              "</div>" +
              (st.blobs.length > 2
                ? '<button type="button" class="mesh-blob__del" data-blob-del aria-label="블롭 삭제">삭제</button>'
                : "<span></span>") +
              "</div>" +
              '<div class="mesh-blob__row">' +
              "<span></span>" +
              '<div>' +
              '<label class="sr-only" for="mesh-y-' +
              idx +
              '">Y</label>' +
              '<input type="range" id="mesh-y-' +
              idx +
              '" min="0" max="100" step="1" value="' +
              Math.round(b.y) +
              '" data-blob-y />' +
              '<div class="mesh-blob__meta">Y: <span data-out-y>' +
              Math.round(b.y) +
              "%</span></div>" +
              "</div>" +
              "<span></span>" +
              "</div>" +
              '<div class="mesh-blob__row">' +
              "<span></span>" +
              '<div>' +
              '<label class="sr-only" for="mesh-size-' +
              idx +
              '">Size</label>' +
              '<input type="range" id="mesh-size-' +
              idx +
              '" min="10" max="90" step="1" value="' +
              Math.round(b.size) +
              '" data-blob-size />' +
              '<div class="mesh-blob__meta">Size: <span data-out-size>' +
              Math.round(b.size) +
              "%</span></div>" +
              "</div>" +
              "<span></span>" +
              "</div>" +
              '<div class="mesh-blob__row">' +
              "<span></span>" +
              '<div>' +
              '<label class="sr-only" for="mesh-op-' +
              idx +
              '">Opacity</label>' +
              '<input type="range" id="mesh-op-' +
              idx +
              '" min="0" max="100" step="1" value="' +
              Math.round(b.opacity) +
              '" data-blob-opacity />' +
              '<div class="mesh-blob__meta">Opacity: <span data-out-op>' +
              Math.round(b.opacity) +
              "%</span></div>" +
              "</div>" +
              "<span></span>" +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      }

      function renderAll() {
        if (outBlur) outBlur.textContent = Math.round(st.blur) + "px";
        if (elBase) elBase.value = st.base;
        if (elBlur) elBlur.value = st.blur;

        var img = buildBackgroundImageCss(st);
        if (surface) {
          surface.style.backgroundColor = st.base;
          surface.style.backgroundImage = img;
          surface.style.filter = "blur(" + Math.round(st.blur) + "px)";
        }

        if (cssOut) {
          cssOut.textContent =
            ".mesh-bg {\n" +
            "  background-color: " +
            st.base +
            ";\n" +
            "  background-image: " +
            img +
            ";\n" +
            "}\n";
        }
      }

      function applyState(next) {
        st = normalizeState(next);
        saveState();
        renderBlobs();
        renderAll();
      }

      function updateFromInputs(target) {
        var row = target.closest("[data-blob-idx]");
        if (!row) return;
        var idx = Number(row.getAttribute("data-blob-idx"));
        if (!st.blobs[idx]) return;

        if (target.matches("[data-blob-color]")) st.blobs[idx].color = target.value;
        if (target.matches("[data-blob-x]")) {
          st.blobs[idx].x = clamp(Number(target.value), 0, 100);
          var ox = row.querySelector("[data-out-x]");
          if (ox) ox.textContent = Math.round(st.blobs[idx].x) + "%";
        }
        if (target.matches("[data-blob-y]")) {
          st.blobs[idx].y = clamp(Number(target.value), 0, 100);
          var oy = row.querySelector("[data-out-y]");
          if (oy) oy.textContent = Math.round(st.blobs[idx].y) + "%";
        }
        if (target.matches("[data-blob-size]")) {
          st.blobs[idx].size = clamp(Number(target.value), 10, 90);
          var os = row.querySelector("[data-out-size]");
          if (os) os.textContent = Math.round(st.blobs[idx].size) + "%";
        }
        if (target.matches("[data-blob-opacity]")) {
          st.blobs[idx].opacity = clamp(Number(target.value), 0, 100);
          var oo = row.querySelector("[data-out-op]");
          if (oo) oo.textContent = Math.round(st.blobs[idx].opacity) + "%";
        }

        saveState();
        renderAll();
      }

      elBase.addEventListener(
        "input",
        function () {
          st.base = elBase.value;
          saveState();
          renderAll();
        },
        { signal: ac.signal }
      );

      elBlur.addEventListener(
        "input",
        function () {
          st.blur = clamp(Number(elBlur.value), 0, 120);
          saveState();
          renderAll();
        },
        { signal: ac.signal }
      );

      listHost.addEventListener(
        "input",
        function (e) {
          updateFromInputs(e.target);
        },
        { signal: ac.signal }
      );

      listHost.addEventListener(
        "click",
        function (e) {
          var del = e.target.closest("[data-blob-del]");
          if (!del) return;
          var row = e.target.closest("[data-blob-idx]");
          if (!row) return;
          if (st.blobs.length <= 2) return;
          var idx = Number(row.getAttribute("data-blob-idx"));
          st.blobs.splice(idx, 1);
          applyState(st);
        },
        { signal: ac.signal }
      );

      root.querySelector("#mesh-add").addEventListener(
        "click",
        function () {
          if (st.blobs.length >= 6) return toast("블롭은 최대 6개까지 추가할 수 있어요.");
          st.blobs.push({ color: "#ffffff", x: 50, y: 50, size: 50, opacity: 45 });
          applyState(st);
        },
        { signal: ac.signal }
      );

      root.querySelector("#mesh-random").addEventListener(
        "click",
        function () {
          applyState(randomize(st));
          toast("메쉬를 랜덤으로 생성했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#mesh-copy").addEventListener(
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

      root.querySelector("#mesh-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("메쉬 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#mesh-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);

          var list = loadPresets();
          list.unshift({ id: "m-" + Date.now(), name: name, state: normalizeState(st) });
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

