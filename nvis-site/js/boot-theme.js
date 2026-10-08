/* ============================================================
   boot-theme.js — применяет тему до первой отрисовки
   Подключается синхронно в <head>: иначе на тёмной теме
   успевает мелькнуть светлый фон.

   Намеренно автономный: читается раньше config.js, поэтому
   ключ хранилища продублирован константой. Меняете здесь —
   меняйте и в js/config.js (theme.storageKey).
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'nvis.theme';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* приватный режим */ }
  if (saved !== 'paper' && saved !== 'ink') {
    saved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'paper' : 'ink';
  }
  root.dataset.theme = saved;
})();