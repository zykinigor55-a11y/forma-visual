# Перенос ПЛЮХ на Beget VPS — полный комплект

**Что включено:** актуальный опубликованный интерфейс PLUX V21 (через проверенную сборку Render), пять оригинальных видео капли, PWA/иконки, звуки, сервер Node.js для чата, изображений, PDF, генерации видео, Cyhub и Arkheon Realtime. Интерфейс и API обслуживаются **одним HTTPS-доменом**, без запросов к старому Render.

## Перед началом

- Требуется **Beget VPS** (рекомендация: Ubuntu 24.04, Node.js 22 LTS, nginx, 2 GB RAM или больше). Для обычного виртуального хостинга конфигурация другая.
- Домен или поддомен, A-запись которого указывает на IPv4 VPS. Пример: `plux.example.ru`. При переносе с Render существующие DNS-записи не меняются автоматически.
- SSH-доступ к VPS / терминал в панели Beget и root-доступ.
- Приватные ключи для подключённых AI-провайдеров. **Не сохраняйте ключи в GitHub, чате и публичных папках сайта.**
- Render оставляем работающим до успешного теста Beget. Beget сообщал о восстановительных работах в ноябре 2026 года.

## Получить архив

GitHub → Actions → **PLUX Beget full release** → последний успешный запуск → Artifacts → `PLUX-Beget-release`. Распакуйте ZIP, внутри будет `PLUX-Beget-release.tar.gz`.

## Установка в консоли VPS

Вместо `plux.example.ru` укажите **свой реальный домен**.

```bash
# Скопируйте PLUX-Beget-release.tar.gz на сервер (WinSCP/SFTP или scp)
tar -xzf PLUX-Beget-release.tar.gz
cd plux-beget-release
sudo bash install.sh plux.example.ru
```

Если установщик сообщает об отсутствии Node 20+, установите **Node.js 22 LTS** из официального репозитория и повторите команду. Для SSL понадобится действующая DNS A-запись.

Приватные переменные сервера:
```bash
sudo nano /etc/plux/plux.env
# Внесите только уже используемые ключи из Render Environment:
# API_MARKET_KEY, API_MARKET_IMAGE_KEY (если требуется)
# CYHUB_API_KEY (если используется)
# ARKHEON_API_KEY (для живого голоса)
# ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, PLUH_DEMO_CODE (если используете старые режимы)
sudo systemctl restart plux
```

После настройки DNS и сертификата:
```bash
sudo certbot --nginx -d plux.example.ru --redirect
curl -I https://plux.example.ru/
curl https://plux.example.ru/api/health
curl -H 'Origin: https://plux.example.ru' https://plux.example.ru/api/arkheon/config
```

`/api/health` проверяет старый ElevenLabs-demo-режим; `ready: false` там не означает, что Arkheon не работает. Для Arkheon смотрите `/api/arkheon/config` и проверяйте живой диалог на телефоне.

## Как это устроено

- `/opt/plux/www`: весь веб-интерфейс и PWA, обслуживается Nginx.
- `/opt/plux/server`: сервер Node.js, доступен только на `127.0.0.1:8080`.
- `/api/*`: запросы проксируются Nginx на локальный Node.js. Ключи API остаются на сервере.
- `/etc/plux/plux.env`: секреты с правами 0600; при повторной установке не перезаписываются.
- `/etc/systemd/system/plux.service`: автозапуск и перезапуск Node.js.
- `/var/backups/plux-before-beget-*.tgz`: резервная копия **предыдущей Beget-версии ПЛЮХ**, если есть.

Логи: `sudo journalctl -u plux -n 100 --no-pager`. Статус: `sudo systemctl status plux`. SSL: `sudo certbot renew --dry-run`.

## Важные ограничения

- Это перенос сервера и браузерного приложения. **Уже установленные APK и iPhone IPA** продолжают открывать старый адрес Render, пока их `mobile-plux/capacitor.config.ts` и `mobile-plux/www/index.html` не заменить на новый домен и не пересобрать.
- Без ввода приватных API-ключей генерация и голос работать не будут.
- Для переключения домена и окончательного подтверждения переноса требуется проверить чат, загрузку фотографий, генерацию видео, разговор на русском, все пять видео капли и звук печатания.
- Не выключайте Render до тестирования всей функциональности и смены адреса в мобильных сборках.
