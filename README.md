# MERA E1 — Ecctrl Controller Proof

## Purpose

This is **E1 only**. It intentionally does not contain the MERA valley.

The build tests whether the replacement game foundation works before migrating any accepted scenery:

- Ecctrl 2.0.2 character controller
- React Three Fiber 9
- Rapier 2 physics
- shape-cast ground detection
- third-person orbit/follow camera
- upright animated humanoid
- idle / walk / run transitions
- walking and running on flat ground
- mild slope traversal
- low and higher step/obstacle interaction
- jump
- live grounded / speed / animation-state / FPS diagnostics

## Controls

- WASD / arrow keys — move
- Shift — run (hold)
- Space — jump
- Mouse drag — orbit the camera
- Mouse wheel — zoom within a constrained range

## Acceptance criteria for E1

E1 passes if:

1. The humanoid is upright, complete and correctly grounded.
2. Movement is smooth and predictable.
3. Idle → Walk → Run and back transitions are visually stable.
4. The character traverses the mild ramp without clipping, falling through, or becoming unstable.
5. Camera orbit/follow remains smooth while moving.
6. The test runs comfortably at normal browser framerates.

The block obstacles are deliberately diagnostic. Failure to climb the taller block is not itself a failure; the important point is stable collision behavior rather than walking through geometry.

## Deployment

This is a static GitHub Pages build. Upload:

- `index.html`
- `styles.css`
- `main.js`

No npm/build step is required. Runtime libraries are pinned and loaded as ES modules from `esm.sh`. The temporary test humanoid is loaded from the Three.js examples host. Once E1 is accepted, the next step is to replace this diagnostic character with the selected free MERA traveller and migrate the MS1B landscape into the same Ecctrl/Rapier architecture.

## Dependencies / licensing

- Ecctrl 2.0.2 — MIT
- React / React DOM
- Three.js
- React Three Fiber
- React Three Drei
- React Three Rapier

Ecctrl's MIT notice should be retained in the eventual repository. E1's temporary Three.js Soldier model is a diagnostic dependency only and is **not intended as the final MERA traveller**.

## Important

The whole point of this build is to prevent another landscape migration before the character/controller stack is proven. Do not assess its art direction; assess only movement, grounding, animation, camera behavior and stability.
