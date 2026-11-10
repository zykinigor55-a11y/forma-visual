# PLUX 13.0 — мобильные сборки

Это исходники Android и iOS на Capacitor с полным сохранением текущего UI из Render.

**Тестовая обёртка:** загружает опубликованный сайт через HTTPS. Нужен интернет. Ключи API хранятся только на Render, а не в APK.

## Android
В GitHub Actions открой «PLUX Android APK + iOS project». При успешной сборке в Artifacts появится «PLUX-Android-debug-APK». Скачай архив и установи app-debug.apk. Это отладочная сборка, не Google Play релиз.

## iPhone
В Artifacts появится «PLUX-iOS-Xcode-project». Для подписанной IPA или TestFlight понадобится аккаунт Apple Developer, Mac/Xcode и подпись приложения. Неподписанный проект нельзя установить на обычный iPhone.

## Локально
npm install
npx cap add android
python3 scripts/patch-native.py android
npx cap sync android
cd android && ./gradlew assembleDebug

Для iOS на macOS: npx cap add ios; python3 scripts/patch-native.py ios; npx cap sync ios.

Для публикации в App Store потребуется заменить remote server.url на упакованные веб-файлы и пройти проверку возможностей и разрешений.
