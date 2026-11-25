# AGENTS.md

## Project Overview & Core Principles

This repository contains the static website for **`doubleudoubleudoubleudotwebsitedotcom.info`** ("A Website on the Internet") — an intentionally whimsical, deadpan, over-engineered playground built purely for fun.

### Non-Negotiable Rules
1. **Strictly Anonymous / Zero Personal or Environment Data:** Never add real names, personal email addresses, local filesystem paths, OS/machine/environment details, social links, personal handles, `<meta name="author">` tags, analytics, cookies, or third-party trackers to any file, image metadata, or commit.
2. **Just for Fun & Creative:** Lean into witty, self-aware humor, playful interactivity, custom artwork, and experimental modern web platform features. Preserve the site's running lore (duct-tape & shoestring infrastructure, absurd domain pronunciation, `hello.` → `you made it.` VIP backroom, `Waaaa` chaos button, and fictional `$0.00` invoice).
3. **Zero External Dependencies / Zero Build Step:** Do not introduce bundlers, npm packages, external CDNs, or third-party fonts/scripts. Everything must work as pure static files served directly by GitHub Pages.
4. **Conventional Commits & Private Git Identity:** Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat(...)`, `fix(...)`, `docs(...)`, `style(...)`, `refactor(...)`, `chore(...)`). Ensure local git `user.name` and `user.email` stay anonymous / use a noreply address before committing.

---

## Tech Stack

- **Markup:** Semantic HTML5 (`index.html`, `loggedin.html`) using native `<dialog>`, native Popover API (`popover="auto"`), `<canvas>`, skip links, and `aria-live` regions.
- **Styling:** Vanilla modern CSS (`styles/main.css`) shared by both pages:
  - Explicit cascade layers: `@layer reset, tokens, themes, layout, components, effects, motion;`
  - Modern primitives: `@property`, `oklch()`, `color-mix()`, `@container` queries, `:has()`, scroll-driven animations (`animation-timeline: scroll()` / `view()`), `@starting-style`, `transition-behavior: allow-discrete`, and cross-document `@view-transition`.
  - Four switchable "Reality Mode" themes via `data-theme` on `<html>`: `bureaucracy` (Obsidian), `shoestring` (Overdrive), `web1997` (1997 Webmaster), and `blueprint`.
- **Scripts:** Vanilla ES modules (`type="module"`) with zero dependencies:
  - `scripts/main.js` — Information Superhighway Canvas 2D physics field, opt-in procedural Web Audio API synth, `document.startViewTransition` theme switcher, `speechSynthesis` domain pronouncer, duct-tape server lab, deterministic identity dossier, 6-stage chaos escalator, native `<dialog>` invoice + `.txt` receipt download, Popover fallback, WebAuthn Passkey demo (`navigator.credentials`), Konami Code Easter egg, and live capability detection.
  - `scripts/vip.js` — Confetti canvas, 3D specular card tilt, interactive VIP badge customizer with downloadable `.svg` export, and the "Do Not Press" button gag.
- **Hosting:** GitHub Pages serving directly from `main` (`/`) with custom domain configured via `CNAME`.

---

## Folder Structure

```text
.
├── AGENTS.md                 # Repo guidance for coding agents
├── CNAME                     # GitHub Pages custom domain (do not delete)
├── favicon.ico               # Root copy of multi-size favicon for /favicon.ico requests
├── index.html                # Main landing page & interactive playground
├── loggedin.html             # Secret VIP Backroom ("you made it.")
├── styles/
│   └── main.css              # Shared layered stylesheet & 4 Reality Mode themes
├── scripts/
│   ├── main.js               # Main page interactive engine (ES module)
│   └── vip.js                # VIP backroom interactive engine (ES module)
└── images/
    ├── apple-touch-icon.png  # 180×180 touch icon
    ├── favicon.ico           # Multi-resolution ICO (16/32/48/64px)
    ├── favicon.png           # 64×64 rounded PNG icon
    ├── hero-server.jpg       # 1376×768 hero duct-tape server illustration
    ├── info-highway.jpg      # 1376×768 information superhighway diorama
    └── vip-lounge.jpg        # 1376×768 VIP folding-chair lounge illustration
```

---

## Build, Preview & Test Commands

There is **no build step**. Serve over HTTP (not `file://`) because ES modules require HTTP and WebAuthn requires a secure context (`https://` or `localhost`).

### Local Preview Server
```bash
python3 -m http.server 8765 --bind 127.0.0.1
# Open http://127.0.0.1:8765/index.html (or http://localhost:8765/index.html for WebAuthn)
```

### JavaScript Syntax Verification
```bash
node --check scripts/main.js && node --check scripts/vip.js
```

### HTML Structure, Duplicate ID & Local Asset Verification
```bash
python3 -c '
from html.parser import HTMLParser
from collections import Counter
import os, re

class CheckHTML(HTMLParser):
    VOID = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
    def __init__(self):
        super().__init__()
        self.stack, self.ids, self.errors = [], [], []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if "id" in d: self.ids.append(d["id"])
        if tag not in self.VOID: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.VOID: return
        if not self.stack or self.stack[-1] != tag: self.errors.append(tag)
        else: self.stack.pop()

for page in ["index.html", "loggedin.html"]:
    txt = open(page).read()
    p = CheckHTML(); p.feed(txt)
    assert not p.errors and not p.stack, f"{page}: {p.errors} {p.stack}"
    dups = [k for k, v in Counter(p.ids).items() if v > 1]
    assert not dups, f"{page} duplicate IDs: {dups}"
    for _, val in re.findall(r"(src|href)=\"([^\"]+)\"", txt):
        if val.startswith("#") or val.startswith("http"): continue
        path = val.split("?", 1)[0]
        assert os.path.exists(path), f"{page}: missing asset {path}"
print("HTML & asset links OK")
'
```

### Safety & Zero-Dependency Audit
```bash
# Confirm no unsafe DOM injection sinks or external asset URLs
grep -rnE "innerHTML|outerHTML|insertAdjacentHTML|eval\(" scripts/ || echo "DOM sink check CLEAN"
grep -rnE "(src|href)=\"https?://" index.html loggedin.html || echo "Zero external assets CLEAN"
```

---

## Coding Conventions & Gotchas

### CSS Architecture (`styles/main.css`)
- **Respect `@layer` precedence:** Layers are ordered `reset < tokens < themes < layout < components < effects < motion`. A later layer always wins over an earlier layer regardless of selector specificity or media queries:
  - Keep grid container base rules (`.bento-grid`, `.vip-grid`, `.hero`) and their responsive `@media` overrides in `@layer layout`.
  - Keep component responsive tweaks (e.g., `.theme-btn` sizing) inside `@layer components`.
  - Keep animation overrides (`body.chaos-wobble .bento-card`) in `@layer motion` *after* `.reveal-item`, and reset `animation-timeline: auto;` so time-based animations override scroll-driven timelines.
- **Avoid `transform` collisions:** `.tilt-card` uses `transform: perspective(...) rotateX(...) rotateY(...)`. Use individual transform properties (`translate`, `scale`, `rotate`) in scroll/ambient keyframes (`reveal-up`, `gentle-float`) so they compose cleanly without clobbering 3D tilt.
- **Reduced motion:** Wrap scroll-driven animations in `@media (prefers-reduced-motion: no-preference)`, explicitly set `animation: none !important;` on `.reveal-item` under `prefers-reduced-motion: reduce`, and pause/skip canvas animations and shockwaves when reduced motion is enabled.
- **Contrast across all 4 themes:** Verify WCAG AA contrast whenever adding colors or editing theme tokens in `bureaucracy`, `shoestring`, `web1997`, or `blueprint`.

### JavaScript (`scripts/main.js`, `scripts/vip.js`)
- **XSS-safe DOM updates:** Never assign user input to `innerHTML`. Use `textContent`, `createTextNode`, and `replaceChildren`. When building downloadable SVGs, escape all 5 XML entities (`&`, `<`, `>`, `"`, `'`) and strip XML 1.0 control characters.
- **Progressive enhancement:** Feature-detect cutting-edge APIs (`startViewTransition`, `popover`, `dialog.showModal`, `speechSynthesis`, `PublicKeyCredential`, `AudioContext`, `canvas.getContext("2d")`) and provide graceful fallbacks.
- **Defensive storage & events:** Wrap all `localStorage`/`sessionStorage` access in `try/catch`, validate stored theme values against an explicit allowlist `Set`, ignore non-mouse pointers (`e.pointerType !== "mouse"`) on hover-tilt listeners, and ignore global hotkeys (like Konami Code) while focus is inside form controls.
- **Audio UX:** Keep Web Audio effects opt-in (muted by default) unless triggered by an explicit speech button.

### Assets & Caching
- Keep generated/raster images optimized (JPEGs ~140–200 KB at 1376×768 with matching `width`/`height` attributes and descriptive `alt` text; no embedded text or personal EXIF data).
- When updating favicons, keep both `favicon.ico` (root) and `images/favicon.ico` in sync alongside `images/favicon.png` and `images/apple-touch-icon.png`, and bump the `?v=` query parameter in `index.html` and `loggedin.html` to bust browser favicon caches.
- Never delete or modify `CNAME` unless intentionally changing the custom domain.
