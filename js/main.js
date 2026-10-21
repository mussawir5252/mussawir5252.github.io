/* Musawir Abrar. Small things, each in its own function. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Light and dark. The head sets the stored choice before the first
     paint; this only handles the button and remembers what was picked.
     ------------------------------------------------------------------ */
  function theme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var root = document.documentElement;
    var dark = window.matchMedia('(prefers-color-scheme: dark)');

    function current() {
      return root.getAttribute('data-theme') || (dark.matches ? 'dark' : 'light');
    }
    function label() {
      var next = current() === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      btn.setAttribute('title', 'Switch to ' + next + ' mode');
    }
    label();

    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
      track('theme_switched', { to: next });
    });

    // Follow the system while no choice has been made.
    if (dark.addEventListener) dark.addEventListener('change', label);
  }

  /* ------------------------------------------------------------------
     The clock in Storrs. Never the same time twice.
     ------------------------------------------------------------------ */
  function clock() {
    function fmt(zone) {
      try {
        return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone }).format(new Date());
      } catch (e) { return '--:--'; }
    }
    function tick() {
      setText('time-storrs', fmt('America/New_York'));
    }
    tick();
    setInterval(tick, 15000);
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
    var vid = document.getElementById('lightbox-video');
    var time = document.getElementById('lightbox-time');
    var label = document.getElementById('lightbox-label');
    var embed = document.getElementById('lightbox-embed');
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-full], [data-video], [data-embed]'));
    if (!dlg || !img || !items.length || typeof dlg.showModal !== 'function') return;
    var fallback = label ? label.textContent : '';
    var index = 0, opener = null, touchX = null;

    function show(i) {
      index = (i + items.length) % items.length;
      var el = items[index];
      var movie = el.getAttribute('data-video');
      var player = el.getAttribute('data-embed');
      if (vid) {
        vid.pause();
        vid.hidden = !movie;
        if (movie) { vid.src = movie; } else { vid.removeAttribute('src'); vid.load(); }
      }
      // The player is built on arrival and torn down on the way out, so the
      // sound stops with the slide and nothing is fetched until it is asked for.
      if (embed) {
        embed.hidden = !player;
        embed.innerHTML = '';
        if (player) {
          var frame = document.createElement('iframe');
          frame.src = player + (player.indexOf('?') < 0 ? '?' : '&') + 'title=0&byline=0&portrait=0';
          frame.title = el.getAttribute('data-caption') || 'Video';
          frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          frame.allowFullscreen = true;
          embed.appendChild(frame);
        }
      }
      img.hidden = !!(movie || player);
      if (!movie && !player) {
        img.src = el.getAttribute('data-full');
        var inner = el.querySelector('img');
        img.alt = el.getAttribute('data-alt') || (inner ? inner.alt : '');
      } else {
        img.removeAttribute('src');
        img.alt = '';
      }
      if (label) label.textContent = el.getAttribute('data-caption') || fallback;
      time.textContent = el.getAttribute('data-time') || '';
      // warm the next one, if it is a picture
      var next = items[(index + 1) % items.length].getAttribute('data-full');
      if (next) new Image().src = next;
      // Hiding the video drops focus to the body if it held it, and the key
      // handler below never fires again. Keep focus inside the dialog.
      if (!dlg.contains(document.activeElement)) dlg.focus();
    }
    function open(i, from) {
      opener = from || null;
      show(i);
      dlg.showModal();
      dlg.focus();
      document.body.classList.add('has-lightbox');
      track('gallery_opened', { item: label ? label.textContent : '' });
    }
    function close() { if (dlg.open) dlg.close(); }

    items.forEach(function (el, i) {
      el.addEventListener('click', function () { open(i, el); });
    });
    dlg.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-close]')) return close();
      var nav = t.closest('[data-dir]');
      if (nav) return show(index + Number(nav.getAttribute('data-dir')));
      // clicks on the video itself are the controls, not a request to leave
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
      if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }
      if (embed) { embed.innerHTML = ''; embed.hidden = true; }
      img.removeAttribute('src');
      if (opener) opener.focus();
    });
  }

  /* ------------------------------------------------------------------
     Screenplays. The PDFs are encrypted, so the browser's own viewer
     does the asking; this only opens one over the page.
     ------------------------------------------------------------------ */
  function reader() {
    var dlg = document.getElementById('reader');
    var frame = document.getElementById('reader-frame');
    var name = document.getElementById('reader-title');
    var link = document.getElementById('reader-link');
    var items = document.querySelectorAll('[data-pdf]');
    if (!dlg || !frame || !items.length) return;
    var narrow = window.matchMedia('(max-width: 760px)');

    function shut() { if (dlg.open) dlg.close(); }

    Array.prototype.forEach.call(items, function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-pdf');
        var title = btn.getAttribute('data-title') || 'Screenplay';
        // Phones embed PDFs badly, often showing page one and no way down.
        // Hand the file to the browser instead.
        if (narrow.matches || typeof dlg.showModal !== 'function') {
          window.open(src, '_blank', 'noopener');
          return;
        }
        name.textContent = title;
        link.href = src;
        frame.src = src;
        frame.title = title;
        dlg.showModal();
        document.body.classList.add('has-lightbox');
        track('screenplay_opened', { work: title });
      });
    });

    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) shut();
    });
    dlg.addEventListener('close', function () {
      frame.removeAttribute('src');
      document.body.classList.remove('has-lightbox');
    });
  }

  /* ------------------------------------------------------------------
     A link to a folded section should arrive with it open. Without this
     the address works and the reader lands on a closed summary.
     ------------------------------------------------------------------ */
  function linked() {
    function reveal() {
      var id = (location.hash || '').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      // A card whose writing lives in a panel opens the panel.
      var opener = target.querySelector('[data-panel]');
      if (opener) return opener.click();
      var fold = target.matches('details') ? target : target.querySelector('details');
      if (!fold) fold = target.closest('details');
      if (fold && !fold.open) {
        fold.open = true;
        target.scrollIntoView();
      }
    }
    reveal();
    window.addEventListener('hashchange', reveal);
  }

  /* ------------------------------------------------------------------
     How far the page has run. The strip is decoration, so it simply
     stays empty where this never runs.
     ------------------------------------------------------------------ */
  function reel() {
    var bar = document.querySelector('.reel');
    if (!bar) return;
    var queued = false;
    function set() {
      queued = false;
      var run = document.documentElement.scrollHeight - window.innerHeight;
      // A page that does not scroll would show a strip that never fills.
      bar.hidden = run < 1;
      var at = run > 0 ? window.pageYOffset / run : 0;
      bar.style.setProperty('--reel', Math.max(0, Math.min(1, at)).toFixed(4));
    }
    function ask() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(set);
    }
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    set();
  }

  /* ------------------------------------------------------------------
     Writing that opens over the page rather than beside it.
     ------------------------------------------------------------------ */
  function panels() {
    var openers = document.querySelectorAll('[data-panel]');
    if (!openers.length) return;
    Array.prototype.forEach.call(openers, function (btn) {
      var dlg = document.getElementById(btn.getAttribute('data-panel'));
      if (!dlg || typeof dlg.showModal !== 'function') return;
      btn.addEventListener('click', function () {
        dlg.showModal();
        document.body.classList.add('has-lightbox');
        var body = dlg.querySelector('.panel__body');
        if (body) body.scrollTop = 0;
        track('panel_opened', { panel: dlg.id });
      });
      if (dlg.dataset.wired) return;
      dlg.dataset.wired = '1';
      dlg.addEventListener('click', function (e) {
        // the backdrop is the dialog itself; the body is a child of it
        if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
      });
      dlg.addEventListener('close', function () {
        document.body.classList.remove('has-lightbox');
        if (btn.focus) btn.focus();
      });
    });
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
  theme();
  clock();
  players();
  lightbox();
  reader();
  reel();
  panels();
  linked();
  printing();
  console_();
  setText('year', String(new Date().getFullYear()));
})();
