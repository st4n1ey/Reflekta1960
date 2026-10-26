import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(ScrollTrigger, Flip);

export function initGallery(lenis) {
  const wall = document.querySelector(".wall");
  if (!wall) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const works = gsap.utils.toArray(".work", wall);

  reveal(works, reduced);
  filters(works, wall, reduced);
  lightbox(works, lenis, reduced);
}

// Paintings appear as they scroll into view
function reveal(works, reduced) {
  if (reduced) return;
  gsap.set(works, { opacity: 0, y: 50 });
  ScrollTrigger.batch(works, {
    start: "top 92%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1 }),
  });
}

// Filter chips: a pill slides behind the active chip, the wall reshuffles with Flip
function filters(works, wall, reduced) {
  const bar = document.querySelector(".filters");
  if (!bar) return;

  const chips = gsap.utils.toArray(".chip", bar);
  const pill = bar.querySelector(".filters__pill");
  const countEl = document.querySelector("[data-count]");

  chips.forEach((chip) => {
    const f = chip.dataset.filter;
    const n = f === "all" ? works.length : works.filter((w) => w.dataset.cat === f).length;
    chip.insertAdjacentHTML("beforeend", `<sup>${n}</sup>`);
  });

  const movePill = (chip, instant) => {
    const vars = { x: chip.offsetLeft, width: chip.offsetWidth };
    if (instant) gsap.set(pill, vars);
    else gsap.to(pill, { ...vars, duration: 0.5, ease: "power3.out" });
  };
  const active = () => bar.querySelector(".chip.is-active");

  movePill(active(), true);
  window.addEventListener("resize", () => movePill(active(), true));
  document.fonts.ready.then(() => movePill(active(), true));

  let current = "all";
  let shown = works.length;
  let flipping = false;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      if (f === current || flipping) return;
      current = f;

      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      movePill(chip);

      // Remember how tall the wall is, then work out how tall it will be
      const startH = wall.offsetHeight;
      const state = Flip.getState(works);
      works.forEach((w) =>
        w.classList.toggle("is-hidden", !(f === "all" || w.dataset.cat === f))
      );
      const endH = wall.offsetHeight;

      const next = works.filter((w) => !w.classList.contains("is-hidden")).length;
      if (countEl) {
        const n = { v: shown };
        gsap.to(n, {
          v: next,
          duration: 0.5,
          snap: { v: 1 },
          onUpdate: () => (countEl.textContent = n.v),
        });
      }
      shown = next;

      if (reduced) {
        ScrollTrigger.refresh();
        return;
      }

      flipping = true;

      // Keep the wall's height so the footer never jumps, and ease it to the new height
      gsap.fromTo(
        wall,
        { height: startH },
        {
          height: endH,
          duration: 0.8,
          ease: "power3.inOut",
          clearProps: "height",
          onComplete: () => {
            flipping = false;
            ScrollTrigger.refresh();
          },
        }
      );

      Flip.from(state, {
        duration: 0.8,
        ease: "power3.inOut",
        stagger: 0.04,
        absolute: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { opacity: 0, scale: 0.94 },
            { opacity: 1, scale: 1, duration: 0.6, delay: 0.2 }
          ),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.4 }),
      });
    });
  });
}

// Lightbox: the real painting flies out of its frame (Flip.fit) and back again
function lightbox(works, lenis, reduced) {
  const lb = document.querySelector(".lightbox");
  if (!lb) return;

  const root = document.documentElement;
  const backdrop = lb.querySelector(".lightbox__backdrop");
  const img = lb.querySelector(".lightbox__img");
  const ui = gsap.utils.toArray(".lightbox__close, .lightbox__nav", lb);
  const infoEls = gsap.utils.toArray(".lightbox__info > *", lb);
  const el = {
    num: lb.querySelector(".lightbox__num"),
    title: lb.querySelector(".lightbox__title"),
    cat: lb.querySelector(".lightbox__cat"),
    note: lb.querySelector(".lightbox__note"),
    count: lb.querySelector(".lightbox__count"),
  };
  const catNames = { figures: "Figures", landscapes: "Landscapes", abstract: "Abstract" };

  let open = false;
  let busy = false;
  let index = 0;

  const visible = () => works.filter((w) => !w.classList.contains("is-hidden"));
  const cardImg = (w) => w.querySelector(".work__window img");

  const fill = (w) => {
    const src = cardImg(w);
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    el.num.textContent = w.dataset.num;
    el.title.textContent = w.dataset.title;
    el.cat.textContent = catNames[w.dataset.cat] || "";
    el.note.textContent = w.dataset.note || "";
    const cta = lb.querySelector(".lightbox__cta");
    if (cta) cta.href = `/contact.html?type=art&item=${encodeURIComponent(w.dataset.title)}`;
    const total = visible().length;
    el.count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  };

  const openWork = async (work) => {
    if (open || busy) return;
    busy = true;
    open = true;
    index = visible().indexOf(work);
    fill(work);

    work.classList.add("is-lifted");
    root.classList.add("lb-open");
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    lenis?.stop();

    try {
      await img.decode();
    } catch {}

    gsap.killTweensOf([img, backdrop, ...infoEls, ...ui]);
    gsap.set(img, { clearProps: "transform,opacity" });

    if (reduced) {
      gsap.set(backdrop, { opacity: 1 });
      busy = false;
      return;
    }

    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });

    // Place the big image exactly over the small one, then let it grow
    Flip.fit(img, cardImg(work), { scale: true });
    gsap.to(img, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.95,
      ease: "power3.inOut",
      onComplete: () => (busy = false),
    });

    gsap.fromTo(
      infoEls,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, delay: 0.5, stagger: 0.08, ease: "power3.out" }
    );
    gsap.fromTo(ui, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.6 });
  };

  const closeLb = () => {
    if (!open || busy) return;
    busy = true;
    const work = visible()[index];

    const finish = () => {
      work.classList.remove("is-lifted");
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      root.classList.remove("lb-open");
      lenis?.start();
      gsap.set([img, backdrop, ...infoEls, ...ui], { clearProps: "all" });
      open = false;
      busy = false;
    };

    if (reduced) {
      finish();
      return;
    }

    gsap.to([...infoEls, ...ui], { opacity: 0, duration: 0.25 });
    gsap.to(backdrop, { opacity: 0, duration: 0.6, delay: 0.25, ease: "power2.in" });
    Flip.fit(img, cardImg(work), {
      scale: true,
      duration: 0.85,
      ease: "power3.inOut",
      onComplete: finish,
    });
  };

  const go = (dir) => {
    if (!open || busy) return;
    const list = visible();
    if (list.length < 2) return;
    busy = true;

    const from = list[index];
    index = (index + dir + list.length) % list.length;
    const to = list[index];

    from.classList.remove("is-lifted");
    to.classList.add("is-lifted");
    try {
      lenis?.scrollTo(to, {
        immediate: true,
        force: true,
        offset: -(window.innerHeight / 2 - to.offsetHeight / 2),
      });
    } catch {}

    if (reduced) {
      fill(to);
      busy = false;
      return;
    }

    const parts = [img, ...infoEls];
    gsap.to(parts, {
      x: -50 * dir,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: async () => {
        fill(to);
        try {
          await img.decode();
        } catch {}
        gsap.fromTo(
          parts,
          { x: 50 * dir, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.04,
            onComplete: () => (busy = false),
          }
        );
      },
    });
  };

  works.forEach((w) => {
    w.addEventListener("click", () => openWork(w));
    w.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openWork(w);
      }
    });
  });

  lb.querySelector(".lightbox__close").addEventListener("click", closeLb);
  lb.querySelector(".lightbox__prev").addEventListener("click", () => go(-1));
  lb.querySelector(".lightbox__next").addEventListener("click", () => go(1));

  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lightbox__img, .lightbox__info, .lightbox__nav, .lightbox__close")) return;
    closeLb();
  });

  window.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });
}