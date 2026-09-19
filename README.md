# MERA E2 — Free Valley

E2 keeps the working E1 Ecctrl/Rapier controller and animated Soldier character unchanged as the technical chassis, then ports MERA back into a compact authored valley.

## Design change from old MERA

The player is **not constrained to narrow authored trajectories**. The visible trails are guidance only. Within the central valley basin the player can move freely, leave the trail, walk around rocks and trees, and approach crossings from different angles.

The **map itself is limited** by steep valley sides, dense boundary tree lines, rocks, the river and the northern/southern terrain rise.

## E2 landscape

- PBR forest ground and dirt-path surfaces (Poly Haven CC0)
- improved four-variant instanced rock field rather than repeated distorted spheres
- instanced conifer/broadleaf forest
- instanced grass and river reeds
- real terrain collider via Rapier trimesh
- physical tree and larger-rock colliders
- stream with shallow terrain at the ford
- physical timber bridge with approach ramps
- outpost grounded into a rock foundation
- waterfall with feeder pool, fall, plunge pool and outlet creek
- mountain backdrop and atmospheric fog

## Performance strategy

- vegetation and rock fields are GPU-instanced
- grass/reeds have no physics
- only a subset of nearby substantial trees/rocks receive Rapier colliders
- no SSAO or heavy post-processing
- 1024 shadow map
- DPR capped at 1.2
- live FPS and draw-call diagnostics in the HUD

## Controls

- WASD / arrow keys: move
- Shift: run
- Space: jump
- mouse drag: orbit camera

## Deployment

This build intentionally has **no local assets folder**. Upload the five files in this package directly to the GitHub Pages root, replacing the E1 test files:

- `index.html`
- `styles.css`
- `main.js`
- `README.md`
- `THIRD_PARTY_NOTICES.md`

Hard-refresh after Pages redeploys. `main.js` currently loads Ecctrl/React/Three/Rapier, the Three.js Soldier test character, and the Poly Haven CC0 textures from their public hosts. There are no `./assets/...` references in this version.

## E2 acceptance gate

Do not add AI/study logic until:

1. movement remains as reliable as E1;
2. the landscape remains visually acceptable;
3. movement feels free rather than rail-bound;
4. bridge and ford work physically;
5. map boundaries feel geographic rather than arbitrary;
6. FPS remains study-appropriate on an ordinary laptop.
