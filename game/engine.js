/* FRAGILE: The Great Server Rescue — game engine (no external assets) */

import { LEVELS } from "./levels.js";
import { createInput } from "./input.js";
import { sfx } from "./audio.js";
import { drawFrame } from "./render.js";

const VIEW_W = 960;
const VIEW_H = 540;

const GRAVITY = 1800;
const HOLD_GRAVITY = 900;
const MAX_SPEED = 260;
const ACCEL = 2600;
const FRICTION = 2200;
const JUMP_V = -600;
const DOUBLE_JUMP_V = -540;
const COYOTE = 0.10;
const BUFFER = 0.12;
const PLAYER_W = 26;
const PLAYER_H = 34;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

/* ------------------------------------------------------------------ */
/* persistence                                                         */
/* ------------------------------------------------------------------ */
function loadProgress() {
  try {
    const raw = localStorage.getItem("fragile.progress.v1");
    if (raw) {
      const data = JSON.parse(raw);
      const best = {};
      if (data.best && typeof data.best === "object") {
        for (const lvl of LEVELS) {
          const b = data.best[lvl.id];
          if (b && Number.isFinite(b.time) && Number.isFinite(b.cookies)) {
            best[lvl.id] = { time: b.time, deaths: Number(b.deaths) || 0, cookies: b.cookies };
          }
        }
      }
      return {
        unlocked: clamp(Math.floor(Number(data.unlocked)) || 1, 1, LEVELS.length),
        best,
        muted: data.muted !== false, // audio is opt-in: muted unless explicitly turned on
      };
    }
  } catch (e) { /* ignore */ }
  return { unlocked: 1, best: {}, muted: true };
}

function saveProgress(p) {
  try {
    localStorage.setItem("fragile.progress.v1", JSON.stringify(p));
  } catch (e) { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/* geometry helpers                                                    */
/* ------------------------------------------------------------------ */
function currentPlatforms(level, t) {
  return level.platforms.map((p) => {
    if (!p.move) return { x: p.x, y: p.y, w: p.w, h: p.h };
    const off = Math.sin(t * p.move.speed) * p.move.range;
    if (p.move.axis === "x") return { x: p.x + off, y: p.y, w: p.w, h: p.h, move: p.move };
    return { x: p.x, y: p.y + off, w: p.w, h: p.h, move: p.move };
  });
}

function platformVelocity(base, t) {
  if (!base || !base.move) return { x: 0, y: 0 };
  const v = Math.cos(t * base.move.speed) * base.move.speed * base.move.range;
  return base.move.axis === "x" ? { x: v, y: 0 } : { x: 0, y: v };
}

function overlap(a, b) {
  return (
    a.x + a.w / 2 > b.x &&
    a.x - a.w / 2 < b.x + b.w &&
    a.y > b.y &&
    a.y - a.h < b.y + b.h
  );
}

function overlapBox(ax, ay, aw, ah, bx, by, bw, bh, shrink) {
  const s = shrink || 0;
  const ax1 = ax - aw / 2 + s, ax2 = ax + aw / 2 - s, ay1 = ay - ah + s, ay2 = ay - s;
  const bx1 = bx, bx2 = bx + bw, by1 = by, by2 = by + bh;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

function formatTime(t) {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

let started = false;

export function startGame() {
  if (started) return;
  started = true;

  const root = document.getElementById("game-root");
  const canvas = document.getElementById("game-canvas");
  if (!root || !canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  /* DOM refs */
  const hud = document.getElementById("hud");
  const hudLevel = document.getElementById("hud-level");
  const hudCookies = document.getElementById("hud-cookies");
  const hudInvoices = document.getElementById("hud-invoices");
  const hudTime = document.getElementById("hud-time");
  const btnMute = document.getElementById("btn-mute");
  const btnPause = document.getElementById("btn-pause");
  const btnHome = document.getElementById("btn-home");
  const touchControls = document.getElementById("touch-controls");
  const overlay = document.getElementById("overlay");
  const overlayKicker = document.getElementById("overlay-kicker");
  const overlayTitle = document.getElementById("overlay-title");
  const overlaySubtitle = document.getElementById("overlay-subtitle");
  const overlayBody = document.getElementById("overlay-body");
  const overlayActions = document.getElementById("overlay-actions");

  const motionQuery = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const reduceMotion = () => !!(motionQuery && motionQuery.matches);

  /* Sharp rendering on hi-dpi screens: keep drawing in 960x540 logical units. */
  let renderScale = 1;
  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const shown = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    const k = clamp(Math.round(shown * dpr * 2) / 2, 1, 2);
    renderScale = k;
    const w = Math.round(VIEW_W * k), h = Math.round(VIEW_H * k);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  const input = createInput(root);
  const progress = loadProgress();
  sfx.setMuted(progress.muted);

  const game = {
    state: "title",
    levelIndex: 0,
    level: LEVELS[0],
    levelTime: 0,
    deaths: 0,
    cookies: 0,
    invoices: 0,
    totalTime: 0,
    totalCookies: 0,
    totalInvoices: 0,
    totalDeaths: 0,
    camera: { x: 0, y: 0 },
    shake: { x: 0, y: 0 },
    shakeMag: 0,
    flash: 0,
    player: null,
    enemies: [],
    pickups: [],
    particles: [],
    coyote: 0,
    buffer: 0,
    deadTimer: 0,
    demoTime: 0,
    lastTime: 0,
    acc: 0,
    running: true,
    overlayLock: 0,
    _prevJumpHeld: false,
    _primaryAction: null,
  };

  /* ---------------- particles ---------------- */
  function spawnDust(x, y, n) {
    for (let i = 0; i < n; i++) {
      game.particles.push({
        x: x + rand(-8, 8),
        y: y - 2,
        vx: rand(-40, 40),
        vy: rand(-50, -10),
        life: rand(0.3, 0.55),
        maxLife: 0.55,
        size: rand(3, 6),
        color: "#c8c8d2",
        kind: "dust",
      });
    }
  }

  function spawnSparkle(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(40, 130);
      game.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: rand(0.35, 0.6),
        maxLife: 0.6,
        size: rand(3, 6),
        color: "#fff6dd",
        kind: "sparkle",
      });
    }
  }

  function spawnPoof(x, y) {
    game.particles.push({
      x, y, vx: 0, vy: 0,
      life: 0.45, maxLife: 0.45,
      size: 18, color: "#d2d2dc", kind: "poof",
    });
  }

  function spawnConfetti(x, y, n) {
    const colors = ["#ffd166", "#ff6b6b", "#7ef0c1", "#c9a7ff", "#ff9f6e", "#ffe08a"];
    for (let i = 0; i < n; i++) {
      game.particles.push({
        x: x + rand(-30, 30),
        y: y + rand(-20, 20),
        vx: rand(-160, 160),
        vy: rand(-380, -120),
        life: rand(1.0, 1.7),
        maxLife: 1.7,
        size: rand(5, 9),
        color: colors[Math.floor(Math.random() * colors.length)],
        kind: "confetti",
      });
    }
  }

  function updateParticles(dt) {
    for (const pt of game.particles) {
      pt.life -= dt;
      if (pt.kind === "confetti") {
        pt.vy += 620 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
      } else if (pt.kind === "dust") {
        pt.vy += 220 * dt;
        pt.vx *= 0.98;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
      } else if (pt.kind === "sparkle") {
        pt.vy += 140 * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
      }
    }
    game.particles = game.particles.filter((pt) => pt.life > 0);
  }

  /* ---------------- level setup ---------------- */
  function makePlayer(level) {
    return {
      x: level.start.x,
      y: level.start.y,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0, vy: 0,
      facing: 1,
      grounded: false,
      jumps: 1,
      squash: 1,
      stretch: 1,
      dead: false,
      _platIndex: null,
    };
  }

  function spawnEnemies(level) {
    return level.enemies.map((e) => ({
      baseX: e.x,
      x: e.x,
      y: e.y,
      w: 30,
      h: 34,
      dir: 1,
      range: e.range,
      speed: e.speed,
    }));
  }

  function spawnPickups(level) {
    return level.pickups.map((pk) => ({ x: pk.x, y: pk.y, kind: pk.kind, taken: false }));
  }

  function setupLevel(fresh) {
    const level = LEVELS[game.levelIndex];
    game.level = level;
    game.levelTime = 0;
    game.cookies = 0;
    game.invoices = 0;
    if (fresh) {
      game.deaths = 0;
      if (game.levelIndex === 0) {
        game.totalTime = 0;
        game.totalCookies = 0;
        game.totalInvoices = 0;
        game.totalDeaths = 0;
      }
    }
    game.player = makePlayer(level);
    game.enemies = spawnEnemies(level);
    game.pickups = spawnPickups(level);
    game.particles = [];
    game.flash = 0;
    game.shakeMag = 0;
    game.coyote = 0;
    game.buffer = 0;
    game.deadTimer = 0;
    game.camera.x = clamp(game.player.x - 480, 0, Math.max(0, level.width - VIEW_W));
    game.camera.y = 0;
  }

  /* ---------------- overlays ---------------- */
  function setOverlay(kicker, title, subtitle) {
    overlayKicker.textContent = kicker || "";
    overlayTitle.textContent = title || "";
    overlaySubtitle.textContent = subtitle || "";
    overlayBody.replaceChildren();
    overlayActions.replaceChildren();
    overlay.hidden = false;
    game.overlayLock = 0.4; // swallow leftover jump-mashing so results aren't skipped
  }

  function addButton(label, opts) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn " + (opts.primary ? "btn-primary" : opts.danger ? "btn-danger" : "btn-ghost");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      sfx.play("ui");
      opts.onClick();
    });
    overlayActions.appendChild(btn);
    if (opts.primary) btn.focus({ preventScroll: true });
    return btn;
  }

  function addLink(label, href) {
    const a = document.createElement("a");
    a.className = "btn btn-ghost";
    a.href = href;
    a.textContent = label;
    overlayActions.appendChild(a);
    return a;
  }

  function addBodyNode(node) {
    overlayBody.appendChild(node);
  }

  function tipLine(text) {
    const p = document.createElement("p");
    p.className = "tip-line";
    p.textContent = text;
    return p;
  }

  function statsGrid(rows) {
    const wrap = document.createElement("div");
    wrap.className = "stats-list";
    for (const [value, label] of rows) {
      const box = document.createElement("div");
      box.className = "stat-box";
      const v = document.createElement("div");
      v.className = "stat-val";
      v.textContent = value;
      const l = document.createElement("div");
      l.className = "stat-label";
      l.textContent = label;
      box.appendChild(v);
      box.appendChild(l);
      wrap.appendChild(box);
    }
    return wrap;
  }

  function setPrimary(action) {
    game._primaryAction = action;
  }

  function hideOverlay() {
    overlay.hidden = true;
    game._primaryAction = null;
  }

  function updateHud() {
    const lvl = game.level;
    hudLevel.textContent = lvl ? `${lvl.id} · ${lvl.name}` : "FRAGILE";
    hudCookies.textContent = `🍪 ${game.cookies}`;
    hudInvoices.textContent = `🧾 $0.00`;
    hudTime.textContent = formatTime(game.levelTime);
  }

  function updateHudVisibility() {
    const visible = game.state === "play" || game.state === "dead" || game.state === "paused";
    hud.style.display = visible ? "flex" : "none";
    const touchVisible = input.isTouch && game.state === "play";
    touchControls.hidden = !touchVisible;
  }

  /* ---------------- state transitions ---------------- */
  function goTitle() {
    game.state = "title";
    game.level = LEVELS[0];
    game.player = null;
    game.enemies = [];
    game.pickups = [];
    game.particles = [];
    game.demoTime = 0;
    game.flash = 0;
    game.shakeMag = 0;
    showTitle();
    updateHudVisibility();
  }

  function goSelect() {
    game.state = "select";
    showSelect();
    updateHudVisibility();
  }

  function goIntro(i) {
    game.levelIndex = clamp(i, 0, LEVELS.length - 1);
    game.state = "intro";
    showIntro();
    updateHudVisibility();
  }

  function startPlay() {
    setupLevel(true);
    game.state = "play";
    hideOverlay();
    updateHudVisibility();
    sfx.play("ui");
  }

  function showTitle() {
    setOverlay("A Website on the Internet Presents", "FRAGILE", "The Great Server Rescue — haul a fragile server to the VIP backroom. Just for fun.");
    addBodyNode(tipLine(input.isTouch
      ? "Use the on-screen buttons · Double jump · Landscape works best."
      : "Arrows / WASD · Space to jump (twice!) · P pause · R restart · M sound"));
    addButton("Play", { primary: true, onClick: () => goSelect() });
    const sound = addButton(sfx.isMuted() ? "Sound: Off" : "Sound: On", {
      onClick: () => { toggleMute(); sound.textContent = sfx.isMuted() ? "Sound: Off" : "Sound: On"; },
    });
    addLink("Back to the Internet", "index.html");
    setPrimary(() => goSelect());
  }

  function showSelect() {
    setOverlay("The Route", "Pick a Level", "Six rooms between you and the VIP backroom.");
    const grid = document.createElement("div");
    grid.className = "level-grid";
    for (const lvl of LEVELS) {
      const unlocked = lvl.id <= progress.unlocked;
      const best = progress.best[lvl.id];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "level-card";
      card.disabled = !unlocked;
      const num = document.createElement("span");
      num.className = "level-num";
      num.textContent = `LEVEL ${lvl.id}`;
      const name = document.createElement("span");
      name.className = "level-name";
      name.textContent = lvl.name;
      const bestLine = document.createElement("span");
      bestLine.className = "level-best";
      bestLine.textContent = best ? `Best ${formatTime(best.time)} · 🍪${best.cookies}` : unlocked ? "Not cleared yet" : "🔒 Locked";
      card.appendChild(num);
      card.appendChild(name);
      card.appendChild(bestLine);
      if (unlocked) {
        card.addEventListener("click", () => {
          sfx.play("ui");
          goIntro(lvl.id - 1);
        });
      }
      grid.appendChild(card);
    }
    addBodyNode(grid);
    addButton("Back", { primary: true, onClick: () => goTitle() });
    setPrimary(() => goTitle());
  }

  function showIntro() {
    const lvl = LEVELS[game.levelIndex];
    setOverlay(`Level ${lvl.id} of ${LEVELS.length}`, lvl.name, lvl.subtitle);
    addBodyNode(tipLine(lvl.tip));
    addBodyNode(tipLine("🍪 cookies · 🧾 $0.00 · reach the VIP chair"));
    addButton("Start", { primary: true, onClick: () => startPlay() });
    addButton("Menu", { onClick: () => goSelect() });
    setPrimary(() => startPlay());
  }

  function showComplete() {
    const lvl = game.level;
    setOverlay("Level Complete", "you made it.", lvl.subtitle);
    addBodyNode(statsGrid([
      [formatTime(game.levelTime), "Time"],
      [String(game.cookies), "Cookies"],
      [String(game.deaths), "Deaths"],
    ]));
    const hasNext = game.levelIndex + 1 < LEVELS.length;
    if (hasNext) {
      addButton("Next Level", { primary: true, onClick: () => goIntro(game.levelIndex + 1) });
      setPrimary(() => goIntro(game.levelIndex + 1));
    } else {
      addButton("Menu", { primary: true, onClick: () => goSelect() });
      setPrimary(() => goSelect());
    }
    addButton("Replay", { onClick: () => goIntro(game.levelIndex) });
    addButton("Menu", { onClick: () => goSelect() });
  }

  function showWin() {
    setOverlay("All Levels Complete", "you made it.", "You have been promoted to VIP. The server is safe. The invoice is $0.00.");
    addBodyNode(statsGrid([
      [formatTime(game.totalTime), "Total Time"],
      [String(game.totalCookies), "Cookies"],
      [String(game.totalDeaths), "Deaths"],
    ]));
    addButton("Play Again", { primary: true, onClick: () => goIntro(0) });
    addButton("Menu", { onClick: () => goSelect() });
    setPrimary(() => goIntro(0));
  }

  function showPaused() {
    setOverlay("Paused", "Paused", "The server waits. Duct tape never forgets.");
    addBodyNode(tipLine("Press P, Esc or Enter to resume."));
    addButton("Resume", { primary: true, onClick: () => resume() });
    addButton("Restart", { onClick: () => { setupLevel(true); game.state = "play"; hideOverlay(); updateHudVisibility(); } });
    addButton("Menu", { onClick: () => goSelect() });
    setPrimary(() => resume());
  }

  /* ---------------- flow ---------------- */
  function toggleMute() {
    sfx.unlock();
    const m = sfx.toggle();
    progress.muted = m;
    saveProgress(progress);
    updateMuteButton();
  }

  function updateMuteButton() {
    const muted = sfx.isMuted();
    btnMute.textContent = muted ? "🔇" : "🔊";
    btnMute.setAttribute("aria-pressed", String(!muted));
  }

  function togglePause() {
    if (game.state === "play") {
      game.state = "paused";
      showPaused();
      updateHudVisibility();
      sfx.play("ui");
    } else if (game.state === "paused") {
      resume();
    }
  }

  function resume() {
    if (game.state !== "paused") return;
    game.state = "play";
    hideOverlay();
    updateHudVisibility();
    sfx.play("ui");
  }

  function restartLevel() {
    setupLevel(true);
    game.state = "play";
    hideOverlay();
    updateHudVisibility();
    sfx.play("ui");
  }

  function die() {
    if (game.state !== "play") return;
    game.state = "dead";
    game.deaths += 1;
    game.flash = 1;
    game.shakeMag = 14;
    game.deadTimer = 0.85;
    if (game.player) game.player.dead = true;
    sfx.play("death");
    if (game.player) spawnPoof(game.player.x, game.player.y - 20);
    updateHudVisibility();
  }

  function completeLevel() {
    const lvl = game.level;
    sfx.play("complete");
    if (game.player) spawnConfetti(game.player.x, game.player.y - 60, 70);

    const best = progress.best[lvl.id] || { time: Infinity, deaths: Infinity, cookies: 0 };
    progress.best[lvl.id] = {
      time: Math.min(best.time, game.levelTime),
      deaths: Math.min(best.deaths, game.deaths),
      cookies: Math.max(best.cookies, game.cookies),
    };
    progress.unlocked = Math.max(progress.unlocked, Math.min(LEVELS.length, lvl.id + 1));
    saveProgress(progress);

    game.totalTime += game.levelTime;
    game.totalCookies += game.cookies;
    game.totalInvoices += game.invoices;
    game.totalDeaths += game.deaths;

    if (lvl.id >= LEVELS.length) {
      game.state = "win";
      sfx.play("win");
      if (game.player) spawnConfetti(game.player.x, game.player.y - 80, 130);
      showWin();
    } else {
      game.state = "complete";
      showComplete();
    }
    updateHudVisibility();
  }

  /* ---------------- physics ---------------- */
  function updateEnemies(dt) {
    for (const e of game.enemies) {
      e.x += e.dir * e.speed * dt;
      if (e.x > e.baseX + e.range) { e.x = e.baseX + e.range; e.dir = -1; }
      if (e.x < e.baseX - e.range) { e.x = e.baseX - e.range; e.dir = 1; }
    }
  }

  function physics(dt) {
    game.levelTime += dt;
    const level = game.level;
    const plats = currentPlatforms(level, game.levelTime);
    const p = game.player;
    if (!p) return;

    // platform carry
    if (p._platIndex != null && p.grounded) {
      const base = level.platforms[p._platIndex];
      if (base && base.move) {
        const vel = platformVelocity(base, game.levelTime);
        if (base.move.axis === "x") p.x += vel.x * dt;
        else p.y += vel.y * dt;
      }
    }

    // horizontal input
    const wasHeld = game._prevJumpHeld;
    if (input.left) p.vx -= ACCEL * dt;
    if (input.right) p.vx += ACCEL * dt;
    if (!input.left && !input.right) {
      const f = FRICTION * dt;
      if (Math.abs(p.vx) <= f) p.vx = 0;
      else p.vx -= Math.sign(p.vx) * f;
    }
    p.vx = clamp(p.vx, -MAX_SPEED, MAX_SPEED);
    if (p.vx !== 0) p.facing = p.vx > 0 ? 1 : -1;

    // jump release cut
    if (wasHeld && !input.jumpHeld && p.vy < 0) p.vy *= 0.45;
    game._prevJumpHeld = input.jumpHeld;

    // buffer & coyote
    if (game.buffer > 0) game.buffer -= dt;
    if (game.coyote > 0) game.coyote -= dt;

    // jump / double jump
    if (game.buffer > 0 && (p.grounded || game.coyote > 0)) {
      p.vy = JUMP_V;
      p.grounded = false;
      game.coyote = 0;
      game.buffer = 0;
      p.jumps = 1;
      p.stretch = 1.3;
      sfx.play("jump");
      spawnDust(p.x, p.y, 4);
    } else if (game.buffer > 0 && p.jumps > 0) {
      p.vy = DOUBLE_JUMP_V;
      p.jumps = 0;
      game.buffer = 0;
      p.stretch = 1.3;
      sfx.play("double");
      spawnDust(p.x, p.y, 6);
    }

    // gravity
    const g = (input.jumpHeld && p.vy < 0) ? HOLD_GRAVITY : GRAVITY;
    p.vy += g * dt;

    // move X (the world has walls at both ends)
    p.x += p.vx * dt;
    const minX = p.w / 2, maxX = level.width - p.w / 2;
    if (p.x < minX) { p.x = minX; if (p.vx < 0) p.vx = 0; }
    else if (p.x > maxX) { p.x = maxX; if (p.vx > 0) p.vx = 0; }
    for (const pl of plats) {
      if (overlap(p, pl)) {
        if (p.vx > 0) p.x = pl.x - p.w / 2;
        else if (p.vx < 0) p.x = pl.x + pl.w + p.w / 2;
        p.vx = 0;
      }
    }

    // move Y
    const prevGrounded = p.grounded;
    p.y += p.vy * dt;
    p.grounded = false;
    p._platIndex = null;
    for (let i = 0; i < plats.length; i++) {
      const pl = plats[i];
      if (overlap(p, pl)) {
        if (p.vy > 0) {
          p.y = pl.y;
          p.vy = 0;
          p.grounded = true;
          p._platIndex = i;
          p.jumps = 1;
        } else if (p.vy < 0) {
          p.y = pl.y + pl.h + p.h;
          p.vy = 0;
        }
      }
    }

    if (p.grounded) game.coyote = COYOTE;

    // landing
    if (!prevGrounded && p.grounded) {
      sfx.play("land");
      spawnDust(p.x, p.y, 6);
      p.squash = 0.55;
      game.shakeMag = Math.max(game.shakeMag, 2);
    }

    // squash / stretch lerp
    p.squash += (1 - p.squash) * Math.min(1, 8 * dt);
    p.stretch += (1 - p.stretch) * Math.min(1, 8 * dt);

    // running dust
    if (p.grounded && Math.abs(p.vx) > 150 && Math.random() < dt * 6) {
      spawnDust(p.x - p.facing * 8, p.y, 1);
    }

    // enemies
    updateEnemies(dt);
    for (const e of game.enemies) {
      if (overlapBox(p.x, p.y, p.w, p.h, e.x - e.w / 2, e.y - e.h, e.w, e.h, 4)) {
        die();
        return;
      }
    }

    // hazards
    for (const hz of level.hazards) {
      if (overlapBox(p.x, p.y, p.w, p.h, hz.x, hz.y, hz.w, hz.h, 4)) {
        die();
        return;
      }
    }

    // pickups
    for (const pk of game.pickups) {
      if (pk.taken) continue;
      const dx = p.x - pk.x;
      const dy = (p.y - p.h / 2) - pk.y;
      if (dx * dx + dy * dy < 16 * 16) {
        pk.taken = true;
        if (pk.kind === "cookie") {
          game.cookies += 1;
          sfx.play("collect");
        } else {
          game.invoices += 1;
          sfx.play("invoice");
        }
        spawnSparkle(pk.x, pk.y, 8);
      }
    }

    // goal
    const goal = level.goal;
    const goalRect = { x: goal.x - 35, y: goal.y - 70, w: 70, h: 70 };
    if (overlap(p, goalRect)) {
      completeLevel();
      return;
    }

    // fall
    if (p.y > VIEW_H + 40) {
      die();
      return;
    }

    // camera follow
    const maxCam = Math.max(0, level.width - VIEW_W);
    const target = p.x - 480 + p.facing * 60;
    game.camera.x += (target - game.camera.x) * Math.min(1, 8 * dt);
    game.camera.x = clamp(game.camera.x, 0, maxCam);
  }

  /* ---------------- update ---------------- */
  function update(dt) {
    // camera shake
    game.shakeMag = Math.max(0, game.shakeMag - 30 * dt);
    const calm = reduceMotion();
    game.shake.x = calm ? 0 : rand(-1, 1) * game.shakeMag;
    game.shake.y = calm ? 0 : rand(-1, 1) * game.shakeMag;
    game.flash = calm ? 0 : Math.max(0, game.flash - 2.5 * dt);

    updateParticles(dt);

    if (game.state === "title") {
      game.demoTime += dt;
      const level = LEVELS[0];
      const maxCam = Math.max(0, level.width - VIEW_W);
      game.camera.x = clamp(200 + 400 * Math.sin(game.demoTime * 0.1), 0, maxCam);
      game.camera.y = 0;
      return;
    }

    if (game.state === "play") {
      physics(dt);
      updateHud();
      return;
    }

    if (game.state === "dead") {
      game.deadTimer -= dt;
      if (game.deadTimer <= 0) {
        setupLevel(false);
        game.state = "play";
        hideOverlay();
        updateHudVisibility();
      }
      return;
    }
  }

  /* ---------------- render ---------------- */
  function buildView() {
    const level = game.level;
    const plats = currentPlatforms(level, game.levelTime);
    const levelView = Object.assign({}, level, { platforms: plats });
    let player = null;
    let time = game.levelTime;
    if (game.state === "dead") {
      time = 0.85 - game.deadTimer;
    }
    if (game.player) {
      player = Object.assign({}, game.player);
    }
    return {
      mode: game.state,
      time,
      level: levelView,
      camera: game.camera,
      shake: game.shake,
      flash: game.flash,
      player,
      enemies: game.enemies.map((e) => Object.assign({}, e)),
      pickups: game.pickups.map((pk) => Object.assign({}, pk)),
      hazards: level.hazards,
      goal: level.goal,
      particles: game.particles,
      demo: game.state === "title",
    };
  }

  function render() {
    const view = buildView();
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    drawFrame(ctx, view);
  }

  /* ---------------- loop ---------------- */
  function frame(now) {
    if (!game.running) return;
    if (!game.lastTime) game.lastTime = now;
    const dt = Math.min(0.1, (now - game.lastTime) / 1000);
    game.lastTime = now;
    game.acc += dt;

    // consume input edges once per frame
    const jumpEdge = input.consumeJump();
    const confirmEdge = input.consumeConfirm();
    const pauseEdge = input.consumePause();
    const muteEdge = input.consumeMute();
    const restartEdge = input.consumeRestart();

    if (muteEdge) toggleMute();

    if (game.overlayLock > 0) game.overlayLock -= dt;

    if (pauseEdge) {
      if (game.state === "select") goTitle();
      else if (game.state === "intro") goSelect();
      else togglePause();
    }

    if (restartEdge && game.state === "play") restartLevel();

    if (confirmEdge && game.overlayLock <= 0 && game.state !== "play" && game.state !== "dead") {
      if (game._primaryAction) {
        sfx.play("ui");
        game._primaryAction();
      }
    }

    if (jumpEdge && game.state === "play" && !confirmEdge) game.buffer = BUFFER;

    const step = 1 / 120;
    let steps = 0;
    while (game.acc >= step && steps < 5) {
      update(step);
      game.acc -= step;
      steps++;
    }
    if (steps === 5) game.acc = 0;

    render();

    requestAnimationFrame(frame);
  }

  /* ---------------- wiring ---------------- */
  function unlockAudioOnce() {
    sfx.unlock();
  }
  window.addEventListener("pointerdown", unlockAudioOnce, { once: true });
  window.addEventListener("keydown", unlockAudioOnce, { once: true });

  btnMute.addEventListener("click", (e) => { toggleMute(); if (e.detail) btnMute.blur(); });
  btnPause.addEventListener("click", (e) => { togglePause(); if (e.detail) btnPause.blur(); });
  btnHome.addEventListener("click", (e) => { sfx.play("ui"); goTitle(); if (e.detail) btnHome.blur(); });

  // Never leave the player running blind: pause when the page loses focus.
  function autoPause() {
    input.reset();
    if (game.state === "play") togglePause();
  }
  window.addEventListener("blur", autoPause);
  document.addEventListener("visibilitychange", () => { if (document.hidden) autoPause(); });

  window.addEventListener("keydown", (e) => {
    if (game.state !== "select") return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= LEVELS.length) {
      const lvl = LEVELS[n - 1];
      if (lvl && lvl.id <= progress.unlocked) {
        sfx.play("ui");
        goIntro(n - 1);
      }
    }
  });

  updateMuteButton();
  goTitle();
  requestAnimationFrame(frame);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => startGame());
  } else {
    startGame();
  }
}
