/* tool: contrast — WCAG contrast checker */
(function () {
  var Hub = window.Hub || {};
  var toast = Hub.toast || function () {};
  var loadJson = Hub.loadJson || function (_k, fb) { return fb; };
  var saveJson = Hub.saveJson || function () {};

  var STORAGE_STATE = "contrast-state";
  var STORAGE_PRESETS = "contrast-presets";

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

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function luminance(c) {
    function srgbToLin(u) {
      u /= 255;
      return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
    }
    var r = srgbToLin(c.r);
    var g = srgbToLin(c.g);
    var b = srgbToLin(c.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(fgHex, bgHex) {
    var a = hexToRgb(fgHex);
    var b = hexToRgb(bgHex);
    var L1 = luminance(a);
    var L2 = luminance(b);
    var hi = Math.max(L1, L2);
    var lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function passLabel(ok) {
    return ok ? "PASS" : "FAIL";
  }

  function defaultState() {
    return {
      fg: "#e5e7eb",
      bg: "#0b1220",
      sample: "가나다라마바사 ABCD 1234",
      fontSize: 16,
      fontWeight: 400,
    };
  }

  function normalizeState(st) {
    st = st && typeof st === "object" ? st : defaultState();
    return {
      fg: typeof st.fg === "string" ? st.fg : "#e5e7eb",
      bg: typeof st.bg === "string" ? st.bg : "#0b1220",
      sample: String(st.sample || "가나다라마바사 ABCD 1234"),
      fontSize: clamp(Number(st.fontSize), 10, 64),
      fontWeight: clamp(Number(st.fontWeight), 100, 900),
    };
  }

  function evaluate(ratio) {
    // WCAG 2.x thresholds
    var aaNormal = ratio >= 4.5;
    var aaaNormal = ratio >= 7;
    var aaLarge = ratio >= 3;
    var aaaLarge = ratio >= 4.5;
    return { aaNormal: aaNormal, aaaNormal: aaaNormal, aaLarge: aaLarge, aaaLarge: aaaLarge };
  }

  function template() {
    return (
      '<section class="tool-root" aria-label="대비 체크">' +
      '<header class="page-hero page-hero--compact">' +
      "<h2>대비 체크</h2>" +
      "<p>전경/배경 색상의 대비비(Contrast ratio)를 계산하고 WCAG AA/AAA 통과 여부를 확인합니다.</p>" +
      "</header>" +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="ctc-controls-heading">' +
      '<h2 id="ctc-controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group"><label for="ctc-fg">텍스트 색(전경)</label><input type="color" id="ctc-fg" value="#e5e7eb" /></div>' +
      '<div class="control-group"><label for="ctc-bg">배경 색</label><input type="color" id="ctc-bg" value="#0b1220" /></div>' +
      '<div class="control-group"><label for="ctc-font-size">폰트 크기 <span class="value" id="out-ctc-font-size">16px</span></label><input type="range" id="ctc-font-size" min="10" max="64" value="16" step="1" /></div>' +
      '<div class="control-group"><label for="ctc-font-weight">폰트 굵기 <span class="value" id="out-ctc-font-weight">400</span></label><input type="range" id="ctc-font-weight" min="100" max="900" value="400" step="100" /></div>' +
      '<div class="control-group"><label for="ctc-sample">샘플 텍스트</label><input type="text" id="ctc-sample" value="가나다라마바사 ABCD 1234" autocomplete="off" spellcheck="false" /></div>' +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="ctc-save">프리셋 저장</button>' +
      '<button type="button" class="btn btn--ghost btn--block" id="ctc-reset" style="margin-top: var(--space-3);">초기값</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="ctc-preview-heading">' +
      '<h2 id="ctc-preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="ctc-preview" id="ctc-preview">' +
      '<div class="ctc-preview__text" id="ctc-preview-text"></div>' +
      "</div>" +
      '<div class="ctc-metrics" id="ctc-metrics"></div>' +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="ctc-report-heading">' +
      '<h2 id="ctc-report-heading" class="generator__panel-title">WCAG 결과</h2>' +
      '<div class="ctc-report" id="ctc-report"></div>' +
      '<div class="ctc-actions">' +
      '<button type="button" class="btn btn--primary" id="ctc-copy">요약 복사</button>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="ctc-presets-heading">' +
      '<h2 id="ctc-presets-heading" class="generator__panel-title">내 프리셋</h2>' +
      '<div id="ctc-presets" class="ctc-presets"></div>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function ensureCssOnce() {
    if (document.getElementById("contrast-inline-style")) return;
    var style = document.createElement("style");
    style.id = "contrast-inline-style";
    style.textContent =
      ".ctc-preview{border-radius:var(--radius-xl);border:1px dashed var(--color-border-subtle);padding:var(--space-8);min-height:240px;display:flex;align-items:center;justify-content:center;overflow:hidden}" +
      ".ctc-preview__text{max-width:44rem;text-align:center}" +
      ".ctc-metrics{margin-top:var(--space-4);display:flex;flex-wrap:wrap;gap:10px;font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted)}" +
      ".ctc-chip{padding:6px 10px;border-radius:999px;border:1px solid var(--color-border-subtle);background:var(--color-surface)}" +
      ".ctc-report{display:grid;gap:var(--space-3)}" +
      ".ctc-row{display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface)}" +
      ".ctc-row__k{font-weight:850;color:var(--color-text-primary)}" +
      ".ctc-row__v{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-secondary)}" +
      ".ctc-badge{padding:6px 10px;border-radius:999px;border:1px solid var(--color-border-subtle);font-size:var(--text-xs);font-weight:900;letter-spacing:.06em}" +
      ".ctc-badge--pass{background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.35);color:rgb(52 211 153)}" +
      ".ctc-badge--fail{background:rgba(251,113,133,.10);border-color:rgba(251,113,133,.35);color:rgb(251 113 133)}" +
      ".ctc-actions{margin-top:var(--space-4);display:flex;justify-content:flex-end}" +
      ".ctc-presets{display:grid;grid-template-columns:1fr;gap:var(--space-3)}" +
      ".ctc-preset{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);background:var(--color-surface);cursor:pointer}" +
      ".ctc-preset:hover{background:var(--color-surface-hover);border-color:var(--color-border-strong)}" +
      ".ctc-preset__sw{width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.16);flex:0 0 auto;overflow:hidden}" +
      "html[data-theme=\"light\"] .ctc-preset__sw{border-color:rgba(15,23,42,.12)}" +
      ".ctc-preset__name{font-size:var(--text-sm);font-weight:850;color:var(--color-text-primary)}" +
      ".ctc-preset__meta{font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px}" +
      ".ctc-preset__del{margin-left:auto;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);background:transparent;color:var(--color-text-secondary)}" +
      ".ctc-preset__del:hover{background:var(--color-surface-hover);color:var(--color-danger)}";
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
        var ratio = round2(contrastRatio(st.fg, st.bg));
        return (
          '<div class="ctc-preset" data-preset-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="ctc-preset__sw" style="background:' +
          escapeHtml(st.bg) +
          ";color:" +
          escapeHtml(st.fg) +
          '"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:900">Aa</div></div>' +
          '<div class="ctc-preset__body">' +
          '<div class="ctc-preset__name">' +
          escapeHtml(p.name) +
          "</div>" +
          '<div class="ctc-preset__meta">' +
          escapeHtml(st.fg) +
          " on " +
          escapeHtml(st.bg) +
          " · " +
          ratio +
          ":1</div>" +
          "</div>" +
          '<button type="button" class="ctc-preset__del" data-preset-del aria-label="프리셋 삭제">삭제</button>' +
          "</div>"
        );
      })
      .join("");
  }

  window.Tools = window.Tools || {};
  window.Tools.contrast = {
    id: "contrast",
    title: "대비 체크",
    render: function (container) {
      ensureCssOnce();
      container.innerHTML = template();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var elFg = root.querySelector("#ctc-fg");
      var elBg = root.querySelector("#ctc-bg");
      var elSample = root.querySelector("#ctc-sample");
      var elFontSize = root.querySelector("#ctc-font-size");
      var elFontWeight = root.querySelector("#ctc-font-weight");

      var outFontSize = root.querySelector("#out-ctc-font-size");
      var outFontWeight = root.querySelector("#out-ctc-font-weight");

      var preview = root.querySelector("#ctc-preview");
      var previewText = root.querySelector("#ctc-preview-text");
      var metrics = root.querySelector("#ctc-metrics");
      var report = root.querySelector("#ctc-report");
      var presetsHost = root.querySelector("#ctc-presets");

      var st = normalizeState(loadJson(STORAGE_STATE, null) || defaultState());

      function syncControls() {
        elFg.value = st.fg;
        elBg.value = st.bg;
        elSample.value = st.sample;
        elFontSize.value = st.fontSize;
        elFontWeight.value = st.fontWeight;
      }

      function readControls() {
        st = normalizeState({
          fg: elFg.value,
          bg: elBg.value,
          sample: elSample.value,
          fontSize: Number(elFontSize.value),
          fontWeight: Number(elFontWeight.value),
        });
        saveJson(STORAGE_STATE, st);
      }

      function renderAll() {
        var ratio = contrastRatio(st.fg, st.bg);
        var r2 = round2(ratio);
        var ok = evaluate(ratio);

        if (outFontSize) outFontSize.textContent = Math.round(st.fontSize) + "px";
        if (outFontWeight) outFontWeight.textContent = String(Math.round(st.fontWeight));

        if (preview) {
          preview.style.background = st.bg;
          preview.style.color = st.fg;
        }
        if (previewText) {
          previewText.textContent = st.sample;
          previewText.style.fontSize = Math.round(st.fontSize) + "px";
          previewText.style.fontWeight = String(Math.round(st.fontWeight));
          previewText.style.lineHeight = "1.35";
        }

        if (metrics) {
          metrics.innerHTML =
            '<span class="ctc-chip">ratio: ' +
            r2 +
            ":1</span>" +
            '<span class="ctc-chip">fg: ' +
            escapeHtml(st.fg) +
            "</span>" +
            '<span class="ctc-chip">bg: ' +
            escapeHtml(st.bg) +
            "</span>";
        }

        function row(label, pass, threshold) {
          var badgeClass = pass ? "ctc-badge ctc-badge--pass" : "ctc-badge ctc-badge--fail";
          return (
            '<div class="ctc-row">' +
            '<div class="ctc-row__k">' +
            escapeHtml(label) +
            "</div>" +
            '<div class="ctc-row__v">≥ ' +
            threshold +
            ":1</div>" +
            '<div class="' +
            badgeClass +
            '">' +
            passLabel(pass) +
            "</div>" +
            "</div>"
          );
        }

        if (report) {
          report.innerHTML =
            row("AA (Normal text)", ok.aaNormal, "4.5") +
            row("AAA (Normal text)", ok.aaaNormal, "7") +
            row("AA (Large text)", ok.aaLarge, "3") +
            row("AAA (Large text)", ok.aaaLarge, "4.5");
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
        renderAll();
      }

      [elFg, elBg, elSample, elFontSize, elFontWeight].forEach(function (el) {
        el.addEventListener("input", onChange, { signal: ac.signal });
        el.addEventListener("change", onChange, { signal: ac.signal });
      });

      root.querySelector("#ctc-copy").addEventListener(
        "click",
        function () {
          var ratio = round2(contrastRatio(st.fg, st.bg));
          var ok = evaluate(contrastRatio(st.fg, st.bg));
          var text =
            "Contrast " +
            ratio +
            ":1 — fg " +
            st.fg +
            " on bg " +
            st.bg +
            "\n" +
            "AA Normal: " +
            (ok.aaNormal ? "PASS" : "FAIL") +
            "\n" +
            "AAA Normal: " +
            (ok.aaaNormal ? "PASS" : "FAIL") +
            "\n" +
            "AA Large: " +
            (ok.aaLarge ? "PASS" : "FAIL") +
            "\n" +
            "AAA Large: " +
            (ok.aaaLarge ? "PASS" : "FAIL");

          var copy = Hub.copyText ? Hub.copyText(text) : Promise.reject(new Error("no copy"));
          copy.then(function () {
            toast("요약을 복사했습니다");
          }).catch(function () {
            toast("복사에 실패했습니다.");
          });
        },
        { signal: ac.signal }
      );

      root.querySelector("#ctc-reset").addEventListener(
        "click",
        function () {
          applyState(defaultState());
          toast("대비 값을 초기화했습니다.");
        },
        { signal: ac.signal }
      );

      root.querySelector("#ctc-save").addEventListener(
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

