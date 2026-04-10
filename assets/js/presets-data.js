/**
 * Glass Lab — preset library (30+)
 * category: soft | vivid | dark | glassy
 * rgba: [r, g, b, a] — a는 표시용; 슬라이더 투명도는 transparency(5–95)와 동기화
 */
window.GLASS_PRESETS = [
  { id: "frost-mint", name: "프로스트 민트", category: "soft", blur: 18, transparency: 38, rgba: [186, 255, 236, 0.38], border: 1, shadow: 42, hint: "민트 틴트의 산뜻한 패널" },
  { id: "cream-soda", name: "크림 소다", category: "soft", blur: 14, transparency: 62, rgba: [255, 248, 235, 0.55], border: 1, shadow: 28, hint: "따뜻한 크림 베이스" },
  { id: "lavender-mist", name: "라벤더 미스트", category: "soft", blur: 22, transparency: 44, rgba: [230, 220, 255, 0.42], border: 2, shadow: 36, hint: "은은한 보라 안개" },
  { id: "rose-quartz", name: "로즈 쿼츠", category: "soft", blur: 16, transparency: 48, rgba: [255, 210, 225, 0.45], border: 1, shadow: 40, hint: "로즈 골드 톤 글래스" },
  { id: "vanilla-sky", name: "바닐라 스카이", category: "soft", blur: 20, transparency: 58, rgba: [255, 252, 240, 0.5], border: 1, shadow: 32, hint: "밝고 부드러운 하늘빛" },
  { id: "peach-glow", name: "피치 글로우", category: "soft", blur: 17, transparency: 52, rgba: [255, 218, 198, 0.48], border: 1, shadow: 38, hint: "피치 코랄 글로우" },
  { id: "honey-amber", name: "허니 앰버", category: "soft", blur: 15, transparency: 46, rgba: [255, 200, 120, 0.4], border: 2, shadow: 44, hint: "꿀빛 앰버 하이라이트" },
  { id: "powder-blue", name: "파우더 블루", category: "soft", blur: 19, transparency: 55, rgba: [200, 225, 255, 0.52], border: 1, shadow: 30, hint: "파스텔 블루 안개" },

  { id: "golden-sunset", name: "골든 선셋", category: "vivid", blur: 12, transparency: 35, rgba: [255, 160, 60, 0.42], border: 2, shadow: 72, hint: "노을빛 오렌지" },
  { id: "cherry-sorbet", name: "체리 소르베", category: "vivid", blur: 14, transparency: 32, rgba: [255, 90, 120, 0.38], border: 2, shadow: 68, hint: "상큼한 체리 레드" },
  { id: "citrus-pop", name: "시트러스 팝", category: "vivid", blur: 11, transparency: 40, rgba: [255, 220, 80, 0.45], border: 2, shadow: 65, hint: "레몬·라임 팝 컬러" },
  { id: "electric-lime", name: "일렉트릭 라임", category: "vivid", blur: 10, transparency: 28, rgba: [180, 255, 100, 0.35], border: 2, shadow: 78, hint: "네온 라임 액센트" },
  { id: "coral-reef", name: "코랄 린", category: "vivid", blur: 13, transparency: 36, rgba: [255, 120, 140, 0.4], border: 2, shadow: 70, hint: "산호초 코랄" },
  { id: "magenta-pearl", name: "마젠타 펄", category: "vivid", blur: 15, transparency: 30, rgba: [240, 100, 200, 0.36], border: 2, shadow: 82, hint: "펄감 마젠타" },
  { id: "event-aurora", name: "이벤트 오로라", category: "vivid", blur: 16, transparency: 34, rgba: [100, 200, 255, 0.4], border: 2, shadow: 76, hint: "오로라 그라데이션 느낌" },
  { id: "ultra-violet", name: "울트라 바이올렛", category: "vivid", blur: 18, transparency: 26, rgba: [140, 80, 255, 0.32], border: 2, shadow: 88, hint: "딥 바이올렛 네온" },

  { id: "midnight-purple", name: "미드나잇 퍼플", category: "dark", blur: 26, transparency: 18, rgba: [40, 25, 70, 0.45], border: 2, shadow: 80, hint: "심야 보라 안개" },
  { id: "deep-ocean", name: "딥 오션", category: "dark", blur: 28, transparency: 16, rgba: [15, 45, 80, 0.48], border: 2, shadow: 85, hint: "깊은 해저 블루" },
  { id: "smoky-quartz", name: "스모키 쿼츠", category: "dark", blur: 24, transparency: 22, rgba: [45, 45, 55, 0.5], border: 2, shadow: 74, hint: "스모키 그레이 쿼츠" },
  { id: "charcoal-silk", name: "차콜 실크", category: "dark", blur: 22, transparency: 20, rgba: [35, 38, 45, 0.46], border: 1, shadow: 72, hint: "실크 같은 차콜" },
  { id: "burgundy-velvet", name: "버건디 벨벳", category: "dark", blur: 20, transparency: 24, rgba: [80, 20, 45, 0.42], border: 2, shadow: 78, hint: "벨벳 버건디" },
  { id: "ink-blue", name: "잉크 블루", category: "dark", blur: 30, transparency: 14, rgba: [10, 25, 55, 0.52], border: 2, shadow: 90, hint: "먹물 블루 뎁스" },
  { id: "black-coffee", name: "블랙 커피", category: "dark", blur: 32, transparency: 12, rgba: [25, 22, 20, 0.55], border: 1, shadow: 88, hint: "에스프레소 다크" },
  { id: "obsidian-glass", name: "흑요석 글래스", category: "dark", blur: 27, transparency: 17, rgba: [20, 22, 30, 0.48], border: 2, shadow: 84, hint: "흑요석 질감" },

  { id: "ice-blue", name: "아이스 블루", category: "glassy", blur: 34, transparency: 22, rgba: [200, 235, 255, 0.28], border: 1, shadow: 52, hint: "얇은 얼음 막" },
  { id: "forest-dew", name: "포레스트 듀", category: "glassy", blur: 30, transparency: 25, rgba: [180, 230, 200, 0.3], border: 1, shadow: 48, hint: "숲 이슬 투명감" },
  { id: "silver-mirror", name: "실버 미러", category: "glassy", blur: 36, transparency: 20, rgba: [240, 245, 255, 0.22], border: 1, shadow: 46, hint: "은빛 거울 반사" },
  { id: "frosty-white", name: "프러스티 화이트", category: "glassy", blur: 38, transparency: 18, rgba: [255, 255, 255, 0.2], border: 1, shadow: 44, hint: "극한 프러스트 화이트" },
  { id: "emerald-drop", name: "에메랄드 드롭", category: "glassy", blur: 32, transparency: 24, rgba: [160, 255, 210, 0.26], border: 1, shadow: 50, hint: "에메랄드 한 방울" },
  { id: "northern-lights", name: "노던 라이트", category: "glassy", blur: 28, transparency: 28, rgba: [120, 255, 200, 0.32], border: 1, shadow: 58, hint: "오로라 투명 레이어" },
  { id: "stardust", name: "스타더스트", category: "glassy", blur: 35, transparency: 21, rgba: [220, 230, 255, 0.24], border: 1, shadow: 55, hint: "별가루 크리스탈" },
  { id: "crystal-clear", name: "크리스탈 클리어", category: "glassy", blur: 40, transparency: 15, rgba: [255, 255, 255, 0.18], border: 0, shadow: 40, hint: "거의 투명한 크리스탈" },
  { id: "prism-lite", name: "프리즘 라이트", category: "glassy", blur: 33, transparency: 23, rgba: [230, 210, 255, 0.27], border: 1, shadow: 49, hint: "프리즘 산란 빛" },
];
