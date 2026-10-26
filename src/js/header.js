export function initHeader(lenis) {
  const header = document.querySelector(".site-header");
  if (!header) return;

  lenis.on("scroll", ({ scroll, direction }) => {
    header.classList.toggle("is-scrolled", scroll > 40);
    header.classList.toggle("is-hidden", direction === 1 && scroll > 240);
  });
}