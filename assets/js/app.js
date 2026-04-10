(function () {
  "use strict";

  var VIEWS = ["generator", "presets", "showcase", "guide"];
  var STORAGE_KEY = "glasslab-generator-state";
  var TOAST_MS = 2200;
  var TOAST_DEFAULT = "Copied!";

  var DEFAULTS = {
    blur: 16,
    transparency: 35,
    border: 1,
    shadow: 50,
    color: "#ffffff",
  };

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function hexToRgb(hex) {
    var h = (hex || "#ffffff").replace(/^#/, "");
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    var n = parseInt(h, 16);
    if (isNaN(n) || h.length !== 6) {
      return { r: 255, g: 255, b: 255 };
    }
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map(function (x) {
          var v = clamp(Math.round(x), 0, 255);
          var h = v.toString(16);
          return h.length < 2 ? "0" + h : h;
        })
        .join("")
    );
  }

  function normalizeHex(hex) {
    var h = (hex || "").trim();
    if (!h.startsWith("#")) h = "#" + h;
    var body = h.slice(1);
    if (/^[0-9a-fA-F]{3}$/.test(body)) {
      body =
        body[0] + body[0] + body[1] + body[1] + body[2] + body[2];
    }
    if (/^[0-9a-fA-F]{6}$/.test(body)) {
      return "#" + body.toLowerCase();
    }
    return "#ffffff";
  }

  function buildCss(blurPx, alphaPct, borderPx, shadowPct, hexColor) {
    var rgb = hexToRgb(hexColor);
    var alpha = clamp(alphaPct, 5, 95) / 100;
    var shadowT = clamp(shadowPct, 0, 100) / 100;
    var spread = Math.round(2 + shadowT * 10);
    var blurShadow = Math.round(8 + shadowT * 32);
    var y = Math.round(4 + shadowT * 20);
    var insetAlpha = 0.25 + shadowT * 0.35;
    var borderAlpha = 0.35 + shadowT * 0.35;
    var shadowDark = 0.15 + shadowT * 0.35;
    var ringAlpha = 0.04 + shadowT * 0.08;

    var bgRgba =
      "rgba(" +
      rgb.r +
      ", " +
      rgb.g +
      ", " +
      rgb.b +
      ", " +
      alpha.toFixed(2) +
      ")";
    var borderRgba =
      "rgba(" +
      rgb.r +
      ", " +
      rgb.g +
      ", " +
      rgb.b +
      ", " +
      borderAlpha.toFixed(2) +
      ")";

    var boxShadow =
      "0 " +
      y +
      "px " +
      blurShadow +
      "px rgba(0, 0, 0, " +
      shadowDark.toFixed(2) +
      "), " +
      "0 0 0 " +
      spread +
      "px rgba(255, 255, 255, " +
      ringAlpha.toFixed(2) +
      "), " +
      "inset 0 1px 0 rgba(255, 255, 255, " +
      insetAlpha.toFixed(2) +
      ")";

    var block =
      ".glass-card {\n" +
      "  background: " +
      bgRgba +
      ";\n" +
      "  backdrop-filter: blur(" +
      blurPx +
      "px);\n" +
      "  -webkit-backdrop-filter: blur(" +
      blurPx +
      "px);\n" +
      "  border: " +
      borderPx +
      "px solid " +
      borderRgba +
      ";\n" +
      "  border-radius: 20px;\n" +
      "  box-shadow:\n" +
      "    0 " +
      y +
      "px " +
      blurShadow +
      "px rgba(0, 0, 0, " +
      shadowDark.toFixed(2) +
      "),\n" +
      "    0 0 0 " +
      spread +
      "px rgba(255, 255, 255, " +
      ringAlpha.toFixed(2) +
      "),\n" +
      "    inset 0 1px 0 rgba(255, 255, 255, " +
      insetAlpha.toFixed(2) +
      ");\n" +
      "}";

    return {
      css: block,
      alpha: alpha,
      rgb: rgb,
      bgRgba: bgRgba,
      borderRgba: borderRgba,
      boxShadow: boxShadow,
      blurPx: blurPx,
      borderPx: borderPx,
    };
  }

  function applyGlassToElement(el, blurPx, alphaPct, borderPx, shadowPct, hex) {
    if (!el) return;
    var built = buildCss(blurPx, alphaPct, borderPx, shadowPct, hex);
    el.style.background = built.bgRgba;
    el.style.backdropFilter = "blur(" + blurPx + "px)";
    el.style.webkitBackdropFilter = "blur(" + blurPx + "px)";
    el.style.border = borderPx + "px solid " + built.borderRgba;
    el.style.boxShadow = built.boxShadow;
  }

  function readGeneratorValues() {
    return {
      blur: parseInt(blurInput.value, 10),
      transparency: parseInt(transparencyInput.value, 10),
      border: parseInt(borderInput.value, 10),
      shadow: parseInt(shadowInput.value, 10),
      hex: normalizeHex(colorInput.value),
    };
  }

  function $(id) {
    return document.getElementById(id);
  }

  var card = $("glassCard");
  var blurInput = $("blur");
  var transparencyInput = $("transparency");
  var borderInput = $("border");
  var shadowInput = $("shadow");
  var colorInput = $("glassColor");
  var cssOutput = $("cssOutput");
  var copyBtn = $("copyBtn");
  var resetBtn = $("resetBtn");
  var toast = $("toast");
  var toastText = $("toastText");

  var blurVal = $("blurVal");
  var transparencyVal = $("transparencyVal");
  var borderVal = $("borderVal");
  var shadowVal = $("shadowVal");
  var glassColorVal = $("glassColorVal");

  var toastHideTimer = null;
  var toastResetTimer = null;

  var presetFilter = "all";

  function getPresets() {
    return window.GLASS_PRESETS || [];
  }

  function saveState() {
    if (!blurInput || !colorInput) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          blur: blurInput.value,
          transparency: transparencyInput.value,
          border: borderInput.value,
          shadow: shadowInput.value,
          color: normalizeHex(colorInput.value),
        })
      );
    } catch (e) {}
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (typeof data !== "object" || data === null) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function applyInputsFromDefaultsOrStorage() {
    var data = loadState();
    var src = data || DEFAULTS;

    var b = parseInt(src.blur, 10);
    var t = parseInt(src.transparency, 10);
    var bd = parseInt(src.border, 10);
    var s = parseInt(src.shadow, 10);

    blurInput.value = String(clamp(isNaN(b) ? DEFAULTS.blur : b, 0, 40));
    transparencyInput.value = String(
      clamp(isNaN(t) ? DEFAULTS.transparency : t, 5, 95)
    );
    borderInput.value = String(clamp(isNaN(bd) ? DEFAULTS.border : bd, 0, 6));
    shadowInput.value = String(
      clamp(isNaN(s) ? DEFAULTS.shadow : s, 0, 100)
    );

    var col =
      typeof src.color === "string" ? normalizeHex(src.color) : DEFAULTS.color;
    colorInput.value = col;
  }

  function updateGenerator() {
    if (!card || !blurInput) return;

    var v = readGeneratorValues();

    blurVal.textContent = v.blur + "px";
    transparencyVal.textContent = v.transparency + "%";
    borderVal.textContent = v.border + "px";
    shadowVal.textContent = v.shadow + "%";
    glassColorVal.textContent = v.hex;

    var built = buildCss(v.blur, v.transparency, v.border, v.shadow, v.hex);

    card.style.background = built.bgRgba;
    card.style.backdropFilter = "blur(" + v.blur + "px)";
    card.style.webkitBackdropFilter = "blur(" + v.blur + "px)";
    card.style.border = v.border + "px solid " + built.borderRgba;
    card.style.boxShadow = built.boxShadow;

    cssOutput.textContent = built.css;
    saveState();
  }

  function resetGenerator() {
    blurInput.value = String(DEFAULTS.blur);
    transparencyInput.value = String(DEFAULTS.transparency);
    borderInput.value = String(DEFAULTS.border);
    shadowInput.value = String(DEFAULTS.shadow);
    colorInput.value = DEFAULTS.color;
    updateGenerator();
    showToast("기본값으로 초기화했어요");
  }

  function applyPresetData(p) {
    if (!p) return;
    var r = p.rgba[0];
    var g = p.rgba[1];
    var b = p.rgba[2];
    blurInput.value = String(clamp(p.blur, 0, 40));
    transparencyInput.value = String(clamp(p.transparency, 5, 95));
    borderInput.value = String(clamp(p.border, 0, 6));
    shadowInput.value = String(clamp(p.shadow, 0, 100));
    colorInput.value = rgbToHex(r, g, b);
    updateGenerator();
  }

  function categoryLabel(cat) {
    var map = {
      soft: "Soft",
      vivid: "Vivid",
      dark: "Dark",
      glassy: "Glassy",
    };
    return map[cat] || cat;
  }

  function renderPresetGrid() {
    var grid = $("presetGrid");
    if (!grid) return;

    var list = getPresets().filter(function (p) {
      return presetFilter === "all" || p.category === presetFilter;
    });

    grid.innerHTML = "";

    if (list.length === 0) {
      grid.innerHTML =
        '<p class="preset-empty">이 카테고리에 맞는 프리셋이 없습니다.</p>';
      return;
    }

    list.forEach(function (p) {
      var rgbaStr =
        "rgba(" +
        p.rgba[0] +
        ", " +
        p.rgba[1] +
        ", " +
        p.rgba[2] +
        ", " +
        (typeof p.rgba[3] === "number" ? p.rgba[3].toFixed(2) : "0.35") +
        ")";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-card";
      btn.setAttribute("data-preset-id", p.id);
      btn.setAttribute("aria-label", p.name + " 프리셋 적용");

      var sw = document.createElement("div");
      sw.className = "preset-swatch";
      sw.setAttribute("aria-hidden", "true");
      sw.style.background = rgbaStr;
      sw.style.backdropFilter = "blur(" + Math.min(p.blur, 24) + "px)";
      sw.style.webkitBackdropFilter = "blur(" + Math.min(p.blur, 24) + "px)";

      var badge = document.createElement("span");
      badge.className = "preset-cat-badge";
      badge.textContent = categoryLabel(p.category);

      var h = document.createElement("h3");
      h.className = "preset-card-title";
      h.textContent = p.name;

      var meta = document.createElement("p");
      meta.className = "preset-card-meta";
      meta.textContent =
        rgbaStr +
        " · blur " +
        p.blur +
        "px · border " +
        p.border +
        "px";

      var hint = document.createElement("p");
      hint.className = "preset-card-hint";
      hint.textContent = p.hint || "";

      btn.appendChild(sw);
      btn.appendChild(badge);
      btn.appendChild(h);
      btn.appendChild(meta);
      btn.appendChild(hint);
      grid.appendChild(btn);
    });
  }

  function findPresetById(id) {
    var found = null;
    getPresets().forEach(function (p) {
      if (p.id === id) found = p;
    });
    return found;
  }

  function initPresetSection() {
    renderPresetGrid();

    var filterBar = $("presetFilterBar");
    if (filterBar) {
      filterBar.addEventListener("click", function (e) {
        var t = e.target.closest("[data-preset-filter]");
        if (!t) return;
        var f = t.getAttribute("data-preset-filter");
        if (!f) return;
        presetFilter = f;
        filterBar.querySelectorAll(".preset-filter-btn").forEach(function (b) {
          b.classList.toggle(
            "is-active",
            b.getAttribute("data-preset-filter") === f
          );
        });
        renderPresetGrid();
      });
    }

    var grid = $("presetGrid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var cardEl = e.target.closest(".preset-card[data-preset-id]");
        if (!cardEl) return;
        var id = cardEl.getAttribute("data-preset-id");
        var p = findPresetById(id);
        if (!p) return;
        applyPresetData(p);
        showView("generator");
        showToast("생성기에 동기화됨 ✨");
      });
    }
  }

  function applyShowcaseTemplate(rootId) {
    var root = $(rootId);
    if (!root) return;
    var surface = root.querySelector(".showcase-glass-surface");
    if (!surface) return;
    var v = readGeneratorValues();
    applyGlassToElement(
      surface,
      v.blur,
      v.transparency,
      v.border,
      v.shadow,
      v.hex
    );
    showToast("템플릿에 내 설정을 적용했어요");
  }

  function initShowcaseInteractions() {
    document.querySelectorAll("[data-apply-generator]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tid = btn.getAttribute("data-apply-generator");
        if (tid) applyShowcaseTemplate(tid);
      });
    });

    var playerRoot = $("showcasePlayer");
    var playBtn = $("demoPlayBtn");
    if (playerRoot && playBtn) {
      playBtn.addEventListener("click", function () {
        var on = playerRoot.classList.toggle("is-playing");
        playBtn.textContent = on ? "❚❚" : "▶";
        playBtn.setAttribute("aria-label", on ? "일시정지" : "재생");
      });
    }

    var prevBtn = $("demoPrevBtn");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        showToast("이전 트랙 (데모)");
      });
    }
    var nextBtn = $("demoNextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        showToast("다음 트랙 (데모)");
      });
    }

    var loginForm = $("showcaseLoginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        showToast("데모 로그인 — 전송 없음");
      });
    }

    initDemoCalculator();
    initCalendarWidget();
    initGlassSwitches();
    initChatDemo();
    var pricingBtn = $("pricingDemoBtn");
    if (pricingBtn) {
      pricingBtn.addEventListener("click", function () {
        showToast("데모 · 구독 플로우");
      });
    }
    var followBtn = $("profileFollowBtn");
    if (followBtn) {
      followBtn.addEventListener("click", function () {
        var on = followBtn.getAttribute("data-following") === "1";
        followBtn.setAttribute("data-following", on ? "0" : "1");
        followBtn.textContent = on ? "팔로우" : "팔로잉";
        showToast(on ? "언팔로우 (데모)" : "팔로우했어요 (데모)");
      });
    }
    var cartBtn = $("productCartBtn");
    if (cartBtn) {
      cartBtn.addEventListener("click", function () {
        showToast("장바구니에 담았어요 (데모)");
      });
    }
  }

  function initDemoCalculator() {
    var out = $("calcDisplay");
    var wrap = $("calcKeys");
    if (!out || !wrap) return;

    var acc = null;
    var pendingOp = null;
    var current = "0";
    var fresh = true;

    function fmt(n) {
      var s = String(n);
      if (s.length > 12) {
        var x = parseFloat(s);
        if (Math.abs(x) > 1e9 || (Math.abs(x) < 1e-6 && x !== 0)) {
          return x.toExponential(5);
        }
        return String(Math.round(x * 1e8) / 1e8);
      }
      return s;
    }

    function applyOp(a, op, b) {
      if (op === "+") return a + b;
      if (op === "-") return a - b;
      if (op === "*") return a * b;
      if (op === "/") return b === 0 ? NaN : a / b;
      return b;
    }

    function render() {
      out.textContent = current;
    }

    function resetAll() {
      acc = null;
      pendingOp = null;
      current = "0";
      fresh = true;
      render();
    }

    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-calc]");
      if (!btn) return;
      var key = btn.getAttribute("data-calc");
      if (!key) return;

      if (key === "C") {
        resetAll();
        return;
      }

      if (key === "⌫") {
        if (!fresh && current.length > 1) {
          current = current.slice(0, -1);
        } else {
          current = "0";
          fresh = true;
        }
        render();
        return;
      }

      if ("0123456789.".indexOf(key) !== -1) {
        if (key === "." && current.indexOf(".") !== -1 && !fresh) return;
        if (fresh) {
          current = key === "." ? "0." : key;
          fresh = false;
        } else {
          current += key;
        }
        render();
        return;
      }

      if (key === "+" || key === "-" || key === "*" || key === "/") {
        var num = parseFloat(current);
        if (isNaN(num)) num = 0;
        if (acc !== null && pendingOp && !fresh) {
          acc = applyOp(acc, pendingOp, num);
          if (isNaN(acc) || !isFinite(acc)) {
            current = "Error";
            fresh = true;
            acc = null;
            pendingOp = null;
            render();
            return;
          }
          current = fmt(acc);
          render();
        } else {
          acc = num;
        }
        pendingOp = key;
        fresh = true;
        return;
      }

      if (key === "=") {
        var n = parseFloat(current);
        if (isNaN(n)) n = 0;
        if (acc !== null && pendingOp) {
          var r = applyOp(acc, pendingOp, n);
          if (isNaN(r) || !isFinite(r)) {
            current = "Error";
          } else {
            current = fmt(r);
          }
        }
        acc = null;
        pendingOp = null;
        fresh = true;
        render();
      }
    });
  }

  function initCalendarWidget() {
    var grid = $("calGrid");
    var title = $("calTitle");
    var prev = $("calPrev");
    var next = $("calNext");
    if (!grid || !title) return;

    var y = 2026;
    var m = 3;

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function renderCal() {
      title.textContent = y + "년 " + (m + 1) + "월";
      grid.innerHTML = "";
      var first = new Date(y, m, 1).getDay();
      var lastDate = new Date(y, m + 1, 0).getDate();
      var prevLast = new Date(y, m, 0).getDate();
      var today = new Date();
      var isThisMonth =
        today.getFullYear() === y && today.getMonth() === m;

      for (var i = 0; i < first; i++) {
        var d = prevLast - first + i + 1;
        var b = document.createElement("span");
        b.className = "tmpl-cal-day tmpl-cal-day--muted";
        b.textContent = String(d);
        grid.appendChild(b);
      }

      for (var day = 1; day <= lastDate; day++) {
        var el = document.createElement("button");
        el.type = "button";
        el.className = "tmpl-cal-day";
        el.textContent = String(day);
        if (isThisMonth && day === today.getDate()) {
          el.classList.add("tmpl-cal-day--today");
        }
        el.addEventListener("click", function () {
          showToast("데모 달력 · 날짜 선택");
        });
        grid.appendChild(el);
      }

      var used = first + lastDate;
      var totalCells = Math.ceil(used / 7) * 7;
      var n = 1;
      for (var j = used; j < totalCells; j++) {
        var b2 = document.createElement("span");
        b2.className = "tmpl-cal-day tmpl-cal-day--muted";
        b2.textContent = String(n++);
        grid.appendChild(b2);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        m--;
        if (m < 0) {
          m = 11;
          y--;
        }
        renderCal();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        m++;
        if (m > 11) {
          m = 0;
          y++;
        }
        renderCal();
      });
    }

    renderCal();
  }

  function initGlassSwitches() {
    document.querySelectorAll(".glass-switch").forEach(function (sw) {
      sw.addEventListener("click", function () {
        var on = sw.getAttribute("aria-checked") === "true";
        sw.setAttribute("aria-checked", on ? "false" : "true");
      });
    });
  }

  function initChatDemo() {
    var form = $("chatDemoForm");
    var input = $("chatInput");
    var thread = $("chatThread");
    if (!form || !input || !thread) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = (input.value || "").trim();
      if (!t) return;
      var div = document.createElement("div");
      div.className = "tmpl-chat-bubble tmpl-chat-bubble--me";
      var span = document.createElement("span");
      span.textContent = t;
      div.appendChild(span);
      thread.appendChild(div);
      input.value = "";
      thread.scrollTop = thread.scrollHeight;
      showToast("메시지 전송 (데모)");
    });
  }

  function showToast(message) {
    if (!toast) return;
    if (toastHideTimer) clearTimeout(toastHideTimer);
    if (toastResetTimer) clearTimeout(toastResetTimer);
    var label = message || TOAST_DEFAULT;
    if (toastText) toastText.textContent = label;
    else toast.textContent = label;
    toast.classList.add("show");
    toastHideTimer = setTimeout(function () {
      toast.classList.remove("show");
      toastHideTimer = null;
      toastResetTimer = setTimeout(function () {
        if (toastText) toastText.textContent = TOAST_DEFAULT;
        else toast.textContent = TOAST_DEFAULT;
        toastResetTimer = null;
      }, 500);
    }, TOAST_MS);
  }

  function copyCss() {
    var text = cssOutput.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          showToast("코드가 복사되었습니다");
        })
        .catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    var ta = document.createElement("textarea");
    ta.value = cssOutput.textContent;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast("코드가 복사되었습니다");
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function showView(viewId) {
    if (VIEWS.indexOf(viewId) === -1) return;

    var sections = document.querySelectorAll(".view-section");
    var tabs = document.querySelectorAll(".nav-tab");

    sections.forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-view") === viewId);
    });

    tabs.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-target") === viewId);
    });

    if (viewId === "presets") renderPresetGrid();
  }

  function initNav() {
    document.querySelectorAll(".nav-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-target");
        if (target) showView(target);
      });
    });
  }

  function initGenerator() {
    if (!blurInput || !colorInput) return;

    applyInputsFromDefaultsOrStorage();

    ["input", "change"].forEach(function (ev) {
      blurInput.addEventListener(ev, updateGenerator);
      transparencyInput.addEventListener(ev, updateGenerator);
      borderInput.addEventListener(ev, updateGenerator);
      shadowInput.addEventListener(ev, updateGenerator);
      colorInput.addEventListener(ev, updateGenerator);
    });

    if (copyBtn) copyBtn.addEventListener("click", copyCss);
    if (resetBtn) resetBtn.addEventListener("click", resetGenerator);

    updateGenerator();
  }

  function initBrand() {
    var brand = $("brandHome");
    if (!brand) return;
    brand.addEventListener("click", function (e) {
      e.preventDefault();
      showView("generator");
    });
  }

  initNav();
  initBrand();
  initGenerator();
  initPresetSection();
  initShowcaseInteractions();
})();
