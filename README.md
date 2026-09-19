# MERA — E3 Study Valley

E3 is the first build shaped around the planned experiment rather than only technical proof.

## What changed from E2

- The playable valley is substantially larger (roughly 160 x 500 world units).
- Movement remains free inside the compact basin; paths guide, but do not constrain, the player.
- Three physical route decisions are built into the geography, with natural crags/ridges preventing a straight-line bypass:
  1. old bridge vs shallow ford;
  2. pine trail vs birch hollow;
  3. rocky ridge vs switchback ascent.
- The outpost remains the fixed northern destination and ends gameplay.
- MERA NAV now demonstrates the intended exposure structure using configurable placeholder nonce adjectives:
  - `menic` = narrow / one-person-wide;
  - `silar` = sheltered / enclosed;
  - `valen` = steeply rising.
- Each item is shown in three stages: glossed -> partial support -> bare use, with ordinary messages interleaved.
- Route choice and lexical exposure are logically separate: both branches expose the same concept.
- The green rod vegetation from E2 has been replaced with transparent crossed-plane grass/reed clumps.
- A final free-text "guide the next traveller" screen appears at the outpost.
- Pilot data can be downloaded as JSON after saving the guide.

## Controls

- WASD / arrows: move
- Shift: run
- Space: jump
- Mouse drag: orbit camera

## Important status

This is still a structural research prototype. The nonce items are placeholders, the scripted messages are not final experimental wording, and JSON export is for local piloting only. No live LLM is used.

## Deploy

Upload all five files to the root of the GitHub Pages repo:

- `index.html`
- `main.js`
- `styles.css`
- `README.md`
- `THIRD_PARTY_NOTICES.md`

No asset folder is required. Runtime 3D/model/texture dependencies are loaded from the pinned CDN URLs in `index.html` / `main.js`.
