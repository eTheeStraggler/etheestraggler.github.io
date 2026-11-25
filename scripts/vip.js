// ============================================================================
// Secret VIP Backroom of the Internet (loggedin.html)
// ============================================================================

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function showToast(message) {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  region.appendChild(toast);
  while (region.children.length > 3) region.firstElementChild.remove();
  setTimeout(() => toast.remove(), 3400);
}

// --- Celebratory Canvas Confetti ---
function initConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return { burst() {} };

  const ctx = canvas.getContext("2d");
  if (!ctx) return { burst() {} };
  const pieces = [];
  let animId = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const colors = ["#22d3ee", "#f59e0b", "#e879f9", "#34d399", "#f8fafc"];

  function burst(count = 75) {
    if (prefersReducedMotion.matches) {
      showToast("🎉 Confetti celebrated quietly in reduced-motion mode.");
      return;
    }
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.25;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 7.5;
      pieces.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        size: 5 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.22,
        color: colors[i % colors.length],
        life: 1,
      });
    }
    if (!animId) animId = requestAnimationFrame(tick);
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16;
      p.vx *= 0.99;
      p.rot += p.vrot;
      p.life -= 0.009;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.55);
      ctx.restore();

      if (p.life <= 0 || p.y > window.innerHeight + 30) {
        pieces.splice(i, 1);
      }
    }
    if (pieces.length) {
      animId = requestAnimationFrame(tick);
    } else {
      animId = null;
    }
  }

  return { burst };
}

// --- Escape XML safely for downloadable SVG badge ---
function escapeXml(str) {
  return str
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function initTiltCards() {
  if (prefersReducedMotion.matches) return;

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      const ry = ((x / rect.width) - 0.5) * 5;
      const rx = ((y / rect.height) - 0.5) * -5;

      card.style.setProperty("--mx", `${px.toFixed(1)}%`);
      card.style.setProperty("--my", `${py.toFixed(1)}%`);
      card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  // Apply saved Reality Mode theme
  try {
    const savedTheme = localStorage.getItem("website-reality-mode");
    const validThemes = new Set(["bureaucracy", "shoestring", "web1997", "blueprint"]);
    if (savedTheme && validThemes.has(savedTheme)) {
      document.documentElement.dataset.theme = savedTheme;
    }
  } catch {
    // ignore storage errors in restricted contexts
  }

  initTiltCards();
  const confetti = initConfetti();
  confetti.burst(80);

  document.getElementById("vip-confetti-btn")?.addEventListener("click", () => {
    confetti.burst(65);
  });

  // Restore codename from sessionStorage (never persisted outside this browser tab)
  let storedName = "";
  try {
    storedName = sessionStorage.getItem("vip-codename") || "";
  } catch {
    storedName = "";
  }

  const nameInput = document.getElementById("badge-name");
  const titleSelect = document.getElementById("badge-title");
  const previewName = document.getElementById("badge-preview-name");
  const previewRole = document.getElementById("badge-preview-role");
  const serialEl = document.getElementById("badge-serial");
  const greetingEl = document.getElementById("vip-greeting");

  const serial = `#VIP-${String(Math.floor(1000 + Math.random() * 8999))}`;
  if (serialEl) serialEl.textContent = serial;

  if (storedName && nameInput) {
    const safeStored = storedName.slice(0, 28);
    nameInput.value = safeStored;
    if (greetingEl) {
      greetingEl.textContent = `Welcome, ${safeStored}. You bypassed our state-of-the-art velvet rope and unlocked the most prestigious folding chair on the Information Superhighway.`;
    }
  }

  function syncBadge() {
    const name = nameInput?.value.trim() || "Anonymous Packet";
    const role = titleSelect?.value || "Senior Duct-Tape Architect";
    if (previewName) previewName.textContent = name;
    if (previewRole) previewRole.textContent = role;
  }

  nameInput?.addEventListener("input", syncBadge);
  titleSelect?.addEventListener("change", syncBadge);
  syncBadge();

  document.getElementById("download-badge-btn")?.addEventListener("click", () => {
    const rawName = nameInput?.value.trim() || "Anonymous Packet";
    const name = escapeXml(rawName);
    const nameFontSize = rawName.length > 22 ? 26 : rawName.length > 16 ? 32 : 42;
    const role = escapeXml(titleSelect?.value || "Senior Duct-Tape Architect");
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b2e"/>
      <stop offset="100%" stop-color="#0b1120"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="55%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#e879f9"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" rx="26" fill="url(#bg)"/>
  <rect x="8" y="8" width="624" height="344" rx="22" fill="none" stroke="url(#accent)" stroke-width="3"/>
  <text x="40" y="58" fill="#94a3b8" font-family="monospace" font-size="16" letter-spacing="2">BUREAU OF THE INTERNET</text>
  <text x="600" y="58" text-anchor="end" fill="#22d3ee" font-family="monospace" font-size="16">${escapeXml(serial)}</text>
  <text x="40" y="175" fill="#f8fafc" font-family="system-ui, sans-serif" font-weight="800" font-size="${nameFontSize}">${name}</text>
  <text x="40" y="218" fill="#f59e0b" font-family="monospace" font-size="22">${role}</text>
  <line x1="40" y1="276" x2="600" y2="276" stroke="#334155" stroke-width="1"/>
  <text x="40" y="314" fill="#94a3b8" font-family="monospace" font-size="14">CLEARANCE: FOLDING CHAIR</text>
  <text x="600" y="314" text-anchor="end" fill="#94a3b8" font-family="monospace" font-size="14">doubleudoubleudoubleudotwebsitedotcom.info</text>
</svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "internet-vip-badge.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("VIP Badge minted and downloaded!");
  });

  // Big Red Button Gag
  const redBtn = document.getElementById("big-red-btn");
  const redCopy = document.getElementById("red-btn-copy");
  const redCounter = document.getElementById("red-btn-counter");
  let presses = 0;

  const responses = [
    "Hey! The label literally said DO NOT PRESS.",
    "Again?! You just nudged a completely imaginary satellite.",
    "Okay, now you're just testing my boundary-setting skills.",
    "Fine. Here's some confetti. Are you happy now?",
    "Congratulations, you broke the record for ignoring signage.",
    "Honestly? I respect the persistence. Keep pressing if it brings you joy.",
  ];

  redBtn?.addEventListener("click", () => {
    presses++;
    const msg = responses[Math.min(presses - 1, responses.length - 1)];
    if (redCopy) redCopy.textContent = msg;
    if (redCounter) redCounter.textContent = `PRESSES: ${presses} (${presses >= 4 ? "ZERO REGRETS" : "QUESTIONABLE DISCIPLINE"})`;
    if (presses === 4 || presses % 5 === 0) confetti.burst(55);
    showToast(msg);
  });
});
