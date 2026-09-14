/* Musawir Abrar. Small things, each in its own function. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Take a number. Yours is derived from the minute you arrived.
     The counter is always one behind you.
     ------------------------------------------------------------------ */
  function ticket() {
    var now = new Date();
    var n = (now.getHours() * 60 + now.getMinutes()) % 1000;
    var yours = 'A-' + String(n).padStart(3, '0');
    var serving = 'A-' + String((n + 999) % 1000).padStart(3, '0');
    setText('board-yours', yours);
    setText('board-serving', serving);
    setText('pending-ticket', yours);
  }

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
     The sun in the footer follows the visitor's real local time.
     Rises at 6, sets at 18. At night it is below the hills.
     ------------------------------------------------------------------ */
  function sun() {
    var el = document.getElementById('sky-sun');
    if (!el) return;
    function place() {
      var d = new Date();
      var h = d.getHours() + d.getMinutes() / 60;
      var t = (h - 6) / 12;                      // 0 at sunrise, 1 at sunset
      var cx = 80 + Math.max(0, Math.min(1, t)) * 1040;
      var arc = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI);
      var cy = 96 - arc * 78;                    // 96 at horizon, 18 at noon
      if (t < 0 || t > 1) cy = 112;              // gone
      el.setAttribute('cx', cx.toFixed(1));
      el.setAttribute('cy', cy.toFixed(1));
    }
    place();
    setInterval(place, 60000);
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
     Load YouTube only when asked.
     ------------------------------------------------------------------ */
  function youtube() {
    var boxes = document.querySelectorAll('.yt[data-yt]');
    Array.prototype.forEach.call(boxes, function (box) {
      var btn = box.querySelector('.yt__play');
      function play() {
        var id = box.getAttribute('data-yt');
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
        iframe.title = box.getAttribute('data-title') || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        box.innerHTML = '';
        box.appendChild(iframe);
        box.classList.add('is-playing');
      }
      if (btn) btn.addEventListener('click', play);
      box.addEventListener('click', function (e) {
        if (e.target === btn || btn.contains(e.target)) return;
        play();
      });
    });
  }

  /* ------------------------------------------------------------------
     Which section is on screen, for the nav underline.
     ------------------------------------------------------------------ */
  function current() {
    if (!('IntersectionObserver' in window)) return;
    var links = document.querySelectorAll('.top__links a[href^="#"]');
    var map = {};
    Array.prototype.forEach.call(links, function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          Array.prototype.forEach.call(links, function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
    var hero = document.querySelector('.hero');
    if (hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          Array.prototype.forEach.call(links, function (l) { l.removeAttribute('aria-current'); });
        }
      }, { rootMargin: '-40% 0px -55% 0px' }).observe(hero);
    }
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
     For whoever opens the console.
     ------------------------------------------------------------------ */
  function console_() {
    if (!window.console || !console.log) return;
    console.log(
      '%cDon’t you ever feel like getting photographed yourself?',
      'font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #d4802a;'
    );
    console.log('%cColor of Sunset, 2022. musawir.abrar@uconn.edu', 'font-family: monospace; font-size: 11px; color: #7a7468;');
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ------------------------------------------------------------------ */
  ticket();
  clocks();
  sun();
  title();
  youtube();
  current();
  credits();
  lights();
  console_();
  setText('year', String(new Date().getFullYear()));
})();
