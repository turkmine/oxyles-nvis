/* ============================================================
   fx.js — фоновый canvas: «чернильные» точки и штрихи линий скорости
   Canvas вместо DOM-элементов: на сотни объектов это дешевле.
   Останавливается, когда вкладка не видна и когда эффекты выключены.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('fx');
  if (!canvas || !canvas.getContext) return;

  var fxCfg = (window.NV_CONFIG && window.NV_CONFIG.fx) || {};
  var p = fxCfg.particles || {};
  var density = typeof p.density === 'number' ? p.density : 1;
  if (density <= 0) { canvas.remove(); return; }

  var ctx = canvas.getContext('2d', { alpha: true });
  var maxCount = Math.max(12, (p.maxCount || 90) | 0);
  var speedMul = typeof p.speed === 'number' ? p.speed : 1;
  var useDashes = p.dashes !== false;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var W = 0, H = 0;
  var items = [];
  var raf = 0;
  var running = false;

  /* Цвета берём из CSS-переменных, чтобы частицы шли в тон теме */
  function readInk() {
    var cs = getComputedStyle(document.documentElement);
    var ink = (cs.getPropertyValue('--ink') || '#f4f4f2').trim();
    var faint = (cs.getPropertyValue('--ink-faint') || '#6a6a67').trim();
    return { ink: ink, faint: faint };
  }
  var palette = readInk();

  function rand(min, max) { return min + Math.random() * (max - min); }

  function spawn(init) {
    var isDash = useDashes && Math.random() < 0.28;
    return {
      x: rand(0, W),
      y: init ? rand(0, H) : rand(-30, H * 0.2),
      r: isDash ? rand(9, 26) : rand(0.9, 2.6),
      vy: rand(0.12, 0.55) * speedMul,
      vx: rand(-0.16, 0.16) * speedMul,
      a: rand(0.08, 0.34),
      dash: isDash,
      len: rand(14, 46),
      spin: rand(-0.01, 0.01)
    };
  }

  function target() {
    var area = W * H;
    return Math.min(maxCount, Math.round((area / 26000) * density));
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var want = target();
    if (items.length > want) items.length = want;
    while (items.length < want) items.push(spawn(true));
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      it.y += it.vy;
      it.x += it.vx;

      if (it.y - 40 > H || it.x < -80 || it.x > W + 80) items[i] = spawn(false);

      ctx.save();
      ctx.globalAlpha = it.a;
      ctx.fillStyle = it.dash ? palette.faint : palette.ink;

      if (it.dash) {
        ctx.translate(it.x, it.y);
        ctx.rotate(it.spin * 40);
        ctx.fillRect(0, 0, it.len, 1.2);
      } else {
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce.matches || document.documentElement.dataset.fx !== 'on') return;
    running = true;
    raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    window.cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, W, H);
  }

  /* Вкладка ушла в фон — не жжём батарею */
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  document.addEventListener('nv:fxchange', function (e) {
    e.detail.on ? start() : stop();
  });

  document.addEventListener('nv:themechange', function () {
    palette = readInk();
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (!running) ctx.clearRect(0, 0, W, H); }, 150);
  }, { passive: true });

  if (reduce.addEventListener) {
    reduce.addEventListener('change', function (e) { e.matches ? stop() : start(); });
  }

  resize();
  start();
})();