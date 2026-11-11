/* مؤسسة عرين الليث — cinematic interactions
   GSAP + ScrollTrigger + Lenis (loaded from CDN, deferred).
   Everything degrades gracefully: without GSAP or with reduced motion,
   all content is visible and every control still works. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const root = document.documentElement;
  const WA = '966550540152';

  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- Word splitting (Arabic-safe: words, never letters) ---------------- */
  const splitWords = (el, cls) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(w => cls === 'w'
      ? `<span class="w" aria-hidden="true"><span>${w}</span></span>`
      : `<span class="${cls}" aria-hidden="true">${w}</span>`).join(' ');
  };

  /* ---------------- Mobile menu ---------------- */
  const menuBtn = $('.menu-btn'), nav = $('#site-nav');
  let lenis = null;
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    $('.sr-only', menuBtn).textContent = open ? 'إغلاق القائمة' : 'فتح القائمة';
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
    matchMedia('(min-width: 1001px)').addEventListener('change', m => m.matches && setMenu(false));
  }

  /* ---------------- Anchor links (works with/without Lenis) ---------------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#' || id === '#main') return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    if (nav && nav.classList.contains('is-open')) setMenu(false);
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

  /* ---------------- Active nav ---------------- */
  const navLinks = $$('.nav a[href^="#"]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => a.getAttribute('href') === '#' + en.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const s = $(a.getAttribute('href')); s && io.observe(s); });

  /* ---------------- Header / progress / floating button ---------------- */
  const header = $('.site-header'), bar = $('.progress i'), waFloat = $('.wa-float');
  let lastY = 0;
  const onScroll = (y) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('is-scrolled', y > 30);
    if (!document.body.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > lastY && y > 400);
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (waFloat) waFloat.classList.toggle('is-visible', y > innerHeight * .8);
    lastY = y;
  };

  /* ---------------- Tabs ---------------- */
  $$('[data-tabs]').forEach(box => {
    const tabs = $$('[role="tab"]', box), ink = $('.tab-ink', box);
    const moveInk = t => { ink.style.setProperty('--w', t.offsetWidth + 'px'); ink.style.setProperty('--x', t.offsetLeft + 'px'); };
    const select = (t, focus) => {
      tabs.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      moveInk(t); if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const n = { ArrowLeft: tabs[(i + 1) % tabs.length], ArrowRight: tabs[(i - 1 + tabs.length) % tabs.length], Home: tabs[0], End: tabs[tabs.length - 1] }[e.key];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    const cur = () => tabs.find(t => t.getAttribute('aria-selected') === 'true');
    moveInk(cur());
    addEventListener('resize', () => moveInk(cur()), { passive: true });
    document.fonts && document.fonts.ready.then(() => moveInk(cur()));
  });

  /* ---------------- Flip cards ---------------- */
  $$('[data-card]').forEach(card => {
    const btn = $('.card-flip', card);
    btn.addEventListener('click', () => {
      const on = !card.classList.contains('is-flipped');
      card.classList.toggle('is-flipped', on);
      btn.setAttribute('aria-expanded', String(on));
      if (on) setTimeout(() => $('.card-back a', card).focus({ preventScroll: true }), 500);
    });
    $('.card-back', card).addEventListener('click', e => { if (!e.target.closest('a') && !finePointer) { card.classList.remove('is-flipped'); btn.setAttribute('aria-expanded', 'false'); } });
  });

  /* ---------------- Finder → WhatsApp ---------------- */
  const form = $('#finder'), msg = $('#finder-msg');
  if (form && msg) {
    const goals = { 'شراء': 'للشراء', 'إيجار': 'للإيجار' };
    const build = () => {
      const d = new FormData(form), type = d.get('type'), goal = d.get('goal');
      const area = String(d.get('area') || '').trim();
      const where = area ? `في ${area}، مكة المكرمة` : 'في مكة المكرمة';
      return goal === 'بيع' ? `أرغب في تسويق وبيع عقار أملكه (${type}) ${where}.` : `أبحث عن ${type} ${goals[goal]} ${where}.`;
    };
    form.addEventListener('change', () => { msg.textContent = build(); msg.classList.remove('flash'); void msg.offsetWidth; msg.classList.add('flash'); });
    $('input[name="area"]', form).addEventListener('input', () => { msg.textContent = build(); });
    form.addEventListener('submit', e => { e.preventDefault(); open(`https://wa.me/${WA}?text=${encodeURIComponent('السلام عليكم، ' + build())}`, '_blank', 'noopener'); });
  }

  /* ================= No-GSAP / reduced-motion path ================= */
  if (!hasGSAP || reduce) {
    root.classList.add('no-gsap');
    const l = $('.loader'); l && l.remove();
    addEventListener('scroll', () => onScroll(scrollY), { passive: true });
    onScroll(scrollY);
    return;
  }

  /* ================= Cinematic path ================= */
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1.2 });
    lenis.on('scroll', ({ scroll }) => { ScrollTrigger.update(); onScroll(scroll); });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  }
  onScroll(scrollY);

  // Split text
  $$('[data-split]').forEach(el => splitWords(el, 'w'));
  $$('[data-words]').forEach(el => splitWords(el, 'sw'));

  /* ---- Intro: loader → hero ---- */
  const heroWords = $$('.hero-title .w > span');
  const heroBits = $$('[data-hero]');
  gsap.set(heroWords, { yPercent: 110 });
  gsap.set(heroBits, { y: 30, autoAlpha: 0 });
  gsap.set('.hero-img', { scale: 1.25 });
  gsap.set('.site-header', { yPercent: -100 });
  if (lenis) lenis.stop();

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .to('.loader-bar i', { scaleX: 1, duration: .7, ease: 'power2.inOut' })
    .to('.loader-inner', { y: -30, autoAlpha: 0, duration: .45, ease: 'power2.in' })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=.1')
    .to('.hero-img', { scale: 1, duration: 2.4 }, '-=.8')
    .to(heroWords, { yPercent: 0, duration: 1.3, stagger: .07 }, '-=2.1')
    .to(heroBits, { y: 0, autoAlpha: 1, duration: 1.1, stagger: .12 }, '-=1.1')
    .to('.site-header', { yPercent: 0, duration: 1 }, '-=1.2')
    .add(() => { $('.loader')?.remove(); gsap.set('.site-header', { clearProps: 'transform' }); lenis && lenis.start(); });
  $('.loader').style.clipPath = 'inset(0 0 0 0)';

  /* ---- Hero parallax out ---- */
  gsap.to('.hero-img', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-content', { y: -120, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '25% top', end: '85% top', scrub: true } });

  /* ---- Marquee with scroll velocity ---- */
  const mq = gsap.fromTo('.marquee-track', { xPercent: -50 }, { xPercent: 0, duration: 38, ease: 'none', repeat: -1 });
  let vt;
  ScrollTrigger.create({
    onUpdate: self => {
      const v = Math.min(6, 1 + Math.abs(self.getVelocity()) / 350);
      gsap.to(mq, { timeScale: self.direction === -1 ? -v : v, duration: .25, overwrite: true });
      clearTimeout(vt); vt = setTimeout(() => gsap.to(mq, { timeScale: self.direction === -1 ? -1 : 1, duration: 1.2 }), 120);
    }
  });

  /* ---- Section headings: words rise ---- */
  $$('[data-split]:not(.hero-title)').forEach(h => {
    gsap.from($$('.w > span', h), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  /* ---- Statement: words light up with scroll ---- */
  $$('[data-words]').forEach(p => {
    gsap.fromTo($$('.sw', p), { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 45%', scrub: true } });
  });

  /* ---- Counters ---- */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
  gsap.from('.stats li', { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.stats', start: 'top 88%' } });

  /* ---- Services: pinned horizontal scroll (desktop) ---- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const track = $('.h-track');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: dist, ease: 'none',
      scrollTrigger: { trigger: '.services-pin', pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1 }
    });
    // keep pin order correct when this is created after later pins (e.g. on resize)
    ScrollTrigger.sort();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
  mm.add('(max-width: 760px)', () => {
    $$('.panel').forEach(p => gsap.from(p, { y: 60, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 88%' } }));
  });
  gsap.from('.panel-media', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut', stagger: .12, scrollTrigger: { trigger: '.services', start: 'top 70%' } });

  /* ---- Property cards ---- */
  gsap.from('.card', { y: 90, rotateX: -12, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .09, transformPerspective: 900, scrollTrigger: { trigger: '.cards', start: 'top 85%' } });

  /* ---- Off-plan: image expands while pinned ---- */
  const op = gsap.timeline({ scrollTrigger: { trigger: '.offplan-stage', start: 'top top', end: '+=110%', pin: true, scrub: 1, anticipatePin: 1 } });
  op.fromTo('.offplan-media', { clipPath: 'inset(22% 26% 22% 26% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' })
    .fromTo('.offplan-media img', { scale: 1.35 }, { scale: 1, ease: 'none' }, 0)
    .fromTo('.offplan-copy', { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'power2.out', duration: .45 }, .45);
  gsap.fromTo('.timeline', { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 80%', end: 'bottom 55%', scrub: true } });
  gsap.from('.timeline li', { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .15, scrollTrigger: { trigger: '.timeline', start: 'top 82%' } });

  /* ---- Ejar ---- */
  gsap.fromTo('.ejar-media img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.ejar-media', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.ejar-media', { clipPath: 'inset(0 0 100% 0)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.ejar-media', start: 'top 80%' } });
  gsap.from('.ejar-badge', { x: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: .6, scrollTrigger: { trigger: '.ejar-media', start: 'top 80%' } });
  gsap.from('.steps li', { y: 30, autoAlpha: 0, duration: .9, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.steps', start: 'top 88%' } });

  /* ---- Finder + contact ---- */
  gsap.from('.finder-form', { y: 70, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.finder-form', start: 'top 85%' } });
  gsap.from('.cta-orb', { scale: 0, rotate: -90, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.cta-orb', start: 'top 90%' } });
  gsap.from('.contact-list li', { y: 30, autoAlpha: 0, duration: .9, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.contact-list', start: 'top 92%' } });

  /* ---- Magnetic elements ---- */
  if (finePointer) {
    $$('.magnetic').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
      const k = el.classList.contains('cta-orb') ? .45 : .3;
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * k); yTo((e.clientY - r.top - r.height / 2) * k); });
      el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' }); });
    });

    /* ---- Custom cursor ---- */
    const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-ring em');
    const dx = gsap.quickTo(dot, 'x', { duration: .1 }), dy = gsap.quickTo(dot, 'y', { duration: .1 });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerover', e => {
      const drag = e.target.closest('.h-track') && innerWidth > 760;
      cur.classList.toggle('is-drag', !!drag);
      label.textContent = drag ? 'مرّر ↓' : '';
      cur.classList.toggle('is-link', !drag && !!e.target.closest('a, button, label, input'));
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
