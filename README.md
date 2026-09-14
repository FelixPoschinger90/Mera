# MERA — Professional Rebuild V4

This version is a quality-focused rebuild of the small playable slice. It deliberately contains no linguistic task.

## Main changes from V3

- Ground-hugging curved trails instead of floating box/slab paths.
- Stream geometry and river valley use the same coordinate function.
- Bridge is built against the actual banks and has a dedicated walkable surface.
- Ford stones are placed on the actual stream bed.
- Character grounding uses the bridge deck when on the bridge, eliminating the "walking through air" mismatch.
- Physical collision against rocks and trees.
- Slope limits and obstacle sliding.
- The stream itself is a barrier except at the chosen bridge/ford.
- Branches remain mutually exclusive after the choice.
- Proper external stylised GLB character is attempted first; smooth fallback only if the network asset fails.
- Proper external deer GLB is attempted first; anatomically shaped fallback only if the network asset fails.
- CC0 Kenney trees/rocks are loaded from a public CDN and replace fallback scenery when available.
- Smoother trailing/shoulder third-person camera.
- Denser grass, fog, atmospheric landscape, clouds, water shader, shadows and ambience.
- No research-looking text during gameplay.

## Deploy on the existing GitHub Pages repository

Replace the repository root files with:

- `index.html`
- `styles.css`
- `game.js`

Keep Pages set to `main` / `(root)`.

Then wait for deployment and do a hard refresh (`Ctrl+F5`).

## Controls

- WASD / arrows: move
- Shift: run
- drag mouse: look
- mobile: left stick + right-side look + RUN

## Asset sources / licensing

Runtime tries to load:
- KayKit/vsim bundled adventurer models (KayKit source is CC0; vsim documents the bundled KayKit adventurers as CC0).
- vsim deer model (generated animal asset; vsim is MIT and documents its bundled asset library separately).
- Kenney environment GLBs redistributed by `syuhei176/ai-game-assets` as CC0.
- UMRAM-Bilkent human model as a final character fallback; its repository states the underlying Quaternius character and prepared model are CC0.

The game itself remains a browser-only static site. No participant/research data is transmitted.

## Scope

This is still a **vertical slice**, not the final experiment. The current goal is to make movement, collision, geography, wildlife, visual composition and basic game feel credible before any lexical manipulation is added.
