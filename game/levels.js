/* FRAGILE: The Great Server Rescue — level data (plain ES module, no dependencies) */

export const WORLD = { W: 960, H: 540 };

/* Ground strip at y=480 with bottomless pits (bounds are [start, end] in world x). */
function ground(width, pits) {
  const segs = [];
  let x = 0;
  for (const [a, b] of pits) {
    if (a > x) segs.push({ x, y: 480, w: a - x, h: 60 });
    x = b;
  }
  if (x < width) segs.push({ x, y: 480, w: width - x, h: 60 });
  return segs;
}

export const LEVELS = [
  {
    id: 1,
    name: "The Front Lobby",
    subtitle: "The Front Lobby. A cheerful room that is only cheerful because nobody checks the door.",
    tip: "Hop the 404 spikes and mind the gap. The double jump is optional. For now.",
    width: 2200,
    sky: ["#182238", "#0d1420"],
    accent: "#ffd166",
    platforms: [
      ...ground(2200, [[1040, 1340]]),
      { x: 320, y: 420, w: 150, h: 22 },
      { x: 560, y: 340, w: 150, h: 22 },
      { x: 810, y: 410, w: 160, h: 22 },
      { x: 1070, y: 330, w: 150, h: 22 },
      { x: 1330, y: 400, w: 150, h: 22 },
      { x: 1590, y: 330, w: 150, h: 22 },
      { x: 1900, y: 350, w: 220, h: 26 },
    ],
    hazards: [
      { x: 560, y: 466, w: 64, h: 14 },
      { x: 1110, y: 316, w: 56, h: 14 },
    ],
    enemies: [
      { x: 890, y: 393, range: 60, speed: 45 },
    ],
    pickups: [
      { x: 395, y: 360, kind: "cookie" },
      { x: 635, y: 280, kind: "invoice" },
      { x: 890, y: 350, kind: "cookie" },
      { x: 1145, y: 265, kind: "invoice" },
      { x: 1665, y: 265, kind: "cookie" },
    ],
    start: { x: 90, y: 480 },
    goal: { x: 2050, y: 350 },
  },

  {
    id: 2,
    name: "The 404 Swamp",
    subtitle: "Everything here returns 404: not found. Except the swamp. The swamp exists.",
    tip: "Use the double jump — the swamp has no floor, only hope and a faint echo of 1997.",
    width: 2400,
    sky: ["#0f2b26", "#07110e"],
    accent: "#7ef0c1",
    platforms: [
      ...ground(2400, [[760, 1160], [1390, 2060]]),
      { x: 320, y: 420, w: 130, h: 22 },
      { x: 540, y: 350, w: 160, h: 22 },
      { x: 760, y: 270, w: 120, h: 22 },
      { x: 950, y: 380, w: 130, h: 22 },
      { x: 1180, y: 300, w: 130, h: 22 },
      { x: 1410, y: 220, w: 160, h: 22 },
      { x: 1660, y: 330, w: 130, h: 22 },
      { x: 1920, y: 260, w: 120, h: 22 },
      { x: 2180, y: 340, w: 220, h: 26 },
    ],
    hazards: [
      { x: 620, y: 466, w: 64, h: 14 },
      { x: 980, y: 366, w: 56, h: 14 },
    ],
    enemies: [
      { x: 620, y: 333, range: 60, speed: 50 },
      { x: 1490, y: 203, range: 60, speed: 55 },
    ],
    pickups: [
      { x: 385, y: 360, kind: "cookie" },
      { x: 620, y: 290, kind: "invoice" },
      { x: 820, y: 210, kind: "cookie" },
      { x: 1245, y: 240, kind: "invoice" },
      { x: 1490, y: 160, kind: "cookie" },
    ],
    start: { x: 90, y: 480 },
    goal: { x: 2250, y: 340 },
  },

  {
    id: 3,
    name: "The Invoice Mine",
    subtitle: "Every spike is a bill that refuses to be paid. All invoices: $0.00.",
    tip: "Time the moving platform. It breathes. So should you.",
    width: 2600,
    sky: ["#2b1a10", "#160d07"],
    accent: "#ffb454",
    platforms: [
      ...ground(2600, [[740, 1250], [1800, 2380]]),
      { x: 330, y: 420, w: 140, h: 22 },
      { x: 580, y: 340, w: 140, h: 22 },
      { x: 830, y: 300, w: 130, h: 22, move: { axis: "y", range: 60, speed: 1.1 } },
      { x: 1090, y: 390, w: 140, h: 22 },
      { x: 1360, y: 320, w: 140, h: 22 },
      { x: 1640, y: 400, w: 140, h: 22 },
      { x: 1900, y: 330, w: 140, h: 22 },
      { x: 2160, y: 280, w: 110, h: 22 },
      { x: 2390, y: 350, w: 210, h: 26 },
    ],
    hazards: [
      { x: 450, y: 466, w: 64, h: 14 },
      { x: 1650, y: 466, w: 64, h: 14 },
      { x: 1400, y: 306, w: 56, h: 14 },
    ],
    enemies: [
      { x: 650, y: 323, range: 60, speed: 50 },
      { x: 1970, y: 313, range: 60, speed: 55 },
    ],
    pickups: [
      { x: 400, y: 360, kind: "cookie" },
      { x: 650, y: 280, kind: "invoice" },
      { x: 895, y: 210, kind: "cookie" },
      { x: 1430, y: 260, kind: "invoice" },
      { x: 1970, y: 270, kind: "cookie" },
    ],
    start: { x: 90, y: 480 },
    goal: { x: 2450, y: 350 },
  },

  {
    id: 4,
    name: "The DNS Dungeon",
    subtitle: "Your domain points to a room. The room points to you. The room is not open.",
    tip: "Watch the platform rhythms. They are slow, steady, and completely unbothered.",
    width: 2800,
    sky: ["#221536", "#100a1c"],
    accent: "#c9a7ff",
    platforms: [
      ...ground(2800, [[800, 1500], [1790, 2560]]),
      { x: 620, y: 420, w: 140, h: 22 },
      { x: 870, y: 350, w: 140, h: 22 },
      { x: 1130, y: 280, w: 120, h: 22, move: { axis: "x", range: 60, speed: 1.0 } },
      { x: 1370, y: 360, w: 120, h: 22 },
      { x: 1660, y: 290, w: 120, h: 22 },
      { x: 1960, y: 330, w: 120, h: 22, move: { axis: "y", range: 60, speed: 1.2 } },
      { x: 2260, y: 260, w: 120, h: 22 },
      { x: 2460, y: 300, w: 110, h: 22 },
      { x: 2590, y: 330, w: 210, h: 26 },
    ],
    hazards: [
      { x: 640, y: 466, w: 64, h: 14 },
      { x: 1420, y: 346, w: 56, h: 14 },
    ],
    enemies: [
      { x: 940, y: 333, range: 60, speed: 45 },
      { x: 1720, y: 273, range: 60, speed: 50 },
      { x: 2515, y: 283, range: 60, speed: 55 },
    ],
    pickups: [
      { x: 690, y: 360, kind: "cookie" },
      { x: 940, y: 290, kind: "invoice" },
      { x: 1190, y: 220, kind: "cookie" },
      { x: 1720, y: 230, kind: "invoice" },
      { x: 2320, y: 200, kind: "cookie" },
    ],
    start: { x: 90, y: 480 },
    goal: { x: 2650, y: 330 },
  },

  {
    id: 5,
    name: "The Chaos Corridor",
    subtitle: "The Waaaa button lives here. It has been pressed. A lot.",
    tip: "Commit. The corridor does not forgive hesitation. Or the invoice.",
    width: 3000,
    sky: ["#2b0f14", "#150608"],
    accent: "#ff6b6b",
    platforms: [
      ...ground(3000, [[760, 1260], [1560, 2330]]),
      { x: 320, y: 420, w: 130, h: 22 },
      { x: 620, y: 340, w: 120, h: 22 },
      { x: 830, y: 270, w: 110, h: 22, move: { axis: "x", range: 60, speed: 1.3 } },
      { x: 1060, y: 360, w: 120, h: 22 },
      { x: 1330, y: 290, w: 120, h: 22 },
      { x: 1610, y: 340, w: 110, h: 22, move: { axis: "y", range: 60, speed: 1.4 } },
      { x: 1890, y: 260, w: 120, h: 22 },
      { x: 2150, y: 350, w: 130, h: 22 },
      { x: 2420, y: 290, w: 110, h: 22 },
      { x: 2700, y: 350, w: 220, h: 26 },
    ],
    hazards: [
      { x: 640, y: 466, w: 64, h: 14 },
      { x: 2350, y: 466, w: 64, h: 14 },
    ],
    enemies: [
      { x: 680, y: 323, range: 60, speed: 55 },
      { x: 1390, y: 273, range: 60, speed: 60 },
      { x: 2215, y: 333, range: 60, speed: 65 },
    ],
    pickups: [
      { x: 385, y: 360, kind: "cookie" },
      { x: 680, y: 280, kind: "invoice" },
      { x: 885, y: 210, kind: "cookie" },
      { x: 1665, y: 250, kind: "invoice" },
      { x: 2475, y: 230, kind: "cookie" },
    ],
    start: { x: 90, y: 480 },
    goal: { x: 2850, y: 350 },
  },

  {
    id: 6,
    name: "The VIP Backroom",
    subtitle: "hello. → you made it. You have always been here. You are $0.00 richer.",
    tip: "You made it. The VIP backroom is warm, quiet, and only $0.00.",
    width: 3200,
    sky: ["#2b2410", "#15100a"],
    accent: "#ffe08a",
    platforms: [
      ...ground(3200, [[740, 1300], [1590, 2330], [2600, 2980]]),
      { x: 300, y: 420, w: 140, h: 22 },
      { x: 580, y: 350, w: 130, h: 22 },
      { x: 800, y: 280, w: 120, h: 22, move: { axis: "x", range: 60, speed: 1.0 } },
      { x: 1040, y: 360, w: 140, h: 22 },
      { x: 1330, y: 280, w: 140, h: 22 },
      { x: 1620, y: 330, w: 120, h: 22, move: { axis: "y", range: 60, speed: 1.2 } },
      { x: 1900, y: 260, w: 130, h: 22 },
      { x: 2150, y: 350, w: 130, h: 22 },
      { x: 2410, y: 280, w: 130, h: 22 },
      { x: 2680, y: 340, w: 130, h: 22 },
      { x: 2990, y: 330, w: 210, h: 26 },
    ],
    hazards: [
      { x: 660, y: 466, w: 64, h: 14 },
      { x: 2350, y: 466, w: 64, h: 14 },
      { x: 2450, y: 266, w: 56, h: 14 },
    ],
    enemies: [
      { x: 645, y: 333, range: 60, speed: 50 },
      { x: 1400, y: 263, range: 60, speed: 55 },
      { x: 2215, y: 333, range: 60, speed: 60 },
    ],
    pickups: [
      { x: 370, y: 360, kind: "cookie" },
      { x: 645, y: 290, kind: "invoice" },
      { x: 860, y: 220, kind: "cookie" },
      { x: 1400, y: 220, kind: "invoice" },
      { x: 2215, y: 290, kind: "cookie" },
    ],
    start: { x: 90, y: 480 },
    goal: { x: 3050, y: 330 },
  },
];
