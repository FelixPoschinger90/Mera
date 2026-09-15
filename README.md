# MERA — Milestone 1B + 1C (zero budget)

This build keeps the accepted Milestone-1 valley art direction and addresses the two concrete problems found during play-testing:

- **1B — performance:** the previous scene looked acceptable but submitted thousands of individual meshes every frame.
- **1C — traveller:** the previous character was an unsuitable prototype composite and could visually lose the head / silhouette.

## Milestone 1B — performance changes

The landscape composition is intentionally retained, but its rendering architecture is different:

- Pine trees are built once as detailed authored geometry and then rendered as GPU instances. Trunk/branches and foliage are two draw batches rather than hundreds of meshes per tree.
- Broadleaf trees use the same batching strategy.
- Grass is one `InstancedMesh` batch rather than ~1,500 separate plane meshes.
- Reeds are one batch.
- Landscape / riverbank / ford stones are one instanced rock batch.
- Flowers are instanced.
- Full-resolution SSAO has been removed. ACES tone mapping, fog, PBR materials and directional lighting remain.
- Shadow resolution is reduced from 2048² to 1024² and the shadow camera is tighter.
- The static landscape shadow map is rendered once; the traveller uses a lightweight contact/blob shadow instead of forcing the entire shadow map to update every frame.
- Device pixel ratio is capped at 1.18 initially and automatically falls to 1.0 / 0.85 only if measured FPS is low.
- PBR loading uses diffuse + normal maps with material roughness constants, reducing Poly Haven texture requests from 12 to 8.
- Traveller and environment assets begin loading in parallel.
- The HUD shows measured FPS so performance can be assessed directly.

## Milestone 1C — traveller changes

The old Michelle + procedural coat/hood/hip-wrap composite has been removed as the primary character.

The build now attempts to load the open XRCLOUD/CNU Metaversity full-body avatar sample first. That avatar pipeline provides a coherent head, hair, body and clothing instead of stacking cylinders over a separate rig. In-browser material tinting pushes bright jacket colours toward muted olive and bright lower clothing toward charcoal, followed by a small traveller backpack/bedroll added behind the body.

If that external avatar cannot be loaded, the build falls back to the Three.js Michelle sample, but without the head-obscuring procedural coat/hood construction. If the chosen avatar does not contain usable locomotion clips, the Three.js Soldier animation clips are loaded only as an animation fallback.

## Landscape retained

- authored terrain and valley composition
- PBR forest/path/wood/rock surfaces
- custom timber bridge
- shallow ford
- stream and waterfall
- visible northern outpost
- mountain backdrop
- dense route-edge vegetation
- narrow authored movement corridors

## Controls

- WASD / arrow keys: move
- Shift: run
- drag mouse / pointer: camera

## Deployment

Upload these three files to the GitHub Pages root:

- `index.html`
- `styles.css`
- `game.js`

The build still fetches Three.js, Poly Haven materials and the free external avatar at runtime, so an internet connection is needed on first load.

## Next acceptance criterion

Do not add the AI / lexical experiment until both are true:

1. movement is smooth enough for a normal study participant laptop; and
2. the traveller looks visually coherent enough beside the accepted landscape.
