/* tool: animation — keyframes + animation shorthand generator */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "animation-state";
  var STORAGE_PRESETS = "animation-presets";

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
      preset: "fade-up", // fade | fade-up | slide-up | slide-right | scale | pop | wobble
      name: "anim",
      duration: 420, // ms
      delay: 0, // ms
      iterations: 1, // number or "infinite"
      direction: "normal",
      fill: "both",
      timing: "cubic-bezier(0.16, 1, 0.3, 1)", // easeOutExpo-ish
      // params
      distance: 18, // px (slide/fade-up)
      scaleFrom: 0.92,
      rotate: 0, // deg (wobble)
      opacityFrom: 0,
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    var iter = st.iterations === "infinite" ? "infinite" : clamp(Number(st.iterations), 1, 99);
    var preset = String(st.preset || "fade-up");
    return {
      preset: preset,
      name: String(st.name || "anim").trim() || "anim",
      duration: clamp(Number(st.duration), 80, 6000),
      delay: clamp(Number(st.delay), 0, 6000),
      iterations: iter,
      direction: st.direction || "normal",
      fill: st.fill || "both",
      timing: st.timing || "ease",
      distance: clamp(Number(st.distance), 0, 120),
      scaleFrom: clamp(Number(st.scaleFrom), 0.5, 1.2),
      rotate: clamp(Number(st.rotate), -45, 45),
      opacityFrom: clamp(Number(st.opacityFrom), 0, 1),
    };
  }

  function timingOptions() {
    return [
      { id: "ease", label: "ease" },
      { id: "ease-in", label: "ease-in" },
      { id: "ease-out", label: "ease-out" },
      { id: "ease-in-out", label: "ease-in-out" },
      { id: "linear", label: "linear" },
      { id: "cubic-bezier(0.16, 1, 0.3, 1)", label: "snappy (0.16,1,0.3,1)" },
      { id: "cubic-bezier(0.34, 1.56, 0.64, 1)", label: "overshoot (0.34,1.56,0.64,1)" },
    ];
  }

  function keyframesCss(st) {
    st = normalizeState(st);
    var n = st.name;
    var d = Math.round(st.distance);
    var s0 = round2(st.scaleFrom);
    var op0 = round2(st.opacityFrom);
    var rot = Math.round(st.rotate);

    if (st.preset === "fade") {
      return (
        "@keyframes " +
        n +
        " {\n" +
        "  from { opacity: " +
        op0 +
        "; }\n" +
        "  to { opacity: 1; }\n" +
        "}\n"
      );
    }

    if (st.preset === "slide-up") {
      return (
        "@keyframes " +
        n +
        " {\n" +
        "  from { transform: translateY(" +
        d +
        "px); }\n" +
        "  to { transform: translateY(0); }\n" +
        "}\n"
      );
    }

    if (st.preset === "slide-right") {
      return (
        "@keyframes " +
        n +
        " {\n" +
        "  from { transform: translateX(" +
        d +
        "px); }\n" +
        "  to { transform: translateX(0); }\n" +
        "}\n"
      );
    }

    if (st.preset === "scale") {
      return (
        "@keyframes " +
        n +
        " {\n" +
        "  from { transform: scale(" +
        s0 +
        "); }\n" +
        "  to { transform: scale(1); }\n" +
        "}\n"
      );
    }

    if (st.preset === "pop") {
      return (
        "@keyframes " +
        n +
        " {\n" +
        "  0% { transform: scale(" +
        s0 +
        "); opacity: " +
        op0 +
        "; }\n" +
        "  60% { transform: scale(1.04); opacity: 1; }\n" +
        "  100% { transform: scale(1); opacity: 1; }\n" +
        "}\n"
      );
    }

    if (st.preset === "wobble") {
      var a = rot || 6;
      return (
        "@keyframes " +
        n +
        " {\n" +
        "  0% { transform: translateY(" +
        d +
        "px) rotate(" +
        a +
        "deg); opacity: " +
        op0 +
        "; }\n" +
        "  50% { transform: translateY(-2px) rotate(" +
        -a +
        "deg); opacity: 1; }\n" +
        "  100% { transform: translateY(0) rotate(0deg); opacity: 1; }\n" +
        "}\n"
      );
    }

    // default: fade-up
    return (
      "@keyframes " +
      n +
      " {\n" +
      "  from { opacity: " +
      op0 +
      "; transform: translateY(" +
      d +
      "px); }\n" +
      "  to { opacity: 1; transform: translateY(0); }\n" +
      "}\n"
    );
  }

  function animationShorthand(st) {
    st = normalizeState(st);
    var it = st.iterations === "infinite" ? "infinite" : String(Math.round(st.iterations));
    return (
      st.name +
      " " +
      Math.round(st.duration) +
      "ms " +
      st.timing +
      " " +
      Math.round(st.delay) +
      "ms " +
      it +
      " " +
      st.direction +
      " " +
      st.fill
    );
  }

  function buildCss(st) {
    st = normalizeState(st);
    return (
      keyframesCss(st) +
      "\n" +
      ".anim-target {\n" +
      "  animation: " +
      animationShorthand(st) +
      ";\n" +
      "}\n"
    );
  }

  function template() {
    var timingOpts = timingOptions()
      .map(function (o) {
        return '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.label) + "</option>";
      })
      .join("");

    return (
      '<section class="tool-root" aria-label="애니메이션">' +
      '<header class="page-hero">' +
      "<h1>애니메이션</h1>" +
      "<p>keyframes + animation shorthand를 생성하고, 미리보기로 동작을 확인하세요.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="an-controls-heading">' +
      '<h2 id="an-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group"><label for="an-preset">프리셋</label>' +
      '<select id="an-preset" class="hub-select">' +
      '<option value="fade-up">fade-up</option>' +
      '<option value="fade">fade</option>' +
      '<option value="slide-up">slide-up</option>' +
      '<option value="slide-right">slide-right</option>' +
      '<option value="scale">scale</option>' +
      '<option value="pop">pop</option>' +
      '<option value="wobble">wobble</option>' +
      "</select></div>" +
      '<div class="control-group"><label for="an-name">keyframes 이름</label>' +
      '<input type="text" id="an-name" value="anim" autocomplete="off" spellcheck="false" /></div>' +
      '<div class="control-group"><label for="an-duration">duration <span class="value" id="out-an-duration">420ms</span></label>' +
      '<input type="range" id="an-duration" min="80" max="6000" value="420" step="10" /></div>' +
      '<div class="control-group"><label for="an-delay">delay <span class="value" id="out-an-delay">0ms</span></label>' +
      '<input type="range" id="an-delay" min="0" max="6000" value="0" step="10" /></div>' +
      '<div class="control-group"><label for="an-timing">timing-function</label>' +
      '<select id="an-timing" class="hub-select">' +
      timingOpts +
      "</select></div>" +
      '<div class="control-group"><label for="an-iter">iterations</label>' +
      '<select id="an-iter" class="hub-select"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="infinite">infinite</option></select></div>' +
      '<div class="control-group"><label for="an-dir">direction</label>' +
      '<select id="an-dir" class="hub-select"><option value="normal">normal</option><option value="reverse">reverse</option><option value="alternate">alternate</option><option value="alternate-reverse">alternate-reverse</option></select></div>' +
      '<div class="control-group"><label for="an-fill">fill-mode</label>' +
      '<select id="an-fill" class="hub-select"><option value="none">none</option><option value="forwards">forwards</option><option value="backwards">backwards</option><option value="both">both</option></select></div>' +
      '<div class="an-params">' +
      '<div class="an-params__title">파라미터</div>' +
      '<div class="control-group"><label for="an-distance">distance <span class="value" id="out-an-distance">18px</span></label>' +
      '<input type="range" id="an-distance" min="0" max="120" value="18" step="1" /></div>' +
      '<div class="control-group"><label for="an-scale-from">scale from <span class="value" id="out-an-scale-from">0.92</span></label>' +
      '<input type="range" id="an-scale-from" min="0.5" max="1.2" value="0.92" step="0.01" /></div>' +
      '<div class="control-group"><label for="an-opacity-from">opacity from <span class="value" id="out-an-opacity-from">0</span></label>' +
      '<input type="range" id="an-opacity-from" min="0" max="1" value="0" step="0.01" /></div>' +
      '<div class="control-group"><label for="an-rotate">rotate (wobble) <span class="value" id="out-an-rotate">0°</span></label>' +
      '<input type="range" id="an-rotate" min="-45" max="45" value="0" step="1" /></div>' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="an-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="an-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="an-preview-heading">' +
      '<h2 id="an-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="an-stage" id="an-stage">' +
      '<button type="button" class="btn btn--primary an-play" id="an-play">재생</button>' +
      '<div class="an-target" id="an-target"><div class="an-target__txt">Animate</div></div>' +
      "</div>" +
      '<div class="an-hint" id="an-hint"></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="an-code-heading">' +
      '<h2 id="an-code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block"><div class="code-block__actions"><button type="button" class="btn btn--primary" id="an-copy">복사</button></div><pre><code id="an-css"></code></pre></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="an-presets-heading">' +
      '<h2 id="an-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="an-presets" class="an-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("animation-inline-style")) return;
    var style = document.createElement("style");
    style.id = "animation-inline-style";
    style.textContent =
      ".hub-select{width:100%;padding:var(--space-3) var(--space-4);border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);background:var(--color-input-bg);color:var(--color-text-primary)}" +
      ".an-params{margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--color-border-subtle)}" +
      ".an-params__title{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary);margin-bottom:var(--space-3)}" +
      ".an-stage{position:relative;min-height:320px;display:flex;align-items:center;justify-content:center;padding:var(--space-8);border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);background:var(--color-bg-mid);overflow:hidden;isolation:isolate}" +
      ".an-play{position:absolute;top:var(--space-4);right:var(--space-4)}" +
      ".an-target{width:min(100%,360px);min-height:180px;border-radius:24px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 28px 60px rgba(0,0,0,.35)}" +
      "html[data-theme=\"light\"] .an-target{border-color:rgba(15,23,42,.12);background:rgba(255,255,255,.75);box-shadow:0 28px 60px rgba(15,23,42,.12)}" +
      ".an-target__txt{font-weight:950;letter-spacing:var(--tracking-tight);color:var(--color-text-primary);font-size:var(--text-2xl)}" +
      ".an-hint{margin-top:var(--space-3);font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".an-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".an-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".an-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".an-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".an-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".an-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".an-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
          '<div class="an-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="an-preset__body">' +
          '<div class="an-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="an-preset__meta">' +
          escapeHtml(st.preset) +
          " · " +
          Math.round(st.duration) +
          "ms</div>" +
          "</div>" +
          '<button type="button" class="an-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.animation = {
    id: "animation",
    title: "애니메이션",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elPreset = root.querySelector("#an-preset");
      var elName = root.querySelector("#an-name");
      var elDuration = root.querySelector("#an-duration");
      var elDelay = root.querySelector("#an-delay");
      var elTiming = root.querySelector("#an-timing");
      var elIter = root.querySelector("#an-iter");
      var elDir = root.querySelector("#an-dir");
      var elFill = root.querySelector("#an-fill");
      var elDistance = root.querySelector("#an-distance");
      var elScaleFrom = root.querySelector("#an-scale-from");
      var elOpacityFrom = root.querySelector("#an-opacity-from");
      var elRotate = root.querySelector("#an-rotate");

      var outDuration = root.querySelector("#out-an-duration");
      var outDelay = root.querySelector("#out-an-delay");
      var outDistance = root.querySelector("#out-an-distance");
      var outScaleFrom = root.querySelector("#out-an-scale-from");
      var outOpacityFrom = root.querySelector("#out-an-opacity-from");
      var outRotate = root.querySelector("#out-an-rotate");

      var target = root.querySelector("#an-target");
      var hint = root.querySelector("#an-hint");
      var cssOut = root.querySelector("#an-css");
      var presetsHost = root.querySelector("#an-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function syncControls() {
        elPreset.value = st.preset;
        elName.value = st.name;
        elDuration.value = st.duration;
        elDelay.value = st.delay;
        elTiming.value = st.timing;
        elIter.value = String(st.iterations);
        elDir.value = st.direction;
        elFill.value = st.fill;
        elDistance.value = st.distance;
        elScaleFrom.value = st.scaleFrom;
        elOpacityFrom.value = st.opacityFrom;
        elRotate.value = st.rotate;
      }

      function readControls() {
        st = normalizeState({
          preset: elPreset.value,
          name: elName.value,
          duration: Number(elDuration.value),
          delay: Number(elDelay.value),
          timing: elTiming.value,
          iterations: elIter.value === "infinite" ? "infinite" : Number(elIter.value),
          direction: elDir.value,
          fill: elFill.value,
          distance: Number(elDistance.value),
          scaleFrom: Number(elScaleFrom.value),
          opacityFrom: Number(elOpacityFrom.value),
          rotate: Number(elRotate.value),
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderAll() {
        if (outDuration) outDuration.textContent = Math.round(st.duration) + "ms";
        if (outDelay) outDelay.textContent = Math.round(st.delay) + "ms";
        if (outDistance) outDistance.textContent = Math.round(st.distance) + "px";
        if (outScaleFrom) outScaleFrom.textContent = String(round2(st.scaleFrom));
        if (outOpacityFrom) outOpacityFrom.textContent = String(round2(st.opacityFrom));
        if (outRotate) outRotate.textContent = Math.round(st.rotate) + "°";
        if (cssOut) cssOut.textContent = buildCss(st);
        if (hint) hint.textContent = "animation: " + animationShorthand(st) + ";";
      }

      function play() {
        if (!target) return;
        readControls();
        var inline = document.getElementById("an-inline-keyframes");
        if (!inline) {
          inline = document.createElement("style");
          inline.id = "an-inline-keyframes";
          document.head.appendChild(inline);
        }
        inline.textContent = keyframesCss(st);
        /* 동일한 shorthand면 재생이 안 되므로 끊었다가 다시 건다 */
        target.style.animation = "none";
        void target.offsetHeight;
        target.style.removeProperty("animation");
        void target.offsetHeight;
        target.style.animation = animationShorthand(st);
      }

      function applyState(next) {
        st = normalizeState(next);
        saveJson(STORAGE_STATE, st);
        syncControls();
        renderAll();
        play();
      }

      function onChange() {
        readControls();
        renderAll();
        play();
      }

      [
        elPreset,
        elName,
        elDuration,
        elDelay,
        elTiming,
        elIter,
        elDir,
        elFill,
        elDistance,
        elScaleFrom,
        elOpacityFrom,
        elRotate,
      ].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#an-play").addEventListener("click", play, { signal: ac.signal });

      root.querySelector("#an-copy").addEventListener(
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

      root.querySelector("#an-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("애니메이션 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#an-save").addEventListener(
        "click",
        function () {
          var name = window.prompt("프리셋 이름을 입력하세요.", "");
          if (name === null) return;
          name = String(name).trim();
          if (!name) return toast("이름을 입력해 주세요.");
          if (name.length > 48) name = name.slice(0, 48);
          var list = loadPresets();
          list.unshift({ id: "a-" + Date.now(), name: name, state: normalizeState(st) });
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
      play();

      return function cleanup() {
        try {
          ac.abort();
        } catch (e) {}
        var inline = document.getElementById("an-inline-keyframes");
        if (inline && inline.parentNode) inline.parentNode.removeChild(inline);
        container.innerHTML = "";
      };
    },
  };
})();

