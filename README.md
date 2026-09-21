# MERA E3.1 — Semantic Expedition

E3.1 keeps the proven Ecctrl/Rapier character-controller foundation and the large free-movement valley from E3, but changes the **game design**: each route choice now has a perceptual/mechanical consequence, and each nonce adjective describes a terrain property that the player actually experiences.

## Narrative premise

A storm knocked the Northern Outpost relay offline at 03:17. The player is a field worker sent across the reserve to restore the emergency relay before the next weather front. MERA NAV has the old survey map and terrain sensor data, but the storm has changed some routes. MERA advises; the player makes the final decisions.

At the outpost, the relay is restored, but MERA's local route cache is corrupted during handover. Another field worker will follow without MERA, motivating the final free-text route guide.

## Target concepts and grounding

### MENIC = narrow / laterally constrained
- West: the bridge is now physically narrow, with collision rails.
- East: the ford is broader/longer, but its far bank compresses into a narrow rock cut.
- Same exposure schedule whichever route is chosen.

### SILAR = sheltered / enclosed from wind
- West: dense pine canopy provides shelter, but a fallen storm trunk obstructs the direct line.
- East: the birch route is more direct but visibly exposed to animated storm gusts before a sheltered rock-and-birch pocket.
- The UI also briefly indicates when the player is in the exposed gust zone.

### VALEN = steeply rising
- East ridge: shorter but materially steeper and rockier.
- West switchback: longer and gentler, with the steep section delayed to the final approach.
- Terrain height itself differs, rather than the difference existing only in text.

## Exposure structure

For each target:

1. first use + ordinary-language gloss;
2. neutral route information;
3. route-specific partially glossed use at the actual perceptual instance;
4. bare target use after/near the experienced section.

Route choice therefore changes the journey but not the intended number of target-word exposures.

## Controls

- WASD / arrows: move
- Shift: run
- Space: jump
- mouse drag: camera

## Deployment

Upload these files to the GitHub Pages repository root:

- `index.html`
- `main.js`
- `styles.css`
- `README.md`
- `THIRD_PARTY_NOTICES.md`

No local asset folder is required in this pilot build; the model and PBR textures are loaded from their existing external sources.
