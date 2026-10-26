import gsap from "gsap";

/*
  <a data-cursor="View"> -> the ring grows into a small accent bubble with that label.
  Links and buttons without data-cursor just make the ring a little bigger.
*/
export function initCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  ring.innerHTML = '<span class="cursor-ring__bubble"></span><span class="cursor-label"></span>';
  const label = ring.querySelector(".cursor-label");
  document.body.append(ring, dot);

  document.documentElement.classList.add("has-custom-cursor");

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

  const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
  const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" });

  let seen = false;
  let current = null;

  window.addEventListener("pointermove", (e) => {
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

  // Only change state when the hovered target actually changes (no flicker)
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest?.("[data-cursor], a, button") || null;
    if (t === current) return;
    current = t;

    const text = t?.dataset.cursor || "";
    if (text) label.textContent = text; // keep old text while fading out
    ring.classList.toggle("is-link", !!t && !text);
    ring.classList.toggle("is-label", !!text);
    dot.classList.toggle("is-hidden", !!text);
  });

  window.addEventListener("pointerdown", () => ring.classList.add("is-down"));
  window.addEventListener("pointerup", () => ring.classList.remove("is-down"));

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