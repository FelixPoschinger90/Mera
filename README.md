# MERA — Milestones 1B + 1C + 1D

This build keeps the accepted Milestone 1 landscape and the performant Milestone 1B rendering architecture, then completes the two outstanding tasks:

## MS1C — Traveller rebuild

- The problematic XRCLOUD avatar has been removed completely.
- Primary traveller base is now the lightweight **Quaternius Universal Base Characters** CC0 humanoid served from a public GitHub copy.
- The imported body is normalized strictly from its real bounding box: upright root, fixed 1.73 m height, centered X/Z, and bounding-box minimum placed exactly at local `y=0`.
- No animation retargeting is used. This specifically avoids the skeleton/orientation failure visible in the previous build.
- Walking/running/idle motion is applied directly and non-destructively to detected humanoid bones relative to their captured rest pose. Each frame begins from the rest transforms, so rotations cannot accumulate into a twisted/inverted body.
- Traveller clothing is attached to the actual rig bones: olive sleeves/coat, dark trousers, brown boots, dark hair/bun, fitted brown backpack and bedroll. The backpack is attached to the torso rig rather than floating at a hard-coded world height.
- The fallback is the Three.js Michelle rig only if the CC0 base cannot load.

## MS1D — Environmental grounding

### Outpost
- Removed the previous `+1.0` vertical offset that made the structure appear to float.
- The outpost group is now anchored directly to sampled terrain height.
- A broad irregular rock foundation deliberately intersects the hill.
- A terrace slab and surrounding grounding boulders visually connect the architecture to the slope.

### Waterfall
- Replaced the standalone water plane / rectangular cliff arrangement.
- The new waterfall has an irregular rock escarpment, visible upper feeder water, a falling sheet, a lower plunge pool and bank stones.
- The waterfall now has a visible source and a visible destination, so its geography reads coherently.

## What is deliberately unchanged

- Milestone 1B vegetation instancing and draw-call reductions.
- Trail/stream/bridge/ford composition.
- PBR ground surfaces and overall lighting direction.
- Adaptive pixel ratio and lightweight contact shadow.
- No AI navigation or lexical experiment yet.

## Controls

- WASD / arrows: move
- Shift: run
- mouse drag: look

## Deployment

Upload `index.html`, `styles.css`, and `game.js` to the existing GitHub Pages root. The scene still loads Poly Haven maps and the CC0 traveller from public HTTPS sources, so an internet connection is required for first load.

## Asset provenance

- Poly Haven environment surfaces: CC0.
- Quaternius Universal Base Characters base model: CC0. The primary GLB is a prepared public copy of the Quaternius CC0 source in `programasweights/avatar`.
- Three.js Michelle is retained only as a network fallback.
