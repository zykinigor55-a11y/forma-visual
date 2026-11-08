# ПЛЮХ: мобильный голосовой тест

Веб-сервер Node.js без внешних npm-пакетов. Отдельная ветка GitHub, не затрагивающая основной проект Forma Visual.

## Запуск в Render
Root Directory: pluh-voice-server
Runtime: Node
Build command: npm install
Start command: npm start
Branch: pluh-voice-server

Переменные Environment (никогда не записывать ключи в GitHub):
- ELEVENLABS_API_KEY: новый приватный ключ ElevenLabs с доступом к ElevenAgents
- ELEVENLABS_AGENT_ID: agent_7501m6wt1wm5efybwty352yqned2
- PLUH_DEMO_CODE: придуманный отдельно пароль длиной 12+ символов для защиты демо

Затем открыть HTTPS URL Render на телефоне, ввести PLUH_DEMO_CODE (не API-ключ), разрешить микрофон и нажать «Начать разговор».

В приложении запрос signed URL к ElevenLabs выполняется только на сервере. Прямой ключ никогда не передаётся телефону.

Примечания:
- реальный разговор не подтверждён, пока не задан ключ и не выполнен тест с телефона;
- интерфейс использует временный встроенный SVG-образ ПЛЮХа, не финальное Kling-видео;
- браузерный аудиомодуль использует WebSocket с PCM и WebAudio, для релиза нужно усилить авторизацию, лимиты и мониторинг;
- бесплатный Render может уходить в сон, вызывая задержку первого подключения.
