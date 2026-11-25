// ============================================================================
// A Website on the Internet — Interactive Engine (Zero Dependencies)
// ============================================================================

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// --- 1. Procedural Web Audio Synthesizer (Opt-In, Zero Audio Files) ---
class HighwaySynth {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  ensureContext() {
    if (!this.ctx && ("AudioContext" in window || "webkitAudioContext" in window)) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ensureContext();
      this.chime(523.25, 0.09);
      setTimeout(() => this.chime(659.25, 0.12), 75);
    }
    return this.enabled;
  }

  chime(freq = 520, duration = 0.08, type = "triangle", gainPeak = 0.07) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  tapeRip() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const duration = 0.18;
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.sin((i / data.length) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.35;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + duration);
    filter.Q.value = 1.6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  waaaa() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(215, now + 0.32);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  fanfare() {
    if (!this.enabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((note, idx) => {
      setTimeout(() => this.chime(note, 0.18, "triangle", 0.08), idx * 75);
    });
  }
}

const synth = new HighwaySynth();

// --- 2. Toast Notifications ---
function showToast(message) {
  const region = document.getElementById("toast-region");
  if (!region) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  region.appendChild(toast);

  // Keep toast stack tidy
  while (region.children.length > 4) {
    region.firstElementChild.remove();
  }

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    setTimeout(() => toast.remove(), 260);
  }, 3600);
}

// --- 3. Information Superhighway Physics Canvas ---
function initHighwayCanvas() {
  const canvas = document.getElementById("highway-canvas");
  if (!canvas) return { setWarp() {}, burst() {} };

  const ctx = canvas.getContext("2d");
  if (!ctx) return { setWarp() {}, burst() {} };

  let width = 0;
  let height = 0;
  let lastWidth = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let warp = false;
  let animId = null;
  let packetsDodged = 0;

  const pointer = { x: -9999, y: -9999, active: false };
  const shockwaves = [];
  const particles = [];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticles() {
    particles.length = 0;
    const count = Math.min(72, Math.max(28, Math.floor((width * height) / 22000)));
    const hues = ["#22d3ee", "#f59e0b", "#e879f9", "#34d399"];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() * 0.7 + 0.25) * (Math.random() < 0.5 ? 1 : -1),
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2 + 1.1,
        color: hues[i % hues.length],
        dodgedCooldown: 0,
      });
    }
  }

  resize();
  lastWidth = width;
  spawnParticles();

  window.addEventListener("resize", () => {
    const prevWidth = lastWidth;
    resize();
    if (Math.abs(width - prevWidth) > 40) {
      lastWidth = width;
      spawnParticles();
    }
  });

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("click", (e) => {
    if (prefersReducedMotion.matches) return;
    if (e.target instanceof Element && e.target.closest("button, a, input, dialog, [popover]")) return;
    shockwaves.push({ x: e.clientX, y: e.clientY, r: 8, alpha: 0.55 });
    synth.chime(680, 0.06, "sine", 0.04);
  });

  const packetEl = document.getElementById("packet-counter");

  function frame() {
    if (document.hidden || prefersReducedMotion.matches) {
      animId = null;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    const speedMult = warp ? 3.8 : 1;

    // Update & draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 19000 && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = (138 - dist) / 138;
          p.vx += (dx / dist) * force * 0.22;
          p.vy += (dy / dist) * force * 0.22;
          if (p.dodgedCooldown <= 0) {
            packetsDodged++;
            p.dodgedCooldown = 45;
            if (packetEl) packetEl.textContent = packetsDodged.toLocaleString();
          }
        }
      }

      if (p.dodgedCooldown > 0) p.dodgedCooldown--;

      // Gentle speed clamping
      p.vx *= 0.992;
      p.vy *= 0.992;
      if (Math.abs(p.vx) < 0.22) p.vx += p.vx >= 0 ? 0.03 : -0.03;

      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;

      if (p.x < -12) p.x = width + 12;
      if (p.x > width + 12) p.x = -12;
      if (p.y < -12) p.y = height + 12;
      if (p.y > height + 12) p.y = -12;

      // Connecting filaments
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14500) {
          const alpha = (1 - d2 / 14500) * 0.16;
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      // Draw packet node
      ctx.fillStyle = p.color;
      ctx.globalAlpha = warp ? 0.9 : 0.65;
      ctx.beginPath();
      ctx.arc(p.x, p.y, warp ? p.r * 1.25 : p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const s = shockwaves[i];
      s.r += 5.5;
      s.alpha *= 0.92;
      ctx.strokeStyle = `rgba(245, 158, 11, ${s.alpha.toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      if (s.alpha < 0.02) shockwaves.splice(i, 1);
    }

    animId = requestAnimationFrame(frame);
  }

  function start() {
    if (!animId && !prefersReducedMotion.matches && !document.hidden) {
      animId = requestAnimationFrame(frame);
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) start();
  });

  prefersReducedMotion.addEventListener("change", () => {
    if (prefersReducedMotion.matches) {
      ctx.clearRect(0, 0, width, height);
    } else {
      start();
    }
  });

  start();

  return {
    setWarp(next) {
      warp = next;
    },
    burst(x = width / 2, y = height / 2) {
      if (prefersReducedMotion.matches) return;
      shockwaves.push({ x, y, r: 14, alpha: 0.75 });
    },
  };
}

// --- 4. 3D Specular Tilt Cards ---
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
      const ry = ((x / rect.width) - 0.5) * 6;
      const rx = ((y / rect.height) - 0.5) * -6;

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

// --- 4b. Popover API Graceful Fallback ---
function initPopoverFallback() {
  if ("popover" in HTMLElement.prototype) return;
  const trigger = document.getElementById("cert-btn");
  const popover = document.getElementById("cert-popover");
  if (!trigger || !popover) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    popover.classList.toggle("is-open");
  });

  document.addEventListener("click", (e) => {
    if (e.target instanceof Node && !popover.contains(e.target) && e.target !== trigger) {
      popover.classList.remove("is-open");
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") popover.classList.remove("is-open");
  });
}

// --- 5. Reality Mode Theme Switcher (View Transitions API) ---
function initThemeSwitcher() {
  const buttons = document.querySelectorAll("[data-theme-select]");
  let saved = null;
  try {
    saved = localStorage.getItem("website-reality-mode");
  } catch {
    saved = null;
  }
  const validThemes = new Set(["bureaucracy", "shoestring", "web1997", "blueprint"]);
  const themeNames = {
    bureaucracy: "Obsidian Bureaucracy",
    shoestring: "Turbo Shoestring Overdrive",
    web1997: "1997 Webmaster Mode",
    blueprint: "Architectural Blueprint",
  };

  function applyTheme(theme, announce = false) {
    if (!validThemes.has(theme)) return;
    const update = () => {
      document.documentElement.dataset.theme = theme;
      buttons.forEach((btn) => {
        btn.setAttribute("aria-pressed", String(btn.dataset.themeSelect === theme));
      });
    };

    if (announce && "startViewTransition" in document && !prefersReducedMotion.matches) {
      document.startViewTransition(update);
    } else {
      update();
    }

    try {
      localStorage.setItem("website-reality-mode", theme);
    } catch {
      // ignore storage errors in restricted contexts
    }
    if (announce) {
      synth.chime(theme === "web1997" ? 330 : 587.33, 0.11);
      showToast(`Reality switched to: ${themeNames[theme]}`);
    }
  }

  if (saved && validThemes.has(saved)) {
    applyTheme(saved, false);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.themeSelect, true));
  });
}

// --- 6. URL Pronunciation Coach (Web Speech API + Karaoke Fallback) ---
function initPronouncer() {
  const btn = document.getElementById("pronounce-btn");
  const syllables = Array.from(document.querySelectorAll("#syllable-track .syllable"));
  const caption = document.getElementById("pronouncer-caption");
  if (!btn || !syllables.length) return;

  let timerIds = [];

  function clearHighlights() {
    timerIds.forEach((id) => clearTimeout(id));
    timerIds = [];
    syllables.forEach((el) => el.classList.remove("is-speaking"));
  }

  btn.addEventListener("click", () => {
    clearHighlights();
    synth.chime(440, 0.06);

    const spokenText = "double u, double u, double u, dot, website, dot, com, dot, info";
    const stepMs = 310;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(spokenText);
      utter.rate = 0.96;
      utter.pitch = 1.05;
      window.speechSynthesis.speak(utter);
      caption.textContent = "Speaking aloud with maximum bureaucratic dignity…";
    } else {
      caption.textContent = "SpeechSynthesis unavailable — enjoy this silent karaoke instead!";
    }

    syllables.forEach((el, index) => {
      const id = setTimeout(() => {
        syllables.forEach((s) => s.classList.remove("is-speaking"));
        el.classList.add("is-speaking");
        synth.chime(360 + index * 38, 0.05, "sine", 0.035);
      }, index * stepMs);
      timerIds.push(id);
    });

    const endId = setTimeout(() => {
      clearHighlights();
      caption.textContent = "Nailed it. Please never try to spell this over a noisy phone call.";
    }, syllables.length * stepMs + 350);
    timerIds.push(endId);
  });
}

// --- 7. Interactive Duct-Tape Server Lab ---
function initServerLab() {
  const frame = document.getElementById("server-frame");
  const tapeLayer = document.getElementById("tape-layer");
  const integrityBadge = document.getElementById("integrity-badge");
  const integrityReadout = document.getElementById("integrity-readout");
  const integrityFill = document.getElementById("integrity-fill");
  const integrityBarWrap = document.getElementById("integrity-bar-wrap");
  const certTapeCount = document.getElementById("cert-tape-count");
  const tensionEl = document.getElementById("shoestring-tension");

  let integrity = 94;
  let extraStrips = 0;
  let shoestringPsi = 42.0;

  function statusLabel(val) {
    if (val >= 115) return "Over-Taped (Bulletproof)";
    if (val >= 100) return "Aerospace Duct-Tape Grade";
    if (val >= 80) return "Nominal Wobble";
    if (val >= 55) return "Slightly Rattling";
    if (val >= 30) return "Held Together by Prayers";
    return "CRITICAL: APPLY TAPE IMMEDIATELY";
  }

  function render() {
    const pct = Math.min(100, Math.max(6, (integrity / 120) * 100));
    integrityBadge.textContent = `INTEGRITY: ${integrity}%`;
    integrityReadout.textContent = `${integrity}% (${statusLabel(integrity)})`;
    integrityFill.style.setProperty("--fill", `${pct.toFixed(0)}%`);
    integrityBarWrap.setAttribute("aria-valuenow", String(integrity));
    if (certTapeCount) certTapeCount.textContent = `${3 + extraStrips} strips`;
    if (tensionEl) tensionEl.textContent = `${shoestringPsi.toFixed(1)} PSI`;
  }

  document.getElementById("apply-tape-btn")?.addEventListener("click", () => {
    if (extraStrips >= 14) {
      showToast("Sir/Ma'am, the server is now 88% adhesive. Save some tape for the router.");
      synth.waaaa();
      return;
    }

    extraStrips++;
    integrity = Math.min(120, integrity + 7);
    const strip = document.createElement("span");
    strip.className = "duct-tape-strip";
    strip.style.setProperty("--tx", `${18 + Math.random() * 64}%`);
    strip.style.setProperty("--ty", `${18 + Math.random() * 64}%`);
    strip.style.setProperty("--trot", `${(Math.random() * 76 - 38).toFixed(1)}deg`);
    tapeLayer.appendChild(strip);

    synth.tapeRip();
    render();
    showToast(`Applied fresh silver duct tape! Integrity now ${integrity}%.`);
  });

  document.getElementById("poke-server-btn")?.addEventListener("click", () => {
    integrity = Math.max(12, integrity - 14);
    shoestringPsi = Math.max(11.4, shoestringPsi - 3.7);
    frame.classList.remove("is-poked");
    void frame.offsetWidth; // trigger reflow for replay
    frame.classList.add("is-poked");

    synth.chime(185, 0.14, "sawtooth", 0.06);
    render();

    const quips = [
      "Hey! Don't poke the load-bearing shoestring!",
      "A mysterious screw rolled out of the chassis.",
      "The server made a noise like an offended toaster.",
      "Warning: 3 kilobytes of CSS just fell on the floor.",
    ];
    showToast(quips[Math.floor(Math.random() * quips.length)]);
  });

  document.getElementById("tighten-laces-btn")?.addEventListener("click", () => {
    shoestringPsi = Math.min(99.9, shoestringPsi + 8.5);
    integrity = Math.min(120, integrity + 5);
    synth.chime(660, 0.09);
    render();
    showToast(`Shoestrings double-knotted! Tension at ${shoestringPsi.toFixed(1)} PSI.`);
  });

  document.getElementById("peel-tape-btn")?.addEventListener("click", () => {
    tapeLayer.replaceChildren();
    extraStrips = 0;
    integrity = 94;
    shoestringPsi = 42.0;
    synth.chime(392, 0.09);
    render();
    showToast("Freshly peeled. Back to factory-standard duct tape.");
  });

  render();
}

// --- 8. "Who Is ___ Anyway?" Identity Dossier (Zero XSS via textContent) ---
function initIdentityEngine() {
  const form = document.getElementById("identity-form");
  const input = document.getElementById("inputId");
  const output = document.getElementById("dossier-output");
  if (!form || !input || !output) return;

  const aliases = [
    "The Phantom of Port 443",
    "Chief Clicking Officer",
    "Definitely Not Three Raccoons in a Trench Coat",
    "Baroness/Baron of Browser Tabs",
    "Licensed Hypertext Enthusiast",
    "Suspiciously Well-Hydrated Netizen",
  ];

  const verdicts = [
    "99.4% likely to have 47 tabs open right now.",
    "Certified legend of the Information Superhighway.",
    "Once refreshed a page twice and felt like a hacker.",
    "Possesses immaculate taste in absurd domain names.",
    "Suspected of reading source code for fun.",
    "Approved for complimentary imaginary snacks.",
  ];

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    const subject = raw || "The Mysterious Blank-Field Bandit";
    const seed = hashString(subject.toLowerCase());

    const alias = aliases[seed % aliases.length];
    const verdict = verdicts[(seed >>> 3) % verdicts.length];
    const raccoonChance = ((seed % 83) + 14);
    const webScore = ((seed % 11) + 90);

    output.replaceChildren();

    const title = document.createElement("div");
    title.className = "dossier-title";
    title.textContent = `Who is ${subject} anyway?`;

    const list = document.createElement("ul");
    list.className = "dossier-list";

    const rows = [
      ["Known Alias: ", alias],
      ["3-Raccoons Probability: ", `${raccoonChance}%`],
      ["Internet Readiness: ", `${webScore} / 100`],
      ["Official Finding: ", verdict],
    ];

    rows.forEach(([label, val]) => {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = label;
      li.append(strong, document.createTextNode(val));
      list.appendChild(li);
    });

    output.append(title, list);
    synth.chime(587.33, 0.08);
  });
}

// --- 9. "This Is Random" Chaos Escalator & $0.00 Invoice Dialog ---
function initChaosAndInvoice(highway) {
  const heading = document.getElementById("rh3");
  const desc = document.getElementById("chaos-desc");
  const levelPill = document.getElementById("chaos-level-pill");
  const randomBtn = document.getElementById("random-btn");
  const restoreBtn = document.getElementById("restore-order-btn");
  const vibeEl = document.getElementById("vibe-status");

  let chaosLevel = 0;

  function launchDucks(count = 5) {
    if (prefersReducedMotion.matches) {
      showToast("🦆 Virtual rubber ducks politely paraded in reduced-motion mode.");
      return;
    }
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const duck = document.createElement("span");
        duck.className = "floating-duck";
        duck.setAttribute("aria-hidden", "true");
        duck.textContent = "🦆";
        duck.style.top = `${14 + Math.random() * 68}vh`;
        duck.style.left = "-4rem";
        document.body.appendChild(duck);
        setTimeout(() => duck.remove(), 4400);
      }, i * 190);
    }
  }

  document.getElementById("launch-duck-btn")?.addEventListener("click", () => {
    launchDucks(3);
    highway.burst();
    synth.chime(740, 0.08);
    showToast("🦆 Rubber duck packet dispatched via UDP (Unreliable Duck Protocol).");
  });

  const warpBtn = document.getElementById("toggle-warp-btn");
  warpBtn?.addEventListener("click", () => {
    const active = warpBtn.getAttribute("aria-pressed") === "true";
    const next = !active;
    warpBtn.setAttribute("aria-pressed", String(next));
    highway.setWarp(next);
    synth.chime(next ? 880 : 330, 0.12);
    showToast(next ? "⚡ Warp speed engaged! Hold onto your shoestrings." : "Returning to sensible suburban fiber speeds.");
    if (vibeEl) vibeEl.textContent = next ? "Ludicrous Speed" : "Cautiously Optimistic";
  });

  const chaosStages = [
    () => {
      heading.textContent = "Waaaa";
      desc.textContent = "A faithful, historic tribute to the original 'This Is Random' button.";
      levelPill.textContent = "1 / 6 — Classic Waaaa";
      synth.waaaa();
    },
    () => {
      heading.textContent = "Waaaa (Slightly Crooked)";
      desc.textContent = "The Bureau of Level Horizons has been alerted.";
      levelPill.textContent = "2 / 6 — Mildly Askew";
      document.body.classList.add("chaos-tilted");
      synth.waaaa();
    },
    () => {
      heading.textContent = "DUCK PACKET STAMPEDE";
      desc.textContent = "Emergency waterfowl are traversing the viewport.";
      levelPill.textContent = "3 / 6 — Avian Bandwidth";
      launchDucks(7);
      synth.chime(620, 0.1);
    },
    () => {
      heading.textContent = "Anti-Gravity Cards Activated";
      desc.textContent = "Somebody loosened the CSS gravity bolts.";
      levelPill.textContent = "4 / 6 — Low Gravity";
      document.body.classList.add("chaos-wobble");
      synth.chime(494, 0.12);
    },
    () => {
      heading.textContent = "DISCO TELEMETRY OVERDRIVE";
      desc.textContent = "We didn't have a budget for lasers so we used CSS hue-rotate.";
      levelPill.textContent = "5 / 6 — Maximum Shimmer";
      document.body.classList.add("chaos-disco");
      highway.setWarp(true);
      warpBtn?.setAttribute("aria-pressed", "true");
      synth.fanfare();
    },
    () => {
      heading.textContent = "TOTAL BUREAUCRATIC MELTDOWN";
      desc.textContent = "You pushed every single button. Respect. Click Restore Order when ready.";
      levelPill.textContent = "6 / 6 — Glorious Chaos";
      launchDucks(10);
      highway.burst();
      synth.fanfare();
    },
  ];

  randomBtn?.addEventListener("click", () => {
    const idx = Math.min(chaosLevel, chaosStages.length - 1);
    chaosStages[idx]();
    chaosLevel = Math.min(chaosStages.length, chaosLevel + 1);
    restoreBtn?.classList.remove("hidden");
    if (vibeEl) vibeEl.textContent = `Chaos Level ${chaosLevel}`;
  });

  restoreBtn?.addEventListener("click", () => {
    chaosLevel = 0;
    document.body.classList.remove("chaos-tilted", "chaos-wobble", "chaos-disco");
    heading.textContent = "Got extra cash?";
    desc.textContent = "Order has been restored. Your browser thanks you for your restraint.";
    levelPill.textContent = "0 / 6 — Respectable";
    restoreBtn.classList.add("hidden");
    highway.setWarp(false);
    warpBtn?.setAttribute("aria-pressed", "false");
    if (vibeEl) vibeEl.textContent = "Cautiously Optimistic";
    synth.chime(523.25, 0.1);
    showToast("Bureaucratic order restored.");
  });

  // Native <dialog> Invoice
  const dialog = document.getElementById("invoice-dialog");
  const paidBanner = document.getElementById("invoice-paid-banner");

  function openInvoice() {
    if (!dialog) return;
    paidBanner?.classList.add("hidden");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    synth.chime(520, 0.08);
  }

  document.getElementById("pay-me-btn")?.addEventListener("click", openInvoice);
  document.getElementById("open-invoice-hero")?.addEventListener("click", openInvoice);
  document.getElementById("close-invoice-btn")?.addEventListener("click", () => dialog?.close());

  dialog?.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  document.getElementById("pay-vibes-btn")?.addEventListener("click", () => {
    paidBanner?.classList.remove("hidden");
    synth.fanfare();
    launchDucks(4);
    showToast("Payment of $0.00 accepted! Good vibes logged.");
  });

  document.getElementById("download-receipt-btn")?.addEventListener("click", () => {
    const receipt = [
      "==========================================",
      "  OFFICIAL RECEIPT — A WEBSITE ON THE INTERNET",
      "  doubleudoubleudoubleudotwebsitedotcom.info",
      "==========================================",
      `Date: ${new Date().toISOString()}`,
      "Item: Viewing an Artisanal Webpage ........... $0.00",
      "Item: Duct Tape Depreciation ................. $0.00",
      "Item: Unnecessary CSS 3D Transforms .......... $0.00",
      "------------------------------------------",
      "TOTAL PAID: $0.00 (Good Vibes Accepted)",
      "Billing inquiries: doubleudoubleudotnetdot.org",
      "==========================================",
    ].join("\n");

    const blob = new Blob([receipt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "official-website-receipt.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    synth.chime(660, 0.08);
  });
}

// --- 10. Upgraded VIP Gate & WebAuthn Passkey Playground ---
function initVipGate() {
  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username-field");
  const passwordDrawer = document.getElementById("passwordStuff");
  const passwordInput = document.getElementById("password");
  const strengthEl = document.getElementById("password-strength");
  const feedbackEl = document.getElementById("auth-feedback");
  const registerBtn = document.getElementById("register-passkey-btn");
  const skipBtn = document.getElementById("skip-to-vip-btn");

  if (!form || !usernameInput || !passwordDrawer || !passwordInput) return;

  function goToVip(codename, message = "Access granted! Lifting the velvet rope…") {
    try {
      sessionStorage.setItem("vip-codename", codename || "Distinguished Netizen");
    } catch {
      // ignore private browsing storage errors
    }
    synth.fanfare();
    feedbackEl.textContent = message;
    setTimeout(() => {
      window.location.href = "loggedin.html";
    }, 520);
  }

  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    if (!val.length) {
      strengthEl.textContent = "Awaiting keystrokes…";
    } else if (/password|1234|qwerty/i.test(val)) {
      strengthEl.textContent = "Boldly Classic (Please Don't Use This Elsewhere)";
    } else if (val.length < 5) {
      strengthEl.textContent = "Strength: Wet Paper Towel";
    } else if (val.length < 10) {
      strengthEl.textContent = "Strength: Probably a Sandwich";
    } else {
      strengthEl.textContent = "Strength: Fortified Duct-Tape Vault";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const passwordIsVisible = !passwordDrawer.hidden;

    // Preserves the classic original trigger: ends with a digit or contains "other" / "password"
    if (!passwordIsVisible && (/\d$/.test(username) || /other|password/i.test(username))) {
      passwordDrawer.hidden = false;
      passwordInput.focus();
      feedbackEl.textContent = "Aha! Classic password drawer unlocked. Type anything to enter.";
      synth.chime(523.25, 0.09);
      return;
    }

    if (passwordIsVisible) {
      if (username.length && password.length) {
        goToVip(username);
      } else {
        feedbackEl.textContent = "Enter both a codename and a fake password (we don't store either!).";
        synth.waaaa();
      }
      return;
    }

    // Attempt WebAuthn Passkey demo if available & secure context
    if (!window.isSecureContext || !("PublicKeyCredential" in window) || !navigator.credentials?.get) {
      passwordDrawer.hidden = false;
      passwordInput.focus();
      feedbackEl.textContent = "Passkeys need HTTPS/localhost — opened the classic password drawer instead!";
      return;
    }

    feedbackEl.textContent = "Summoning browser Passkey prompt…";
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const cred = await navigator.credentials.get({ publicKey: { challenge } });
      if (!cred) throw new Error("No passkey returned");
      goToVip(username || "Passkey Wizard");
    } catch {
      passwordDrawer.hidden = false;
      passwordInput.focus();
      feedbackEl.textContent = "No passkey selected — feel free to use the classic password drawer instead!";
    }
  });

  registerBtn?.addEventListener("click", async () => {
    if (!window.isSecureContext || !("PublicKeyCredential" in window) || !navigator.credentials?.create) {
      feedbackEl.textContent = "WebAuthn Passkey registration requires HTTPS or localhost.";
      showToast("Passkey demo works over HTTPS or localhost.");
      return;
    }

    const username = usernameInput.value.trim() || "internet-visitor";
    feedbackEl.textContent = "Opening browser Passkey creation sandbox…";
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "A Website on the Internet" },
          user: { id: userId, name: username, displayName: username },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
          },
        },
      });
      if (!cred) throw new Error("No passkey created");
      goToVip(username, "Demo passkey created locally! Entering VIP lounge…");
    } catch {
      feedbackEl.textContent = "Passkey registration cancelled or unavailable on this device.";
    }
  });

  skipBtn?.addEventListener("click", () => {
    goToVip(usernameInput.value.trim() || "Velvet-Rope Acrobat");
  });
}

// --- 11. Browser Capability Detection & Live Uptime Telemetry ---
function initTelemetryAndCapabilities() {
  const caps = {
    viewTransitions: "startViewTransition" in document,
    scrollTimeline: CSS.supports("animation-timeline", "scroll()"),
    popover: "popover" in HTMLElement.prototype,
    cssProperty: typeof CSS !== "undefined" && "registerProperty" in CSS && CSS.supports("color", "oklch(70% 0.1 200)"),
    webAuthn: "PublicKeyCredential" in window,
    webAudio: "AudioContext" in window || "webkitAudioContext" in window,
  };

  Object.entries(caps).forEach(([key, supported]) => {
    const item = document.querySelector(`[data-cap="${key}"]`);
    if (item) {
      const isSupported = Boolean(supported);
      const statusText = isSupported ? "Supported natively by your browser" : "Graceful fallback active";
      item.dataset.supported = String(isSupported);
      item.title = statusText;
      const srStatus = document.createElement("span");
      srStatus.className = "sr-only";
      srStatus.textContent = ` (${statusText})`;
      item.appendChild(srStatus);
    }
  });

  const uptimeEl = document.getElementById("visit-uptime");
  const start = Date.now();
  setInterval(() => {
    if (!uptimeEl) return;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, "0");
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
    const secs = String(elapsed % 60).padStart(2, "0");
    uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// --- 12. Konami Code Easter Egg ---
function initKonamiCode(highway) {
  const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  const warpBtn = document.getElementById("toggle-warp-btn");
  let pos = 0;

  window.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLElement && (e.target.matches("input, textarea, select") || e.target.isContentEditable)) {
      return;
    }
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === sequence[pos]) {
      pos++;
      if (pos === sequence.length) {
        pos = 0;
        document.documentElement.classList.toggle("konami-overdrive");
        const active = document.documentElement.classList.contains("konami-overdrive");
        highway.setWarp(active);
        warpBtn?.setAttribute("aria-pressed", String(active));
        highway.burst();
        synth.fanfare();
        showToast(active ? "🎮 KONAMI OVERDRIVE UNLOCKED! +30 Imaginary Lives." : "Konami Overdrive deactivated.");
      }
    } else {
      pos = key === sequence[0] ? 1 : 0;
    }
  });
}

// --- Boot Everything ---
window.addEventListener("DOMContentLoaded", () => {
  const soundBtn = document.getElementById("sound-toggle");
  soundBtn?.addEventListener("click", () => {
    const enabled = synth.toggle();
    soundBtn.setAttribute("aria-pressed", String(enabled));
    soundBtn.querySelector(".pill-icon").textContent = enabled ? "🔊" : "🔇";
    soundBtn.querySelector(".pill-label").textContent = enabled ? "Audio: On" : "Audio: Off";
    showToast(enabled ? "Procedural Web Audio synth enabled." : "Audio muted.");
  });

  const highway = initHighwayCanvas();
  initTiltCards();
  initPopoverFallback();
  initThemeSwitcher();
  initPronouncer();
  initServerLab();
  initIdentityEngine();
  initChaosAndInvoice(highway);
  initVipGate();
  initTelemetryAndCapabilities();
  initKonamiCode(highway);
});
