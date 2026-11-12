# PLUX Friends — регистрация пользователей по email

Проект Supabase: `lxwqpoakdsbpshfyfqih`

## Готово в GitHub

- `.github/workflows/plux-smtp-setup.yml` — автоматическое безопасное включение SMTP через официальный Supabase Management API, только вручную и только для ветки `main`.
- `ops/plux-smtp-setup.mjs` — проверка настроек и отправка конфигурации Supabase Auth.
- SMTP host: `smtp-relay.brevo.com`; port: `587`; sender name: `PLUX`; подтверждение email **остаётся включённым**.

## Что требуется перед первым запуском

1. [Зарегистрировать Brevo](https://www.brevo.com/) и подтвердить аккаунт. Нужна личная проверка владения email; ChatGPT не может пройти её вместо владельца.
2. Подтвердить свой отправляющий домен (через DKIM/DMARC/DNS) и адрес типа `no-reply@<ваш-домен>` в Brevo. Домены `gmail.com`, `mail.ru`, `yandex.ru` для профессионального отправителя не подходят.
3. В [Brevo SMTP](https://app.brevo.com/settings/keys/smtp) скопировать **SMTP login** и создать **SMTP key**. Ключ SMTP отличается от API key.
4. Создать [Supabase personal access token](https://supabase.com/dashboard/account/tokens) с правом конфигурирования проекта.
5. Добавить следующие **GitHub Actions repository secrets** в [Settings → Secrets and variables → Actions](https://github.com/zykinigor55-a11y/forma-visual/settings/secrets/actions):

   | Secret | Значение |
   | --- | --- |
   | `SUPABASE_ACCESS_TOKEN` | Персональный токен управления Supabase |
   | `BREVO_SMTP_LOGIN` | SMTP login, показанный в Brevo |
   | `BREVO_SMTP_KEY` | SMTP key, созданный в Brevo |
   | `PLUX_SENDER_EMAIL` | Полный email с подтверждённого домена |

   Нельзя вводить секреты в код, issue, pull request, чат или скриншот.

## Включение SMTP

1. Открыть [PLUX — configure Brevo SMTP for Friends registration](https://github.com/zykinigor55-a11y/forma-visual/actions/workflows/plux-smtp-setup.yml).
2. Нажать **Run workflow**, выбрать ветку `main`, отметить **sender_verified**, запустить.
3. Проверить, что оба задания `validate` и `configure` завершились успешно.
4. Открыть [PLUX Friends](https://supabase.com/dashboard/project/lxwqpoakdsbpshfyfqih/auth/smtp) и проверить, что custom SMTP включён.
5. На [ПЛЮХ](https://plux-v17-friends-preview.onrender.com/?v=3189) открыть «Друзья», создать тестовый аккаунт с реальной почтой, подтвердить письмо и войти. Для уже созданного неподтверждённого аккаунта использовать повторную отправку, **не** повторную регистрацию.

Пока нет подтверждённого Brevo-аккаунта, домена, отправителя и секретов — SMTP не включён. Встроенный SMTP Supabase предназначен только для тестирования и ограничен адресами команды проекта.

Источники: [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Brevo × Supabase SMTP](https://developers.brevo.com/docs/supabase-smtp-integration).
