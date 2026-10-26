# Reflekta 1960 - Step 2 setup (design system, layout, smooth scroll, pages)
# Run from the project root (the folder that contains package.json).

$ErrorActionPreference = "Stop"
$root = (Get-Location).Path

if (-not (Test-Path (Join-Path $root "package.json"))) {
  Write-Host "package.json not found. cd into the reflekta-1960 folder first." -ForegroundColor Red
  exit 1
}

function Write-File {
  param([string]$RelPath, [string]$Content)
  $full = Join-Path $root $RelPath
  $dir = Split-Path $full -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8)
  Write-Host "  created $RelPath" -ForegroundColor Green
}

# ---------------------------------------------------------------
# 1. Remove Vite sample files
# ---------------------------------------------------------------
Write-Host "Cleaning sample files..." -ForegroundColor Cyan
$old = @("src\counter.js", "src\style.css", "src\main.js", "src\javascript.svg", "src\assets", "public\vite.svg")
foreach ($p in $old) {
  $full = Join-Path $root $p
  if (Test-Path $full) {
    Remove-Item $full -Recurse -Force
    Write-Host "  removed $p" -ForegroundColor DarkGray
  }
}

# Folders for later steps
foreach ($d in @("public\images", "src\css", "src\js")) {
  New-Item -ItemType Directory -Path (Join-Path $root $d) -Force | Out-Null
}

Write-Host "Creating files..." -ForegroundColor Cyan

# ---------------------------------------------------------------
# 2. vite.config.js (multipage)
# ---------------------------------------------------------------
Write-File "vite.config.js" @'
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        gallery: resolve(__dirname, "gallery.html"),
        merch: resolve(__dirname, "merch.html"),
        about: resolve(__dirname, "about.html"),
        contact: resolve(__dirname, "contact.html"),
      },
    },
  },
});
'@

# ---------------------------------------------------------------
# 3. CSS
# ---------------------------------------------------------------
Write-File "src\css\tokens.css" @'
:root {
  --green: #004741;
  --green-dark: #00302c;
  --cream: #f0ede4;
  --cream-dim: #f0ede4b3;
  --accent: #ff6a3d;

  --font-display: "DM Serif Display", serif;
  --font-body: "DM Sans", sans-serif;

  --pad: clamp(1.25rem, 3vw, 2.5rem);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
'@

Write-File "src\css\base.css" @'
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { -webkit-text-size-adjust: 100%; }

body {
  background: var(--green);
  color: var(--cream);
  font-family: var(--font-body);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

img, video { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }

::selection { background: var(--accent); color: var(--green-dark); }

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 0.95;
}

.page { min-height: 100vh; }

/* Hero */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 8rem var(--pad) var(--pad);
}
.eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--cream-dim);
  margin-bottom: 1.5rem;
}
.hero__title {
  font-size: clamp(4rem, 17vw, 16rem);
  overflow: hidden;
}
.hero__title .char { display: inline-block; }
'@

Write-File "src\css\layout.css" @'
.site-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem var(--pad);
}
.site-logo { font-family: var(--font-display); font-size: 1.6rem; }

.site-nav { display: flex; gap: 2rem; }
.site-nav a {
  position: relative;
  font-size: 0.95rem;
  padding-block: 0.25rem;
}
.site-nav a::after {
  content: "";
  position: absolute;
  left: 0; bottom: 0;
  width: 100%; height: 1px;
  background: var(--cream);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.5s var(--ease-out);
}
.site-nav a:hover::after,
.site-nav a.is-active::after {
  transform: scaleX(1);
  transform-origin: left;
}

.site-footer {
  padding: 6rem var(--pad) var(--pad);
  border-top: 1px solid var(--cream-dim);
}
.site-footer__word {
  font-family: var(--font-display);
  font-size: clamp(3rem, 14vw, 13rem);
  line-height: 0.9;
}
.site-footer__row {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  color: var(--cream-dim);
  font-size: 0.85rem;
}
'@

# ---------------------------------------------------------------
# 4. JavaScript
# ---------------------------------------------------------------
Write-File "src\js\layout.js" @'
const links = [
  { label: "Home", href: "/" },
  { label: "Gallery", href: "/gallery.html" },
  { label: "Merch", href: "/merch.html" },
  { label: "About", href: "/about.html" },
  { label: "Contact", href: "/contact.html" },
];

const here = location.pathname === "/index.html" ? "/" : location.pathname;

export function renderLayout() {
  const header = document.querySelector("#site-header");
  const footer = document.querySelector("#site-footer");

  if (header) {
    header.outerHTML = `
      <header class="site-header">
        <a href="/" class="site-logo">Reflekta 1960</a>
        <nav class="site-nav">
          ${links
            .map(
              (l) =>
                `<a href="${l.href}" class="${l.href === here ? "is-active" : ""}">${l.label}</a>`
            )
            .join("")}
        </nav>
      </header>`;
  }

  if (footer) {
    footer.outerHTML = `
      <footer class="site-footer">
        <div class="site-footer__word">Reflekta 1960</div>
        <div class="site-footer__row">
          <span>Art &amp; Merch</span>
          <span>&copy; ${new Date().getFullYear()} Reflekta 1960</span>
        </div>
      </footer>`;
  }
}
'@

Write-File "src\js\smooth-scroll.js" @'
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.1 });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
'@

Write-File "src\js\main.js" @'
import "../css/tokens.css";
import "../css/base.css";
import "../css/layout.css";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { renderLayout } from "./layout.js";
import { initSmoothScroll } from "./smooth-scroll.js";

gsap.registerPlugin(SplitText);

renderLayout();
initSmoothScroll();

// Hero intro (only runs if the page has a hero title)
document.fonts.ready.then(() => {
  const title = document.querySelector(".hero__title");
  if (!title) return;

  const split = new SplitText(title, { type: "chars", charsClass: "char" });

  gsap.from(split.chars, {
    yPercent: 110,
    duration: 1.2,
    ease: "expo.out",
    stagger: 0.04,
    delay: 0.2,
  });

  gsap.from(".eyebrow", { opacity: 0, y: 20, duration: 1, delay: 0.8 });
});
'@

# ---------------------------------------------------------------
# 5. HTML pages (generated from one template)
# ---------------------------------------------------------------
$template = @'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{TITLE}}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=DM+Serif+Display&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="site-header"></div>

    <main class="page">
      <section class="hero">
        <p class="eyebrow">{{EYEBROW}}</p>
        <h1 class="hero__title">{{HEADING}}</h1>
      </section>
    </main>

    <div id="site-footer"></div>
    <script type="module" src="/src/js/main.js"></script>
  </body>
</html>
'@

$pages = @(
  @{ File = "index.html";   Title = "Reflekta 1960";           Eyebrow = "Art &amp; Merch";   Heading = "Reflekta" },
  @{ File = "gallery.html"; Title = "Gallery | Reflekta 1960"; Eyebrow = "The Collection";    Heading = "Gallery" },
  @{ File = "merch.html";   Title = "Merch | Reflekta 1960";   Eyebrow = "Wear the Art";      Heading = "Merch" },
  @{ File = "about.html";   Title = "About | Reflekta 1960";   Eyebrow = "Our Story";         Heading = "About" },
  @{ File = "contact.html"; Title = "Contact | Reflekta 1960"; Eyebrow = "Say Hello";         Heading = "Contact" }
)

foreach ($p in $pages) {
  $html = $template.Replace("{{TITLE}}", $p.Title).Replace("{{EYEBROW}}", $p.Eyebrow).Replace("{{HEADING}}", $p.Heading)
  Write-File $p.File $html
}

Write-Host ""
Write-Host "Done. Now run: npm run dev" -ForegroundColor Cyan
