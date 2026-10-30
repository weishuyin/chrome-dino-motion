# Chromium Dinosaur source

Upstream: https://github.com/chromium/chromium/tree/120.0.6099.109/components/neterror/resources
Version: Chromium 120.0.6099.109. License: BSD (see LICENSE in this directory).

Copied official files: offline.js, offline-sprite-definitions.js, constants.js;
public/vendor/chromium contains the original 1x/2x sprites and three MP3 sounds.
index.html embeds those MP3 bytes as data URIs, as expected by offline.js.

Only change to upstream game source: offline.js imports ./load-time-data.js
instead of chrome://resources/js/load_time_data.js. That new module supplies a
browser-compatible localized data adapter and leaves optional alternate modes disabled.
The integration and motion input live separately in src/main.js; original game
physics, collision detection, drawing, keyboard controls and score logic are retained.
