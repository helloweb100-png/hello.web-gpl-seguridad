/* ==========================================================================
   GRUPO LEÓN · GPL SEGURIDAD — Interacciones y animaciones
   Vanilla JS, sin dependencias obligatorias. Lenis (CDN) es opcional:
   si no carga, la página usa scroll nativo suave y todo sigue funcionando.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const WA_NUMBER = '524492113512';
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* modo privado */ } },
  };

  const header = $('.site-header');
  const progressBar = $('.scroll-progress span');
  let lenis = null;
  let menuOpen = false;

  /* ==========================================================
     SMOOTH SCROLL (Lenis opcional)
     ========================================================== */
  function initScroll() {
    if (window.Lenis && !reduced) {
      lenis = new window.Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      lenis.on('scroll', onScroll);
    } else {
      root.classList.add('native-smooth');
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
  }

  /* ==========================================================
     LOOP DE SCROLL (throttle con rAF)
     ========================================================== */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  const parallaxImgs = () => $$('[data-parallax-img]');
  const parallaxX = () => $$('[data-parallax-x]');
  const timeline = $('[data-timeline]');
  const heroBg = $('.hero__bg');

  function update() {
    ticking = false;
    const y = window.scrollY || root.scrollTop;
    const vh = innerHeight;
    const max = root.scrollHeight - vh;

    if (progressBar) progressBar.style.setProperty('--sp', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0);
    if (header) header.classList.toggle('is-scrolled', y > 30);

    if (reduced) return;

    if (heroBg && y < vh * 1.3) heroBg.style.transform = `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0)`;

    parallaxImgs().forEach((img) => {
      const box = (img.closest('.hex__in, .monitor__bg') || img.parentElement).getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      const d = (box.top + box.height / 2 - vh / 2) / vh;
      const strength = img.closest('.monitor__bg') ? 90 : 34;
      img.style.setProperty('--py', `${(d * -strength).toFixed(1)}px`);
    });

    parallaxX().forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const f = parseFloat(el.dataset.parallaxX) || 0;
      el.style.setProperty('--px', `${((r.top + r.height / 2 - vh / 2) * f).toFixed(1)}px`);
    });

    if (timeline) updateTimeline(vh);
  }

  function updateTimeline(vh) {
    const r = timeline.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const wide = matchMedia('(min-width: 1024px)').matches;
    const steps = $$('[data-step]', timeline);
    let p;
    if (wide) {
      p = clamp((vh * 0.88 - r.top) / (vh * 0.5), 0, 1);
      steps.forEach((s, i) => s.classList.toggle('is-on', p >= (i / (steps.length - 1)) * 0.92 + 0.04));
    } else {
      const line = vh * 0.62;
      p = clamp((line - r.top - 26) / Math.max(1, r.height - 52), 0, 1);
      steps.forEach((s) => s.classList.toggle('is-on', s.getBoundingClientRect().top + 27 < line));
    }
    timeline.style.setProperty('--tp', p.toFixed(4));
  }

  /* ==========================================================
     PRELOADER
     ========================================================== */
  function initPreloader() {
    const pre = $('#preloader');
    if (!pre || reduced) {
      if (pre) pre.remove();
      finishLoad();
      return;
    }

    root.classList.add('is-loading');
    if (lenis) lenis.stop();

    const bar = $('#pl-progress');
    const cnt = $('#pl-count');
    const status = $('#pl-status');
    const messages = [
      [0, 'Iniciando protocolos de seguridad'],
      [28, 'Verificando autorizaciones'],
      [58, 'Activando supervisión 24/7'],
      [88, 'Sistema listo'],
    ];
    const MIN = 2400;
    const HARD_CAP = 7500;
    const t0 = performance.now();
    let pageLoaded = document.readyState === 'complete';
    let fontsReady = !document.fonts || !document.fonts.ready;
    let p = 0;
    let finished = false;

    if (!pageLoaded) addEventListener('load', () => { pageLoaded = true; }, { once: true });
    if (!fontsReady) {
      document.fonts.ready.then(() => { fontsReady = true; });
      setTimeout(() => { fontsReady = true; }, 4500);
    }

    const finish = () => {
      if (finished) return;
      finished = true;
      bar.style.strokeDashoffset = 0;
      cnt.textContent = '100';
      status.textContent = messages[messages.length - 1][1];
      setTimeout(() => {
        pre.classList.add('is-done');
        setTimeout(finishLoad, 380);
        setTimeout(() => {
          pre.classList.add('is-gone');
          root.classList.remove('is-loading');
          if (lenis) lenis.start();
        }, 1200);
      }, 380);
    };

    const tick = (now) => {
      if (finished) return;
      const t = now - t0;
      const ready = pageLoaded && fontsReady;
      const timeP = clamp(t / MIN, 0, 1);
      const eased = 1 - Math.pow(1 - timeP, 2.2);
      const goal = Math.min(eased * 100, ready ? 100 : 92);
      p += (goal - p) * 0.14;
      if (goal - p < 0.15) p = goal;

      bar.style.strokeDashoffset = (100 - p).toFixed(2);
      cnt.textContent = String(Math.round(p)).padStart(3, '0');
      for (let i = messages.length - 1; i >= 0; i--) {
        if (p >= messages[i][0]) { if (status.textContent !== messages[i][1]) status.textContent = messages[i][1]; break; }
      }

      if ((ready && t >= MIN && p >= 99.4) || t > HARD_CAP) { finish(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* Se ejecuta cuando el preloader termina: entrada del hero y widgets */
  let loaded = false;
  function finishLoad() {
    if (loaded) return;
    loaded = true;
    document.body.classList.add('is-ready');
    $$('[data-hero-in]').forEach((el, i) => {
      el.style.setProperty('--d', i * 120);
      el.classList.add('is-in');
    });
    startRotator();
    startWaTip();
    update();
  }

  /* ==========================================================
     HERO · rotador de frases
     ========================================================== */
  let rotTimer = null;
  function initRotator() {
    $$('.rot-word').forEach((w) => {
      const text = w.textContent.trim();
      w.textContent = '';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = text;
      w.appendChild(sr);

      const wrap = document.createElement('span');
      wrap.setAttribute('aria-hidden', 'true');
      let i = 0;
      text.split(' ').forEach((word, idx, arr) => {
        const rw = document.createElement('span');
        rw.className = 'rw';
        Array.from(word).forEach((c) => {
          const ch = document.createElement('span');
          ch.className = 'ch';
          ch.style.setProperty('--i', i++);
          ch.textContent = c;
          rw.appendChild(ch);
        });
        wrap.appendChild(rw);
        if (idx < arr.length - 1) wrap.appendChild(document.createTextNode(' '));
      });
      w.appendChild(wrap);
    });
  }

  function startRotator() {
    const words = $$('.rot-word');
    if (words.length < 2 || reduced || rotTimer) return;
    let cur = 0;
    rotTimer = setInterval(() => {
      if (document.hidden) return;
      const prev = words[cur];
      cur = (cur + 1) % words.length;
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      words[cur].classList.add('is-active');
      setTimeout(() => prev.classList.remove('is-leaving'), 900);
    }, 3600);
  }

  /* ==========================================================
     HERO · canvas de partículas (red de nodos interactiva)
     ========================================================== */
  function initHeroCanvas() {
    const cv = $('#hero-canvas');
    const hero = $('.hero');
    if (!cv || !hero) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, raf = 0;
    let visible = true;
    let parts = [];
    const mouse = { x: -9999, y: -9999, on: false };
    const LINK = 135;

    const build = () => {
      const count = Math.round(clamp((w * h) / 16000, 26, 92));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        red: Math.random() < 0.22,
      }));
    };

    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduced) draw(false);
    };

    const draw = (move = true) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (move) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
          if (mouse.on) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
            if (d2 < 14400) {
              const d = Math.sqrt(d2) || 1, f = ((120 - d) / 120) * 0.7;
              p.x += (dx / d) * f; p.y += (dy / d) * f;
            }
          }
        }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const k = 1 - Math.sqrt(d2) / LINK;
            ctx.strokeStyle = (a.red || b.red) ? `rgba(255,59,69,${(k * 0.4).toFixed(3)})` : `rgba(255,255,255,${(k * 0.16).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (mouse.on) {
          const dx = a.x - mouse.x, dy = a.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 190 * 190) {
            const k = 1 - Math.sqrt(d2) / 190;
            ctx.strokeStyle = `rgba(255,59,69,${(k * 0.55).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      for (const p of parts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.red ? 'rgba(255,59,69,0.95)' : 'rgba(255,255,255,0.6)';
        if (p.red) { ctx.shadowColor = 'rgba(255,59,69,0.9)'; ctx.shadowBlur = 10; } else { ctx.shadowBlur = 0; }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(true);
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !reduced) raf = requestAnimationFrame(loop); };

    size();
    if (!reduced) start();

    if ('ResizeObserver' in window) {
      let t;
      new ResizeObserver(() => { clearTimeout(t); t = setTimeout(size, 150); }).observe(cv);
    } else {
      addEventListener('resize', size);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

    if (finePointer) {
      hero.addEventListener('pointermove', (e) => {
        const r = cv.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
      });
      hero.addEventListener('pointerleave', () => { mouse.on = false; });
    }
  }

  /* ==========================================================
     HERO · HUD con parallax 3D al mover el cursor
     ========================================================== */
  function initHud() {
    const hud = $('[data-hud]');
    const hero = $('.hero');
    if (!hud) return;
    $$('[data-depth]', hud).forEach((c) => c.style.setProperty('--depth', c.dataset.depth));
    if (!finePointer || reduced || !hero) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    const loop = () => {
      cx = lerp(cx, tx, 0.08); cy = lerp(cy, ty, 0.08);
      hud.style.setProperty('--hx', cx.toFixed(3));
      hud.style.setProperty('--hy', cy.toFixed(3));
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) requestAnimationFrame(loop);
      else running = false;
    };
    const start = () => { if (!running) { running = true; requestAnimationFrame(loop); } };

    hero.addEventListener('pointermove', (e) => {
      const r = hud.getBoundingClientRect();
      tx = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
      ty = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
      start();
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; start(); });
  }

  /* Texto de estado del chip del HUD */
  function initHudStatus() {
    const el = $('[data-feed-text]');
    if (!el || reduced) return;
    const msgs = ['Supervisión 24/7 · Activa', 'Rondines en curso', 'Monitoreo CCTV activo', 'Control de accesos · OK'];
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      el.classList.add('is-swap');
      setTimeout(() => { i = (i + 1) % msgs.length; el.textContent = msgs[i]; el.classList.remove('is-swap'); }, 350);
    }, 3200);
  }

  /* ==========================================================
     TÍTULOS · reveal por palabra
     ========================================================== */
  function splitTitles() {
    $$('[data-split]').forEach((el) => {
      let i = 0;
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span');
              w.className = 'w';
              const wi = document.createElement('span');
              wi.className = 'wi';
              wi.style.setProperty('--i', i++);
              wi.textContent = part;
              w.appendChild(wi);
              frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      };
      walk(el);
    });
  }

  /* ==========================================================
     REVEAL al hacer scroll
     ========================================================== */
  function initReveal() {
    $$('[data-reveal-stagger]').forEach((parent) => {
      $$(':scope > [data-reveal]', parent).forEach((child, i) => {
        if (!child.style.getPropertyValue('--d')) child.style.setProperty('--d', Math.min(i * 90, 600));
      });
    });

    const targets = $$('[data-reveal]:not([data-hero-in]), [data-split]');
    if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el) => io.observe(el));
  }

  /* ==========================================================
     CONTADORES
     ========================================================== */
  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const fmt = (el, n) => (el.dataset.prefix || '') + Math.round(n).toLocaleString('en-US');

    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const dur = 1900;
      const t0 = performance.now();
      const step = (t) => {
        const p = clamp((t - t0) / dur, 0, 1);
        const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = fmt(el, target * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (reduced || !('IntersectionObserver' in window)) return; // se queda el valor final del HTML
    els.forEach((el) => { el.textContent = fmt(el, 0); });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ==========================================================
     EFECTOS DE PUNTERO: spotlight, tilt, botones magnéticos
     ========================================================== */
  function initPointerFx() {
    if (!finePointer) return;

    document.addEventListener('pointermove', (e) => {
      const spot = e.target.closest && e.target.closest('.spot');
      if (!spot) return;
      const r = spot.getBoundingClientRect();
      spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
      spot.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });

    if (reduced) return;

    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.2;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  /* ==========================================================
     MENÚ MÓVIL + NAVEGACIÓN
     ========================================================== */
  function setMenu(open) {
    const toggle = $('.nav-toggle');
    const menu = $('#mobile-menu');
    if (!toggle || !menu) return;
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    root.classList.toggle('menu-open', open);
    if (lenis && !root.classList.contains('is-loading')) { open ? lenis.stop() : lenis.start(); }
  }

  function initNav() {
    const toggle = $('.nav-toggle');
    if (toggle) toggle.addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    addEventListener('resize', () => { if (menuOpen && innerWidth >= 1024) setMenu(false); });

    // Anclas con scroll suave (y preselección de servicio en el formulario)
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();

      if (a.dataset.service) {
        const sel = $('#f-service');
        if (sel) sel.value = a.dataset.service;
      }

      const wasOpen = menuOpen;
      if (wasOpen) setMenu(false);
      const go = () => {
        if (lenis) {
          if (id === '#inicio') lenis.scrollTo(0, { duration: 1.4 });
          else lenis.scrollTo(target, { offset: -(header ? header.offsetHeight - 4 : 70), duration: 1.4 });
        } else {
          target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }
        history.replaceState(null, '', id);
      };
      wasOpen ? setTimeout(go, 420) : go();
    });

    // Enlace activo según la sección visible
    const links = $$('[data-nav-link]');
    if (links.length && 'IntersectionObserver' in window) {
      const map = new Map();
      links.forEach((l) => { const s = document.getElementById(l.getAttribute('href').slice(1)); if (s) map.set(s, l); });
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((l) => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          const l = map.get(e.target);
          if (l) { l.classList.add('is-active'); l.setAttribute('aria-current', 'true'); }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      map.forEach((_, s) => io.observe(s));
    }
  }

  /* ==========================================================
     TABS DE SERVICIOS (accesibles con teclado)
     ========================================================== */
  function initTabs() {
    const wrap = $('[data-tabs]');
    if (!wrap) return;
    const btns = $$('.tabs__btn', wrap);
    const panels = $$('.panel', wrap);
    const ind = $('.tabs__indicator', wrap);

    const place = () => {
      const a = btns.find((b) => b.classList.contains('is-active'));
      if (ind && a) { ind.style.setProperty('--x', `${a.offsetLeft}px`); ind.style.setProperty('--w', `${a.offsetWidth}px`); }
    };

    const activate = (btn, focus) => {
      btns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => {
        const on = p.id === btn.getAttribute('aria-controls');
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
      place();
      if (focus) btn.focus();
    };

    btns.forEach((b, i) => {
      b.addEventListener('click', () => activate(b));
      b.addEventListener('keydown', (e) => {
        const k = e.key;
        let n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % btns.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + btns.length) % btns.length;
        else if (k === 'Home') n = 0;
        else if (k === 'End') n = btns.length - 1;
        if (n === null) return;
        e.preventDefault();
        activate(btns[n], true);
      });
    });

    place();
    addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }

  /* ==========================================================
     SUPERVISIÓN: dial + bitácora ilustrativa
     ========================================================== */
  function initMonitor() {
    const section = $('[data-dial-section]');
    if (!section) return;
    const list = $('[data-feed]', section);

    const events = [
      'Ronda perimetral completada',
      'Control de acceso verificado',
      'CCTV · cámaras en línea',
      'Relevo de turno confirmado',
      'Supervisor en sitio',
      'Revisión de alarmas · sin novedad',
      'Verificación de vehículos en caseta',
      'Reporte de turno enviado',
    ];
    let idx = 0;
    let clock = new Date(Date.now() - 10 * 60000);
    const fmt = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const add = () => {
      clock = new Date(clock.getTime() + (1 + Math.floor(Math.random() * 3)) * 60000);
      const li = document.createElement('li');
      const t = document.createElement('time');
      t.textContent = fmt(clock);
      const s = document.createElement('span');
      s.textContent = events[idx++ % events.length];
      li.append(t, s);
      list.prepend(li);
      while (list.children.length > 4) list.lastElementChild.remove();
    };
    if (list) for (let i = 0; i < 4; i++) add();

    let timer = null;
    if (!('IntersectionObserver' in window)) { section.classList.add('dial-on'); return; }
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        section.classList.add('dial-on');
        if (list && !timer && !reduced) timer = setInterval(() => { if (!document.hidden) add(); }, 2800);
      } else if (timer) {
        clearInterval(timer); timer = null;
      }
    }, { threshold: 0.25 }).observe(section);
  }

  /* ==========================================================
     VIDEO DE PRESENTACIÓN
     ========================================================== */
  function initVideo() {
    const fig = $('[data-video]');
    if (!fig) return;
    const v = $('video', fig);
    const play = $('.video__play', fig);
    const mute = $('.video__mute', fig);
    const useEl = $('use', mute);

    const icon = () => useEl.setAttribute('href', v.muted ? '#i-mute' : '#i-sound');

    play.addEventListener('click', () => {
      v.muted = false; icon();
      const p = v.play();
      if (p && p.catch) p.catch(() => { v.muted = true; icon(); v.play().catch(() => {}); });
    });
    v.addEventListener('play', () => { fig.classList.add('is-playing'); mute.hidden = false; });
    v.addEventListener('pause', () => { if (!v.ended) fig.classList.remove('is-playing'); });
    v.addEventListener('ended', () => { fig.classList.remove('is-playing'); mute.hidden = true; v.currentTime = 0; fig.style.setProperty('--vp', 0); });
    v.addEventListener('timeupdate', () => { if (v.duration) fig.style.setProperty('--vp', (v.currentTime / v.duration).toFixed(4)); });
    v.addEventListener('click', () => { v.paused ? v.play() : v.pause(); });
    mute.addEventListener('click', () => { v.muted = !v.muted; icon(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0.15 }).observe(fig);
    }
  }

  /* ==========================================================
     LIGHTBOX de documentos
     ========================================================== */
  function initLightbox() {
    const lb = $('#lightbox');
    if (!lb) return;
    const img = $('img', lb);
    const cap = $('figcaption', lb);
    const closeBtn = $('.lightbox__close', lb);
    let last = null;

    const open = (trigger) => {
      last = trigger;
      const thumb = $('img', trigger);
      img.src = trigger.dataset.lightbox;
      img.alt = thumb ? thumb.alt : '';
      cap.textContent = trigger.dataset.caption || '';
      lb.hidden = false;
      root.classList.add('menu-open');
      if (lenis) lenis.stop();
      requestAnimationFrame(() => lb.classList.add('is-open'));
      closeBtn.focus();
    };
    const close = () => {
      lb.classList.remove('is-open');
      root.classList.remove('menu-open');
      if (lenis) lenis.start();
      setTimeout(() => { lb.hidden = true; img.removeAttribute('src'); }, 400);
      if (last) last.focus();
    };

    $$('[data-lightbox]').forEach((b) => b.addEventListener('click', () => open(b)));
    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
    });
  }

  /* ==========================================================
     FAQ (acordeón accesible)
     ========================================================== */
  function initFaq() {
    const items = $$('.qa');
    items.forEach((qa, i) => {
      const btn = $('.qa__btn', qa);
      const set = (open) => { qa.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };
      btn.addEventListener('click', () => {
        const open = !qa.classList.contains('is-open');
        items.forEach((o) => { if (o !== qa) { o.classList.remove('is-open'); $('.qa__btn', o).setAttribute('aria-expanded', 'false'); } });
        set(open);
      });
      if (i === 0) set(true);
    });
  }

  /* ==========================================================
     FORMULARIO → WHATSAPP
     ========================================================== */
  function initForm() {
    const form = $('#contact-form');
    if (!form) return;
    const f = form.elements;
    const ok = $('.form__ok', form);

    const setErr = (input, msg) => {
      const field = input.closest('.field');
      field.classList.toggle('has-error', Boolean(msg));
      $('.field__error', field).textContent = msg || '';
      input.setAttribute('aria-invalid', String(Boolean(msg)));
    };
    ['nombre', 'telefono'].forEach((n) => f[n].addEventListener('input', () => setErr(f[n], '')));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = f.nombre.value.trim();
      const empresa = f.empresa.value.trim();
      const tel = f.telefono.value.trim();
      const servicio = f.servicio.value.trim();
      const mensaje = f.mensaje.value.trim();

      let valid = true;
      if (nombre.length < 2) { setErr(f.nombre, 'Escribe tu nombre para poder atenderte.'); valid = false; } else setErr(f.nombre, '');
      if (tel.replace(/\D/g, '').length < 10) { setErr(f.telefono, 'Escribe un teléfono de 10 dígitos.'); valid = false; } else setErr(f.telefono, '');
      if (!valid) { const bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }

      const lines = [
        `Hola, soy ${nombre}${empresa ? ` de ${empresa}` : ''}.`,
        'Quiero una cotización de seguridad privada.',
        `Servicio de interés: ${servicio || 'Aún no lo sé, necesito asesoría'}`,
        `Mi teléfono: ${tel}`,
      ];
      if (mensaje) lines.push(`Detalles: ${mensaje}`);

      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
      window.open(url, '_blank', 'noopener');
      if (ok) { ok.hidden = false; const a = $('a', ok); if (a) a.href = url; }
    });
  }

  /* ==========================================================
     BOTÓN FLOTANTE DE WHATSAPP
     ========================================================== */
  function startWaTip() {
    const wrap = $('[data-wa-float]');
    if (!wrap) return;
    const close = $('.wa-float__close', wrap);
    if (close) close.addEventListener('click', () => { wrap.classList.remove('is-tip'); store.set('gplTip', '1'); });
    if (store.get('gplTip')) return;
    setTimeout(() => {
      wrap.classList.add('is-tip');
      setTimeout(() => wrap.classList.remove('is-tip'), 9000);
    }, 7000);
  }

  /* ==========================================================
     INIT
     ========================================================== */
  function init() {
    const yr = $('#year');
    if (yr) yr.textContent = String(new Date().getFullYear());

    initScroll();
    splitTitles();
    initRotator();
    initReveal();
    initCounters();
    initPointerFx();
    initNav();
    initTabs();
    initMonitor();
    initVideo();
    initLightbox();
    initFaq();
    initForm();
    initHeroCanvas();
    initHud();
    initHudStatus();
    initPreloader();
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
