/* =========================================================
   Victor Domingos — interações e animações
   ========================================================= */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  document.documentElement.classList.remove("no-js");
  $("#year").textContent = new Date().getFullYear();

  // ---------- Distância Angola → São Leopoldo ----------
  const KM = (() => {
    const rad = (d) => (d * Math.PI) / 180;
    const [la1, lo1, la2, lo2] = [-8.84, 13.23, -29.76, -51.15].map(rad);
    const a = Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2;
    return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)));
  })();

  // ---------- Palavras da declaração ----------
  $$("[data-words]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(" ");
  });

  // ---------- Menu ----------
  const burger = $("#burger");
  const menu = $("#menu");
  let lenis = null;
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));

  // ---------- Copiar email ----------
  const toast = $("#toast");
  $("#copyEmail").addEventListener("click", async () => {
    const email = "victormuanguvodomingos@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      toast.textContent = "Email copiado";
    } catch (e) {
      toast.textContent = email;
    }
    toast.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  });

  const copyPrompt = $("#copyPrompt");
  if (copyPrompt) {
    copyPrompt.addEventListener("click", async () => {
      const text = $("#promptText").textContent.trim().replace(/\s+/g, " ");
      try {
        await navigator.clipboard.writeText(text);
        toast.textContent = "Prompt copiado — cole no Gemini";
      } catch (e) {
        toast.textContent = "Não foi possível copiar";
      }
      toast.classList.add("is-visible");
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toast.classList.remove("is-visible"), 2400);
    });
  }

  // ---------- Sem GSAP: mostra tudo ----------
  if (!window.gsap || !window.ScrollTrigger) {
    const sc = $("#showcase");
    sc && sc.classList.add("showcase--static");
    $("#loader").remove();
    window.cityIntro && window.cityIntro();
    window.journeyGlobe && window.journeyGlobe.setProgress(1);
    $("#km").textContent = KM.toLocaleString("pt-BR");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add("is-loading");

  // ---------- Rolagem suave ----------
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      setMenu(false);
      if (lenis) lenis.scrollTo(target, { duration: 1.8 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // ---------- Estados iniciais ----------
  gsap.set(".hero__title .line > span", { yPercent: 110 });
  gsap.set(".reveal-up", { y: 24, opacity: 0 });
  gsap.set("#nav", { opacity: 0 });
  gsap.set(".loader__line > span", { yPercent: 110 });

  // ---------- Abertura ----------
  const counter = { v: 0 };
  const loaderTl = gsap.timeline({ onComplete: startSite });
  loaderTl
    .to(".loader__line > span", { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.12 })
    .to(counter, {
      v: 100,
      duration: reduceMotion ? 0.2 : 1.4,
      ease: "power2.inOut",
      onUpdate: () => {
        $("#loaderCount").textContent = Math.round(counter.v);
        $("#loaderBar").style.transform = `scaleX(${counter.v / 100})`;
      },
    }, 0.2)
    .to(".loader__line > span", { yPercent: -110, duration: 0.8, ease: "expo.in", stagger: 0.06 }, "+=0.15")
    .to("#loader", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.3");

  function startSite() {
    $("#loader").remove();
    document.body.classList.remove("is-loading");
    lenis && lenis.start();
    window.cityIntro && window.cityIntro();

    gsap.timeline({ defaults: { ease: "expo.out" } })
      .to("#nav", { opacity: 1, duration: 1.2 }, 0)
      .to(".hero__title .line > span", { yPercent: 0, duration: 1.6, stagger: 0.12 }, 0.05)
      .to(".reveal-up", { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 }, 0.5);

    ScrollTrigger.refresh();
  }

  // ---------- Hero: saída com parallax ----------
  gsap.to(".hero__title", {
    yPercent: -35,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // ---------- Declaração palavra por palavra ----------
  gsap.fromTo(".about__statement .w",
    { opacity: 0.14 },
    {
      opacity: 1,
      stagger: 0.08,
      ease: "none",
      scrollTrigger: { trigger: ".about__statement", start: "top 80%", end: "bottom 45%", scrub: true },
    }
  );

  // ---------- Foto: cortina + parallax ----------
  // Retrato em arco: cortina, órbita desenhada, selo e nome
  const portraitTl = gsap.timeline({ scrollTrigger: { trigger: ".about__photo", start: "top 80%" } });
  portraitTl
    .fromTo(".portrait__reveal", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.6, ease: "expo.inOut" }, 0)
    .fromTo(".portrait__frame img", { scale: 1.12 }, { scale: 1, duration: 2, ease: "expo.out" }, 0.3)
    .to(".portrait__orbit-path", { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" }, 0.4)
    .fromTo(".portrait__badge", { scale: 0, rotate: -90, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.4, ease: "back.out(1.6)", transformOrigin: "50% 50%" }, 1)
    .from(".portrait__name", { y: 30, opacity: 0, duration: 1.2, ease: "expo.out" }, 0.9)
    .from(".portrait__line", { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, 1.1)
    .from(".portrait__role", { y: 14, opacity: 0, duration: 1, ease: "expo.out" }, 1.3);
  gsap.to(".portrait__orbit", {
    yPercent: -8,
    ease: "none",
    scrollTrigger: { trigger: ".about__photo", start: "top bottom", end: "bottom top", scrub: true },
  });

  // ---------- Elementos que surgem ----------
  $$(".fade").forEach((el) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  // Títulos em linhas (Atualmente e Contato)
  $$(".now__title, .contact__title, .google__title").forEach((title) => {
    gsap.from($$(".line > span", title), {
      yPercent: 110,
      duration: 1.5,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: { trigger: title, start: "top 85%" },
    });
  });

  $$(".section-title, .journey__title, .contact__mail").forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  // Marquee acompanha o scroll
  gsap.to(".marquee__track", {
    x: -200,
    ease: "none",
    scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true },
  });

  // Competências
  gsap.from(".skill", {
    y: 40,
    opacity: 0,
    duration: 1.1,
    ease: "expo.out",
    stagger: 0.08,
    scrollTrigger: { trigger: ".skill-list", start: "top 85%" },
  });

  // ---------- Contadores ----------
  $$("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const obj = { v: 0 };
    el.textContent = "0";
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => gsap.to(obj, { v: end, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(obj.v)) }),
    });
  });

  // ---------- Encontros do programa ----------
  gsap.from(".session", {
    y: 30,
    opacity: 0,
    duration: 1,
    ease: "expo.out",
    stagger: 0.07,
    scrollTrigger: { trigger: ".sessions__list", start: "top 85%" },
  });

  // ---------- Galeria em baralho (cards do Google) ----------
  const deck = $("#deck");
  if (deck) {
    let cards = $$(".deck__card", deck);
    const total = cards.length;
    const deckIndex = $("#deckIndex");
    let current = 0;
    let busy = false;

    function layoutDeck(animate) {
      cards.forEach((card, k) => {
        const props = {
          zIndex: total - k,
          x: k * 18,
          y: k * -14,
          rotate: k * 3.5,
          scale: 1 - k * 0.05,
          opacity: k > 3 ? 0 : 1,
        };
        animate ? gsap.to(card, { ...props, duration: 0.8, ease: "expo.out" }) : gsap.set(card, props);
      });
    }
    layoutDeck(false);

    gsap.from(cards, {
      y: 140,
      rotate: -8,
      opacity: 0,
      duration: 1.4,
      ease: "expo.out",
      stagger: 0.1,
      scrollTrigger: { trigger: deck, start: "top 85%" },
    });

    function nextCard() {
      if (busy) return;
      busy = true;
      const top = cards[0];
      gsap.to(top, {
        x: -window.innerWidth * 0.12 - 180,
        y: 40,
        rotate: -14,
        opacity: 0,
        duration: 0.55,
        ease: "power3.in",
        onComplete: () => {
          cards = cards.slice(1).concat(top);
          gsap.set(top, { x: 40, y: -60, rotate: 12, scale: 0.8 });
          layoutDeck(true);
          current = (current + 1) % total;
          deckIndex.textContent = String(current + 1).padStart(2, "0");
          setTimeout(() => (busy = false), 350);
        },
      });
    }
    deck.addEventListener("click", nextCard);
    deck.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); nextCard(); }
    });

    if (finePointer && !reduceMotion) {
      deck.addEventListener("pointermove", (e) => {
        const r = deck.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(deck, { rotateY: px * 14, rotateX: -py * 10, transformPerspective: 1100, duration: 0.6, ease: "power2.out" });
      });
      deck.addEventListener("pointerleave", () => gsap.to(deck, { rotateY: 0, rotateX: 0, duration: 1, ease: "elastic.out(1, 0.5)" }));
    }
  }

  // ---------- Certificações: galeria 3D guiada pela rolagem ----------
  const showcase = $("#showcase");
  const scCards = $$(".sc-card");
  const scTabs = $$(".showcase .tab");
  if (showcase && scCards.length) {
    const N = scCards.length;
    const scNum = $("#scNum"), scCat = $("#scCat"), scTitle = $("#scTitle");
    const scOrg = $("#scOrg"), scDate = $("#scDate"), scHours = $("#scHours");
    const scBar = $("#scBar"), scMeta = $("#scMeta");
    let shown = -1;

    function showInfo(i, animate) {
      if (i === shown) return;
      shown = i;
      const d = scCards[i].dataset;
      const fill = () => {
        scNum.textContent = String(i + 1).padStart(2, "0");
        scCat.innerHTML = (d.cat === "google" ? '<span class="g-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' : "") + d.catname;
        scTitle.textContent = d.title;
        scOrg.textContent = d.org;
        scDate.textContent = d.date;
        scHours.textContent = d.hours;
      };
      if (animate) {
        gsap.killTweensOf(scMeta);
        gsap.to(scMeta, {
          opacity: 0, y: -10, duration: 0.18, ease: "power2.in",
          onComplete: () => { fill(); gsap.fromTo(scMeta, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }); },
        });
      } else fill();
      scTabs.forEach((t) => t.classList.toggle("is-active", t.dataset.cat === d.cat));
    }

    // Posiciona cada certificado em profundidade conforme a posição da rolagem
    function place(pos) {
      scCards.forEach((card, i) => {
        const d = i - pos;
        if (d < -1.2 || d > 4.5) { card.style.visibility = "hidden"; return; }
        card.style.visibility = "visible";
        let z, y, x, rx, ry, o;
        if (d >= 0) {
          z = -d * 360; y = -d * 62; x = d * 84; rx = 0; ry = -6 - d * 2; o = Math.max(0, 1 - d * 0.22);
        } else {
          z = -d * 700; y = -d * 260; x = d * 60; rx = d * 18; ry = -6; o = Math.max(0, 1 + d * 1.5);
        }
        gsap.set(card, { xPercent: -50, yPercent: -50, x, y, z, rotateX: rx, rotateY: ry, opacity: o, zIndex: Math.round(1000 - d * 100) });
      });
      scBar.style.transform = `scaleX(${pos / (N - 1)})`;
      showInfo(Math.min(N - 1, Math.max(0, Math.round(pos))), true);
    }

    if (reduceMotion) {
      showcase.classList.add("showcase--static");
      showInfo(0, false);
    } else {
      showInfo(0, false);
      place(0);
      const perCard = window.innerWidth <= 820 ? 38 : 48;
      const st = ScrollTrigger.create({
        trigger: showcase,
        start: "top top",
        end: () => "+=" + (N - 1) * (window.innerHeight * perCard / 100),
        pin: ".showcase__pin",
        refreshPriority: 1,
        scrub: 0.6,
        invalidateOnRefresh: true,
        snap: { snapTo: 1 / (N - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: "power2.inOut" },
        onUpdate: (self) => place(self.progress * (N - 1)),
      });

      // Abas funcionam como capítulos: levam ao primeiro certificado da categoria
      scTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const i = parseInt(tab.dataset.jump, 10);
          const y = st.start + (st.end - st.start) * (i / (N - 1)) + 2;
          if (lenis) lenis.scrollTo(y, { duration: 1.4 });
          else window.scrollTo({ top: y, behavior: "smooth" });
        });
      });

      // Leve inclinação da cena com o mouse
      if (finePointer) {
        const scene = $("#scScene");
        scene.addEventListener("pointermove", (e) => {
          const r = scene.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(scene, { rotateY: px * 10, rotateX: -py * 8, duration: 0.8, ease: "power2.out" });
        });
        scene.addEventListener("pointerleave", () => gsap.to(scene, { rotateY: 0, rotateX: 0, duration: 1.2, ease: "power3.out" }));
      }
    }
  }

  // ---------- Seções fixadas (desktop e celular diferentes) ----------
  const mm = gsap.matchMedia();
  const km = $("#km");
  const steps = $$(".jstep");

  function setJourney(p) {
    window.journeyGlobe && window.journeyGlobe.setProgress(p);
    const arcP = Math.min(1, Math.max(0, (p - 0.12) / 0.7));
    km.textContent = Math.round(KM * arcP).toLocaleString("pt-BR");
    const idx = p > 0.55 ? 1 : 0;
    steps.forEach((s, i) => s.classList.toggle("is-active", i === idx));
  }

  mm.add("(min-width: 821px)", () => {
    // Trajetória horizontal
    const track = $("#pathTrack");
    const distance = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".path",
        start: "top top",
        end: () => "+=" + distance(),
        pin: ".path__pin",
        refreshPriority: 3,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set("#pathBar", { scaleX: self.progress }),
      },
    });

    // Jornada com o globo
    ScrollTrigger.create({
      trigger: ".journey",
      start: "top top",
      end: "+=160%",
      pin: ".journey__pin",
      refreshPriority: 2,
      scrub: true,
      onUpdate: (self) => setJourney(self.progress),
    });
  });

  mm.add("(max-width: 820px)", () => {
    $$(".stop").forEach((stop) => {
      gsap.from(stop, { y: 50, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: stop, start: "top 88%" } });
    });
    ScrollTrigger.create({
      trigger: ".journey__visual",
      start: "top 85%",
      end: "bottom 40%",
      scrub: true,
      onUpdate: (self) => setJourney(self.progress),
    });
  });

  // ---------- Navegação: esconder ao descer, link ativo ----------
  const nav = $("#nav");
  let lastY = 0;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (!menu.classList.contains("is-open")) nav.classList.toggle("is-hidden", y > lastY && y > 400);
    lastY = y;
  }, { passive: true });

  $$(".nav__links a").forEach((link) => {
    const sec = $(link.getAttribute("href"));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => link.classList.toggle("is-active", self.isActive),
    });
  });

  // Ordena os gatilhos pela posição na página (as seções fixadas acima empurram as de baixo)
  ScrollTrigger.sort();
  ScrollTrigger.refresh();

  // ---------- Efeitos de ponteiro (desktop) ----------
  if (finePointer && !reduceMotion) {
    // Cartões com inclinação 3D
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * 12, rotateX: -py * 10, transformPerspective: 1000, duration: 0.6, ease: "power2.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1.1, ease: "elastic.out(1, 0.5)" }));
    });

    // Botões magnéticos
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" }));
    });

    // Cursor
    const cursor = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    const label = $("#cursorLabel");
    const pos = { x: -100, y: -100 };
    const rp = { x: -100, y: -100 };
    window.addEventListener("pointermove", (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    });
    gsap.ticker.add(() => {
      rp.x += (pos.x - rp.x) * 0.15;
      rp.y += (pos.y - rp.y) * 0.15;
      ring.style.transform = `translate(${rp.x}px, ${rp.y}px)`;
    });
    document.addEventListener("pointerover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const interactive = e.target.closest("a, button, [data-tilt], .skill");
      if (labelled) label.textContent = labelled.dataset.cursor;
      cursor.classList.toggle("has-label", !!labelled && !interactive);
      cursor.classList.toggle("is-hover", !!interactive);
    });
  }
})();
