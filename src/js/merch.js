import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initMerch() {
  const products = gsap.utils.toArray(".product");
  if (!products.length) return;

  products.forEach(sizePicker);
  products.forEach(reveal);

  const mm = gsap.matchMedia();

  // Desktop: the product is pinned and turns / zooms as you scroll
  mm.add("(min-width: 801px) and (prefers-reduced-motion: no-preference)", () => {
    products.forEach(pinned);
  });

  // Phones or reduced motion: a button does it instead
  mm.add("(max-width: 800px), (prefers-reduced-motion: reduce)", () => {
    const undo = products.map(toggle);
    return () => undo.forEach((fn) => fn && fn());
  });

  ScrollTrigger.refresh();
}

// Size circles + order link that carries the item and size to the contact page
function sizePicker(p) {
  const chips = gsap.utils.toArray(".size", p);
  const order = p.querySelector(".order");
  const priceEl = p.querySelector(".product__price");
  const name = p.dataset.name || "";
  let size = "";

  if (p.dataset.price && priceEl) {
    priceEl.textContent = p.dataset.price;
    priceEl.hidden = false;
  }

  const href = () =>
    `/contact.html?type=merch&item=${encodeURIComponent(name)}${size ? `&size=${encodeURIComponent(size)}` : ""}`;
  if (order) order.href = href();

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      size = chip.dataset.size;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      if (order) order.href = href();
    });
  });
}

function reveal(p) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.from(p.querySelectorAll(".product__info > *"), {
    opacity: 0,
    y: 28,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.08,
    clearProps: "opacity,transform",
    scrollTrigger: { trigger: p, start: "top 70%", once: true },
  });

  gsap.from(p.querySelector(".product__media"), {
    opacity: 0,
    y: 60,
    duration: 1.1,
    ease: "power3.out",
    clearProps: "opacity,transform",
    scrollTrigger: { trigger: p, start: "top 75%", once: true },
  });
}

function pinned(p) {
  const stage = p.querySelector(".product__stage");
  const motion = p.dataset.motion;
  const a = p.querySelector(".lbl--a");
  const b = p.querySelector(".lbl--b");

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: stage,
      start: "top top",
      end: "+=140%",
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
    },
  });

  tl.to(p.querySelector(".hint"), { opacity: 0, duration: 0.1 }, 0);

  if (motion === "flip") {
    tl.to(p.querySelector(".flip__inner"), { rotationY: 180, ease: "power2.inOut", duration: 1 }, 0.1);
  } else {
    tl.to(p.querySelector(".zoom img"), { scale: 2.3, ease: "power2.inOut", duration: 1 }, 0.1);
  }

  tl.to(a, { opacity: 0, duration: 0.2 }, 0.3)
    .fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.6)
    .to({}, { duration: 0.25 }); // hold at the end
}

function toggle(p) {
  const btn = p.querySelector(".product__turn");
  if (!btn) return;

  const motion = p.dataset.motion;
  const a = p.querySelector(".lbl--a");
  const b = p.querySelector(".lbl--b");
  const text = btn.querySelector("span");
  let on = false;

  const onClick = () => {
    on = !on;
    if (motion === "flip") {
      gsap.to(p.querySelector(".flip__inner"), {
        rotationY: on ? 180 : 0,
        duration: 0.9,
        ease: "power3.inOut",
      });
    } else {
      gsap.to(p.querySelector(".zoom img"), {
        scale: on ? 2.3 : 1,
        duration: 0.9,
        ease: "power3.inOut",
      });
    }
    gsap.to(a, { opacity: on ? 0 : 1, duration: 0.3 });
    gsap.to(b, { opacity: on ? 1 : 0, duration: 0.3 });
    text.textContent = on ? btn.dataset.off : btn.dataset.on;
  };

  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}