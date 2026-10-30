# Chromium Dinosaur source

Upstream: https://github.com/chromium/chromium/tree/120.0.6099.109/components/neterror/resources
Version: Chromium 120.0.6099.109. License: BSD (see LICENSE in this directory).

Copied official files: offline.js, offline-sprite-definitions.js, constants.js;
public/vendor/chromium contains the original 1x/2x sprites and three MP3 sounds.
index.html embeds those MP3 bytes as data URIs, as expected by offline.js.

Changes to upstream game source: offline.js imports ./load-time-data.js
instead of chrome://resources/js/load_time_data.js. That new module supplies a
browser-compatible localized data adapter and leaves optional alternate modes disabled.
offline.js also scales horizon update time and traveled distance by an application-controlled
scrollRate (default 1). Dinosaur physics, animation, input timing and acceleration
retain their original real-time behavior. Horizontal obstacle and ground movement
retain fractional pixels so 0.1x scrolling does not stall due to per-frame rounding. The visible five-level selector replaces the hidden binary
speed setting through src/speed-control.js.
Night mode uses a separate standard-rate distance counter so map speed does not
change its timing; the counter resets on restart. An application-controlled
invincible flag (default false) bypasses obstacle collision detection.
The integration and motion input live separately in src/main.js; original game
physics, collision detection, drawing, keyboard controls and score logic are retained.
