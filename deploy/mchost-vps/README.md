# DOM.RENDER → MCHost VPS (подготовка, не включено)

Это подготовительные файлы для переноса **только** ветки `dom-render-nanobanana` на VPS MCHost. Сам VPS ещё не куплен и не настроен. Существующие сервисы Render и хостинг ZYKINA ART не изменяются.

## Почему так

На виртуальном MCHost нельзя постоянно запускать Node.js. На VPS будет работать тот же `server.mjs` и обслуживать **и статику, и /api/**. Это сохраняет единый origin; не требуется менять сотни клиентских ссылок и включать CORS.

## Первый запуск (Ubuntu 24.04)

1. Купить VPS, установить Ubuntu 24.04, добавить SSH-ключ администратора. Не публиковать пароли и приватные ключи в чатах или репозитории.
2. Настроить брандмауэр: SSH (желательно доступ только с доверенных IP), HTTP 80 и HTTPS 443. Не открывать порт 3000.
3. Установить `git`, `curl`, `nginx`, `certbot`, `python3-certbot-nginx`, `flock` (`util-linux`) и **Node.js 20+** из доверенного репозитория.
4. Создать отдельного системного пользователя без SSH-доступа:
   `sudo useradd --system --home-dir /var/lib/forma-visual --create-home --shell /usr/sbin/nologin forma`.
5. Скопировать код в `/srv/forma-visual/app`:
   `sudo mkdir -p /srv/forma-visual && sudo git clone --single-branch --depth 1 --branch dom-render-nanobanana https://github.com/zykinigor55-a11y/forma-visual.git /srv/forma-visual/app`.
   Репозиторий большой: заранее проверить место на диске.
6. Вручную создать `/etc/forma-visual.env`, права 600, владелец root, например:
   `HOST=127.0.0.1`, `PORT=3000`, `API_MARKET_KEY=...`, `DAILY_GENERATION_LIMIT=12`. Никогда не коммитить реальные ключи.
7. Установить `forma-visual.service` в `/etc/systemd/system/`, выполнить `sudo systemctl daemon-reload && sudo systemctl enable --now forma-visual`. Проверить `curl -fsS http://127.0.0.1:3000/api/status` (HTTP 200; `ready=false` при отсутствии ключа).
8. Установить `nginx-forma.conf` как `/etc/nginx/sites-available/forma-visual`, заменить `REPLACE_WITH_YOUR_DOMAIN`, включить сайт через symlink, выполнить `sudo nginx -t && sudo systemctl reload nginx`.
9. Настроить DNS A-запись на VPS и **после** её распространения выпустить сертификат: `sudo certbot --nginx -d YOUR_DOMAIN`. До успешного HTTPS не открывать продукт публично.
10. Проверить визуально 3D, GLB, загрузку изображений, /api/status и платную генерацию **с новым ключом и ограничениями**.

## Автодеплой — НЕ встроенная функция MCHost

Файл `.github/workflows/mchost-vps-deploy.yml` подготовлен для GitHub Actions. Пока он **только ручной** (`workflow_dispatch`) и запускается лишь из `dom-render-nanobanana` после переноса workflow туда.

После создания VPS:
- Создать отдельного SSH-пользователя `deploy` и разрешить ему только `sudo /usr/local/sbin/forma-deploy <sha>` без пароля через строго ограниченную запись sudoers. Не давать общий passwordless sudo.
- Установить `forma-deploy.sh` как `/usr/local/sbin/forma-deploy` с владельцем root и правами 755.
- Установить публичный SSH-ключ CI-пользователя в `~deploy/.ssh/authorized_keys`, закрытый ключ — исключительно в **GitHub Actions Secrets**.
- В Settings → Secrets and variables → Actions задать `DOM_VPS_HOST`, `DOM_VPS_USER`, `DOM_VPS_SSH_PRIVATE_KEY`, `DOM_VPS_KNOWN_HOSTS`, `DOM_VPS_PORT`.
- Отпечаток сервера `KNOWN_HOSTS` проверить по доверенному каналу, а не слепо через ssh-keyscan.
- Проверить первый ручной deploy и откат. Затем отдельным изменением workflow добавить триггер `push` только на `dom-render-nanobanana`.

## Важно

В текущем коде нет полноценной авторизации и постоянного учёта платных AI-запросов; дневной лимит хранится в памяти и сбрасывается при перезапуске. **Не открывать публично платные API до включения авторизации/жёстких лимитов расходов.** Наличие VPS не заменяет внешнюю оплату AI API. Отдельные прикладные данные, если они будут храниться на сервере, должны иметь резервные копии отдельно от git.

`forma-deploy.sh` делает проверку commit SHA, `node --check`, restart и /api/status с откатом к предыдущему git-commit при ошибке.
