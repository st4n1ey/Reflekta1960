import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);

/*
  FILL THESE IN. Leave any of them empty to hide that option.
  whatsapp: digits only, with country code, e.g. "15551234567"
  email:    e.g. "hello@yourdomain.com"
  instagram: handle without the @, e.g. "reflekta1960"
*/
const CONTACT = {
  whatsapp: "",
  email: "",
  instagram: "",
};

const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

export function initContact() {
  const form = document.querySelector(".letter__form");
  if (!form) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  plane(reduced);
  tickets();
  const state = prefill(form);
  letter(form, state, reduced);
  reveal(reduced);
}

// A paper plane flies along a dashed trail, forever
function plane(reduced) {
  const g = document.querySelector(".plane");
  if (!g || !document.querySelector("#flight-path")) return;

  if (reduced) {
    g.style.display = "none";
    return;
  }

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
  tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0)
    .to(
      g,
      {
        motionPath: {
          path: "#flight-path",
          align: "#flight-path",
          autoRotate: true,
          alignOrigin: [0.5, 0.5],
        },
        duration: 12,
        ease: "none",
      },
      0
    )
    .to(g, { opacity: 0, duration: 0.8 }, 11.2);

  ScrollTrigger.create({
    trigger: ".hero--contact",
    start: "top bottom",
    end: "bottom top",
    onToggle: (s) => tl.paused(!s.isActive),
  });
}

// Ticket-stub links for the channels you have set up
function tickets() {
  const box = document.querySelector(".tickets");
  if (!box) return;

  const list = [];
  const digits = (CONTACT.whatsapp || "").replace(/\D/g, "");
  const handle = (CONTACT.instagram || "").replace(/^@/, "");

  if (digits) list.push({ label: "WhatsApp", value: "Message us", href: `https://wa.me/${digits}` });
  if (CONTACT.email) list.push({ label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` });
  if (handle) list.push({ label: "Instagram", value: `@${handle}`, href: `https://instagram.com/${handle}` });

  if (!list.length) {
    if (isLocal) {
      box.innerHTML =
        '<div class="ticket ticket--empty">Add your WhatsApp, email and Instagram at the top of src/js/contact.js</div>';
    } else {
      box.hidden = true;
    }
    return;
  }

  box.innerHTML = list
    .map(
      (t) =>
        `<a class="ticket" href="${t.href}" target="_blank" rel="noopener" data-cursor="Open"><span><b>${t.label}</b><i>${t.value}</i></span><em>&nearr;</em></a>`
    )
    .join("");
}

// Order / enquiry links from Merch and the gallery arrive with ?type=&item=&size=
function prefill(form) {
  const q = new URLSearchParams(location.search);
  const state = {
    item: q.get("item") || "",
    size: q.get("size") || "",
    type: q.get("type") || "",
  };

  const topic = state.type === "art" ? "Art" : state.type === "merch" || state.size ? "Merch" : "";
  if (topic) {
    const radio = form.querySelector(`input[name="topic"][value="${topic}"]`);
    if (radio) radio.checked = true;
  }

  const msg = form.elements.message;
  if (state.item && !msg.value) {
    msg.value =
      topic === "Art"
        ? `I'm interested in "${state.item}". Is it still available?`
        : `I'd like to order the ${state.item}${state.size ? ` in size ${state.size}` : ""}.`;
  }

  renderTags(form, state);
  return state;
}

function renderTags(form, state) {
  const box = form.querySelector(".letter__tags");
  box.innerHTML = "";

  const add = (label, key) => {
    const chip = document.createElement("span");
    chip.className = "tagchip";
    const text = document.createElement("span");
    text.textContent = label;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "\u00d7";
    btn.setAttribute("aria-label", `Remove ${label}`);
    btn.addEventListener("click", () => {
      state[key] = "";
      chip.remove();
    });
    chip.append(text, btn);
    box.append(chip);
  };

  if (state.item) add(`Item: ${state.item}`, "item");
  if (state.size) add(`Size: ${state.size}`, "size");
}

function buildMessage(d) {
  const lines = ["Hi Reflekta 1960,", "", d.message, "", `\u2014 ${d.name}`, `Reply to: ${d.reply}`];
  const meta = [];
  if (d.topic) meta.push(`About: ${d.topic}`);
  if (d.item) meta.push(`Item: ${d.item}`);
  if (d.size) meta.push(`Size: ${d.size}`);
  if (meta.length) lines.push("", meta.join(" \u00b7 "));
  return lines.join("\n");
}

function letter(form, state, reduced) {
  const card = form.closest(".letter__card");
  const sent = card.querySelector(".sent");
  const fields = gsap.utils.toArray(".field", form);
  const required = [form.elements.name, form.elements.reply, form.elements.message];

  form.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("is-invalid"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    fields.forEach((f) => f.classList.remove("is-invalid"));

    let first = null;
    required.forEach((inp) => {
      const tooShort = inp === form.elements.message && inp.value.trim().length < 5;
      if (!inp.value.trim() || tooShort) {
        const f = inp.closest(".field");
        f.classList.add("is-invalid");
        if (!first) first = inp;
        if (!reduced) gsap.fromTo(f, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.35)" });
      }
    });
    if (first) {
      first.focus();
      return;
    }

    const checked = form.querySelector('input[name="topic"]:checked');
    const data = {
      name: form.elements.name.value.trim(),
      reply: form.elements.reply.value.trim(),
      message: form.elements.message.value.trim(),
      topic: checked ? checked.value : "",
      item: state.item,
      size: state.size,
    };
    seal(card, form, sent, data, reduced);
  });

  sent.querySelector(".again").addEventListener("click", () => {
    sent.classList.remove("is-on");
    card.style.minHeight = "";
    form.style.display = "";
    gsap.set(form, { clearProps: "opacity,transform" });
    gsap.set(sent.querySelectorAll(".envelope, .envelope *, .sent__panel > *"), { clearProps: "all" });
    form.reset();
    state.item = "";
    state.size = "";
    renderTags(form, state);
    form.elements.name.focus();
  });
}

function fillPanel(sent, data) {
  const msg = buildMessage(data);
  const subject = data.item ? `Enquiry: ${data.item}` : "Hello from the website";
  const digits = (CONTACT.whatsapp || "").replace(/\D/g, "");
  const actions = sent.querySelector(".sent__actions");
  const hint = sent.querySelector(".sent__hint");
  actions.innerHTML = "";
  hint.hidden = true;

  if (digits) {
    actions.insertAdjacentHTML(
      "beforeend",
      `<a class="send" href="https://wa.me/${digits}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Send on WhatsApp <i>&nearr;</i></a>`
    );
  }
  if (CONTACT.email) {
    actions.insertAdjacentHTML(
      "beforeend",
      `<a class="send" href="mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}">Send by email <i>&nearr;</i></a>`
    );
  }

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "send send--ghost";
  copy.textContent = "Copy message";
  copy.addEventListener("click", () => {
    navigator.clipboard?.writeText(msg).then(() => (copy.textContent = "Copied \u2713"));
  });
  actions.append(copy);

  if (!digits && !CONTACT.email && isLocal) {
    hint.textContent = "Developer note: add your WhatsApp number or email in src/js/contact.js so the send buttons appear.";
    hint.hidden = false;
  }
}

// The letter folds into an envelope, gets stamped and postmarked, and flies away
function seal(card, form, sent, data, reduced) {
  const env = sent.querySelector(".envelope");
  const flap = sent.querySelector(".envelope__flap");
  const stampEl = sent.querySelector(".envelope .stamp");
  const pm = sent.querySelector(".envelope__postmark");
  const panel = gsap.utils.toArray(".sent__panel > *", sent);

  card.style.minHeight = card.offsetHeight + "px";
  fillPanel(sent, data);

  if (reduced) {
    form.style.display = "none";
    sent.classList.add("is-on");
    env.style.display = "none";
    return;
  }

  const tl = gsap.timeline();
  tl.to(form, {
    opacity: 0,
    y: 16,
    duration: 0.4,
    ease: "power2.in",
    onComplete: () => {
      form.style.display = "none";
      sent.classList.add("is-on");
    },
  })
    .set(panel, { opacity: 0, y: 20 })
    .set([stampEl, pm], { opacity: 0 })
    .fromTo(env, { y: 60, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" })
    .fromTo(flap, { rotationX: 180 }, { rotationX: 0, duration: 0.8, ease: "power2.inOut" }, "+=0.1")
    .fromTo(
      stampEl,
      { scale: 3, opacity: 0, rotation: -24 },
      { scale: 1, opacity: 1, rotation: -6, duration: 0.45, ease: "back.out(1.6)" },
      "+=0.05"
    )
    .fromTo(
      pm,
      { scale: 1.5, opacity: 0, rotation: 20 },
      { scale: 1, opacity: 0.85, rotation: -12, duration: 0.5, ease: "power2.out" },
      "-=0.1"
    )
    .to(env, { x: "120%", y: "-30%", rotation: 10, opacity: 0, duration: 0.9, ease: "power3.in" }, "+=0.6")
    .to(panel, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }, "-=0.3");
}

function reveal(reduced) {
  if (reduced) return;

  const card = document.querySelector(".letter__card");
  const aside = document.querySelectorAll(".letter__aside > *");

  gsap.from(card, {
    opacity: 0,
    y: 60,
    duration: 1.1,
    ease: "power3.out",
    clearProps: "opacity,transform",
    scrollTrigger: { trigger: card, start: "top 88%", once: true },
  });

  gsap.from(aside, {
    opacity: 0,
    y: 28,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.1,
    clearProps: "opacity,transform",
    scrollTrigger: { trigger: ".letter__aside", start: "top 85%", once: true },
  });

  const dear = document.querySelector(".letter__dear");
  if (dear) {
    const split = new SplitText(dear, { type: "chars" });
    gsap.from(split.chars, {
      opacity: 0,
      y: 8,
      stagger: 0.06,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: { trigger: dear, start: "top 92%", once: true },
    });
  }
}