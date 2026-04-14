(function () {
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
    {
      id: "steel-mist",
      name: "스틸 미스트",
      description: "차분한 스틸 블루 그레이",
      blur: 24,
      opacity: 16,
      border: 1,
      radius: 14,
      shadow: 20,
      tint: "#94a3b8",
      bgImage: "",
    },
    {
      id: "forest-canopy",
      name: "포레스트 캐노피",
      description: "숲속 이파리 그린",
      blur: 18,
      opacity: 22,
      border: 2,
      radius: 20,
      shadow: 26,
      tint: "#4ade80",
      bgImage: "",
    },
    {
      id: "lavender-dream",
      name: "라벤더 드림",
      description: "몽환적인 연보라",
      blur: 28,
      opacity: 14,
      border: 1,
      radius: 30,
      shadow: 22,
      tint: "#d8b4fe",
      bgImage: "",
    },
    {
      id: "graphite-smoke",
      name: "그래파이트 스모크",
      description: "뉴트럴 다크 그레이",
      blur: 20,
      opacity: 28,
      border: 1,
      radius: 12,
      shadow: 34,
      tint: "#64748b",
      bgImage: "",
    },
    {
      id: "tangerine-pop",
      name: "탠저린 팝",
      description: "선명한 오렌지 포인트",
      blur: 14,
      opacity: 27,
      border: 1,
      radius: 16,
      shadow: 32,
      tint: "#f97316",
      bgImage: "",
    },
    {
      id: "polar-fog",
      name: "폴라 포그",
      description: "얼음빛 화이트·페일 블루",
      blur: 30,
      opacity: 11,
      border: 1,
      radius: 20,
      shadow: 16,
      tint: "#e0f2fe",
      bgImage: "",
    },
    {
      id: "electric-violet",
      name: "일렉트릭 바이올렛",
      description: "비비드 퍼플 네온",
      blur: 13,
      opacity: 23,
      border: 2,
      radius: 10,
      shadow: 38,
      tint: "#a855f7",
      bgImage: "",
    },
    {
      id: "coral-reef",
      name: "코랄 리프",
      description: "따뜻한 코랄·살몬",
      blur: 19,
      opacity: 25,
      border: 1,
      radius: 24,
      shadow: 25,
      tint: "#fb7185",
      bgImage: "",
    },
  ];

  var MY_PRESETS_STORAGE = "glass-my-presets";
  var MY_PRESETS_EVENT = "glass-my-presets-changed";

  var FILTER_BUILTIN = "builtin";
  var FILTER_MY = "my";

  var root = document.getElementById("presets-root");
  if (!root) return;

  var grid;
  var currentFilter = FILTER_BUILTIN;

  function loadMyPresets() {
    try {
      var raw = localStorage.getItem(MY_PRESETS_STORAGE);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveMyPresets(list) {
    try {
      localStorage.setItem(MY_PRESETS_STORAGE, JSON.stringify(list));
    } catch (e) {}
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
      ' 프리셋 삭제">' +
      '<span aria-hidden="true">삭제</span>' +
      "</button>" +
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
      if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      }
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
    var builtin = findBuiltin(id);
    if (builtin) return builtin;
    return findMyPreset(id);
  }

  function renderGrid() {
    var list =
      currentFilter === FILTER_MY ? loadMyPresets() : GLASS_PRESETS.slice();

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
    var buttons = root.querySelectorAll(".presets-filter__btn");
    buttons.forEach(function (btn) {
      var f = btn.getAttribute("data-preset-filter");
      var active = f === filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    renderGrid();
  }

  function onPick(id) {
    var p = resolvePreset(id);
    if (!p || !window.GlassGenerator) return;
    window.GlassGenerator.applyPreset(p);
    if (window.SpaNav) window.SpaNav.go("generator");
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
    if (window.GlassGenerator && window.GlassGenerator.showToast) {
      window.GlassGenerator.showToast("프리셋을 삭제했습니다.");
    }
  }

  root.innerHTML =
    '<div class="presets-toolbar" role="toolbar" aria-label="프리셋 카테고리">' +
    '<button type="button" class="presets-filter__btn is-active" data-preset-filter="' +
    FILTER_BUILTIN +
    '" aria-pressed="true">기본 프리셋</button>' +
    '<button type="button" class="presets-filter__btn" data-preset-filter="' +
    FILTER_MY +
    '" aria-pressed="false">My Presets</button>' +
    "</div>" +
    '<div id="presets-grid" class="presets-grid"></div>';

  grid = document.getElementById("presets-grid");

  root.addEventListener("click", function (e) {
    var delBtn = e.target.closest("[data-preset-delete]");
    if (delBtn && grid && grid.contains(delBtn)) {
      e.preventDefault();
      e.stopPropagation();
      onDeleteMyPreset(delBtn.getAttribute("data-preset-delete"));
      return;
    }

    var filterBtn = e.target.closest("[data-preset-filter]");
    if (filterBtn && root.contains(filterBtn)) {
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
  });

  root.addEventListener("keydown", function (e) {
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
  });

  window.addEventListener(MY_PRESETS_EVENT, function () {
    if (currentFilter === FILTER_MY) renderGrid();
  });

  setFilter(FILTER_BUILTIN);

  window.PresetsGallery = {
    refresh: function () {
      renderGrid();
    },
    setFilter: setFilter,
  };
})();
