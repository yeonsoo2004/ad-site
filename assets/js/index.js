(function () {
  var root = document.documentElement;
  var preview = document.getElementById("preview-card");
  var previewStage = document.getElementById("preview-stage");
  var codeOut = document.getElementById("generated-css");
  var toast = document.getElementById("toast");

  var MY_PRESETS_EVENT = "glass-my-presets-changed";
  var MY_PRESETS_STORAGE = "glass-my-presets";

  var controls = {
    blur: document.getElementById("ctrl-blur"),
    opacity: document.getElementById("ctrl-opacity"),
    border: document.getElementById("ctrl-border"),
    radius: document.getElementById("ctrl-radius"),
    shadow: document.getElementById("ctrl-shadow"),
    tint: document.getElementById("ctrl-tint"),
    bgImage: document.getElementById("ctrl-bg-image"),
  };

  var outputs = {
    blur: document.getElementById("out-blur"),
    opacity: document.getElementById("out-opacity"),
    border: document.getElementById("out-border"),
    radius: document.getElementById("out-radius"),
    shadow: document.getElementById("out-shadow"),
  };

  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    var n = parseInt(h, 16);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255,
    };
  }

  function rgbaFromHex(hex, alpha) {
    var c = hexToRgb(hex);
    return "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + alpha + ")";
  }

  function syncLiveGlassVars(blur, opacity, borderPx, radius, shadowStr, tintHex) {
    var c = hexToRgb(tintHex);
    var spread = shadowStr * 2;
    root.style.setProperty("--live-glass-blur", blur + "px");
    root.style.setProperty("--live-glass-opacity", String(opacity));
    root.style.setProperty("--live-glass-r", String(c.r));
    root.style.setProperty("--live-glass-g", String(c.g));
    root.style.setProperty("--live-glass-b", String(c.b));
    root.style.setProperty("--live-glass-border-w", borderPx + "px");
    root.style.setProperty("--live-glass-radius", radius + "px");
    root.style.setProperty("--live-glass-shadow-y", shadowStr + "px");
    root.style.setProperty("--live-glass-shadow-spread", spread + "px");
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
      "  content: \"\";\n" +
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

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message || "알림";
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

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

  function onSaveMyPreset() {
    var name = window.prompt("저장할 프리셋 이름을 입력하세요.", "");
    if (name === null) return;
    name = String(name).trim();
    if (!name) {
      showToast("이름을 입력해 주세요.");
      return;
    }
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

  window.GlassGenerator = {
    applyPreset: applyPreset,
    update: update,
    getState: getState,
    showToast: showToast,
  };

  Object.keys(controls).forEach(function (key) {
    var el = controls[key];
    if (el && el.addEventListener) {
      el.addEventListener("input", update);
      el.addEventListener("change", update);
    }
  });

  var btnCopy = document.getElementById("btn-copy");
  if (btnCopy)
    btnCopy.addEventListener("click", function () {
      var text = codeOut.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast("클립보드에 복사했습니다");
        }).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          showToast("클립보드에 복사했습니다");
        } catch (e) {}
        document.body.removeChild(ta);
      }
    });

  var btnSavePreset = document.getElementById("btn-save-my-preset");
  if (btnSavePreset) btnSavePreset.addEventListener("click", onSaveMyPreset);

  update();
})();
