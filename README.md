# MERA — V6 Attempt 1

This is the first rebuild of MERA around the actual study concept rather than the earlier open-world prototype logic.

## What changed

- The level is treated as a **small authored scenic corridor** rather than a freely explorable island.
- The **outpost is visible as the fixed destination** from the start.
- The player physically walks the route: choosing bridge or ford **unlocks that branch** instead of triggering an automatic crossing cinematic.
- Off-trail movement is deliberately limited to a few metres so the scene can be visually dense without letting the participant wander into the wilderness.
- Ground and trail materials now use procedural surface textures instead of flat colour alone.
- The fallback traveller has a coat, boots, tied-back hair and backpack, with free hands and no weapons.
- A permanent outpost landmark, richer fallback trees, water-bank vegetation, deer, rocks and path scenery remain part of the playable scene.
- The game contains an initial **MERA NAV** overlay with placeholder novel lexical items.
- Route choice, AI messages, timing, outpost arrival and final free-text directions are logged.
- At the outpost, the AI goes offline and the participant writes a guide for the next traveller.
- Pilot data can be downloaded locally as JSON.

## Placeholder lexical configuration

At the top of the study-state section in `game.js`:

```js
const STUDY={
  items:{bridge:'menic',ford:'silar',ridge:'valen'},
  ...
};
```

These are only placeholders for testing pacing. The final lexical items, gloss schedule and experimental conditions can be swapped here later.

## GitHub Pages deployment

Upload/replace these files in the root of the repository:

- `index.html`
- `styles.css`
- `game.js`

GitHub Pages serves the files directly. The current build loads Three.js and several optional 3D assets from CDN URLs. If a remote model fails, the scene has local procedural fallbacks rather than failing to start.

## Controls

- WASD / arrow keys: move
- Shift: run
- Mouse drag: look
- Mobile: joystick + look pad + run button

## Current status

This is **Attempt 1**, intended to test the new level architecture and study flow. It is not yet the final visual-quality pass. The generated cinematic valley image remains the art-direction target; the next iterations should focus primarily on higher-quality authored 3D assets, terrain dressing, vegetation density/composition, bridge/ford dressing, character model quality and lighting/post-processing.
