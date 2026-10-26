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