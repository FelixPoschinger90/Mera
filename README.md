# MERA — Visual Milestone 1 (zero budget)

This build deliberately tackles only the visual/spatial milestone before the linguistic experiment is added.

## Scope

- Real Three.js 3D world — not a background plate.
- Small authored valley with highly constrained traversable corridors.
- Outpost visible from the beginning.
- Two physical river crossings: custom-built timber bridge and shallow ford.
- Custom-authored terrain, river, bridge, distant cliff/outpost, waterfall and mountain backdrop.
- CC0 Poly Haven PBR surfaces for forest floor, dirt trail, weathered timber and mossy stone.
- Rigged third-person human base loaded from the Three.js sample library, recolored and dressed in-browser with a muted traveller silhouette and backpack.
- Walk / run / idle clips are taken from the Three.js Soldier sample and retargeted to the traveller by matching Mixamo bone names.
- No AI navigation dialogue, nonce words, survey, or final text task yet.

## Why this build is different

Previous prototypes tried to make the *art* procedurally out of simple shapes. This milestone uses the procedural code mainly to author the level geometry, while the visible surfaces are PBR and the player is a real rigged human mesh. The bridge and outpost are intentionally custom-built because those are small, scene-defining objects and do not justify buying assets.

## Deployment

Put these files at the GitHub Pages root:

- `index.html`
- `styles.css`
- `game.js`

The page loads Three.js from jsDelivr and CC0 textures/HDRI from Poly Haven at runtime. An internet connection is therefore required for the first load.

## Controls

- WASD / arrow keys: move
- Shift: run
- drag mouse / pointer: camera

## Licensing / asset notes

Environment surface textures and HDRI: Poly Haven, CC0.

Prototype human/animation bases are loaded from the public Three.js example asset CDN. These are used only as an embedded prototype dependency here; for a final research release, the character pipeline should be replaced by a fully redistributable CC0/owned human export (e.g. MakeHuman or another explicitly redistributable source) before archiving the stimulus package.

## Acceptance criterion for Milestone 1

Do **not** proceed to the AI/lexical layer unless this slice is visually convincing enough that a participant would voluntarily move through it for several minutes. If the traveller or environment still looks too prototype-like, the next work should be art/asset replacement, not experimental logic.
