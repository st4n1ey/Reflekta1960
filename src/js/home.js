import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initHome() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  hero(reduced);
  mirror(reduced);
  statement(reduced);
  featured();
  clothesline(reduced);
  cta(reduced);

  ScrollTrigger.refresh();
}

// Hero: gentle scroll drift, hand-drawn lines, collage "stick-on" intro + soft parallax
function hero(reduced) {
  const heroEl = document.querySelector(".hero");
  if (!heroEl) return;

  const collage = heroEl.querySelector(".collage");
  const pieces = gsap.utils.toArray(".piece");

  gsap.to(".hero__copy", {
    yPercent: -8,
    ease: "none",
    scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true },
  });
  if (collage) {
    gsap.to(collage, {
      yPercent: -4,
      ease: "none",
      scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true },
    });
  }

  if (reduced) {
    gsap.set(pieces, { opacity: 1 });
    return;
  }

  const draw = (sel, delay) => {
    if (!document.querySelector(sel)) return;
    gsap.fromTo(
      sel,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.2, delay, ease: "power2.inOut" }
    );
  };
  draw(".hero__underline path", 1.0);
  draw(".btn-oval path", 1.3);

  document.querySelector(".btn-oval")?.addEventListener("mouseenter", () => {
    gsap.fromTo(
      ".btn-oval path",
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", overwrite: true }
    );
  });

  if (!pieces.length) return;

  gsap.fromTo(
    pieces,
    { opacity: 0, yPercent: 14, scale: 1.05, rotation: -2 },
    {
      opacity: 1,
      yPercent: 0,
      scale: 1,
      rotation: 0,
      duration: 1.1,
      ease: "back.out(1.1)",
      stagger: 0.12,
    }
  );

  // Soft mouse parallax (small on purpose)
  if (!window.matchMedia("(hover: hover)").matches) return;

  const xTo = pieces.map((p) => gsap.quickTo(p, "x", { duration: 1.1, ease: "power3" }));
  const yTo = pieces.map((p) => gsap.quickTo(p, "y", { duration: 1.1, ease: "power3" }));

  heroEl.addEventListener("pointermove", (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    pieces.forEach((p, i) => {
      const d = parseFloat(p.dataset.depth) || 0.5;
      xTo[i](-nx * 12 * d);
      yTo[i](-ny * 8 * d);
    });
  });
}

// Mirror: words, spinning stamp, rising sun, and rippling reflections
function mirror(reduced) {
  const section = document.querySelector(".mirror");
  if (!section) return;

  section.querySelectorAll("[data-mirror]").forEach((word) => {
    const split = new SplitText(word, { type: "chars", charsClass: "char" });
    gsap.from(split.chars, {
      opacity: 0,
      yPercent: 60,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.04,
      scrollTrigger: { trigger: section, start: "top 75%" },
    });
  });

  if (reduced) return;

  // The stamp turns as you scroll (original and reflection together)
  gsap.to(".badge__ring", {
    rotation: 360,
    svgOrigin: "100 100",
    ease: "none",
    scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
  });

  // The sun rises out of the water line (the reflection sinks, since it is flipped)
  gsap.fromTo(
    ".sunrise__disc",
    { yPercent: 58 },
    {
      yPercent: 0,
      ease: "power2.out",
      scrollTrigger: { trigger: section, start: "top 80%", end: "center 50%", scrub: 0.6 },
    }
  );

  // Water ripple
  const turb = document.querySelector("#ripple feTurbulence");
  const disp = document.querySelector("#ripple feDisplacementMap");
  if (!turb || !disp) return;

  const s = { fy: 0.06, scale: 8 };
  const apply = () => {
    turb.setAttribute("baseFrequency", `0.006 ${s.fy.toFixed(4)}`);
    disp.setAttribute("scale", s.scale.toFixed(1));
  };
  apply();

  const drift = gsap.to(s, {
    fy: 0.11,
    duration: 4,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    onUpdate: apply,
  });

  const st = ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => drift.paused(!self.isActive),
  });
  drift.paused(!st.isActive);

  section.addEventListener("pointermove", (e) => {
    const v = Math.min(Math.hypot(e.movementX, e.movementY), 50);
    gsap.to(s, {
      scale: 8 + v * 1.2,
      duration: 0.25,
      overwrite: "auto",
      onUpdate: apply,
      onComplete: () =>
        gsap.to(s, { scale: 8, duration: 1.6, ease: "power2.out", onUpdate: apply }),
    });
  });
}

// Statement: words get inked in, and the paint spills across the canvas
function statement(reduced) {
  const el = document.querySelector(".statement__text");
  if (!el || reduced) return;

  const split = new SplitText(el, { type: "words" });
  const range = { trigger: ".statement", start: "top 75%", end: "bottom 55%", scrub: 0.6 };

  gsap.fromTo(
    split.words,
    { opacity: 0.15 },
    {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: true },
    }
  );

  if (!document.querySelector(".paint")) return;

  const tl = gsap.timeline({ scrollTrigger: range });
  tl.fromTo(
    ".paint .spill",
    { scale: 0.15, transformOrigin: "50% 50%" },
    { scale: 1, ease: "power2.out", duration: 1 },
    0
  )
    .fromTo(
      ".paint .drips path",
      { scaleY: 0, transformOrigin: "50% 0%" },
      { scaleY: 1, ease: "power1.in", stagger: 0.12, duration: 0.6 },
      0.7
    )
    .fromTo(
      ".paint .brush",
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, ease: "power1.inOut", duration: 0.8 },
      0.4
    )
    .fromTo(
      ".paint .splatter circle",
      { scale: 0, transformOrigin: "50% 50%" },
      { scale: 1, ease: "back.out(2)", stagger: 0.07, duration: 0.3 },
      0.5
    );

  gsap.to(".canvas", {
    yPercent: -5,
    ease: "none",
    scrollTrigger: { trigger: ".statement", start: "top bottom", end: "bottom top", scrub: true },
  });
}

// Art cards: reveal, text fade and gentle parallax image
function featured() {
  gsap.utils.toArray(".art-card").forEach((card, i) => {
    const frame = card.querySelector(".art-card__frame");
    const win = card.querySelector(".art-card__window");
    const img = card.querySelector(".art-card__img");
    const meta = card.querySelector(".art-card__meta");
    const at = { trigger: card, start: "top 88%" };

    gsap.from(frame, {
      opacity: 0,
      y: 50,
      duration: 1.1,
      ease: "expo.out",
      delay: (i % 3) * 0.1,
      scrollTrigger: at,
    });

    gsap.fromTo(
      win,
      { clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.2,
        ease: "expo.out",
        delay: 0.15 + (i % 3) * 0.1,
        scrollTrigger: at,
      }
    );

    gsap.from(meta, {
      opacity: 0,
      y: 16,
      duration: 0.8,
      delay: 0.35 + (i % 3) * 0.1,
      scrollTrigger: at,
    });

    gsap.fromTo(
      img,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

// Merch on a clothesline: the string runs through the pins, tags fade in calmly
function clothesline(reduced) {
  const line = document.querySelector(".line");
  if (!line) return;

  const svg = line.querySelector(".line__string");
  const path = svg.querySelector("path");
  const tags = gsap.utils.toArray(".tag", line);

  const drawString = () => {
    const w = line.offsetWidth;
    const h = line.offsetHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const pts = tags.map((t) => [t.offsetLeft + t.offsetWidth / 2, t.offsetTop + 2]);
    const all = [[0, pts[0][1] - 26], ...pts, [w, pts[pts.length - 1][1] - 26]];

    let d = `M${all[0][0]} ${all[0][1]}`;
    for (let i = 1; i < all.length; i++) {
      const [x0, y0] = all[i - 1];
      const [x1, y1] = all[i];
      d += ` Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 22} ${x1} ${y1}`;
    }
    path.setAttribute("d", d);
  };

  drawString();
  window.addEventListener("resize", drawString);
  window.addEventListener("load", drawString);

  if (reduced) return;

  // Each tag has its own trigger and plays once, so none can get stuck hidden
  tags.forEach((tag, i) => {
    gsap.from(tag, {
      opacity: 0,
      y: 36,
      duration: 1,
      ease: "power3.out",
      delay: i * 0.08,
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: tag, start: "top 92%", once: true },
    });
  });
}

// CTA cards: reveal, and the arrow leans slightly toward the cursor
function cta(reduced) {
  const cards = gsap.utils.toArray(".cta__card");
  if (!cards.length) return;

  if (!reduced) {
    gsap.from(cards, {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: "power3.out",
      stagger: 0.12,
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: ".cta", start: "top 88%", once: true },
    });
  }

  if (reduced || !window.matchMedia("(hover: hover)").matches) return;

  cards.forEach((card) => {
    const arrow = card.querySelector(".cta__arrow");
    const xTo = gsap.quickTo(arrow, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(arrow, "y", { duration: 0.5, ease: "power3" });

    card.addEventListener("pointermove", (e) => {
      const r = arrow.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2 - gsap.getProperty(arrow, "x"));
      const dy = e.clientY - (r.top + r.height / 2 - gsap.getProperty(arrow, "y"));
      xTo(gsap.utils.clamp(-14, 14, dx * 0.08));
      yTo(gsap.utils.clamp(-14, 14, dy * 0.08));
    });
    card.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}