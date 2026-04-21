/* One-off generator for subpage/*.html — run: node scripts/gen-subpages.js */
const fs = require("fs");
const path = require("path");

const tools = [
  { id: "glass", title: "글래스모피즘" },
  { id: "neumorphism", title: "뉴모피즘" },
  { id: "gradient", title: "그라디언트 메이커" },
  { id: "mesh", title: "메쉬 그라디언트" },
  { id: "pattern", title: "패턴 생성기" },
  { id: "grid", title: "그리드 빌더" },
  { id: "flex", title: "플렉스박스 빌더" },
  { id: "spacing", title: "스페이싱 스케일" },
  { id: "container", title: "컨테이너 계산기" },
  { id: "type", title: "타이포 스케일" },
  { id: "palette", title: "팔레트 생성기" },
  { id: "contrast", title: "대비 체크" },
  { id: "shadow", title: "섀도우 프리셋" },
  { id: "border", title: "보더/라디우스" },
  { id: "animation", title: "애니메이션" },
];

const dir = path.join(__dirname, "..", "subpage");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function page(t) {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${t.title} — CSS Utility Hub 도구" />
    <title>${t.title} — CSS Utility Hub</title>
    <link rel="icon" href="../assets/images/icon/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" href="../assets/images/icon/favicon.png" />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
    />
    <link rel="stylesheet" href="../assets/css/base.css" />
    <link rel="stylesheet" href="../assets/css/common.css" />
    <link rel="stylesheet" href="../assets/css/hub.css" />
    <link rel="stylesheet" href="../assets/css/index.css" />
    <link rel="stylesheet" href="../assets/css/footer.css" />
    <script>
      (function () {
        try {
          if (localStorage.getItem("glass-theme") === "light")
            document.documentElement.setAttribute("data-theme", "light");
        } catch (e) {}
      })();
    </script>
    <script>
      window.__HUB_PAGE__ = { tool: "${t.id}" };
    </script>
  </head>
  <body>
    <div id="hub-root"></div>

    <div class="toast" id="toast" role="status" aria-live="polite">알림</div>

    <script src="../assets/js/hub.js" defer></script>
    <script src="../assets/js/theme.js" defer></script>
    <script src="../assets/js/tools/${t.id}.js" defer></script>
    <script src="../assets/js/tools/coming-soon.js" defer></script>
    <script src="../assets/js/hub-layout.js" defer></script>
    <script src="../assets/js/hub-bootstrap.js" defer></script>
    <script src="../assets/js/app.js" defer></script>
  </body>
</html>
`;
}

for (const t of tools) {
  fs.writeFileSync(path.join(dir, t.id + ".html"), page(t), "utf8");
  console.log("wrote", t.id + ".html");
}
