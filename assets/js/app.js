/* ══ the fixer LAB — motion layer ══ */
(function () {
  'use strict';
  var root = document.documentElement;
  /* Η κίνηση είναι ΤΟ ΠΡΟΪΟΝ αυτής της σελίδας, οπότε παίζει από προεπιλογή ακόμη
     κι αν το λειτουργικό έχει Reduce Motion (iOS: Ρυθμίσεις → Προσβασιμότητα →
     Κίνηση). Όποιος τη θέλει σβηστή την κλείνει από το κουμπί «Κίνηση» και η
     επιλογή του θυμάται στο localStorage. */
  var motionOn = true;

  var toggles = Array.prototype.slice.call(document.querySelectorAll('.motion-toggle'));
  function setMotion(on) {
    motionOn = on;
    root.classList.toggle('no-motion', !on);
    toggles.forEach(function (t) { t.setAttribute('aria-pressed', String(on)); });
    window.dispatchEvent(new CustomEvent('tf:motion', { detail: on }));
    try { localStorage.setItem('ist_motion', on ? '1' : '0'); } catch (e) {}
  }
  try {
    var saved = localStorage.getItem('ist_motion');
    if (saved !== null) motionOn = saved === '1';
  } catch (e) {}
  root.classList.toggle('no-motion', !motionOn);
  toggles.forEach(function (t) { t.setAttribute('aria-pressed', String(motionOn)); });
  window.dispatchEvent(new CustomEvent('tf:motion', { detail: motionOn }));
  toggles.forEach(function (t) { t.addEventListener('click', function () { setMotion(!motionOn); }); });

  /* ── timecode σε μορφή HH:MM:SS:FF στα 24fps ── */
  function tc(sec) {
    var f = Math.floor(sec * 24), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(Math.floor(f / 86400) % 24) + ':' + p(Math.floor(f / 1440) % 60) + ':' +
           p(Math.floor(f / 24) % 60) + ':' + p(f % 24);
  }

  /* ── title card: μετράει, μετά ανοίγει σαν κουρτίνα ── */
  (function () {
    var el = document.getElementById('loader'), bar = document.getElementById('loaderBar'),
        num = document.getElementById('loaderNum');
    if (!el) return;
    var opened = false;
    function open_() {
      if (opened) return;
      opened = true;
      el.classList.add('done');
      document.body.classList.remove('lock');
      heroIn();
      setTimeout(function () { el.classList.add('gone'); }, 1300);
    }
    var seen = false;
    try { seen = sessionStorage.getItem('ist_seen') === '1'; } catch (e) {}
    if (seen || !motionOn) { el.classList.add('done', 'gone'); document.body.classList.remove('lock'); heroIn(); return; }

    document.body.classList.add('lock');
    var t0 = performance.now(), DUR = 1450;
    /* Το requestAnimationFrame παγώνει σε κρυφή καρτέλα — δίχτυ ασφαλείας
       ώστε η κουρτίνα να ανοίγει πάντα, ακόμη κι αν χαθούν τα frames. */
    setTimeout(open_, DUR + 1400);
    (function step(t) {
      var p = Math.min(1, (t - t0) / DUR);
      bar.style.width = (p * 100) + '%';
      num.textContent = tc((t - t0) / 1000);
      if (p < 1) return requestAnimationFrame(step);
      try { sessionStorage.setItem('ist_seen', '1'); } catch (e) {}
      setTimeout(open_, 260);
    })(t0);
  })();

  /* ── το timecode του viewfinder τρέχει όσο βλέπεις τη σελίδα ── */
  (function () {
    var els = document.querySelectorAll('[data-tc]');
    if (!els.length) return;
    var t0 = performance.now();
    (function tick() {
      setTimeout(tick, 42);
      if (!motionOn || document.hidden) return;
      var v = tc((performance.now() - t0) / 1000);
      for (var i = 0; i < els.length; i++) els[i].textContent = v;
    })();
  })();

  /* ── fade to black ανάμεσα στις σελίδες ── */
  (function () {
    if (!document.getElementById('fade')) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a || !motionOn) return;
      if (a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var href = a.getAttribute('href') || '';
      if (!href || href[0] === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function () { location.href = url.href; }, 420);
    });
    window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });
  })();

  /* ── hero headline: per-word 3D reveal ── */
  function heroIn() {
    var ws = document.querySelectorAll('.hero__title .w');
    Array.prototype.forEach.call(ws, function (w, i) {
      setTimeout(function () { w.classList.add('in'); }, motionOn ? 90 + i * 85 : 0);
    });
    var rev = document.querySelectorAll('.hero .reveal');
    Array.prototype.forEach.call(rev, function (r, i) {
      setTimeout(function () { r.classList.add('in'); }, motionOn ? 380 + i * 110 : 0);
    });
  }

  /* ── scroll reveals ── */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    if (el.closest('.hero')) return;
    if (io) io.observe(el); else el.classList.add('in');
  });

  /* ── nav: shrink, hide on scroll down, progress bar ── */
  (function () {
    var nav = document.getElementById('nav'), prog = document.getElementById('navProgress'), last = 0;
    function onScroll() {
      var y = window.scrollY || 0;
      nav.classList.toggle('scrolled', y > 40);
      nav.classList.toggle('hide', y > 420 && y > last && !nav.contains(document.activeElement));
      last = y;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ── custom cursor ── */
  (function () {
    var c = document.getElementById('cursor');
    if (!c || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var dot = c.querySelector('.cursor__dot'), ring = c.querySelector('.cursor__ring'), lab = c.querySelector('.cursor__label');
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    document.addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() {
      requestAnimationFrame(loop);
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      lab.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
    })();
    var LABELS = { view: 'δες', drag: 'σύρε' };
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      var kind = el.getAttribute('data-cursor');
      el.addEventListener('pointerenter', function () {
        c.classList.add('is-' + kind);
        if (LABELS[kind]) lab.textContent = LABELS[kind];
      });
      el.addEventListener('pointerleave', function () { c.classList.remove('is-' + kind); });
    });
  })();

  /* ── magnetic buttons ── */
  document.querySelectorAll('.magnet').forEach(function (el) {
    var rect = null;
    el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', function (e) {
      if (!motionOn || !rect) return;
      var dx = e.clientX - (rect.left + rect.width / 2);
      var dy = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = 'translate(' + dx * 0.28 + 'px,' + dy * 0.38 + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });

  /* ── 3D tilt (cards, stats, cta panel) ── */
  document.querySelectorAll('.tilt').forEach(function (el) {
    var r = null, raf = null, tx = 0, ty = 0;
    el.addEventListener('pointerenter', function () { r = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', function (e) {
      if (!motionOn) return;
      if (!r) r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100) + '%');
      el.style.setProperty('--my', (py * 100) + '%');
      tx = (0.5 - py) * 13; ty = (px - 0.5) * 15;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = null;
        el.style.transform = 'perspective(1000px) rotateX(' + tx + 'deg) rotateY(' + ty + 'deg) translateZ(14px)';
      });
    });
    el.addEventListener('pointerleave', function () { r = null; el.style.transform = ''; });
  });

  /* ── statement: words light up as you scroll ── */
  (function () {
    var el = document.getElementById('statementTxt');
    if (!el) return;
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="sw">' + w + '</span>'; }).join(' ');
    var spans = el.querySelectorAll('.sw');
    function onScroll() {
      if (!motionOn) return;
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var p = (vh * 0.82 - r.top) / (r.height + vh * 0.34);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * spans.length);
      for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('lit', i < n);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ── counters ── */
  (function () {
    var els = document.querySelectorAll('.count');
    if (!els.length || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.textContent = e.dataset.to + (e.dataset.suf || ''); }); return; }
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        var el = en.target, to = parseFloat(el.dataset.to), suf = el.dataset.suf || '';
        var dec = (el.dataset.to.indexOf('.') > -1) ? 1 : 0;
        if (!motionOn || to === 0) { el.textContent = to.toFixed(dec) + suf; return; }
        var t0 = performance.now(), dur = 1500;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = (to * e).toFixed(dec) + suf;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.5 });
    els.forEach(function (e) { obs.observe(e); });
  })();

  /* ── 3D ring carousel ── */
  (function () {
    var ring = document.getElementById('ring');
    if (!ring) return;
    var slides = Array.prototype.slice.call(ring.querySelectorAll('.slide'));
    var n = slides.length, step = 360 / n, radius = 0, angle = 0, target = 0, dragging = false, startX = 0, startAngle = 0;

    function measure() {
      var w = slides[0].offsetWidth;
      radius = Math.round((w / 2) / Math.tan(Math.PI / n) * 1.06);
    }
    var go = document.getElementById('ringGo'), lastActive = null;
    function place() {
      var tilt = motionOn ? -6 : 0, best = -2, bestEl = null;
      slides.forEach(function (s, i) {
        var a = i * step;
        s.style.transform = 'translate(-50%,-50%) rotateY(' + a + 'deg) translateZ(' + radius + 'px)';
        var rel = ((a + angle) % 360 + 360) % 360;
        var facing = Math.cos(rel * Math.PI / 180);
        s.style.opacity = String(0.28 + 0.72 * Math.max(0, facing));
        s.style.zIndex = String(Math.round(facing * 100) + 100);
        s.classList.toggle('active', facing > 0.86);
        if (facing > best) { best = facing; bestEl = s; }
      });
      if (bestEl && bestEl !== lastActive && go) {
        lastActive = bestEl;
        go.href = bestEl.dataset.url;
        go.querySelector('b').textContent = bestEl.dataset.name;
      }
      ring.style.transform = 'rotateX(' + tilt + 'deg) rotateY(' + angle + 'deg)';
    }
    function loop() {
      requestAnimationFrame(loop);
      angle += (target - angle) * (motionOn ? 0.085 : 1);
      place();
    }
    measure(); place(); loop();
    window.addEventListener('resize', function () { measure(); place(); }, { passive: true });

    document.getElementById('ringNext').addEventListener('click', function () { target -= step; });
    document.getElementById('ringPrev').addEventListener('click', function () { target += step; });

    var moved = false;
    ring.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false; startX = e.clientX; startAngle = target;
      ring.setPointerCapture(e.pointerId);
    });
    ring.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    ring.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (Math.abs(e.clientX - startX) > 6) moved = true;
      target = startAngle + (e.clientX - startX) * 0.28;
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      target = Math.round(target / step) * step;
    }
    ring.addEventListener('pointerup', end);
    ring.addEventListener('pointercancel', end);

    // scroll-linked rotation while the section is on screen
    var wrap = document.getElementById('ringWrap');
    var base = null;
    window.addEventListener('scroll', function () {
      if (!motionOn || dragging) return;
      var r = wrap.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var p = (innerHeight - r.top) / (innerHeight + r.height);
      if (base === null) base = target;
      target = base + (p - 0.5) * step * 3.2;
    }, { passive: true });
  })();

  /* ── process deck: pinned 3D stack ── */
  (function () {
    var sec = document.getElementById('process');
    if (!sec) return;
    var cards = Array.prototype.slice.call(sec.querySelectorAll('.deck__card'));
    var n = cards.length;
    function onScroll() {
      var r = sec.getBoundingClientRect();
      var total = sec.offsetHeight - innerHeight;
      var p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
      var pos = p * (n - 1);
      cards.forEach(function (c, i) {
        var d = i - pos;                     // >0 = still ahead, <0 = passed
        var y, s, o, rot;
        if (d >= 0) { var dc = Math.min(d, 3); y = dc * 26; s = 1 - dc * 0.05; o = 1; rot = 0; }
        else       { y = d * 120; s = 1 + d * 0.04; o = Math.max(0, 1 + d * 1.15); rot = d * 8; }
        c.style.transform = 'translate3d(0,' + y + 'px,0) scale(' + s + ') rotateX(' + rot + 'deg)';
        c.style.opacity = String(o);
        c.style.zIndex = String(100 - i);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  })();

  /* ── clients marquee (built twice for a seamless loop) ── */
  (function () {
    var track = document.getElementById('clientTrack');
    if (!track) return;
    var order = [1, 2, 3, 10, 4, 5, 6, 7, 8, 9];
    var html = order.map(function (i) {
      return '<img src="/assets/img/clients/client-' + i + '.png" alt="" loading="lazy" draggable="false">';
    }).join('');
    track.innerHTML = html + html;
  })();

  /* ── hero parallax on the floating panels ── */
  (function () {
    var f = Array.prototype.slice.call(document.querySelectorAll('.floater'));
    if (!f.length) return;
    var x = 0, y = 0, tx = 0, ty = 0;
    document.addEventListener('pointermove', function (e) {
      tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5);
    }, { passive: true });
    (function loop() {
      requestAnimationFrame(loop);
      if (!motionOn) return;
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      var sy = window.scrollY || 0;
      f.forEach(function (el) {
        var d = parseFloat(el.dataset.depth) || 0.08;
        el.style.transform = 'translate3d(' + (-x * d * 420) + 'px,' + (-y * d * 300 + sy * d * 0.55) + 'px,0) rotateY(' + (-x * 12) + 'deg) rotateX(' + (y * 10) + 'deg)';
      });
    })();
  })();


  /* ── burger / drawer ── */
  (function () {
    var b = document.getElementById('burger'), dr = document.getElementById('drawer');
    if (!b || !dr) return;
    function set(open) {
      b.setAttribute('aria-expanded', String(open));
      dr.hidden = !open;
      document.body.classList.toggle('lock', open);
    }
    b.addEventListener('click', function () { set(b.getAttribute('aria-expanded') !== 'true'); });
    dr.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    window.addEventListener('resize', function () { if (innerWidth > 900) set(false); });
  })();

  /* ── φίλτρα portfolio ── */
  (function () {
    var wrap = document.getElementById('chips'), grid = document.getElementById('pjs');
    if (!wrap || !grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.pj'));
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      wrap.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('is-on', c === b); });
      var f = b.dataset.filter;
      cards.forEach(function (c, i) {
        var show = f === 'all' || (' ' + c.dataset.cats + ' ').indexOf(' ' + f + ' ') > -1;
        c.classList.toggle('is-out', !show);
        if (show && motionOn) {
          c.style.animation = 'none';
          void c.offsetWidth;
          c.style.animation = 'pjIn .55s var(--ease) both ' + (i % 6) * 0.045 + 's';
        }
      });
    });
  })();

  /* ── μήνυμα «στάλθηκε» στη φόρμα ── */
  (function () {
    if (location.search.indexOf('sent=1') === -1) return;
    var f = document.querySelector('.form');
    if (!f) return;
    var ok = document.createElement('p');
    ok.className = 'form__ok';
    ok.setAttribute('role', 'status');
    ok.textContent = 'Ελήφθη. Θα σου απαντήσουμε στο email που έδωσες.';
    f.insertBefore(ok, f.firstChild);
    f.scrollIntoView({ behavior: motionOn ? 'smooth' : 'auto', block: 'center' });
  })();

  /* ── smooth in-page links respecting reduced motion ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: motionOn ? 'smooth' : 'auto', block: 'start' });
    });
  });
})();
