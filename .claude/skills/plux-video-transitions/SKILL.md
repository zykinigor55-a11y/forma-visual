---
name: plux-video-transitions
description: Preserve and smoothly play PLUX's five original video emotions on mobile browsers. Use when switching PLUX states, optimizing video transitions, handling playback freezes, or comparing a 3D substitute with original assets.
---

# PLUX Original Video Animation — Production Rules

## Non-negotiable source of truth

The PLUX mascot remains the **five original video files**, not a newly modeled Three.js droplet. Do not replace their appearance or personality without an explicit new user decision:

- `01_idle.mp4` — calm idle
- `02_listening.mp4` — listening
- `03_thinking.mp4` — thinking
- `04_talking.mp4` — speaking
- `05_happy.mp4` — happy/reaction

The originals are opaque H.264, 720×1280, 24 fps, around 5 seconds each, and their first and last frames do **not** match. They cannot be made mathematically seamless merely by adding `loop` or CSS `transition`. Never claim seamless playback without examining the actual frame boundaries and testing real hardware.

## Playback architecture

1. Separate **visual state** from speech/audio state. Adopt explicit states: `idle`, `listening`, `thinking`, `talking`, `happy`, plus `error`/fallback.
2. Avoid setting `video.src`, `load()`, or calling `play()` repeatedly when the effective visual state is unchanged. Frequent voice/audio events must not restart the same video.
3. Prefer an active and a standby video layer for *short opacity crossfades*. Preload only the next probable state to avoid multiple competing decoders on low-memory Samsung/Android devices. Keep transitions responsive if the standby asset cannot decode quickly.
4. Always use `muted`, `playsinline`, `preload="metadata"` or tuned `auto`, `poster`, and `video.play().catch(...)`; comply with mobile autoplay restrictions.
5. At scene boundaries, pause/disable hidden video layers, and resume on `visibilitychange` from a stable state. Use `AbortController` or an increasing request token to discard stale async transitions.
6. Default to `playbackRate = 1`, not 1.5; let the real-world motion be seen. Faster playback is an opt-in effect, not a permanent setting.
7. For looping: retain the source, first test whether a pose-matched crop or very short end-to-start blend helps, and watch for double images. For `happy`, a single short playback then return to idle is often preferable to a loop.
8. The original video has an opaque dark background. A CSS alpha fade blends two entire rectangular frames, not just the character. Do not promise a perfect silhouette cutout without a real alpha asset or segmentation.

## Timing and voice state changes

- `tap microphone` → request consent / start listener → `listening`.
- New user transcript → `thinking`.
- Actual agent speech begins → `talking`.
- Speech ends → `idle`, or `happy` only after a deliberate reaction.
- On interruption: promptly stop the talking visual and go back to listening.
- If ElevenLabs/server credentials are missing, show accurate fallback copy and never pretend real conversation is working.

## Performance and QA

- Measure decode stalls with `requestVideoFrameCallback` where supported and record delivered/presented frames; use `getVideoPlaybackQuality()` when available.
- Keep CSS animated transforms/opacity compositor-friendly. Do not stack fullscreen `filter: blur()` and `backdrop-filter` above playing videos.
- Test at 360×780, 393×852, 412×915, then on the actual Samsung Android browser. Verify screen transitions, tab backgrounding, repeated state calls, play rejections, dropped frames, and battery/performance.
- Preserve original source files, preferably with backup names and checksums. Reencoded files should be additional assets with traceable lineage.
- A passing Chromium/desktop capture is **not** evidence of good Samsung playback.

## Deliverables and honesty

When implementing, provide an actual code diff/ZIP or a verified deployed URL. State exactly which tests ran and distinguish local/desktop validation from phone validation. Never substitute a picture for a functioning animation.