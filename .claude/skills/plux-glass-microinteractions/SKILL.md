---
name: plux-glass-microinteractions
description: Implement motion for PLUX's approved OLED/black-crystal mobile UI without introducing duplicate glass rims, moving icons or cropped buttons. Use for glass capsules, tools tiles, touch glows, onboarding typewriter, chat, microphone, and settings.
---

# PLUX Premium Glass Motion — Design & Interaction

## Approved visual direction

The app uses OLED black (`#000000`), dark transparent optical glass with visibly thick refracting edges, soft emerald/cyan internal light and restrained violet accents. The **existing approved PLUX screenshots and image assets are the source of truth**. Do not approximate approved visuals with unrelated generic CSS gradients or regenerate the mascot.

The six mode tiles already contain their designed icons and labels **inside the images**. Use one source of icons and labels, never draw duplicate SVG/text over the image. Preserve exact icon centering and text geometry. Keep all three home controls fully visible (keyboard, central microphone, camera), including their lower glass edges; give the dock a safe bottom inset above the Android system bar.

## Glass animation behaviors

- Idle: small slow traveling internal illumination; 8–14s oscillation, no flashing, no intrusive constant neon. Keep the center dark and the thick refractive boundary readable.
- Tap / touch hold: light intensifies and the element moves by at most 2–4%; on `pointerup`, `pointercancel`, `pointerleave`, page blur or background visibility change, immediately settle back without a stuck state.
- Selected tab: indicate the active state separately from transient press feedback, with a subtly brighter inner glow. **Do not** use the same stuck press class for selection.
- Icons can move a tiny amount (about 1–2 px); all label positions stay fixed. Never animate layout measurements in a way that shifts neighbors.
- Prefer `transform` and `opacity` for high-frequency animation. Moving a fullscreen heavy CSS filter can cause paint/decode stalls while the mascot video is playing.
- Use one optical shell and one illumination layer. Avoid duplicated white borders, nested pseudo-element rims or multiple conflicting old overlay scripts. Test DOM-specificity before applying a new layer.

## Typewriter behavior

- First onboarding visit: play a short welcome in sequence; do not block name entry.
- Later home visits: optionally type only a short greeting, not the full introduction on every route change.
- For a new chat response, reveal just the new message. Do not retype older messages during rerender.
- Set delays relative to screen visibility, not early `DOMContentLoaded` alone. Prevent race conditions if route changes or components mount late.
- Keyboard/sound: on the web, audio effects require a user gesture to unlock `AudioContext`. Never claim autoplay sounds before first gesture. Respect mute and accessibility preferences.
- Avoid breaking screen readers: prefer a stable accessible text equivalent; `aria-live` should not announce each individual character.

## Implementation patterns

- Use the existing GSAP skills: `gsap-core`, `gsap-timeline`, and `gsap-performance` for interruptible motion and cleanup.
- Use `gsap.context()` or scoped selectors when appropriate; `context.revert()` on teardown.
- For touch, prefer pointer events, with a Map keyed by pointerId, and cleanup of all active targets when tab hides.
- Preserve original Five Video mascot playback; do not put GPU-heavy special effects over its whole surface.
- Apply `@media (prefers-reduced-motion: reduce)` to stop decorative loops. Avoid hover-only effects on touch devices.
- Audio: subtle glass click and optional soft typing; no rapid sound spam, no artificial speech claims.

## Phone QA before calling it finished

At minimum, inspect on 360×780, 393×852, 412×915. Confirm:

1. Each of the six mode cards has exactly one icon and one readable label, with no shifts.
2. Keyboard, microphone and camera are centered and **fully visible**, not cropped; dock stands clear of Android safe-area.
3. Voice mode side buttons and the text-chat capsule are not clipped.
4. Touch glow clears on finger release, cancel, navigation and app background.
5. Animated greeting starts when shown and can be skipped; screen still works if animation/audio are disabled.
6. Buttons remain real interactive controls with accessible labels.
7. No console errors, no broken navigation, no loss of the original videos.

Report which checks were actually completed. Screenshot-only or still-image tests do not prove motion frame rate or mobile sound behavior.