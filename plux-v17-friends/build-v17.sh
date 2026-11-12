#!/bin/sh
set -eu
unzip -oq PLUX_V10_2_RENDER_READY.zip -d /tmp/plux112source; mkdir -p plux-published; cp -a /tmp/plux112source/PLUX_CRYSTAL_V10/public/. plux-published/; cp plux-v103-overlay/icon-flow-v103.css plux-v103-overlay/icon-flow-v103.js plux-published/; cp plux-v105-overlay/chat-glass-v105.css plux-v105-overlay/chat-glass-v105.js plux-published/; cp plux-v106-overlay/seamless-v106.css plux-v106-overlay/seamless-v106.js plux-published/; cp plux-v107-overlay/aurora-v107.css plux-v107-overlay/aurora-sfx-v107.js plux-published/; cp plux-v111-overlay/balance-modes-v111.css plux-v111-overlay/balance-modes-v111.js plux-published/; cp plux-v112-overlay/reference-exact-v112.css plux-v112-overlay/reference-exact-v112.js plux-published/; node plux-v106-overlay/patch-app-v106.mjs plux-published; node plux-v107-overlay/patch-app-v107.mjs plux-published; node plux-v112-overlay/patch-app-v112.mjs plux-published; base64 -d plux-v113-overlay/v113_sources.tar.gz.b64 | tar xz -C plux-published; node plux-published/patch-app-v113.mjs plux-published; base64 -d plux-v114-overlay/v114_sources.tar.gz.b64 | tar xz -C plux-published; cp plux-v114-overlay/patch-app-v114-fixed.mjs plux-published/patch-app-v114.mjs; node plux-published/patch-app-v114.mjs plux-published; base64 -d plux-v115-overlay/v115_sources.tar.br.b64 | node -e "const z=require('node:zlib');const chunks=[];process.stdin.on('data',x=>chunks.push(x));process.stdin.on('end',()=>process.stdout.write(z.brotliDecompressSync(Buffer.concat(chunks))))" | tar xf - -C plux-published; node plux-published/patch-app-v115.mjs plux-published; for item in keyboard camera mic dock; do base64 -d "plux-v11-overlay/ref-assets/$item.webp.base64" > "plux-published/assets/ref-$item.webp"; done; for x in keyboard camera mic dock; do test -s "plux-published/assets/ref-$x.webp"; done; if command -v ffmpeg >/dev/null 2>&1; then export PLUX_FFMPEG="$(command -v ffmpeg)"; else npm install --prefix /tmp/plux112-ffmpeg --no-save --no-audit --no-fund ffmpeg-static@5.2.0; export PLUX_FFMPEG="$(node -p "require('/tmp/plux112-ffmpeg/node_modules/ffmpeg-static')")"; fi; node plux-v106-overlay/make-videos-v106.mjs plux-published/assets/videos plux-published/assets/videos-v106; node --check plux-published/reference-exact-v112.js; node --check plux-published/balance-modes-v111.js; grep -q '11.2-single-reference-glass' plux-published/index.html; if grep -q 'crystal-vessels-v108' plux-published/index.html; then exit 6; fi; if grep -q 'crystal-depth-v109' plux-published/index.html; then exit 7; fi; test -s plux-published/assets/videos-v106/01_idle.mp4; test -s plux-published/assets/videos-v106/05_happy.mp4; grep -q 'plux-release-v113' plux-published/index.html; node --check plux-published/liquid-metal-v113.js; node --check plux-published/patch-app-v113.mjs; test -s plux-published/liquid-metal-v113.css; node --check plux-published/touch-life-v114.js; node --check plux-published/patch-app-v114.mjs; test -s plux-published/touch-life-v114.css; grep -q 'plux-version-v114' plux-published/index.html; test -s plux-published/assets/videos-v106/01_idle.mp4; node --check plux-published/crystal-aura-v115.js; node --check plux-published/patch-app-v115.mjs; test -s plux-published/crystal-aura-v115.css; grep -q 'plux-release-v115' plux-published/index.html; base64 -d plux-v117-overlay/v116-v117-text.tar.br.b64 | node -e "const z=require('node:zlib');const c=[];process.stdin.on('data',x=>c.push(x));process.stdin.on('end',()=>process.stdout.write(z.brotliDecompressSync(Buffer.concat(c))))" | tar xf - -C plux-published; "$PLUX_FFMPEG" -nostdin -hide_banner -loglevel error -y -ss 0 -i plux-published/assets/videos-v106/01_idle.mp4 -frames:v 1 -vf scale=420:-1 plux-published/assets/onboard-idle-poster.png; sed -i 's/onboard-idle-poster.webp/onboard-idle-poster.png/g' plux-published/onboard-cinematic-v116.js plux-published/patch-app-v116.mjs; node plux-published/patch-app-v116.mjs plux-published; node plux-published/patch-app-v117.mjs plux-published; node --check plux-published/oled-cinema-v117.js; node --check plux-published/patch-app-v117.mjs; node --check plux-published/onboard-cinematic-v116.js; test -s plux-published/assets/onboard-idle-poster.png; grep -q 'plux-release-v117' plux-published/index.html; grep -q 'onboard-cinematic-v116.js' plux-published/index.html; test -s plux-published/assets/videos-v106/05_happy.mp4; cp plux-v120-overlay/reference-restored-v120.css plux-published/; node plux-v120-overlay/patch-app-v120.mjs plux-published; "$PLUX_FFMPEG" -nostdin -hide_banner -loglevel error -y -i plux-published/assets/videos-v106/01_idle.mp4 -frames:v 1 -vf scale=192:192 plux-published/icon-192.png; "$PLUX_FFMPEG" -nostdin -hide_banner -loglevel error -y -i plux-published/assets/videos-v106/01_idle.mp4 -frames:v 1 -vf scale=512:512 plux-published/icon-512.png; node --check plux-v120-overlay/patch-app-v120.mjs; grep -q 'plux-release-v120' plux-published/index.html; if grep -q 'crystal-system-v119' plux-published/index.html; then exit 19; fi; test -s plux-published/assets/mode-tiles/mode-1.webp; test -s plux-published/assets/mode-tiles/mode-6.webp; test -s plux-published/icon-192.png; test -s plux-published/icon-512.png; cp plux-v121-overlay/reference-motion-v121.css plux-v121-overlay/reference-motion-v121.js plux-published/; base64 -d plux-v121-overlay/modes-reference-atlas-v121.webp.b64 > plux-published/assets/modes-reference-atlas-v121.webp; node plux-v121-overlay/patch-app-v121.mjs plux-published; node --check plux-published/reference-motion-v121.js; node --check plux-v121-overlay/patch-app-v121.mjs; test -s plux-published/assets/modes-reference-atlas-v121.webp; grep -q plux-release-v121 plux-published/index.html; grep -q reference-motion-v121.js plux-published/index.html; test -s plux-published/assets/videos-v106/01_idle.mp4; test -s plux-published/assets/videos-v106/05_happy.mp4; cp plux-v122-overlay/plux-fix-v122.css plux-v122-overlay/plux-fix-v122.js plux-published/; cp plux-v122-overlay/ref-keyboard-crystal-v122.svg plux-v122-overlay/ref-camera-crystal-v122.svg plux-published/assets/; node plux-v122-overlay/patch-app-v122.mjs plux-published; "$PLUX_FFMPEG" -nostdin -hide_banner -loglevel error -y -i plux-published/assets/modes-reference-atlas-v121.webp -vf scale=2048:2826:flags=lanczos -frames:v 1 -c:v libwebp -q:v 88 plux-published/assets/modes-atlas-2k-v122.webp; "$PLUX_FFMPEG" -nostdin -hide_banner -loglevel error -y -i plux-published/assets/emerald-world.webp -vf scale=2048:-2:flags=lanczos -frames:v 1 -c:v libwebp -q:v 88 plux-published/assets/emerald-world-2k-v122.webp; "$PLUX_FFMPEG" -nostdin -hide_banner -loglevel error -y -i plux-published/assets/plux-liquid-logo.png -vf scale=2048:-2:flags=lanczos -frames:v 1 -c:v libwebp -pix_fmt yuva420p -q:v 88 plux-published/assets/plux-logo-2k-v122.webp; "$PLUX_FFMPEG" -nostdin -hide_banner -loglevel error -y -i plux-published/assets/ref-mic.webp -vf scale=2048:-2:flags=lanczos -frames:v 1 -c:v libwebp -q:v 88 plux-published/assets/ref-mic-2k-v122.webp; sed -i 's/modes-atlas-2k-v122.png/modes-atlas-2k-v122.webp/g; s/emerald-world-2k-v122.png/emerald-world-2k-v122.webp/g; s/plux-logo-2k-v122.png/plux-logo-2k-v122.webp/g; s/ref-mic-2k-v122.png/ref-mic-2k-v122.webp/g' plux-published/plux-fix-v122.css; node --check plux-published/plux-fix-v122.js; node --check plux-v122-overlay/patch-app-v122.mjs; grep -q 'plux-release-v122' plux-published/index.html; if grep -q 'Код тестового доступа' plux-published/index.html; then exit 14; fi; test -s plux-published/assets/modes-atlas-2k-v122.webp; test -s plux-published/assets/ref-keyboard-crystal-v122.svg; test -s plux-published/assets/ref-camera-crystal-v122.svg; test -s plux-published/assets/ref-mic-2k-v122.webp; test -s plux-published/assets/emerald-world-2k-v122.webp; test -s plux-published/assets/plux-logo-2k-v122.webp

# Stage additional features after the original approved PLUX build.
node plux-v17-friends/install-media-v17.mjs plux-published
node plux-v17-friends/apply-v17.mjs plux-published
node plux-v31/apply-v31.mjs plux-published
echo 'V316_CHECKPOINT: full-screen mascot CSS copied and linked'
node --check plux-published/plux-v129.js
node --check plux-published/plux-video-v16.js
node --check plux-published/plux-friends-v17.js
node --check plux-published/plux-save-v17.js
node --check plux-published/plux-microdust-v17.js
node --check plux-published/music-player-v31.js
node --check plux-published/drop-colors-v31.js
node --check plux-published/intro-asmr-v313.js
node --check plux-published/quick-orbs-v314.js
test -s plux-published/home-fix-v314.css
test -s plux-published/oled-v315.css
test -s plux-published/mascot-fullscreen-v316.css
grep -q 'mascot-fullscreen-v316.css' plux-published/index.html
grep -q 'oled-v315.css' plux-published/index.html
grep -q 'name="theme-color" content="#000000"' plux-published/index.html
grep -q 'home-fix-v314.css' plux-published/index.html
grep -q 'quick-orbs-v314.js' plux-published/index.html
test -s plux-published/home-contrast-v313.css
grep -q 'home-contrast-v313.css' plux-published/index.html
grep -q 'intro-asmr-v313.js' plux-published/index.html
if grep -q 'welcome-asmr-v31.js' plux-published/index.html; then echo 'duplicate ASMR script' >&2; exit 34; fi
if grep -q 'home-contrast-v31.css' plux-published/index.html; then echo 'duplicate home contrast' >&2; exit 35; fi
node --check plux-published/plux-gallery-v24.js
node --check plux-published/plux-music-v24.js
node --check plux-published/plux-modes-v26.js
node --check plux-published/plux-themes-v31.js
node --check plux-published/tools-v30-bridge-v31.js
test -s plux-published/plux-v26.css
test -s plux-published/plux-themes-v23.css
test -s plux-published/plux-v30.css
grep -q 'plux-gallery-v24.js' plux-published/index.html
grep -q 'plux-music-v24.js' plux-published/index.html
grep -q 'plux-modes-v26.js' plux-published/index.html
grep -q 'plux-themes-v31.js' plux-published/index.html
grep -q 'tools-v30-bridge-v31.js' plux-published/index.html
node --check plux-v31/apply-v31.mjs
node --check plux-v17-friends/install-media-v17.mjs
grep -q 'plux-friends-v17.js' plux-published/index.html
grep -q 'plux-microdust-v17.js' plux-published/index.html
grep -q 'music-player-v31.js' plux-published/index.html
grep -q 'plux31-equalizer' plux-published/music-player-v31.js
grep -q 'plux31-eq-dance' plux-published/music-player-v31.css
grep -q 'touchstart' plux-published/music-player-v31.js
grep -q 'drop-colors-v31.js' plux-published/index.html
test -s plux-published/index.html
# V31.8 feature gates: all additive modules must be bundled and linked.
for file in header-palette-v3184.js header-prompt-v3184.css video-hub-v318.js video-hub-v318.css ai-cognition-v318.js ai-cognition-v318.css microdust-enhanced-v318.js microdust-enhanced-v318.css microphone-permission-v318.js theme-motion-v318.css gemini-voice-v3183.js; do
  test -s "plux-published/$file"
  grep -q "/$file?v=3186" plux-published/index.html
done
for file in header-palette-v3184.js video-hub-v318.js ai-cognition-v318.js microdust-enhanced-v318.js microphone-permission-v318.js gemini-voice-v3183.js; do
  node --check "plux-published/$file"
done
test -s plux-published/plux-friends-v17.js
node --check plux-published/plux-friends-v17.js
node --check plux-published/plux-v129.js
test -s plux-published/assets/videos-v106/01_idle.mp4
test -s plux-published/assets/videos-v106/05_happy.mp4
echo "PLUX V31.8 OLED: V31.7 preserved; Nano Banana errors, Friends avatars, Video, AI core, microphone, brighter particles and themes bundled"

grep -q 'plux3184-prompt-count' plux-published/plux-v129.js

# V31.8.5 voice exclusivity, persistent account and profile avatar handling.
node --check plux-published/gemini-voice-v3183.js
node --check plux-published/plux-friends-v17.js
grep -q 'plux_friends_session_v3185' plux-published/plux-friends-v17.js
grep -q 'responseFinished' plux-published/gemini-voice-v3183.js
if grep -Eiq '<script[^>]*src=["\x27][^"\x27]*plux-live-v151\.js' plux-published/index.html; then
 echo 'competing ElevenLabs realtime script was not removed' >&2; exit 49
fi

# V31.8.6 voice memory must load before realtime Gemini; never include raw recordings.
node --check plux-published/voice-memory-v3186.js
node --check plux-published/gemini-voice-v3183.js
test -s plux-published/voice-memory-v3186.css
grep -q '/voice-memory-v3186.js?v=3186' plux-published/index.html
grep -q '/voice-memory-v3186.css?v=3186' plux-published/index.html
grep -q 'input_audio_transcription' plux-published/gemini-voice-v3183.js
