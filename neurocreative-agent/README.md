# Нейрокреатив — VIZORLAB Chat

Приватная веб-панель для группы «Нейрокреатив» (ID 42).

## Возможности
- Чтение до 200 сообщений с обновлением каждые 30 секунд при открытой странице.
- Отправка текста и вложений через API VIZORLAB (до 8 МБ).
- Банк идей для нейровидео; добавление выбранной идеи в черновик.
- Опциональный ИИ-сценарист с OpenAI API.
- Пароль, HTTP-only cookie, CSRF-защита, ограничение попыток входа.
- Не сохраняет историю сообщений на сервере.

## Публикация на Render
1. Создайте Web Service для репозитория zykinigor55-a11y/forma-visual, ветка neurocreative-agent.
2. Plan: free; Region: Frankfurt; Runtime: Node.
3. Build command: `cd neurocreative-agent && npm install`
4. Start command: `cd neurocreative-agent && npm start`
5. Environment:
   - `NODE_ENV=production`
   - `ADMIN_PASSWORD` — собственный пароль от 12 символов
   - `SESSION_SECRET` — криптографически случайные 64 hex-символа
   - `VIZORLAB_SHARE_URL` — полная HTTPS-ссылка доступа с новым токеном
   - `OPENAI_API_KEY` — необязательно, для генерации сценариев
6. Проверьте /health, затем вход, чтение группы и тестовую отправку.

Не публикуйте VIZORLAB_SHARE_URL и пароль в репозитории. Старый токен рекомендуется перевыпустить.
Если chat.vizorlab43.ru не разрешается со стороны Render, потребуется исправить внешний DNS/HTTPS на стороне VIZORLAB.

Основная ветка main используется для других проектов и не затрагивается.
