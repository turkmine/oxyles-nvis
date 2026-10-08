/* ============================================================
   404.js — на странице «кадр не найден» нужен только год
   ============================================================ */
(function () {
  'use strict';
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();