(() => {
  // Intro animations
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));

  // Scroll reveals
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.1 });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // Nav pills get a denser backdrop once past the hero
  const navEl = document.querySelector('[data-nav]');
  const onNavScroll = () => navEl.classList.toggle('is-scrolled', window.scrollY > 40 || !document.querySelector('[data-nav-panel]').hidden);
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  // Nav stays visible; highlight the section currently in view
  const sectionIds = ['top', 'about', 'education', 'experience', 'skills', 'blog', 'contact'];
  const navLinks = [...document.querySelectorAll('.nav__links a, .nav__panel a')];
  const setActive = (id) => navLinks.forEach((a) => {
    if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const pickActive = () => {
    const line = window.innerHeight * 0.35;
    let current = sections[0].id;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s.id; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1].id;
    setActive(current);
  };
  let navTick = false;
  window.addEventListener('scroll', () => {
    if (!navTick) { navTick = true; requestAnimationFrame(() => { pickActive(); navTick = false; }); }
  }, { passive: true });
  pickActive();

  // Mobile menu
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');
  if (toggle && panel) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.hidden = !open;
      document.querySelector('[data-nav]').classList.toggle('is-scrolled', open || window.scrollY > 40);
    };
    toggle.addEventListener('click', () => setOpen(panel.hidden));
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // Cursor spotlight on glass cards (pointer devices only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  // Journey: scroll-driven progress line + light up passed stops
  const road = document.querySelector('[data-road]');
  if (road) {
    const fill = road.querySelector('[data-road-fill]');
    const stops = [...road.querySelectorAll('.stop')];
    let ticking = false;
    const update = () => {
      const r = road.getBoundingClientRect();
      const anchor = window.innerHeight * 0.6;              // the "pen" sits 60% down the viewport
      const p = Math.min(Math.max((anchor - r.top) / r.height, 0), 1);
      fill.style.setProperty('--fill', `${(p * 100).toFixed(2)}%`);
      stops.forEach((s) => {
        const n = s.querySelector('.stop__node').getBoundingClientRect();
        s.classList.toggle('is-lit', n.top + n.height / 2 < anchor);
      });
      ticking = false;
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    update();
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero parallax: layers drift at different depths with the mouse, and on scroll
  const hero = document.querySelector('[data-hero]');
  if (hero && !reduceMotion) {
    const layers = [...hero.querySelectorAll('[data-depth]')];
    let mx = 0, my = 0, sy = 0, raf = 0;
    const apply = () => {
      raf = 0;
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth);
        const scrollShift = sy * (d / 60);
        l.style.setProperty('--dx', `${(mx * d).toFixed(2)}px`);
        l.style.setProperty('--dy', `${(my * d * 0.6 + scrollShift).toFixed(2)}px`);
      });
      // 3D: the photo turns toward the pointer, the text layer floats in front
      hero.style.setProperty('--ry', `${(mx * 7).toFixed(2)}deg`);
      hero.style.setProperty('--rx', `${(-my * 5).toFixed(2)}deg`);
      hero.style.setProperty('--sy', `${Math.min(sy / window.innerHeight, 1).toFixed(3)}`);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    if (finePointer) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
        queue();
      });
      hero.addEventListener('pointerleave', () => { mx = 0; my = 0; queue(); });
    }
    window.addEventListener('scroll', () => {
      if (window.scrollY > window.innerHeight * 1.2) return;
      sy = window.scrollY; queue();
    }, { passive: true });
  }

  // 3D tilt + light sheen on cards (mouse/trackpad only)
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.stop__card, .post-card, .stat, .pillar, .skill').forEach((el) => {
      const strength = el.classList.contains('stat') || el.classList.contains('pillar') ? 6 : el.classList.contains('skill') ? 8 : 9;
      el.classList.add('tilt');
      let raf = 0, px = .5, py = .5;
      const paint = () => {
        raf = 0;
        el.style.setProperty('--try', `${((px - .5) * strength * 1.4).toFixed(2)}deg`);
        el.style.setProperty('--trx', `${((.5 - py) * strength).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      };
      el.addEventListener('pointerenter', () => el.classList.add('is-tilting'));
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height;
        if (!raf) raf = requestAnimationFrame(paint);
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting'); px = py = .5; paint();
      });
    });
  }

  // Custom cursor: a dot plus a trailing ring that grows over interactive elements
  const cursor = document.querySelector('.cursor');
  if (cursor && finePointer && !reduceMotion) {
    document.documentElement.classList.add('has-cursor');
    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    let x = -100, y = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (x > 0 || y > 0) cursor.classList.add('is-live');
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, [data-copy], .stop__card, .cert-row, .post-card'));
    }, { passive: true });
    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-live'));
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  // Blog: render post cards from posts.js, open stories in a reader
  const postsEl = document.querySelector('[data-posts]');
  const reader = document.querySelector('[data-reader]');
  const readerBody = document.querySelector('[data-reader-body]');
  const POSTS = (window.POSTS || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_) { return d; } };
  const minutes = (p) => Math.max(1, Math.round((p.body || []).join(' ').split(/\s+/).length / 200));

  if (postsEl) {
    if (!POSTS.length) {
      postsEl.innerHTML = `
        <div class="posts__empty reveal is-in">
          <span class="posts__empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg></span>
          <div>
            <p class="posts__empty-title">First stories coming soon</p>
            <p class="posts__empty-text">Notes from the events and workshops I organise will appear here.</p>
          </div>
        </div>`;
    } else {
      postsEl.classList.toggle('posts--three', POSTS.length === 3);
      postsEl.innerHTML = POSTS.map((p, i) => `
        <article class="post-card${POSTS.length === 1 ? ' post-card--solo' : i === 0 ? ' post-card--featured' : ''} reveal is-in">
          <a class="post-card__link" href="#post-${esc(p.slug)}" aria-label="Read: ${esc(p.title)}">
            ${p.cover ? `<span class="post-card__img"><img src="${esc(p.cover)}" alt="${esc(p.coverAlt || '')}" loading="lazy"></span>` : `<span class="post-card__img post-card__img--type stripes" aria-hidden="true"><span class="post-card__mark">&ldquo;</span><span class="post-card__quote">${esc(p.coverQuote || p.title)}</span></span>`}
            <span class="post-card__meta"><span class="post-card__cat">${esc(p.category || 'Story')}</span><time datetime="${esc(p.date)}">${esc(fmtDate(p.date))}</time></span>
            <h3 class="post-card__title">${esc(p.title)}</h3>
            ${p.excerpt ? `<p class="post-card__excerpt">${esc(p.excerpt)}</p>` : ''}
            <span class="post-card__more">Read story <span aria-hidden="true">&rarr;</span></span>
          </a>
        </article>`).join('');
    }
  }

  let lastFocus = null;
  const openPost = (slug) => {
    const p = POSTS.find((x) => x.slug === slug);
    if (!p || !reader) return false;
    readerBody.innerHTML = `
      <p class="reader__meta"><span>${esc(p.category || 'Story')}</span><time datetime="${esc(p.date)}">${esc(fmtDate(p.date))}</time><span>${minutes(p)} min read</span></p>
      <h2 class="reader__title" id="reader-title">${esc(p.title)}</h2>
      ${p.cover ? `<figure class="reader__figure"><img class="reader__cover" src="${esc(p.cover)}" alt="${esc(p.coverAlt || '')}">${p.coverCredit ? `<figcaption>${esc(p.coverCredit)}</figcaption>` : ''}</figure>` : ''}
      ${(p.body || []).map((para) => para.startsWith('## ') ? `<h3>${esc(para.slice(3))}</h3>` : para.startsWith('> ') ? `<blockquote>${esc(para.slice(2))}</blockquote>` : `<p>${esc(para)}</p>`).join('')}
      <p class="reader__sign">&mdash; Nitesh Kumar Singh</p>`;
    lastFocus = document.activeElement;
    reader.hidden = false;
    document.documentElement.classList.add('is-reading');
    reader.scrollTop = 0;
    reader.querySelector('[data-reader-close]').focus({ preventScroll: true });
    return true;
  };
  const closePost = (fromHash) => {
    if (!reader || reader.hidden) return;
    reader.hidden = true;
    document.documentElement.classList.remove('is-reading');
    if (!fromHash && location.hash.startsWith('#post-')) {
      try { history.replaceState(null, '', '#blog'); } catch (_) { location.hash = 'blog'; }
    }
    if (lastFocus) lastFocus.focus();
  };
  const route = () => {
    const h = location.hash.slice(1);
    if (h.startsWith('post-')) { if (!openPost(h.slice(5))) closePost(true); }
    else closePost(true);
  };
  if (reader) {
    reader.querySelector('[data-reader-close]').addEventListener('click', () => closePost(false));
    reader.addEventListener('click', (e) => { if (e.target === reader) closePost(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePost(false); });
    window.addEventListener('hashchange', route);
    route();
  }

  // Copy buttons (contact details)
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('span');
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (_) {
        try {
          const t = Object.assign(document.createElement('textarea'), { value: text });
          t.style.position = 'fixed'; t.style.opacity = '0';
          document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove();
        } catch (_) { ok = false; }
      }
      btn.classList.toggle('is-done', ok);
      if (label) label.textContent = ok ? 'Copied' : 'Select & copy';
      setTimeout(() => { btn.classList.remove('is-done'); if (label) label.textContent = 'Copy'; }, 1800);
    });
  });

  // Footer year
  const yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();

  // Local time in Bharatpur (Asia/Kathmandu, UTC+05:45)
  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }
})();
