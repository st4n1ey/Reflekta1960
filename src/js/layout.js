const links = [
  { label: "Home", href: "/" },
  { label: "Gallery", href: "/gallery.html" },
  { label: "Merch", href: "/merch.html" },
  { label: "About", href: "/about.html" },
  { label: "Contact", href: "/contact.html" },
];

const here = location.pathname === "/index.html" ? "/" : location.pathname;

const star = `
  <svg class="site-logo__star" viewBox="0 0 40 40" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
      <path d="M20 2v36M2 20h36M7.5 7.5l25 25M32.5 7.5l-25 25" />
      <path d="M20 9v22M9 20h22" opacity=".6" />
    </g>
  </svg>`;

export function renderLayout() {
  const header = document.querySelector("#site-header");
  const footer = document.querySelector("#site-footer");

  if (header) {
    header.outerHTML = `
      <header class="site-header">
        <a href="/" class="site-logo">${star}<span>Reflekta 1960</span></a>
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
        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <a href="/" class="site-logo">${star}<span>Reflekta 1960</span></a>
            <p>Art and merch, made to be looked at twice.</p>
          </div>

          <nav class="site-footer__col" aria-label="Explore">
            <h4>Explore</h4>
            <div class="site-footer__links">
              ${links.map((l) => `<a href="${l.href}">${l.label}</a>`).join("")}
            </div>
          </nav>

          <div class="site-footer__col">
            <h4>Get in touch</h4>
            <div class="site-footer__links">
              <a href="/contact.html">Contact</a>
              <a href="#">Instagram</a>
              <a href="#">WhatsApp</a>
            </div>
          </div>
        </div>

        <div class="site-footer__bottom">
          <span>&copy; ${new Date().getFullYear()} Reflekta 1960</span>
          <span>Timeless art / Modern soul.</span>
        </div>
      </footer>`;
  }
}