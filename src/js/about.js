import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initAbout() {
  if (!document.querySelector(".hero--about")) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) gsap.set(".draw", { strokeDashoffset: 0 });

  heroDoodles(reduced);
  story(reduced);
  journey(reduced);
  sketchpad(reduced);
}

// The sketchbook in the hero draws itself; the pencil rocks gently
function heroDoodles(reduced) {
  if (reduced) return;

  gsap.fromTo(
    ".sketchpage .draw",
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 1.2, stagger: 0.3, ease: "power2.inOut", delay: 1.1 }
  );

  gsap.to(".pencil", {
    rotation: 3,
    transformOrigin: "50% 50%",
    duration: 3,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
}

function story(reduced) {
  if (reduced) return;

  gsap.fromTo(
    ".scribble .draw",
    { strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: ".story", start: "top 70%", end: "top 20%", scrub: true },
    }
  );

  gsap.from(".story__body > *", {
    opacity: 0,
    y: 30,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    clearProps: "opacity,transform",
    scrollTrigger: { trigger: ".story__body", start: "top 80%", once: true },
  });

  gsap.fromTo(
    ".sign .draw",
    { strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      duration: 1.4,
      ease: "power2.inOut",
      scrollTrigger: { trigger: ".sign", start: "top 92%", once: true },
    }
  );
}

// Draw. Paint. Wear: the thread draws as you scroll, each card sketches itself
function journey(reduced) {
  if (reduced) return;

  gsap.fromTo(
    ".journey__line .draw",
    { strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: ".journey__grid", start: "top 75%", end: "bottom 60%", scrub: true },
    }
  );

  gsap.utils.toArray(".step-card").forEach((card) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 85%", once: true } });

    tl.from(card, { opacity: 0, y: 50, duration: 0.9, ease: "power3.out", clearProps: "opacity,transform" })
      .fromTo(
        card.querySelectorAll(".draw"),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.1, stagger: 0.15, ease: "power2.inOut" },
        "-=0.4"
      )
      .fromTo(
        card.querySelectorAll(".pop"),
        { scale: 0, transformOrigin: "50% 50%" },
        { scale: 1, duration: 0.7, ease: "back.out(1.6)" },
        "-=0.9"
      )
      .fromTo(
        card.querySelectorAll(".drop"),
        { scaleY: 0, transformOrigin: "50% 0%" },
        { scaleY: 1, duration: 0.5, stagger: 0.1, ease: "power1.in" },
        "-=0.2"
      );
  });
}

// A real sketchbook: draw with the mouse or a finger, then save or clear
function sketchpad(reduced) {
  const canvas = document.querySelector(".sketch__canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const pad = canvas.parentElement;
  const hint = document.querySelector(".sketch__hint");
  const swatches = gsap.utils.toArray(".swatch");

  let color = "#06241f";
  let drawing = false;
  let last = null;
  let mid = null;
  let width = 3;

  const size = () => {
    const r = pad.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // keep what has been drawn when the size changes
    const keep = document.createElement("canvas");
    keep.width = canvas.width;
    keep.height = canvas.height;
    if (canvas.width) keep.getContext("2d").drawImage(canvas, 0, 0);

    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (keep.width) ctx.drawImage(keep, 0, 0, keep.width / dpr, keep.height / dpr);
  };
  size();
  window.addEventListener("resize", size);

  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
  };

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    last = point(e);
    mid = { x: last.x, y: last.y };
    width = 3;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 1.6, 0, Math.PI * 2);
    ctx.fill();

    if (hint && !hint.dataset.gone) {
      hint.dataset.gone = "1";
      gsap.to(hint, { opacity: 0, duration: 0.4 });
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = point(e);
    const dist = Math.hypot(p.x - last.x, p.y - last.y);
    const speed = dist / Math.max(p.t - last.t, 1);
    const target = Math.max(1.6, Math.min(5, 5.2 - speed * 2.2));
    width += (target - width) * 0.35;

    const m = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);
    ctx.quadraticCurveTo(last.x, last.y, m.x, m.y);
    ctx.stroke();

    mid = m;
    last = p;
  });

  const stop = () => (drawing = false);
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);

  swatches.forEach((sw) => {
    sw.addEventListener("click", () => {
      color = sw.dataset.color;
      swatches.forEach((s) => s.setAttribute("aria-pressed", String(s === sw)));
    });
  });

  document.querySelector("[data-clear]")?.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (hint) {
      delete hint.dataset.gone;
      gsap.to(hint, { opacity: 1, duration: 0.4 });
    }
  });

  document.querySelector("[data-save]")?.addEventListener("click", () => {
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const o = out.getContext("2d");
    o.fillStyle = "#ece7d9";
    o.fillRect(0, 0, out.width, out.height);
    o.drawImage(canvas, 0, 0);
    const a = document.createElement("a");
    a.download = "my-reflekta-sketch.png";
    a.href = out.toDataURL("image/png");
    a.click();
  });
}