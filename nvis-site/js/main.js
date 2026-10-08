/* ============================================================
   main.js — контент из config, появление блоков, навигация, мелочи
   Никаких зависимостей. Всё, что можно, — на addEventListener
   с passive, чтобы не трогать скролл.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.NV_CONFIG || {};
  var product = cfg.product || {};
  var scrollCfg = cfg.scroll || {};

  /* ---------- 1. Контент из config ---------- */
  function setText(el, text) {
    if (el && text) el.textContent = text;
  }

  /* Все подписи, которые config умеет менять, помечены data-cfg="<ключ>".
     Порядок не важен — выборка идёт по атрибуту, а не по классу,
     поэтому блок можно переставить в разметке как угодно. */
  document.querySelectorAll('[data-cfg]').forEach(function (el) {
    setText(el, product[el.dataset.cfg]);
  });

  var name = document.querySelector('[data-cfg="name"]');
  if (name && product.name) name.setAttribute('data-text', product.name);

  /* Подпись в шапке — тоже всегда заглавными */
  var brand = document.querySelector('[data-cfg="brand"]');
  if (brand && product.brand) brand.textContent = product.brand;

  var tagline = document.querySelector('[data-cfg="tagline"]');
  if (tagline && Array.isArray(product.tagline) && product.tagline.length) {
    tagline.textContent = '';
    product.tagline.forEach(function (part, i) {
      if (i) {
        var dot = document.createElement('span');
        dot.className = 'dot';
        dot.setAttribute('aria-hidden', 'true');
        tagline.appendChild(dot);
      }
      var span = document.createElement('span');
      span.textContent = part;
      tagline.appendChild(span);
    });
  }

  /* Кнопка скачивания. Адрес лежит и в config, и в разметке:
     из config он меняется в одном месте, из разметки — работает
     при выключенном JS. Здесь config побеждает.

     Атрибут download намеренно не ставим: браузер игнорирует его
     для ссылок на чужой домен (установщик лежит в GitHub Releases),
     так что толку от него не было бы. Имя файла задаёт сам
     GitHub заголовком Content-Disposition. */
  document.querySelectorAll('[data-download]').forEach(function (el) {
    if (!product.downloadUrl) return;
    el.setAttribute('href', product.downloadUrl);
  });

  /* Соцсети и ссылка на сайт разработчика: подменяем href/подпись.
     Пустой url — это не ссылка, а <span>, чтобы не оставлять
     краулерам и скринридерам битый якорь. */
  var links = product.links || {};
  document.querySelectorAll('[data-net]').forEach(function (el) {
    var net = links[el.dataset.net];
    if (!net) return;

    if (!net.url) {
      var span = document.createElement('span');
      span.className = el.className + ' soc--off';
      span.setAttribute('aria-disabled', 'true');
      span.title = 'Ссылка не задана в js/config.js';
      while (el.firstChild) span.appendChild(el.firstChild);
      var note = document.createElement('span');
      note.className = 'soc__note';
      note.textContent = 'ссылка не задана';
      span.appendChild(note);
      el.parentNode.replaceChild(span, el);
      return;
    }

    el.setAttribute('href', net.url);
    var lab = el.querySelector('.soc__meta i');
    setText(lab, net.label);
  });

  /* ---------- 2. Появление блоков ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var offset = typeof scrollCfg.revealOffset === 'number' ? scrollCfg.revealOffset : 0.12;

  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);          // анимация один раз
      });
    }, { rootMargin: '0px 0px -' + (offset * 100) + '% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. Подсветка активного раздела ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) {
          a.setAttribute('aria-current', String(a.getAttribute('href') === id));
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 4. Полоса прогресса + кнопка «наверх» ---------- */
  var bar = scrollCfg.progressBar === false ? null : document.getElementById('progress');
  var toTop = document.getElementById('toTop');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
      if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight * 0.7);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 5. Мелочи ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* Плавный переход по внутренним ссылкам с учётом reduced-motion */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
    history.replaceState(null, '', id);
  });

  /* Метка «no-js» снимается: значит скрипт точно выполнился */
  document.documentElement.classList.remove('no-js');
})();