/* tool: glass — migrated from legacy single-page generator */
(function () {
  var MY_PRESETS_EVENT = "glass-my-presets-changed";
  var MY_PRESETS_STORAGE = "glass-my-presets";
  var Hub = window.Hub || {};
  var showToast = Hub.toast || function () {};

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function glassTemplate() {
    return (
      '<section class="tool-root" aria-label="글래스모피즘">' +
      '<header class="page-hero">' +
      "<h1>글래스모피즘 CSS 생성기</h1>" +
      "<p>블러, 투명도, 테두리, 그림자를 조절해 미리보기와 함께 바로 쓸 수 있는 CSS 코드를 만듭니다.</p>" +
      "</header>" +
      '<div class="tool-tabs" role="navigation" aria-label="글래스 도구 탭">' +
      '<button type="button" class="tool-tab" data-glass-tab="generator" aria-current="page">생성기</button>' +
      '<button type="button" class="tool-tab" data-glass-tab="presets">프리셋</button>' +
      '<button type="button" class="tool-tab" data-glass-tab="showcase">쇼케이스</button>' +
      '<button type="button" class="tool-tab" data-glass-tab="guide">가이드</button>' +
      "</div>" +
      '<div class="tool-pane is-active" data-glass-pane="generator">' +
      '<div class="generator">' +
      '<aside class="generator__panel" aria-labelledby="controls-heading">' +
      '<h2 id="controls-heading" class="generator__panel-title">컨트롤</h2>' +
      '<div class="control-group">' +
      '<label for="ctrl-blur">블러 강도 <span class="value" id="out-blur">16px</span></label>' +
      '<input type="range" id="ctrl-blur" min="0" max="40" value="16" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="ctrl-opacity">배경 투명도 <span class="value" id="out-opacity">20%</span></label>' +
      '<input type="range" id="ctrl-opacity" min="5" max="90" value="20" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="ctrl-border">테두리 두께 <span class="value" id="out-border">1px</span></label>' +
      '<input type="range" id="ctrl-border" min="0" max="4" value="1" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="ctrl-radius">모서리 반경 <span class="value" id="out-radius">20px</span></label>' +
      '<input type="range" id="ctrl-radius" min="0" max="48" value="20" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="ctrl-shadow">그림자 (Y 오프셋) <span class="value" id="out-shadow">24px</span></label>' +
      '<input type="range" id="ctrl-shadow" min="0" max="48" value="24" step="1" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="ctrl-tint">글래스 틴트 색</label>' +
      '<input type="color" id="ctrl-tint" value="#ffffff" />' +
      "</div>" +
      '<div class="control-group">' +
      '<label for="ctrl-bg-image">미리보기 배경 이미지 URL (선택)</label>' +
      '<input type="text" id="ctrl-bg-image" placeholder="https://…" autocomplete="off" spellcheck="false" />' +
      "</div>" +
      '<div class="generator__save-row">' +
      '<button type="button" class="btn btn--ghost btn--block" id="btn-save-my-preset">내 프리셋으로 저장</button>' +
      "</div>" +
      "</aside>" +
      '<div class="generator__preview-wrap">' +
      '<section class="generator__panel" aria-labelledby="preview-heading">' +
      '<h2 id="preview-heading" class="generator__panel-title">미리보기</h2>' +
      '<div class="preview-stage" id="preview-stage">' +
      '<div class="preview-blobs" aria-hidden="true">' +
      '<span class="preview-blob preview-blob--pink"></span>' +
      '<span class="preview-blob preview-blob--emerald"></span>' +
      '<span class="preview-blob preview-blob--violet"></span>' +
      "</div>" +
      '<div class="preview-card" id="preview-card"><span class="preview-card__label">Glass Card</span></div>' +
      "</div>" +
      "</section>" +
      '<section class="generator__panel" aria-labelledby="code-heading">' +
      '<h2 id="code-heading" class="generator__panel-title">생성된 CSS</h2>' +
      '<div class="code-block">' +
      '<div class="code-block__actions"><button type="button" class="btn btn--primary" id="btn-copy">복사</button></div>' +
      '<pre><code id="generated-css"></code></pre>' +
      "</div>" +
      "</section>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="tool-pane" data-glass-pane="presets">' +
      '<header class="page-hero page-hero--compact"><h1>글래스 프리셋</h1><p>마음에 드는 스타일을 눌러 생성기에 불러오세요.</p></header>' +
      '<div id="presets-root"></div>' +
      "</div>" +
      '<div class="tool-pane" data-glass-pane="showcase">' +
      '<header class="page-hero page-hero--compact"><h1>쇼케이스</h1><p>생성기에서 조절한 글래스 값이 이 영역에도 실시간으로 반영됩니다.</p></header>' +
      '<div class="showcase-shell"><div class="showcase-stage">' +
      '<div class="showcase-blobs" aria-hidden="true">' +
      '<span class="showcase-blob showcase-blob--coral"></span>' +
      '<span class="showcase-blob showcase-blob--cyan"></span>' +
      '<span class="showcase-blob showcase-blob--amber"></span>' +
      "</div>" +
      '<div class="showcase-grid">' +
      '<article class="showcase-card"><div class="showcase-card__glass">' +
      '<div class="showcase-card__row"><span class="showcase-card__dot"></span><span class="showcase-card__dot"></span><span class="showcase-card__dot"></span></div>' +
      '<p class="showcase-card__kicker">Now playing</p><p class="showcase-card__title">Glasswave FM</p><p class="showcase-card__meta">Lo-fi · 글래스 플레이어</p>' +
      '<div class="showcase-card__bars" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>' +
      "</div></article>" +
      '<article class="showcase-card"><div class="showcase-card__glass showcase-card__glass--compact"><p class="showcase-card__kicker">날씨</p><p class="showcase-card__stat">24°</p><p class="showcase-card__meta">맑음 · 습도 42%</p></div></article>' +
      '<article class="showcase-card"><div class="showcase-card__glass showcase-card__glass--compact"><p class="showcase-card__kicker">대시보드</p><p class="showcase-card__stat">98%</p><p class="showcase-card__meta">이번 주 목표 달성</p></div></article>' +
      '<article class="showcase-card"><div class="showcase-card__glass showcase-card__glass--tall"><p class="showcase-card__kicker">알림</p><ul class="showcase-list"><li>새 프리셋이 생성기에 동기화되었습니다.</li><li>코드를 복사한 뒤 프로젝트에 붙여 넣어 보세요.</li><li>라이트 모드에서는 테두리와 그림자가 더 또렷해집니다.</li></ul></div></article>' +
      '<article class="showcase-card showcase-card--login"><div class="showcase-card__glass showcase-login"><p class="showcase-card__kicker">로그인</p><p class="showcase-login__hint">Glass UI로 감싼 폼 예시입니다.</p>' +
      '<div class="showcase-login__form" role="group" aria-label="로그인 폼 예시">' +
      '<label class="showcase-login__label" for="showcase-login-email">이메일</label>' +
      '<input class="showcase-login__input" id="showcase-login-email" type="email" inputmode="email" placeholder="you@example.com" autocomplete="email" />' +
      '<label class="showcase-login__label" for="showcase-login-password">비밀번호</label>' +
      '<input class="showcase-login__input" id="showcase-login-password" type="password" placeholder="••••••••" autocomplete="current-password" />' +
      '<button type="button" class="btn btn--primary showcase-login__submit">계속하기</button>' +
      "</div></div></article>" +
      "</div></div></div></div>" +
      "</div>" +
      '<div class="tool-pane" data-glass-pane="guide">' +
      '<header class="page-hero page-hero--compact"><h1>가이드</h1><p>생성기·프리셋·쇼케이스를 효과적으로 쓰는 방법과 팁을 정리했습니다.</p></header>' +
      '<div class="guide-layout">' +
      '<article class="guide-block generator__panel"><h2 class="guide-block__title">1. 생성기로 값 맞추기</h2><p class="guide-block__text">슬라이더로 블러·투명도·테두리·반경·그림자·틴트 색을 조절하면 <strong>생성된 CSS</strong>가 함께 갱신됩니다.</p><ul class="guide-list"><li>배경이 단조로우면 블러가 잘 안 보입니다. 이미지 URL을 넣거나 색 덩어리를 두세요.</li><li><code class="guide-code">backdrop-filter</code>는 카드 뒤에 콘텐츠가 있을 때 효과가 큽니다.</li></ul></article>' +
      '<article class="guide-block generator__panel"><h2 class="guide-block__title">2. 프리셋 → 생성기</h2><p class="guide-block__text"><strong>프리셋</strong>에서 카드를 클릭하면 슬라이더·미리보기에 반영되고 자동으로 <strong>생성기</strong>로 이동합니다.</p></article>' +
      '<article class="guide-block generator__panel"><h2 class="guide-block__title">3. 복사한 CSS 붙여넣기</h2><p class="guide-block__text">하단의 <strong>복사</strong> 버튼으로 클립보드에 스니펫을 담은 뒤, 클래스 이름을 바꿔 사용하세요.</p><pre class="guide-pre"><code>&lt;div class="glass-card"&gt;콘텐츠&lt;/div&gt;</code></pre></article>' +
      '<article class="guide-block generator__panel"><h2 class="guide-block__title">4. 브라우저와 접근성</h2><p class="guide-block__text">구형 브라우저를 고려하면 불투명 배경색을 fallback으로 두는 것이 안전합니다.</p></article>' +
      '<article class="guide-block generator__panel"><h2 class="guide-block__title">5. 다크 / 라이트 모드</h2><p class="guide-block__text">상단 바의 아이콘으로 테마를 전환할 수 있고, 선택은 <code class="guide-code">localStorage</code>에 저장됩니다.</p></article>' +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function initTabs(root, signal) {
    var tabs = root.querySelectorAll("[data-glass-tab]");
    var panes = root.querySelectorAll("[data-glass-pane]");

    function setActive(id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-glass-tab") === id;
        if (on) t.setAttribute("aria-current", "page");
        else t.removeAttribute("aria-current");
      });
      panes.forEach(function (p) {
        var on = p.getAttribute("data-glass-pane") === id;
        p.classList.toggle("is-active", on);
      });
    }

    root.addEventListener(
      "click",
      function (e) {
        var t = e.target.closest("[data-glass-tab]");
        if (!t || !root.contains(t)) return;
        e.preventDefault();
        setActive(t.getAttribute("data-glass-tab"));
      },
      { signal: signal }
    );

    return { setActive: setActive };
  }

  function initGenerator(root, signal) {
    var docRoot = document.documentElement;
    var preview = root.querySelector("#preview-card");
    var previewStage = root.querySelector("#preview-stage");
    var codeOut = root.querySelector("#generated-css");

    var controls = {
      blur: root.querySelector("#ctrl-blur"),
      opacity: root.querySelector("#ctrl-opacity"),
      border: root.querySelector("#ctrl-border"),
      radius: root.querySelector("#ctrl-radius"),
      shadow: root.querySelector("#ctrl-shadow"),
      tint: root.querySelector("#ctrl-tint"),
      bgImage: root.querySelector("#ctrl-bg-image"),
    };

    var outputs = {
      blur: root.querySelector("#out-blur"),
      opacity: root.querySelector("#out-opacity"),
      border: root.querySelector("#out-border"),
      radius: root.querySelector("#out-radius"),
      shadow: root.querySelector("#out-shadow"),
    };

    function hexToRgb(hex) {
      var h = String(hex || "").replace("#", "");
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function rgbaFromHex(hex, alpha) {
      var c = hexToRgb(hex);
      return "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + alpha + ")";
    }

    function syncLiveGlassVars(blur, opacity, borderPx, radius, shadowStr, tintHex) {
      var c = hexToRgb(tintHex);
      var spread = shadowStr * 2;
      docRoot.style.setProperty("--live-glass-blur", blur + "px");
      docRoot.style.setProperty("--live-glass-opacity", String(opacity));
      docRoot.style.setProperty("--live-glass-r", String(c.r));
      docRoot.style.setProperty("--live-glass-g", String(c.g));
      docRoot.style.setProperty("--live-glass-b", String(c.b));
      docRoot.style.setProperty("--live-glass-border-w", borderPx + "px");
      docRoot.style.setProperty("--live-glass-radius", radius + "px");
      docRoot.style.setProperty("--live-glass-shadow-y", shadowStr + "px");
      docRoot.style.setProperty("--live-glass-shadow-spread", spread + "px");
    }

    function update() {
      if (!preview || !codeOut) return;

      var blur = Number(controls.blur.value);
      var opacity = Number(controls.opacity.value) / 100;
      var borderW = Number(controls.border.value);
      var borderPx = Math.max(1, borderW);
      var radius = Number(controls.radius.value);
      var shadowStr = Number(controls.shadow.value);
      var tint = controls.tint.value;
      var bgUrl = (controls.bgImage && controls.bgImage.value.trim()) || "";

      if (outputs.blur) outputs.blur.textContent = blur + "px";
      if (outputs.opacity) outputs.opacity.textContent = Math.round(opacity * 100) + "%";
      if (outputs.border) outputs.border.textContent = borderPx + "px";
      if (outputs.radius) outputs.radius.textContent = radius + "px";
      if (outputs.shadow) outputs.shadow.textContent = shadowStr + "px";

      var bgGlass = rgbaFromHex(tint, opacity);
      syncLiveGlassVars(blur, opacity, borderPx, radius, shadowStr, tint);

      preview.style.cssText =
        "position:relative;overflow:hidden;" +
        "backdrop-filter: blur(" +
        blur +
        "px);" +
        "-webkit-backdrop-filter: blur(" +
        blur +
        "px);" +
        "background: " +
        bgGlass +
        ";" +
        "border: " +
        borderPx +
        "px solid rgba(255, 255, 255, 0.2);" +
        "border-radius: " +
        radius +
        "px;" +
        "box-shadow: 0 " +
        shadowStr +
        "px " +
        shadowStr * 2 +
        "px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18);";

      if (previewStage) {
        if (bgUrl) {
          var safeUrl = bgUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
          previewStage.style.backgroundImage =
            'url("' +
            safeUrl +
            '"), linear-gradient(145deg, rgba(255,255,255,0.08), transparent)';
          previewStage.style.backgroundSize = "cover, auto";
          previewStage.style.backgroundPosition = "center, center";
        } else {
          previewStage.style.backgroundImage =
            "linear-gradient(145deg, rgba(255, 255, 255, 0.04), transparent)";
          previewStage.style.backgroundSize = "auto";
        }
      }

      var css =
        ".glass-card {\n" +
        "  position: relative;\n" +
        "  overflow: hidden;\n" +
        "  backdrop-filter: blur(" +
        blur +
        "px);\n" +
        "  -webkit-backdrop-filter: blur(" +
        blur +
        "px);\n" +
        "  background: " +
        bgGlass +
        ";\n" +
        "  border: " +
        borderPx +
        "px solid rgba(255, 255, 255, 0.2);\n" +
        "  border-radius: " +
        radius +
        "px;\n" +
        "  box-shadow:\n" +
        "    0 " +
        shadowStr +
        "px " +
        shadowStr * 2 +
        "px rgba(0, 0, 0, 0.28),\n" +
        "    inset 0 1px 0 rgba(255, 255, 255, 0.18);\n" +
        "}\n" +
        "\n" +
        ".glass-card::before {\n" +
        '  content: "";\n' +
        "  position: absolute;\n" +
        "  inset: 0;\n" +
        "  border-radius: inherit;\n" +
        "  background: linear-gradient(\n" +
        "    135deg,\n" +
        "    rgba(255, 255, 255, 0.35) 0%,\n" +
        "    rgba(255, 255, 255, 0.1) 38%,\n" +
        "    transparent 58%\n" +
        "  );\n" +
        "  pointer-events: none;\n" +
        "}\n";

      codeOut.textContent = css;
    }

    function getState() {
      return {
        blur: Number(controls.blur && controls.blur.value),
        opacity: Number(controls.opacity && controls.opacity.value),
        border: Number(controls.border && controls.border.value),
        radius: Number(controls.radius && controls.radius.value),
        shadow: Number(controls.shadow && controls.shadow.value),
        tint: controls.tint ? controls.tint.value : "#ffffff",
        bgImage: controls.bgImage ? controls.bgImage.value.trim() : "",
      };
    }

    function applyPreset(p) {
      if (!p) return;
      if (controls.blur) controls.blur.value = p.blur;
      if (controls.opacity) controls.opacity.value = p.opacity;
      if (controls.border) controls.border.value = p.border;
      if (controls.radius) controls.radius.value = p.radius;
      if (controls.shadow) controls.shadow.value = p.shadow;
      if (controls.tint) controls.tint.value = p.tint;
      if (controls.bgImage) controls.bgImage.value = p.bgImage != null ? p.bgImage : "";
      update();
    }

    function loadMyPresets() {
      var list = Hub.loadJson ? Hub.loadJson(MY_PRESETS_STORAGE, []) : [];
      return Array.isArray(list) ? list : [];
    }

    function saveMyPresets(list) {
      if (Hub.saveJson) Hub.saveJson(MY_PRESETS_STORAGE, list);
    }

    function onSaveMyPreset() {
      var name = window.prompt("저장할 프리셋 이름을 입력하세요.", "");
      if (name === null) return;
      name = String(name).trim();
      if (!name) return showToast("이름을 입력해 주세요.");
      if (name.length > 48) name = name.slice(0, 48);

      var st = getState();
      var entry = {
        id: "my-" + Date.now(),
        name: name,
        description: "나만의 프리셋",
        blur: st.blur,
        opacity: st.opacity,
        border: st.border,
        radius: st.radius,
        shadow: st.shadow,
        tint: st.tint,
        bgImage: st.bgImage || "",
      };

      var list = loadMyPresets();
      list.unshift(entry);
      if (list.length > 40) list = list.slice(0, 40);
      saveMyPresets(list);
      showToast("「" + name + "」 프리셋을 저장했습니다.");
      try {
        window.dispatchEvent(new CustomEvent(MY_PRESETS_EVENT));
      } catch (e) {}
    }

    Object.keys(controls).forEach(function (key) {
      var el = controls[key];
      if (!el) return;
      el.addEventListener("input", update, { signal: signal });
      el.addEventListener("change", update, { signal: signal });
    });

    var btnCopy = root.querySelector("#btn-copy");
    if (btnCopy)
      btnCopy.addEventListener(
        "click",
        function () {
          var text = codeOut.textContent;
          var copy = Hub.copyText ? Hub.copyText(text) : Promise.reject(new Error("no copy"));
          copy.then(function () {
            showToast("클립보드에 복사했습니다");
          }).catch(function () {
            showToast("복사에 실패했습니다.");
          });
        },
        { signal: signal }
      );

    var btnSavePreset = root.querySelector("#btn-save-my-preset");
    if (btnSavePreset) btnSavePreset.addEventListener("click", onSaveMyPreset, { signal: signal });

    update();

    return { applyPreset: applyPreset };
  }

  function initPresets(root, deps, signal, tabsApi) {
    var GLASS_PRESETS = [
      {
        id: "frost-aurora",
        name: "프로스트 오로라",
        description: "차갑고 맑은 블루 틴트",
        blur: 22,
        opacity: 18,
        border: 1,
        radius: 24,
        shadow: 28,
        tint: "#a8c8ff",
        bgImage: "",
      },
      {
        id: "emerald-lake",
        name: "에메랄드 레이크",
        description: "깊은 에메랄드 글래스",
        blur: 18,
        opacity: 22,
        border: 1,
        radius: 20,
        shadow: 22,
        tint: "#5eead4",
        bgImage: "",
      },
      {
        id: "rose-quartz",
        name: "로즈 쿼츠",
        description: "부드러운 핑크 글로우",
        blur: 20,
        opacity: 25,
        border: 2,
        radius: 28,
        shadow: 32,
        tint: "#fda4af",
        bgImage: "",
      },
      {
        id: "violet-haze",
        name: "바이올렛 헤이즈",
        description: "보랏빛 안개",
        blur: 26,
        opacity: 15,
        border: 1,
        radius: 16,
        shadow: 20,
        tint: "#c4b5fd",
        bgImage: "",
      },
      {
        id: "sunset-glass",
        name: "선셋 글래스",
        description: "따뜻한 피치·코랄",
        blur: 16,
        opacity: 28,
        border: 1,
        radius: 22,
        shadow: 26,
        tint: "#fb923c",
        bgImage: "",
      },
      {
        id: "mono-ice",
        name: "모노 아이스",
        description: "흰색 틴트, 강한 블러",
        blur: 32,
        opacity: 12,
        border: 1,
        radius: 18,
        shadow: 18,
        tint: "#ffffff",
        bgImage: "",
      },
      {
        id: "neon-edge",
        name: "네온 엣지",
        description: "날카로운 모서리·그림자",
        blur: 12,
        opacity: 20,
        border: 2,
        radius: 8,
        shadow: 36,
        tint: "#22d3ee",
        bgImage: "",
      },
      {
        id: "midnight-sapphire",
        name: "미드나이트 사파이어",
        description: "낮은 투명도·묵직한 글래스",
        blur: 14,
        opacity: 35,
        border: 1,
        radius: 20,
        shadow: 40,
        tint: "#6366f1",
        bgImage: "",
      },
      {
        id: "lime-zest",
        name: "라임 제스트",
        description: "상큼한 라임 하이라이트",
        blur: 19,
        opacity: 24,
        border: 1,
        radius: 26,
        shadow: 24,
        tint: "#bef264",
        bgImage: "",
      },
      {
        id: "arctic-mint",
        name: "아틱 민트",
        description: "청량한 민트·시안 블렌드",
        blur: 21,
        opacity: 20,
        border: 1,
        radius: 22,
        shadow: 22,
        tint: "#5ee9cf",
        bgImage: "",
      },
      {
        id: "cherry-bloom",
        name: "체리 블룸",
        description: "깊은 체리 레드 글래스",
        blur: 17,
        opacity: 26,
        border: 1,
        radius: 18,
        shadow: 30,
        tint: "#f43f5e",
        bgImage: "",
      },
      {
        id: "golden-hour",
        name: "골든 아워",
        description: "노을빛 앰버·골드",
        blur: 15,
        opacity: 30,
        border: 1,
        radius: 24,
        shadow: 28,
        tint: "#fbbf24",
        bgImage: "",
      },
    ];

    var FILTER_BUILTIN = "builtin";
    var FILTER_MY = "my";

    var host = root.querySelector("#presets-root");
    if (!host) return;

    var grid;
    var currentFilter = FILTER_BUILTIN;

    function loadMyPresets() {
      var list = Hub.loadJson ? Hub.loadJson(MY_PRESETS_STORAGE, []) : [];
      return Array.isArray(list) ? list : [];
    }

    function saveMyPresets(list) {
      if (Hub.saveJson) Hub.saveJson(MY_PRESETS_STORAGE, list);
    }

    function previewBlock(p) {
      return (
        '<div class="preset-card__preview" aria-hidden="true">' +
        '<div class="preset-card__glass" data-preview-blur="' +
        p.blur +
        '" data-preview-opacity="' +
        p.opacity +
        '" data-preview-tint="' +
        escapeHtml(p.tint) +
        '" data-preview-radius="' +
        p.radius +
        '" data-preview-border="' +
        p.border +
        '" data-preview-shadow="' +
        p.shadow +
        '"></div>' +
        "</div>"
      );
    }

    function bodyBlock(name, desc) {
      return (
        '<div class="preset-card__body">' +
        '<h3 class="preset-card__title">' +
        name +
        "</h3>" +
        '<p class="preset-card__desc">' +
        desc +
        "</p>" +
        "</div>"
      );
    }

    function cardHtml(p) {
      var id = escapeHtml(p.id);
      var name = escapeHtml(p.name);
      var desc = escapeHtml(p.description || "");
      return (
        '<article class="preset-card" role="button" tabindex="0" data-preset-id="' +
        id +
        '">' +
        previewBlock(p) +
        bodyBlock(name, desc) +
        "</article>"
      );
    }

    function cardHtmlMy(p) {
      var id = escapeHtml(p.id);
      var name = escapeHtml(p.name);
      var desc = escapeHtml(p.description || "");
      var label = escapeHtml(p.name) + " 프리셋, 생성기에 적용";
      return (
        '<article class="preset-card preset-card--my">' +
        '<button type="button" class="preset-card__delete" data-preset-delete="' +
        id +
        '" aria-label="' +
        escapeHtml(p.name) +
        ' 프리셋 삭제"><span aria-hidden="true">삭제</span></button>' +
        '<div class="preset-card__main" role="button" tabindex="0" data-preset-id="' +
        id +
        '" aria-label="' +
        label +
        '">' +
        previewBlock(p) +
        bodyBlock(name, desc) +
        "</div>" +
        "</article>"
      );
    }

    function styleMiniGlass(el) {
      if (!el || el.dataset.previewBlur == null) return;
      var blur = el.dataset.previewBlur;
      var op = Number(el.dataset.previewOpacity) / 100;
      var tint = el.dataset.previewTint || "#ffffff";
      var radius = el.dataset.previewRadius;
      var borderW = el.dataset.previewBorder;
      var shadow = el.dataset.previewShadow;

      function hexToRgb(hex) {
        var h = hex.replace("#", "");
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        var n = parseInt(h, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
      }
      var c = hexToRgb(tint);
      var bg = "rgba(" + c.r + "," + c.g + "," + c.b + "," + op + ")";
      var bw = Math.max(1, Number(borderW));
      el.style.cssText =
        "backdrop-filter:blur(" +
        blur +
        "px);-webkit-backdrop-filter:blur(" +
        blur +
        "px);background:" +
        bg +
        ";border:" +
        bw +
        "px solid rgba(255,255,255,0.2);border-radius:" +
        radius +
        "px;box-shadow:0 " +
        shadow +
        "px " +
        Number(shadow) * 2 +
        "px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.15);";
    }

    function findBuiltin(id) {
      for (var i = 0; i < GLASS_PRESETS.length; i++) {
        if (GLASS_PRESETS[i].id === id) return GLASS_PRESETS[i];
      }
      return null;
    }

    function findMyPreset(id) {
      var list = loadMyPresets();
      for (var j = 0; j < list.length; j++) {
        if (list[j].id === id) return list[j];
      }
      return null;
    }

    function resolvePreset(id) {
      return findBuiltin(id) || findMyPreset(id);
    }

    function renderGrid() {
      var list = currentFilter === FILTER_MY ? loadMyPresets() : GLASS_PRESETS.slice();
      if (currentFilter === FILTER_MY && list.length === 0) {
        grid.innerHTML =
          '<p class="presets-empty" role="status">저장된 내 프리셋이 없습니다. 생성기에서 「내 프리셋으로 저장」을 눌러 추가해 보세요.</p>';
        return;
      }

      grid.innerHTML = list
        .map(function (p) {
          return currentFilter === FILTER_MY ? cardHtmlMy(p) : cardHtml(p);
        })
        .join("");
      grid.querySelectorAll(".preset-card__glass").forEach(styleMiniGlass);
    }

    function setFilter(filter) {
      currentFilter = filter;
      host.querySelectorAll(".presets-filter__btn").forEach(function (btn) {
        var f = btn.getAttribute("data-preset-filter");
        var active = f === filter;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      renderGrid();
    }

    function onPick(id) {
      var p = resolvePreset(id);
      if (!p || !deps || !deps.applyPreset) return;
      deps.applyPreset(p);
      if (tabsApi && tabsApi.setActive) tabsApi.setActive("generator");
    }

    function onDeleteMyPreset(id) {
      if (!id) return;
      if (!window.confirm("이 프리셋을 삭제할까요?")) return;
      var next = loadMyPresets().filter(function (item) {
        return item.id !== id;
      });
      saveMyPresets(next);
      try {
        window.dispatchEvent(new CustomEvent(MY_PRESETS_EVENT));
      } catch (e) {}
      renderGrid();
      showToast("프리셋을 삭제했습니다.");
    }

    host.innerHTML =
      '<div class="presets-toolbar" role="toolbar" aria-label="프리셋 카테고리">' +
      '<button type="button" class="presets-filter__btn is-active" data-preset-filter="' +
      FILTER_BUILTIN +
      '" aria-pressed="true">기본 프리셋</button>' +
      '<button type="button" class="presets-filter__btn" data-preset-filter="' +
      FILTER_MY +
      '" aria-pressed="false">My Presets</button>' +
      "</div>" +
      '<div class="presets-grid" id="presets-grid"></div>';

    grid = host.querySelector("#presets-grid");

    host.addEventListener(
      "click",
      function (e) {
        var delBtn = e.target.closest("[data-preset-delete]");
        if (delBtn && grid && grid.contains(delBtn)) {
          e.preventDefault();
          e.stopPropagation();
          onDeleteMyPreset(delBtn.getAttribute("data-preset-delete"));
          return;
        }

        var filterBtn = e.target.closest("[data-preset-filter]");
        if (filterBtn && host.contains(filterBtn)) {
          var f = filterBtn.getAttribute("data-preset-filter");
          if (f === FILTER_BUILTIN || f === FILTER_MY) setFilter(f);
          return;
        }

        var main = e.target.closest(".preset-card__main");
        if (main && grid && grid.contains(main)) {
          onPick(main.getAttribute("data-preset-id"));
          return;
        }

        var card = e.target.closest(".preset-card:not(.preset-card--my)");
        if (!card || !grid || !grid.contains(card)) return;
        onPick(card.getAttribute("data-preset-id"));
      },
      { signal: signal }
    );

    host.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var main = e.target.closest(".preset-card__main");
        if (main && grid && grid.contains(main) && e.target === main) {
          e.preventDefault();
          onPick(main.getAttribute("data-preset-id"));
          return;
        }
        var card = e.target.closest(".preset-card:not(.preset-card--my)");
        if (!card || !grid || !grid.contains(card) || e.target !== card) return;
        e.preventDefault();
        onPick(card.getAttribute("data-preset-id"));
      },
      { signal: signal }
    );

    window.addEventListener(
      MY_PRESETS_EVENT,
      function () {
        if (currentFilter === FILTER_MY) renderGrid();
      },
      { signal: signal }
    );

    setFilter(FILTER_BUILTIN);
  }

  window.Tools = window.Tools || {};
  window.Tools.glass = {
    id: "glass",
    title: "글래스모피즘",
    render: function (container) {
      container.innerHTML = glassTemplate();
      var root = container.querySelector(".tool-root");
      var ac = new AbortController();

      var tabsApi = initTabs(root, ac.signal);
      var genApi = initGenerator(root, ac.signal);
      initPresets(root, genApi, ac.signal, tabsApi);

      return function cleanup() {
        try {
          ac.abort();
        } catch (e) {}
        container.innerHTML = "";
      };
    },
  };
})();

