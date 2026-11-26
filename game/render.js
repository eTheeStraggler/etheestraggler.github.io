/* FRAGILE: The Great Server Rescue — canvas renderer (no dependencies) */

const W = 960;
const H = 540;

const HEAD_FONT = '"ui-rounded", "SF Pro Rounded", system-ui, sans-serif';
const MONO_FONT = '"ui-monospace", Menlo, monospace';

const TOKENS = ["404", "hello.", "Waaaa", "$0.00", "0x0", "you made it."];

/* ---- deterministic PRNG (mulberry32) ---------------------------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseHex(hex) {
  let s = typeof hex === "string" ? hex.trim() : "";
  if (s.charAt(0) !== "#") return [255, 209, 102];
  s = s.slice(1);
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length !== 6) return [255, 209, 102];
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [255, 209, 102];
  return [r, g, b];
}

/* ---- rounded rect via arcTo (ctx.roundRect is not guaranteed) --------- */
function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ---- 4-point sparkle star ---------------------------------------------- */
function star4(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
}

/* ---- pickups ------------------------------------------------------------ */
function drawCookie(ctx) {
  ctx.fillStyle = "#b5814d";
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7a5432";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#3d2a1a";
  const chips = [[-3.5, -2.5], [3, -3.5], [-1, 3.5], [4.5, 2.5]];
  for (let i = 0; i < chips.length; i++) {
    ctx.beginPath();
    ctx.arc(chips[i][0], chips[i][1], 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#fff6dd";
  star4(ctx, 6.5, -6.5, 3.2);
  ctx.fill();
}

function drawInvoice(ctx) {
  ctx.fillStyle = "#f5f2e8";
  roundedRect(ctx, -8, -10, 16, 20, 2);
  ctx.fill();
  ctx.strokeStyle = "#d8d2c0";
  ctx.lineWidth = 1;
  ctx.stroke();
  // folded corner
  ctx.fillStyle = "#ddd6c2";
  ctx.beginPath();
  ctx.moveTo(3, -10);
  ctx.lineTo(8, -10);
  ctx.lineTo(8, -5);
  ctx.closePath();
  ctx.fill();
  // staple
  ctx.strokeStyle = "#9a917d";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-3, -7.5);
  ctx.lineTo(3, -7.5);
  ctx.stroke();
  // $0.00
  ctx.fillStyle = "#2b3448";
  ctx.font = `bold 5.5px ${MONO_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$0.00", 0, 2.5);
  // tiny ruled line
  ctx.strokeStyle = "#c9c2ae";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, 6.5);
  ctx.lineTo(5, 6.5);
  ctx.stroke();
}

/* ---- player ------------------------------------------------------------- */
function drawPlayer(ctx, p, time, accent) {
  const dead = !!p.dead;
  const rise = dead ? time * 100 : 0;
  const alpha = dead ? Math.max(0, 1 - time * 0.9) : 1;
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y - rise);

  const stretch = dead ? 1 : (p.stretch || 1);
  const squash = dead ? 1 : (p.squash || 1);
  const facing = p.facing === -1 ? -1 : 1;
  ctx.scale(facing * stretch, squash);

  const moving = Math.abs(p.vx || 0) > 20;
  const phase = time * 10;
  const legA = moving && !dead ? Math.max(0, Math.sin(phase)) * 3 : 0;
  const legB = moving && !dead ? Math.max(0, -Math.sin(phase)) * 3 : 0;
  const airborne = !p.grounded && !dead;

  // legs
  ctx.fillStyle = "#1a1f2e";
  roundedRect(ctx, -7.5, -9 + (airborne ? -3 : legA), 5, 9, 2);
  ctx.fill();
  roundedRect(ctx, 2.5, -9 + (airborne ? -3 : legB), 5, 9, 2);
  ctx.fill();

  // body
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, -20, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // cap
  ctx.fillStyle = "#2b3448";
  roundedRect(ctx, -9, -34.5, 18, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = "#2b3448";
  roundedRect(ctx, 4, -32.5, 10, 3.5, 1.75);
  ctx.fill();

  // determined face
  ctx.strokeStyle = "#1a1f2e";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-6, -25.5);
  ctx.lineTo(-2.5, -23.5);
  ctx.moveTo(6, -25.5);
  ctx.lineTo(2.5, -23.5);
  ctx.stroke();
  ctx.fillStyle = "#1a1f2e";
  ctx.beginPath();
  ctx.arc(-3.5, -21, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3.5, -21, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1f2e";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-3, -16.5);
  ctx.lineTo(3, -16.5);
  ctx.stroke();

  // cardboard box on head (FRAGILE)
  ctx.fillStyle = "#c9a06b";
  roundedRect(ctx, -11, -46.5, 22, 13, 2);
  ctx.fill();
  ctx.strokeStyle = "#8a6a3f";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // tape strips
  ctx.fillStyle = "#e8d9b0";
  ctx.fillRect(-8.5, -46.5, 3, 13);
  ctx.fillRect(5.5, -46.5, 3, 13);
  ctx.fillRect(-11, -46.5, 22, 2.5);
  // FRAGILE label
  ctx.fillStyle = "#4a3423";
  ctx.font = `bold 5.5px ${MONO_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FRAGILE", 0, -40);

  ctx.restore();

  // 404 ghost when dead
  if (dead) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 90, 90, 0.9)";
    ctx.font = `bold 16px ${MONO_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("404", p.x, p.y - rise - 58);
    ctx.restore();
  }
}

/* ---- main entry ---------------------------------------------------------- */
export function drawFrame(ctx, view) {
  const time = typeof view.time === "number" ? view.time : 0;
  const mode = view.mode || "play";
  const level = view.level || {};
  const camera = view.camera || { x: 0, y: 0 };
  const shake = view.shake || { x: 0, y: 0 };
  const sky = Array.isArray(level.sky) && level.sky.length >= 2
    ? level.sky
    : ["#182238", "#0d1420"];
  const accent = level.accent || "#ffd166";
  const accentRGB = parseHex(accent);
  const levelId = typeof level.id === "number" ? level.id : 1;
  const levelWidth = typeof level.width === "number" ? level.width : 960;
  const accentA = (a) => `rgba(${accentRGB[0]},${accentRGB[1]},${accentRGB[2]},${a})`;

  /* 1. Sky */
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, sky[0]);
  skyGrad.addColorStop(1, sky[1]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  /* 2. Sun (parallax 0.15) */
  ctx.save();
  ctx.translate(-camera.x * 0.15, 0);
  const sunX = camera.x * 0.15 + 700;
  const sunY = 110;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 180);
  sunGrad.addColorStop(0, "rgba(255, 222, 160, 0.38)");
  sunGrad.addColorStop(0.45, "rgba(255, 205, 140, 0.14)");
  sunGrad.addColorStop(1, "rgba(255, 205, 140, 0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* 3. Far parallax buildings (0.25) */
  ctx.save();
  ctx.translate(-camera.x * 0.25, 0);
  const farLeft = camera.x * 0.25;
  const farStep = 90;
  const farStart = Math.floor(farLeft / farStep);
  const farEnd = Math.floor((farLeft + W) / farStep) + 1;
  for (let idx = farStart; idx <= farEnd; idx++) {
    const rng = mulberry32((levelId * 2654435761 + idx * 40503) >>> 0);
    const bw = 56 + rng() * 28;
    const bh = 80 + rng() * 140;
    const bx = idx * farStep + rng() * 14;
    const by = H - bh;
    ctx.fillStyle = "rgba(8, 12, 22, 0.55)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "rgba(46, 60, 84, 0.5)";
    ctx.fillRect(bx, by, bw, 3);
    // antenna
    const ah = 12 + rng() * 22;
    ctx.strokeStyle = "rgba(8, 12, 22, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by);
    ctx.lineTo(bx + bw / 2, by - ah);
    ctx.stroke();
    const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 2.2 + idx * 1.7));
    ctx.fillStyle = `rgba(255, 110, 110, ${blink * 0.85})`;
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by - ah, 2.4, 0, Math.PI * 2);
    ctx.fill();
    // tiny lit windows
    const cols = Math.min(4, Math.max(2, Math.floor(bw / 18)));
    const rows = Math.min(6, Math.max(2, Math.floor(bh / 30)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rng() < 0.5) continue;
        const wx = bx + 6 + c * ((bw - 12) / cols);
        const wy = by + 8 + r * ((bh - 16) / rows);
        ctx.fillStyle = rng() < 0.85
          ? "rgba(255, 214, 140, 0.5)"
          : "rgba(150, 200, 255, 0.45)";
        ctx.fillRect(wx, wy, 4, 6);
      }
    }
  }
  ctx.restore();

  /* 4. Floating decor tokens (0.4) */
  ctx.save();
  ctx.translate(-camera.x * 0.4, 0);
  const decorRng = mulberry32((levelId * 131 + 7) >>> 0);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < 10; i++) {
    const baseX = decorRng() * ((levelWidth - W) * 0.4 + W);
    const baseY = 40 + decorRng() * 360;
    const size = 11 + decorRng() * 6;
    const token = TOKENS[Math.floor(decorRng() * TOKENS.length)];
    const alpha = 0.1 + decorRng() * 0.1;
    const drift = (time * 12 + i * 53) % 400;
    const y = 30 + (((baseY - drift) % 400) + 400) % 400;
    const screenX = baseX - camera.x * 0.4;
    if (screenX < -140 || screenX > W + 140) continue;
    ctx.font = `${size}px ${MONO_FONT}`;
    ctx.fillStyle = accentA(alpha);
    ctx.fillText(token, baseX, y);
  }
  ctx.restore();

  /* 5. Near parallax pipes (0.55) */
  ctx.save();
  ctx.translate(-camera.x * 0.55, 0);
  const pipeRng = mulberry32((levelId * 97 + 13) >>> 0);
  for (let i = 0; i < 6; i++) {
    const baseX = ((i + 0.5) / 6) * ((levelWidth - W) * 0.55 + W) + (pipeRng() - 0.5) * 90;
    const y = 60 + pipeRng() * 360;
    const w = 130 + pipeRng() * 150;
    const h = 16 + pipeRng() * 12;
    const screenX = baseX - camera.x * 0.55;
    if (screenX + w < -60 || screenX > W + 60) continue;
    // flanges
    ctx.fillStyle = "rgba(14, 19, 30, 0.9)";
    ctx.fillRect(baseX + 6, y - 3, 6, h + 6);
    ctx.fillRect(baseX + w - 12, y - 3, 6, h + 6);
    // body
    ctx.fillStyle = "rgba(14, 19, 30, 0.82)";
    roundedRect(ctx, baseX, y, w, h, h / 2);
    ctx.fill();
    // top highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    roundedRect(ctx, baseX + 4, y + 2, w - 8, 3, 1.5);
    ctx.fill();
    // accent stripe
    ctx.fillStyle = accentA(0.42);
    roundedRect(ctx, baseX + 10, y + h / 2 - 2.5, w - 20, 5, 2.5);
    ctx.fill();
  }
  ctx.restore();

  /* 6-12. World space */
  ctx.save();
  ctx.translate(-camera.x + shake.x, -camera.y + shake.y);

  // platforms
  const platforms = Array.isArray(level.platforms) ? level.platforms : [];
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (!p) continue;
    ctx.fillStyle = "#2b3448";
    roundedRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();
    // top edge highlight
    ctx.fillStyle = "#3d4a63";
    roundedRect(ctx, p.x, p.y, p.w, Math.min(7, p.h), 4);
    ctx.fill();
    // diagonal hatch lines
    ctx.save();
    roundedRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.clip();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let hx = p.x - p.h; hx < p.x + p.w; hx += 14) {
      ctx.moveTo(hx, p.y + p.h + 2);
      ctx.lineTo(hx + p.h + 4, p.y - 2);
    }
    ctx.stroke();
    ctx.restore();
    // moving platform indicator
    if (p.move) {
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      roundedRect(ctx, p.x + 1.5, p.y + 1.5, p.w - 3, p.h - 3, 6);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = accent;
      ctx.font = `bold 13px ${HEAD_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.move.axis === "y" ? "↕" : "↔", p.x + p.w / 2, p.y + p.h / 2);
    }
  }

  // hazards (404 spikes)
  const hazards = Array.isArray(view.hazards) ? view.hazards : [];
  for (let i = 0; i < hazards.length; i++) {
    const hz = hazards[i];
    if (!hz) continue;
    ctx.fillStyle = "rgba(255, 60, 60, 0.18)";
    roundedRect(ctx, hz.x - 4, hz.y - 6, hz.w + 8, hz.h + 14, 6);
    ctx.fill();
    const n = Math.max(2, Math.round(hz.w / 12));
    const tw = hz.w / n;
    ctx.fillStyle = "#0b0d14";
    ctx.beginPath();
    for (let j = 0; j < n; j++) {
      const x0 = hz.x + j * tw;
      ctx.moveTo(x0, hz.y + hz.h);
      ctx.lineTo(x0 + tw / 2, hz.y);
      ctx.lineTo(x0 + tw, hz.y + hz.h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 70, 70, 0.55)";
    ctx.fillRect(hz.x, hz.y + hz.h - 2, hz.w, 2);
    ctx.fillStyle = "rgba(255, 120, 120, 0.85)";
    ctx.font = `bold 9px ${MONO_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("404", hz.x + hz.w / 2, hz.y + hz.h + 3);
  }

  // pickups
  const pickups = Array.isArray(view.pickups) ? view.pickups : [];
  for (let i = 0; i < pickups.length; i++) {
    const pk = pickups[i];
    if (!pk || pk.taken) continue;
    const bob = Math.sin(time * 3 + pk.x * 0.05) * 5;
    const rot = Math.sin(time * 1.5 + pk.x * 0.02) * 0.15;
    ctx.save();
    ctx.translate(pk.x, pk.y + bob);
    ctx.rotate(rot);
    if (pk.kind === "cookie") drawCookie(ctx);
    else drawInvoice(ctx);
    ctx.restore();
  }

  // enemies (404 bots)
  const enemies = Array.isArray(view.enemies) ? view.enemies : [];
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e) continue;
    const w = e.w || 30;
    const h = e.h || 34;
    const bob = Math.sin(time * 4 + e.x * 0.05) * 3;
    const dir = e.dir === -1 ? -1 : 1;
    ctx.save();
    ctx.translate(e.x, e.y - h / 2 + bob);
    ctx.save();
    ctx.scale(dir, 1);
    // antenna
    ctx.strokeStyle = "#1a1f2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, -h / 2 - 8);
    ctx.stroke();
    const blinkOn = Math.sin(time * 5 + e.x) > 0;
    ctx.fillStyle = blinkOn ? "rgba(255, 90, 90, 1)" : "rgba(255, 90, 90, 0.25)";
    ctx.beginPath();
    ctx.arc(0, -h / 2 - 9, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.fillStyle = "#1a1f2e";
    roundedRect(ctx, -w / 2, -h / 2, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // visor
    ctx.fillStyle = "#0d111c";
    roundedRect(ctx, -w / 2 + 4, -h / 2 + 6, w - 8, 10, 4);
    ctx.fill();
    // glowing eyes
    const glow = 0.7 + 0.3 * Math.sin(time * 6 + e.x);
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.fillStyle = accentA(glow);
    ctx.beginPath();
    ctx.arc(-w / 4, -h / 2 + 11, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w / 4, -h / 2 + 11, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    // 404 label (not flipped)
    ctx.fillStyle = accent;
    ctx.font = `bold 8px ${MONO_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("404", 0, h / 2 - 6);
    ctx.restore();
  }

  // goal (VIP chair)
  const goal = view.goal || { x: 480, y: 480 };
  const bannerBob = Math.sin(time * 2.5) * 4;
  ctx.save();
  ctx.translate(goal.x, goal.y);
  // soft glow behind chair
  const goalGlow = ctx.createRadialGradient(0, -30, 0, 0, -30, 72);
  goalGlow.addColorStop(0, accentA(0.22));
  goalGlow.addColorStop(1, accentA(0));
  ctx.fillStyle = goalGlow;
  ctx.beginPath();
  ctx.arc(0, -30, 72, 0, Math.PI * 2);
  ctx.fill();
  // legs
  ctx.fillStyle = "#1a1426";
  ctx.fillRect(-13, -18, 5, 18);
  ctx.fillRect(8, -18, 5, 18);
  // cushion
  ctx.fillStyle = "#3a2b52";
  roundedRect(ctx, -18, -30, 36, 12, 6);
  ctx.fill();
  // back
  ctx.fillStyle = "#241b33";
  roundedRect(ctx, -16, -58, 32, 30, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // VIP badge
  ctx.fillStyle = accent;
  roundedRect(ctx, -11, -52, 22, 12, 4);
  ctx.fill();
  ctx.fillStyle = "#241b33";
  ctx.font = `bold 8px ${MONO_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VIP", 0, -46);
  // floating banner
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 16;
  ctx.fillStyle = accent;
  ctx.font = `bold 17px ${HEAD_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("you made it.", 0, -104 + bannerBob);
  ctx.restore();
  ctx.restore();

  // player (skipped for title/demo)
  const player = view.player;
  if (player && mode !== "title") {
    drawPlayer(ctx, player, time, accent);
  }

  // particles
  const particles = Array.isArray(view.particles) ? view.particles : [];
  for (let i = 0; i < particles.length; i++) {
    const pt = particles[i];
    if (!pt) continue;
    const maxLife = pt.maxLife || 1;
    const ratio = Math.max(0, Math.min(1, pt.life / maxLife));
    const size = pt.size || 4;
    if (pt.kind === "dust") {
      ctx.fillStyle = `rgba(200, 200, 210, ${0.32 * ratio})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, size * (1 + (1 - ratio) * 2), 0, Math.PI * 2);
      ctx.fill();
    } else if (pt.kind === "sparkle") {
      ctx.fillStyle = pt.color || "#fff6dd";
      ctx.globalAlpha = ratio;
      star4(ctx, pt.x, pt.y, size * (0.5 + ratio * 0.5));
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (pt.kind === "confetti") {
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(time * 4 + pt.x * 0.1);
      ctx.globalAlpha = ratio;
      ctx.fillStyle = pt.color || "#ffd166";
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      ctx.restore();
      ctx.globalAlpha = 1;
    } else if (pt.kind === "poof") {
      ctx.strokeStyle = pt.color || `rgba(210, 210, 220, ${0.7 * ratio})`;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = ratio;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, size * (1 + (1 - ratio) * 2.5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();

  /* 13. Vignette */
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.85);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  /* 14. Flash */
  const flash = typeof view.flash === "number" ? view.flash : 0;
  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 70, 70, ${Math.min(1, flash) * 0.55})`;
    ctx.fillRect(0, 0, W, H);
  }
}
