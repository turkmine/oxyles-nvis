# Деплой страницы Nvis

Сайт полностью статический: 19 файлов на выкладку, ~109 КБ, ни одной зависимости
и ни одного внешнего запроса.

Главная особенность: **установщик весит 57,4 МБ, а Cloudflare Workers и Pages
принимают максимум 25 МиБ на файл**. Поэтому `.msi` лежит в GitHub Releases,
а папка `downloads/` исключена из выкладки.

---

## Коротко: Cloudflare Workers (актуальная схема)

Сайт в подпапке `nvis-site/`, установщик — в Releases.

**1. Конфиг в корне репозитория.** `wrangler.jsonc` кладётся рядом с папкой
`nvis-site/`, а не внутрь неё — wrangler ищет конфиг в рабочей директории.

```jsonc
{
  "name": "nvis-site",
  "compatibility_date": "2026-10-08",
  "assets": {
    "directory": "./nvis-site/",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  }
}
```

**2. `.assetsignore` — внутри `nvis-site/`**, рядом с `index.html`. Так требует
платформа: файл ищется в корне папки со статикой. Уже настроен: выпускает 19
нужных файлов, не выпускает `README.md`, `deploy/`, `wrangler.jsonc` и
`downloads/`.

**3. Команда сборки** в настройках Workers Builds:

```
npx wrangler deploy
```

Альтернатива: если конфиг остаётся внутри `nvis-site/`, поставь
`directory: "./"` и укажи путь явно —

```
npx wrangler deploy --config nvis-site/wrangler.jsonc
```

**4. Установщик — в Releases.**

```bash
git tag v1.0.0
git push origin v1.0.0
```

На GitHub: **Releases → Create a new release** → выбрать тег `v1.0.0` →
перетащить `Nvis-Setup-1.0.0.msi` в «Attach files» → **Publish**.

Готовый адрес вставить в двух местах:

- `js/config.js` → `product.downloadUrl`
- `index.html` → `href` у `.dl__btn` и `downloadUrl` в JSON-LD

### Проверка до деплоя

```bash
npx wrangler deploy --dry-run
```

Ожидается `Read N files from the assets directory .../nvis-site`.
Если снова `Could not detect a directory containing static files` — путь
в `directory` не указывает туда, где лежит `index.html`.

---

## Частые ошибки

| Ошибка | Причина | Что делать |
|---|---|---|
| `Could not detect a directory containing static files` | `directory` указывает не в папку с `index.html` | Поставить `"./nvis-site/"` (конфиг в корне) или `"./"` (конфиг внутри папки) |
| `Asset is too large` / ошибка размера | В папке статики лежит `.msi` на 57 МБ | Проверить, что `/downloads/` есть в `.assetsignore` |
| Деплой прошёл, кнопка отдаёт 404 | Адрес установщика не задан или ведёт в никуда | Создать релиз на GitHub и вписать `product.downloadUrl` |
| `_headers` не применился | Файл лежит в подпапке, а не в корне репозитория | Перенести `_headers` в корень репозитория |

> Про `_headers`: Cloudflare читает его **из корня выходной директории**.
> Если хочешь оставить конфиг внутри `nvis-site/`, копия лежит в
> `nvis-site/deploy/_headers` — но её тоже нужно положить в корень.

---

## Вариант: свой сервер (nginx)

Установщик остаётся локально, `.assetsignore` не нужен.

```bash
scp -r nvis-site user@server:/var/www/nvis-site

cp nvis-site/deploy/nginx.conf /etc/nginx/sites-available/nvis
ln -s /etc/nginx/sites-available/nvis /etc/nginx/sites-enabled/nvis

# Перед включением поправить:
#   server_name     — твой домен
#   root            — путь к папке
#   ssl_certificate — пути к сертификату
# И удали из .assetsignore строку /downloads/, иначе nginx-конфиг
# будет отдавать 404 на установщик. В этом же случае удали
# product.downloadUrl из js/config.js, чтобы кнопка вела на
# локальный файл.

nginx -t && systemctl reload nginx
```

`deploy/nginx.conf` уже умеет отдавать `.msi` с
`Content-Type: application/x-msi` и `Content-Disposition: attachment`.

---

## Вариант: Cloudflare R2 вместо GitHub

Если не хочется, чтобы файл лежал на стороне GitHub:

1. Создать бакет R2 в дашборде Cloudflare.
2. Загрузить `Nvis-Setup-1.0.0.msi`.
3. Вписать адрес в `product.downloadUrl` и `href` в `index.html`.

R2 отдаёт файлы без лимита на размер и с поддержкой `Range`, поэтому работает
докачка. Бесплатного тарифа (10 ГБ) хватит на десятки версий.

Имя файла при скачивании задаёт `Content-Disposition` — для R2 поставь
`Content-Disposition: attachment; filename="Nvis-Setup-1.0.0.msi"` в настройках
бакета.

---

## Заголовки

Готовые конфиги: `deploy/nginx.conf` и `deploy/_headers` (то же для
Cloudflare Pages / Netlify).

CSP отдаётся заголовками, а не через `<meta http-equiv>`: в `meta` не работает
`frame-ancestors`, и браузер применяет `meta`-CSP к служебным запросам вроде
`robots.txt`, из-за чего часть аудиторов его не читает.

Кэш: `css/` и `js/` — неделя, `assets/` — неделя, `index.html` — `no-cache`.

> Если будешь менять `css`/`js` без смены имени файла, браузер может долго
> показывать старую версию. Тогда убери `immutable` из секции кэша
> в `deploy/nginx.conf` либо добавь к имени файла хеш.

---

## Проверка перед выкладкой

```bash
cd nvis-site
python -m http.server 8000
```

- [ ] Кнопка скачивает установщик
- [ ] Переключатели темы и эффектов работают, состояние переживает перезагрузку
- [ ] Обе темы читаемы, контраст текста ≥ 4.5:1
- [ ] Все ссылки в шапке ведут на существующие разделы
- [ ] На телефоне одна колонка, кнопка на всю ширину
- [ ] Нигде нет наезжающих друг на друга блоков
- [ ] `/robots.txt` и `/sitemap.xml` отдаются с кодом 200
- [ ] В консоли браузера пусто

Lighthouse: Accessibility 1.00, Best Practices 1.00, SEO 1.00.

---

## Что запрещено в `_headers`

Только комментарии через `#`. Конструкция `/* ... */` не поддерживается и
ломает деплой ошибкой `Expected a colon-separated header pair` — строки `/*`
и `*/` парсер принимает за заголовки.