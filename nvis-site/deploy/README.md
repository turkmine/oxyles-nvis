# Деплой страницы Nvis

Сайт полностью статический: 19 файлов, ~109 КБ, ни одной зависимости и ни
одного внешнего запроса. Подойдёт любой статический хостинг.

Отличие от био-сайта: здесь лежит **установщик на 57,4 МБ**, и это главный
момент, из-за которого выбор хостинга ограничен.

---

## ⚠️ Сначала: где будет лежать установщик

| Хостинг | Лимит на один файл | Подходит |
|---|---|---|
| Свой сервер (nginx, Caddy) | нет | Да, из коробки |
| Cloudflare Pages | **25 МиБ** | Нет |
| Cloudflare Workers (static assets) | **25 МиБ** | Нет |
| GitHub Pages | 100 МБ | Да, но неудобно: файл тянется на каждый деплой |

`Nvis-Setup-1.0.0.msi` — 57,4 МБ. На Cloudflare он просто не загрузится:
деплой упадёт с ошибкой про размер файла.

### Вариант А — сайт на своём сервере

Файл уже лежит в `downloads/`, `deploy/nginx.conf` умеет его отдавать.
Ничего менять не нужно, кроме `server_name` и путей к сертификату.

### Вариант Б — сайт на Cloudflare (R2)

1. Создай бакет R2 в дашборде Cloudflare.
2. Загрузи в него `Nvis-Setup-1.0.0.msi` (через консоль или `wrangler r2 object put`).
3. Впиши адрес в `js/config.js`:

```js
downloadUrl: 'https://files.твой-бакет.r2.cloudflarestorage.com/Nvis-Setup-1.0.0.msi',
```

Либо сделай публичный домен на бакете (Settings → Public access → Custom
domain) — тогда адрес будет короче и без токена.

4. Добавь `/downloads/` в `.assetsignore`, иначе Cloudflare попытается
   залить лишние 57 МБ и упадёт.
5. Продублируй адрес в `index.html` — по нему кнопка сработает при
   выключенном JS.

> R2 отдаёт файлы без лимита на размер и с поддержкой `Range`, поэтому
> работает докачка. Бесплатный тариф: 10 ГБ хранилища, этого хватит
> на десятки версий установщика.

> Имя файла при скачивании задаёт `Content-Disposition`. Для своего
> сервера это уже сделано в `deploy/nginx.conf`. Для R2 поставь
> `Content-Disposition: attachment; filename="Nvis-Setup-1.0.0.msi"` в
> настройках бакета — иначе откроется загрузка как «документ», и
> браузер подставит имя из ссылки. Атрибут `download` на ссылке
> работает только для своего домена, на внешний он игнорируется.

### Вариант В — GitHub Releases

1. `git tag v1.0.0 && git push --tags`
2. На GitHub: **Releases → Create a new release**, перетащи `.msi` в поле
   «Attach files».
3. Скопируй адрес `.../releases/download/v1.0.0/Nvis-Setup-1.0.0.msi` в
   `config.js → product.downloadUrl`.

Плюс: показывается число скачиваний и список версий. Минус: файл живёт
на стороне и адрес ведёт на чужой домен.

---

## Коротко: Cloudflare Workers

```bash
cd nvis-site
npx wrangler login
npx wrangler deploy
```

Адрес будет `https://nvis-site.<твой-поддомен>.workers.dev`. Перед деплоем
убедись, что `/downloads/` добавлен в `.assetsignore` (см. вариант Б),
иначе деплой провалится на размере файла.

`wrangler.jsonc` уже настроен: папка `./`, `not_found_handling: 404-page`
(иначе Cloudflare отдаст свою 404 вместо твоей), `html_handling:
auto-trailing-slash`.

Файл `.assetsignore` вычитывается только Workers, поэтому лежит в корне
проекта. `deploy/_headers` — копия на случай, если деплой идёт из `deploy/`.

---

## Коротко: свой сервер

```bash
# 1. Залить на сервер
scp -r nvis-site user@server:/var/www/nvis-site

# 2. Конфиг
cp nvis-site/deploy/nginx.conf /etc/nginx/sites-available/nvis
ln -s /etc/nginx/sites-available/nvis /etc/nginx/sites-enabled/nvis

# 3. Перед включением поправить:
#    server_name       — твой домен
#    root              — путь к папке
#    ssl_certificate   — пути к сертификату

# 4. Проверить и применить
nginx -t && systemctl reload nginx
```

Отсечь лишнее наружу — `.htaccess`-аналог для nginx в самой папке не нужен,
`location ~ /\.(?!well-known) { deny all; }` уже есть в конфиге.

---

## Заголовки

Готовые конфиги лежат в `deploy/` и в корне (`_headers`):

- `deploy/nginx.conf` — серверный блок целиком: TLS, редирект, заголовки,
  кэш, gzip и отдельный блок отдачи `.msi` с `Content-Disposition: attachment`
- `deploy/_headers` — то же для Cloudflare Pages / Netlify

CSP отдаётся заголовками, а не через `<meta http-equiv>`: в `meta` не
работает `frame-ancestors`, и браузер применяет `meta`-CSP к служебным
запросам вроде `robots.txt`, из-за чего часть аудиторов его не читает.

Кэш: `css/` и `js/` — неделя (в nginx-конфиге год с `immutable`), `assets/` —
неделя, `downloads/` — неделя, `index.html` — `no-cache`.

> Если будешь менять `css`/`js` без смены имени файла, браузер может
> долго показывать старую версию. Тогда убери `immutable` из соответствующей
> секции, либо добавь к имени файла хеш.

---

## Проверка перед выкладкой

```bash
# Локально
cd nvis-site
python -m http.server 8000
```

Открыть `http://localhost:8000` и проверить:

- [ ] Кнопка скачивает файл, размер совпадает с `downloads/`
- [ ] Переключатели темы и эффектов работают, состояние переживает перезагрузку
- [ ] Обе темы читаемы, контраст текста ≥ 4.5:1
- [ ] Все ссылки в шапке ведут на существующие разделы
- [ ] На телефоне одна колонка, кнопка на всю ширину
- [ ] `/robots.txt` и `/sitemap.xml` отдаются с кодом 200
- [ ] В консоли браузера пусто

Lighthouse: Accessibility 1.00, Best Practices 1.00, SEO 1.00.

---

## Что запрещено в `_headers`

Только комментарии через `#`. Конструкция `/* ... */` не поддерживается и
ломает деплой ошибкой `Expected a colon-separated header pair` — строки `/*`
и `*/` парсер принимает за заголовки.