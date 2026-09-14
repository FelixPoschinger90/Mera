# MERA — Professional Rebuild V5

V5 is a polish-and-playability pass over V4. It still contains **no linguistic task**.

## Main fixes

- **Western route is now guaranteed open after the bridge.** All scenery placement checks the actual south/west/east/north path polylines, with a broad clearance corridor. Random rocks or trees can no longer seal the authored trail.
- **Visible continuation after the bridge.** The western trail is wider and gains subtle edge stones so it reads as a continuous route into the animal-trail section.
- **Free-handed player character.** The first-choice runtime character is now the clean rigged CC0 human model rather than the armed rogue/knight. Any fallback adventurer model has sword/shield/bow/quiver/etc. nodes explicitly hidden.
- **No weapons in the procedural fallback**, with explicit hand geometry.
- **Camera collision pass.** The third-person camera pulls inward before clipping through nearby trees and boulders.
- **Richer riverbanks.** Reed coverage makes the stream sit more naturally in the landscape.
- Existing V4 improvements remain: aligned stream/bridge/ford geometry, ground-hugging paths, physical rock/tree collision, slope limits, route-gated water crossings, deer behaviour, atmosphere, water shader and audio.

## Deploy

Replace these files in the root of your existing GitHub Pages repository:

- `index.html`
- `styles.css`
- `game.js`

Commit, wait for Pages to redeploy, then hard-refresh with **Ctrl+F5**.

## Controls

- WASD / arrows: move
- Shift: run
- mouse drag: camera
- mobile: virtual stick + look area + RUN

## Current objective

This remains a short professional-game-feel vertical slice. We are intentionally not adding the research task until the environment, character movement, navigation and wildlife are credible enough that a participant would play voluntarily.
