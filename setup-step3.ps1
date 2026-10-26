# Reflekta 1960 - Step 3 setup (custom cursor, film grain, page-transition wipe)
# Run from the project root (the folder that contains package.json).
# Requires step 2 to be done first.

$ErrorActionPreference = "Stop"
$root = (Get-Location).Path

if (-not (Test-Path (Join-Path $root "src\js\main.js"))) {
  Write-Host "src\js\main.js not found. Finish step 2 and run this from the project root." -ForegroundColor Red
  exit 1
}

function Write-File {
  param([string]$RelPath, [string]$Content)
  $full = Join-Path $root $RelPath
  $dir = Split-Path $full -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8)
  Write-Host "  wrote $RelPath" -ForegroundColor Green
}

Write-Host "Creating step 3 files..." -ForegroundColor Cyan

# ---------------------------------------------------------------
# CSS: grain + cursor + transition
# ---------------------------------------------------------------
Write-File "src\css\effects.css" @'
/* ---------- Film grain ---------- */
.grain {
  position: fixed;
  inset: -50%;
  width: 200%;
  height: 200%;
  pointer-events: none;
  z-index: 9500;
  opacity: 0.1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain 0.9s steps(6) infinite;
}
@keyframes grain {
  0%   { transform: translate(0, 0); }
  17%  { transform: translate(-5%, -8%); }
  33%  { transform: translate(-12%, 6%); }
  50%  { transform: translate(8%, -12%); }
  67%  { transform: translate(-6%, 10%); }
  83%  { transform: translate(10%, 4%); }
  100% { transform: translate(0, 0); }
}

/* ---------- Custom cursor ---------- */
html.has-custom-cursor,
html.has-custom-cursor * {
  cursor: none !important;
}

.cursor-dot,
.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.cursor-dot.is-visible,
.cursor-ring.is-visible { opacity: 1; }

.cursor-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cream);
}

.cursor-ring {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--cream);
  transition:
    opacity 0.3s ease,
    width 0.45s var(--ease-out),
    height 0.45s var(--ease-out),
    background-color 0.3s ease,
    border-color 0.3s ease,
    scale 0.25s ease;
}
.cursor-ring.is-link { width: 64px; height: 64px; }
.cursor-ring.is-label {
  width: 96px;
  height: 96px;
  background: var(--accent);
  border-color: var(--accent);
}
.cursor-ring.is-down { scale: 0.85; }

.cursor-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--green-dark);
  opacity: 0;
  transition: opacity 0.25s ease;
}
.cursor-ring.is-label .cursor-label { opacity: 1; }

/* ---------- Page transition ---------- */
html.is-transitioning body { visibility: hidden; }

.transition {
  position: fixed;
  inset: 0;
  z-index: 9000;
  pointer-events: none;
  overflow: hidden;
}
.transition.is-active { pointer-events: all; }

.transition__cols {
  position: absolute;
  inset: 0;
  display: flex;
}
.transition__cols span {
  flex: 1 0 calc(20% + 1px);
  margin-right: -1px;
  background: var(--cream);
  will-change: transform;
}

.transition__label {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: clamp(3rem, 12vw, 11rem);
  line-height: 1;
  color: var(--green);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .grain { animation: none; }
}
'@

# ---------------------------------------------------------------
# JS: grain
# ---------------------------------------------------------------
Write-File "src\js\grain.js" @'
export function initGrain() {
  const grain = document.createElement("div");
  grain.className = "grain";
  grain.setAttribute("aria-hidden", "true");
  document.body.append(grain);
}
'@

# ---------------------------------------------------------------
# JS: cursor
# ---------------------------------------------------------------
Write-File "src\js\cursor.js" @'
import gsap from "gsap";

/*
  Usage in HTML:
    <a href="..." data-cursor="View">   -> big accent bubble with the label "View"
  Links and buttons without data-cursor just make the ring grow.
*/
export function initCursor() {
  // Only on devices with a real mouse
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  const label = document.createElement("span");
  label.className = "cursor-label";
  ring.append(label);
  document.body.append(ring, dot);

  document.documentElement.classList.add("has-custom-cursor");

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

  const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
  const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });

  let seen = false;

  window.addEventListener("mousemove", (e) => {
    if (!seen) {
      gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
      dot.classList.add("is-visible");
      ring.classList.add("is-visible");
      seen = true;
    }
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
  });

  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-cursor], a, button");
    const text = t?.dataset.cursor;

    ring.classList.toggle("is-link", !!t && !text);
    ring.classList.toggle("is-label", !!text);
    label.textContent = text || "";
    dot.style.opacity = text ? "0" : "";
  });

  window.addEventListener("mousedown", () => ring.classList.add("is-down"));
  window.addEventListener("mouseup", () => ring.classList.remove("is-down"));

  document.documentElement.addEventListener("mouseleave", () => {
    dot.classList.remove("is-visible");
    ring.classList.remove("is-visible");
  });
  document.documentElement.addEventListener("mouseenter", () => {
    if (!seen) return;
    dot.classList.add("is-visible");
    ring.classList.add("is-visible");
  });
}
'@

# ---------------------------------------------------------------
# JS: page transitions
# ---------------------------------------------------------------
Write-File "src\js\transitions.js" @'
import gsap from "gsap";

const KEY = "rk-t";
const COLS = 5;

const names = {
  "/": "Reflekta",
  "/index.html": "Reflekta",
  "/gallery.html": "Gallery",
  "/merch.html": "Merch",
  "/about.html": "About",
  "/contact.html": "Contact",
};

export function initTransitions() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Build overlay
  const overlay = document.createElement("div");
  overlay.className = "transition";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="transition__cols">${"<span></span>".repeat(COLS)}</div>
    <div class="transition__label"></div>`;
  document.body.append(overlay);

  const cols = overlay.querySelectorAll(".transition__cols span");
  const label = overlay.querySelector(".transition__label");

  gsap.set(cols, { yPercent: 100 });

  let busy = false;

  // ---- ENTER (runs on the new page) ----
  const incoming = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);

  const ready = new Promise((resolve) => {
    if (!incoming || reduced) {
      document.documentElement.classList.remove("is-transitioning");
      resolve();
      return;
    }

    // Start fully covered, then reveal
    label.textContent = incoming;
    gsap.set(cols, { yPercent: 0 });
    gsap.set(label, { opacity: 1, y: 0 });
    overlay.classList.add("is-active");
    document.documentElement.classList.remove("is-transitioning");

    document.fonts.ready.then(() => {
      gsap
        .timeline({
          onComplete: () => overlay.classList.remove("is-active"),
        })
        .to(label, { opacity: 0, y: -30, duration: 0.4, ease: "power3.in" }, 0.15)
        .to(
          cols,
          {
            yPercent: -100,
            duration: 0.9,
            ease: "expo.inOut",
            stagger: { each: 0.06, from: "start" },
          },
          0.3
        )
        .call(resolve, null, 0.75);
    });
  });

  // ---- LEAVE (click on an internal link) ----
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;

    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;

    const samePage = url.pathname === location.pathname;
    if (samePage && url.hash) return; // normal anchor jump
    e.preventDefault();
    if (samePage || busy) return;

    if (reduced) {
      location.href = url.href;
      return;
    }

    busy = true;
    const name = names[url.pathname] || "Reflekta";
    label.textContent = name;
    sessionStorage.setItem(KEY, name);
    overlay.classList.add("is-active");

    gsap
      .timeline({ onComplete: () => (location.href = url.href) })
      .to(cols, {
        yPercent: 0,
        duration: 0.8,
        ease: "expo.inOut",
        stagger: { each: 0.06, from: "start" },
      })
      .fromTo(
        label,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
        "-=0.4"
      );
  });

  // Back/forward cache: reset the overlay when returning to a cached page
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    busy = false;
    overlay.classList.remove("is-active");
    gsap.set(cols, { yPercent: 100 });
    gsap.set(label, { opacity: 0 });
  });

  return ready;
}
'@

# ---------------------------------------------------------------
# JS: main.js (rewritten to wire everything together)
# ---------------------------------------------------------------
Write-File "src\js\main.js" @'
import "../css/tokens.css";
import "../css/base.css";
import "../css/layout.css";
import "../css/effects.css";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { renderLayout } from "./layout.js";
import { initSmoothScroll } from "./smooth-scroll.js";
import { initGrain } from "./grain.js";
import { initCursor } from "./cursor.js";
import { initTransitions } from "./transitions.js";

gsap.registerPlugin(SplitText);

renderLayout();
initSmoothScroll();
initGrain();
initCursor();
const transitionReady = initTransitions();

function heroIntro() {
  const title = document.querySelector(".hero__title");
  if (!title) return;

  const split = new SplitText(title, { type: "chars", charsClass: "char" });

  gsap.from(split.chars, {
    yPercent: 110,
    duration: 1.2,
    ease: "expo.out",
    stagger: 0.04,
  });

  gsap.from(".eyebrow", { opacity: 0, y: 20, duration: 1, delay: 0.6 });
}

// Wait for fonts and for the page-transition reveal before the hero intro
Promise.all([document.fonts.ready, transitionReady]).then(heroIntro);
'@

# ---------------------------------------------------------------
# HTML: inline head script so the new page never flashes before the wipe
# ---------------------------------------------------------------
Write-Host "Patching HTML pages..." -ForegroundColor Cyan
$inline = '    <script>if (sessionStorage.getItem("rk-t")) document.documentElement.classList.add("is-transitioning");</script>'
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($f in @("index.html", "gallery.html", "merch.html", "about.html", "contact.html")) {
  $path = Join-Path $root $f
  if (-not (Test-Path $path)) { Write-Host "  skipped $f (not found)" -ForegroundColor Yellow; continue }

  $html = [System.IO.File]::ReadAllText($path)
  if ($html.Contains('"rk-t"')) { Write-Host "  $f already patched" -ForegroundColor DarkGray; continue }

  $html = $html.Replace("</head>", "$inline`n  </head>")
  [System.IO.File]::WriteAllText($path, $html, $utf8)
  Write-Host "  patched $f" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. If the dev server is running it reloads by itself, otherwise run: npm run dev" -ForegroundColor Cyan
