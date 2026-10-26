import "../css/tokens.css";
import "../css/base.css";
import "../css/layout.css";
import "../css/effects.css";
import "../css/home.css";
import "../css/gallery.css";
import "../css/merch.css";
import "../css/contact.css";
import "../css/about.css";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { renderLayout } from "./layout.js";
import { initSmoothScroll } from "./smooth-scroll.js";
import { initGrain } from "./grain.js";
import { initCursor } from "./cursor.js";
import { initTransitions } from "./transitions.js";
import { initHome } from "./home.js";
import { initGallery } from "./gallery.js";
import { initMerch } from "./merch.js";
import { initContact } from "./contact.js";
import { initAbout } from "./about.js";
import { initHeader } from "./header.js";

gsap.registerPlugin(SplitText);

renderLayout();
const lenis = initSmoothScroll();
initHeader(lenis);
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

  gsap.from(".eyebrow, .hero__sub, .btn-oval, .hero__foot", {
    opacity: 0,
    y: 16,
    duration: 1,
    delay: 0.6,
    stagger: 0.12,
  });
}

// Wait for fonts and the page-transition reveal before starting animations
Promise.all([document.fonts.ready, transitionReady]).then(() => {
  heroIntro();
  initHome();
  initGallery(lenis);
  initMerch();
  initContact();
  initAbout();
});