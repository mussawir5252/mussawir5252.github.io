/* Musawir Abrar. Small things, each in its own function. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Sunset in Storrs. Both films end on a deadline at sunset:
     a last photograph, a funeral home closing at nightfall.
     NOAA solar position, no geolocation prompt.
     ------------------------------------------------------------------ */
  var STORRS = { lat: 41.8084, lon: -72.2495, zone: 'America/New_York' };

  function solarTimes(date, lat, lon) {
    // Returns { rise, set } as Date objects (UTC instants) for the civil day of `date`.
    var rad = Math.PI / 180;
    var J = Math.floor(date.getTime() / 86400000 + 2440587.5);
    var n = J - 2451545.0 + 0.0008;
    var Jstar = n - lon / 360;
    var M = (357.5291 + 0.98560028 * Jstar) % 360;
    var C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    var lambda = (M + C + 180 + 102.9372) % 360;
    var Jtransit = 2451545.0 + Jstar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
    var delta = Math.asin(Math.sin(lambda * rad) * Math.sin(23.4397 * rad));
    var cosw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(delta)) / (Math.cos(lat * rad) * Math.cos(delta));
    if (cosw < -1 || cosw > 1) return null;
    var w = Math.acos(cosw) / rad;
    var toDate = function (jd) { return new Date((jd - 2440587.5) * 86400000); };
    return { rise: toDate(Jtransit - w / 360), set: toDate(Jtransit + w / 360) };
  }

  function storrsNow() {
    // The civil date in Storrs right now, as a UTC-midnight Date for the solar math.
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: STORRS.zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return new Date(parts + 'T12:00:00Z');
  }

  function clock12(d) {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: STORRS.zone }).format(d).toLowerCase();
  }

  function relative(ms) {
    var m = Math.round(ms / 60000);
    var h = Math.floor(m / 60); m = m % 60;
    if (h === 0) return m + ' min';
    return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
  }

  /* The favicon follows the same clock: a sun by day, a line of it after dark. */
  function favicon(isNight) {
    var link = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
    if (!link) return;
    var want = isNight ? 'assets/favicon-night.svg' : 'assets/favicon.svg';
    if (link.getAttribute('href').indexOf(want) === -1) link.setAttribute('href', want);
  }

  function sunset() {
    var line = document.getElementById('sun-line');
    var time = document.getElementById('sun-time');
    var rel = document.getElementById('sun-rel');
    if (!line || !time || !rel) return;
    function update() {
      var now = new Date();
      var today = storrsNow();
      var t = solarTimes(today, STORRS.lat, STORRS.lon);
      if (!t) return;
      favicon(now >= t.set || now < t.rise);
      if (now < t.set) {
        line.firstChild.textContent = 'Sunset in Storrs is at ';
        time.textContent = clock12(t.set);
        rel.textContent = ', ' + relative(t.set - now) + ' from now';
      } else {
        var tomorrow = solarTimes(new Date(today.getTime() + 86400000), STORRS.lat, STORRS.lon);
        line.firstChild.textContent = 'The sun set in Storrs at ';
        time.textContent = clock12(t.set);
        rel.textContent = '. It rises again at ' + clock12(tomorrow.rise);
      }
    }
    update();
    setInterval(update, 30000);
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
     The sun in the footer is where the real sun is over Storrs.
     ------------------------------------------------------------------ */
  function sun() {
    var el = document.getElementById('sky-sun');
    if (!el) return;
    function place() {
      var t = solarTimes(storrsNow(), STORRS.lat, STORRS.lon);
      if (!t) return;
      var now = Date.now();
      var f = (now - t.rise) / (t.set - t.rise);      // 0 at sunrise, 1 at sunset
      var cx = 80 + Math.max(0, Math.min(1, f)) * 1040;
      var arc = Math.sin(Math.max(0, Math.min(1, f)) * Math.PI);
      var cy = 96 - arc * 78;                          // 96 at horizon, 18 at noon
      if (f < 0 || f > 1) cy = 112;                    // below the hills
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
        track('film_played', { film: iframe.title });
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

  /* Analytics, only if the snippet loaded. */
  function track(name, props) {
    if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(name, props);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ------------------------------------------------------------------ */
  sunset();
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
