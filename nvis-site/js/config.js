/* ============================================================
   config.js — единственное место, которое нужно править
   Подключается с defer, лежит в window.NV_CONFIG.
   Значения ниже перекрывают то, что вписано прямо в index.html,
   поэтому сайт остаётся рабочим и с выключенным JS.

   ВНИМАНИЕ: путь к установщику и его размер здесь только
   подпись. Сама ссылка лежит в index.html (атрибут href) —
   без JS страница всё равно должна предлагать скачать файл.
   ============================================================ */
window.NV_CONFIG = {
  product: {
    brand: 'NVIS',
    name: 'NVIS',

    // Строки под именем; между ними рисуются точки-разделители
    tagline: ['Windows', 'Гамма экрана', 'Хоткеи'],

    version: '1.0.0',
    platform: 'Windows 10 / 11 · x64',
    sizeLabel: '57,4 МБ',
    fileName: 'Nvis-Setup-1.0.0.msi',

    /* Куда ведёт кнопка «Скачать».
       Cloudflare Workers и Pages не принимают файл больше 25 МиБ,
       а установщик весит 57,4 МБ — поэтому он лежит в Releases
       на GitHub, а кнопка ведёт туда.
       ПРОВЕРЬ ИМЯ ПОЛЬЗОВАТЕЛЯ: если репозиторий не под
       turkmine/oxyles-nvis — поправь здесь и в index.html
       (в атрибуте href и в JSON-LD), если адрес изменится. */
    downloadUrl: 'https://github.com/turkmine/oxyles-nvis/releases/download/1.0.0/Nvis-Setup-1.0.0.msi',

    // Текст под кнопкой скачивания
    downloadNote:
      'Один файл, установка не нужна. Без рекламы, без трекеров, ' +
      'без автозапуска служб и без интернет-соединения.',

    // Текст в блоке «О авторе» — короткая версия
    aboutLead:
      'Меня зовут Oxyles. Я разработчик: Python, парсеры, плагины для Rust ' +
      'и серверы. Nvis — маленькая утилита, выросшая из личной необходимости.',

    footerNote: 'Сделано вручную: ни трекеров, ни внешних CDN, ни чужих скриптов.',

    links: {
      // Официальная страница разработчика
      home: {
        label: 'oxyles-site',
        url: 'https://oxyles-site.turkmine3456.workers.dev/'
      },
      telegram: {
        label: '@Oxyles',
        url: 'https://t.me/Oxyles'
      },
      discord: {
        label: 'oxyles.s',
        // Сервер-приглашение: работает без установленного клиента
        url: 'https://discord.gg/FH7V66hZ8P'
      },
      steam: {
        label: '76561199429925548',
        url: 'https://steamcommunity.com/profiles/76561199429925548/'
      }
    }
  },

  /* ---------- Поведение ---------- */

  theme: {
    default: 'auto',      // 'auto' | 'paper' | 'ink'
    storageKey: 'nvis.theme'
  },

  fx: {
    enabled: true,          // стартовое состояние тумблера эффектов
    storageKey: 'nvis.fx',
    particles: {
      density: 1,           // множитель количества (0 — выключить canvas совсем)
      maxCount: 90,         // потолок, чтобы не жечь батарею
      speed: 1,             // множитель скорости
      dashes: true          // короткие штрихи «линии скорости»
    }
  },

  scroll: {
    revealOffset: 0.12,     // доля панели, которая должна показаться до анимации
    progressBar: true
  }
};