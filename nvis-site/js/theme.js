/* ============================================================
   theme.js — переключение «бумага / инверс» и тумблер эффектов
   Тема ставится инлайновым скриптом в <head> ещё до отрисовки,
   здесь только обработчики и синхронизация с config.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var cfg = (window.NV_CONFIG && window.NV_CONFIG.theme) || {};
  var key = cfg.storageKey || 'nvis.theme';

  /* Подпись и aria-label строим от видимого текста, иначе скринридер
     объявляет одно, а на кнопке написано другое. */
  var LABELS = {
    ink:   { ico: '黒', name: 'Инверс', hint: 'тёмная тема, нажмите для светлой' },
    paper: { ico: '白', name: 'Бумага', hint: 'светлая тема, нажмите для тёмной' }
  };

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* приватный режим */ }
  }

  var toggle = document.getElementById('themeToggle');
  var ico = document.getElementById('themeIco');
  var lbl = document.getElementById('themeLbl');

  function paintThemeButton() {
    var mode = root.dataset.theme === 'paper' ? 'paper' : 'ink';
    var l = LABELS[mode];
    if (ico) ico.textContent = l.ico;
    if (lbl) lbl.textContent = l.name;
    if (toggle) {
      /* Имя кнопки обязано начинать с видимого текста, иначе скринридер
         объявляет не то, что написано на кнопке. Поэтому иероглиф темы
         входит в aria-label, а дальше идёт подсказка. */
      var name = l.ico + ' ' + l.name + ': ' + l.hint;
      toggle.setAttribute('title', l.hint);
      toggle.setAttribute('aria-label', name);
      toggle.setAttribute('aria-pressed', String(mode === 'ink'));
    }
  }

  function setTheme(mode) {
    root.dataset.theme = mode === 'paper' ? 'paper' : 'ink';
    write(key, root.dataset.theme);
    paintThemeButton();
    document.dispatchEvent(new CustomEvent('nv:themechange', {
      detail: { theme: root.dataset.theme }
    }));
  }

  paintThemeButton();

  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(root.dataset.theme === 'paper' ? 'ink' : 'paper');
    });
  }

  /* Следуем за системной темой, пока пользователь не выбрал вручную.
     Читаем хранилище каждый раз: после ручного переключения связь теряется. */
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  var onSystem = function (e) {
    var current = read(key);
    if (current !== 'paper' && current !== 'ink') setTheme(e.matches ? 'paper' : 'ink');
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystem);
  else if (mq.addListener) mq.addListener(onSystem);

  /* ---------- Эффекты ---------- */
  var fxCfg = (window.NV_CONFIG && window.NV_CONFIG.fx) || {};
  var fxKey = fxCfg.storageKey || 'nvis.fx';
  var fxToggle = document.getElementById('fxToggle');

  function setFx(on) {
    root.dataset.fx = on ? 'on' : 'off';
    write(fxKey, on ? 'on' : 'off');
    if (fxToggle) {
      fxToggle.setAttribute('aria-pressed', String(on));
      fxToggle.setAttribute('aria-label', on ? 'Выключить эффекты' : 'Включить эффекты');
    }
    document.dispatchEvent(new CustomEvent('nv:fxchange', { detail: { on: on } }));
  }

  var savedFx = read(fxKey);
  setFx(savedFx === 'off' ? false : (savedFx === 'on' ? true : fxCfg.enabled !== false));

  if (fxToggle) {
    fxToggle.addEventListener('click', function () {
      setFx(root.dataset.fx !== 'on');
    });
  }

  /* ---------- Цвет системной панели браузера ---------- */
  var metas = document.querySelectorAll('meta[name="theme-color"]');
  var DARK = '#0b0b0c';
  var LIGHT = '#f4f2ec';
  function paintThemeColor() {
    var c = root.dataset.theme === 'paper' ? LIGHT : DARK;
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', c);
  }
  paintThemeColor();
  document.addEventListener('nv:themechange', paintThemeColor);
})();