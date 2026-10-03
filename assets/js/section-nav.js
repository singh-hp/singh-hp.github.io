// Highlights the link of the section currently being read, in both the
// sidebar and the mobile bar, keeps the active link visible in the bar, and
// shows the bar's edge fades only where more links are hidden.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.section-nav a'));
  if (!links.length) return;

  var ids = [];
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (ids.indexOf(id) < 0) ids.push(id);
  });
  var headings = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (!headings.length) return;

  var bar = document.querySelector('.section-nav--bar');
  var scroller = bar && bar.querySelector('.section-nav__links');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = null;
  // A clicked link stays active until the reader scrolls by hand, so short
  // sections near the end of the page are still highlighted when chosen.
  var pinned = null;

  function barVisible() {
    return bar && bar.offsetParent !== null;
  }

  function activeId() {
    if (pinned) return pinned;
    var doc = document.documentElement;
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
      return headings[headings.length - 1].id;
    }
    var offset = (barVisible() ? bar.offsetHeight : 0) + window.innerHeight * 0.25;
    var id = headings[0].id;
    headings.forEach(function (h) {
      if (h.getBoundingClientRect().top <= offset) id = h.id;
    });
    return id;
  }

  function update() {
    var id = activeId();
    if (id === current) return;
    current = id;
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (barVisible()) {
      var active = scroller.querySelector('a.active');
      if (active) {
        scroller.scrollTo({
          left: active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2,
          behavior: reduceMotion.matches ? 'auto' : 'smooth'
        });
      }
    }
  }

  function updateFades() {
    if (!barVisible()) return;
    var max = scroller.scrollWidth - scroller.clientWidth;
    bar.classList.toggle('at-start', scroller.scrollLeft <= 1);
    bar.classList.toggle('at-end', scroller.scrollLeft >= max - 1);
  }

  var ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      update();
    });
  }

  links.forEach(function (a) {
    a.addEventListener('click', function () {
      pinned = a.getAttribute('href').slice(1);
      update();
    });
  });
  ['wheel', 'touchstart', 'keydown'].forEach(function (type) {
    window.addEventListener(type, function () {
      if (!pinned) return;
      pinned = null;
      schedule();
    }, { passive: true });
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () {
    current = null;
    schedule();
    updateFades();
  });
  if (scroller) scroller.addEventListener('scroll', updateFades, { passive: true });
  update();
  updateFades();
})();
