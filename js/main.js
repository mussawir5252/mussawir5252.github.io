/* Musawir Abrar. Small things, each in its own function. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Two clocks. Storrs and Lahore. Never the same time twice.
     ------------------------------------------------------------------ */
  function clocks() {
    function fmt(zone) {
      try {
        return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone }).format(new Date());
      } catch (e) { return '--:--'; }
    }
    function tick() {
      setText('time-storrs', fmt('America/New_York'));
      setText('time-lahore', fmt('Asia/Karachi'));
    }
    tick();
    setInterval(tick, 15000);
  }

  /* ------------------------------------------------------------------
     Tab title. When you look away, the title becomes the film's.
     ------------------------------------------------------------------ */
  function title() {
    var home = document.title;
    document.addEventListener('visibilitychange', function () {
      document.title = document.hidden ? 'منظر' : home;
    });
  }

  /* ------------------------------------------------------------------
     Load a player only when asked. YouTube for the films, Vimeo for the essays.
     ------------------------------------------------------------------ */
  function players() {
    var boxes = document.querySelectorAll('[data-yt], [data-vimeo]');
    Array.prototype.forEach.call(boxes, function (box) {
      var yt = box.getAttribute('data-yt');
      var vimeo = box.getAttribute('data-vimeo');
      // The play control is a sibling for the films, a child for the essays.
      var btn = (box.parentNode || document).querySelector('.yt__play') || box.querySelector('.vid__play');
      function play() {
        var iframe = document.createElement('iframe');
        iframe.src = yt
          ? 'https://www.youtube-nocookie.com/embed/' + yt + '?autoplay=1&rel=0&modestbranding=1'
          : 'https://player.vimeo.com/video/' + vimeo + '?autoplay=1&title=0&byline=0&portrait=0';
        iframe.title = box.getAttribute('data-title') || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        box.innerHTML = '';
        box.appendChild(iframe);
        box.classList.add('is-playing');
        box.style.cursor = 'default';
        if (btn && btn.parentNode !== box) btn.hidden = true;
        track('film_played', { film: iframe.title });
      }
      if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); play(); });
      box.addEventListener('click', function () {
        if (!box.classList.contains('is-playing')) play();
      });
    });
  }

  /* ------------------------------------------------------------------
     Stills open full size. Arrow keys and swipes move between them.
     ------------------------------------------------------------------ */
  function lightbox() {
    var dlg = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    var time = document.getElementById('lightbox-time');
    var items = Array.prototype.slice.call(document.querySelectorAll('.strip__item[data-full]'));
    if (!dlg || !img || !items.length || typeof dlg.showModal !== 'function') return;
    var index = 0, opener = null, touchX = null;

    function show(i) {
      index = (i + items.length) % items.length;
      var btn = items[index];
      img.src = btn.getAttribute('data-full');
      img.alt = btn.querySelector('img').alt;
      time.textContent = btn.getAttribute('data-time') || '';
      var next = items[(index + 1) % items.length];
      new Image().src = next.getAttribute('data-full');
    }
    function open(i, from) {
      opener = from || null;
      show(i);
      dlg.showModal();
      document.body.classList.add('has-lightbox');
      track('still_opened', { time: time.textContent });
    }
    function close() { if (dlg.open) dlg.close(); }

    items.forEach(function (btn, i) {
      btn.addEventListener('click', function () { open(i, btn); });
    });
    dlg.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-close]')) return close();
      var nav = t.closest('[data-dir]');
      if (nav) return show(index + Number(nav.getAttribute('data-dir')));
      if (!t.closest('.lightbox__stage, .lightbox__cap')) close();
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    });
    dlg.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 48) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
    dlg.addEventListener('close', function () {
      document.body.classList.remove('has-lightbox');
      img.removeAttribute('src');
      if (opener) opener.focus();
    });
  }

  /* ------------------------------------------------------------------
     If you sit at the bottom long enough, the credits roll.
     Any movement ends them. Once per visit.
     ------------------------------------------------------------------ */
  function credits() {
    var el = document.getElementById('credits');
    if (!el || reduceMotion) return;
    var timer = null, shown = false;
    function atBottom() {
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    }
    function arm() {
      if (shown) return;
      clearTimeout(timer);
      if (atBottom()) timer = setTimeout(show, 25000);
    }
    function show() {
      if (shown) return;
      shown = true;
      track('credits_rolled', {});
      el.classList.add('is-on');
      el.setAttribute('aria-hidden', 'false');
      ['scroll', 'keydown', 'pointerdown', 'touchstart', 'wheel'].forEach(function (ev) {
        window.addEventListener(ev, hide, { once: true, passive: true });
      });
      setTimeout(hide, 42000);
    }
    function hide() {
      el.classList.remove('is-on');
      el.setAttribute('aria-hidden', 'true');
    }
    window.addEventListener('scroll', arm, { passive: true });
    arm();
  }

  /* ------------------------------------------------------------------
     At 17 minutes 49 seconds on the page, the length of Color of Sunset,
     the lights flicker once.
     ------------------------------------------------------------------ */
  function lights() {
    if (reduceMotion) return;
    setTimeout(function () {
      document.body.classList.add('is-flicker');
      setTimeout(function () { document.body.classList.remove('is-flicker'); }, 800);
    }, (17 * 60 + 49) * 1000);
  }

  /* ------------------------------------------------------------------
     A folded statement should still print in full.
     ------------------------------------------------------------------ */
  function printing() {
    var folds = document.querySelectorAll('details');
    if (!folds.length) return;
    var wasShut = [];
    window.addEventListener('beforeprint', function () {
      wasShut = [];
      Array.prototype.forEach.call(folds, function (d) {
        if (!d.open) { wasShut.push(d); d.open = true; }
      });
    });
    window.addEventListener('afterprint', function () {
      wasShut.forEach(function (d) { d.open = false; });
      wasShut = [];
    });
  }

  /* ------------------------------------------------------------------
     For whoever opens the console.
     ------------------------------------------------------------------ */
  function console_() {
    if (!window.console || !console.log) return;
    console.log(
      '%cDon’t you ever feel like getting photographed yourself?',
      'font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #37b5ff;'
    );
    console.log('%cColor of Sunset, 2022. musawir.abrar@uconn.edu', 'font-family: monospace; font-size: 11px; color: #6c687a;');
  }

  /* Analytics, only if the snippet loaded. */
  function track(name, props) {
    if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(name, props);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ------------------------------------------------------------------ */
  clocks();
  title();
  players();
  lightbox();
  printing();
  credits();
  lights();
  console_();
  setText('year', String(new Date().getFullYear()));
})();
