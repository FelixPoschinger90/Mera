# MERA E1 — Ecctrl Proof, Direct-Input Fix

This is the corrected E1 controller proof.

## What changed

- Ecctrl is still the actual physics-driven character controller.
- Browser keyboard input now uses Ecctrl's public `setMovement()` handle API directly instead of relying on Drei `KeyboardControls` context. This removes the module/context mismatch that left SPEED at 0.
- The Three.js Soldier GLTF is no longer duplicated with `scene.clone(true)`. The original skinned scene is mounted directly so its skeleton remains valid and Idle/Walk/Run clips bind correctly.
- The HUD now exposes `INPUT`, `STATE`, `GROUND`, `SPEED`, and `FPS` separately.

## Expected test

1. Enter the test area.
2. Press W: INPUT must show W and SPEED must become >0.
3. Hold Shift+W: STATE should become RUN and speed should rise.
4. Space: the capsule should jump.
5. Walk onto the low step and slope.
6. Drag the mouse to orbit the camera.

E1 passes only if all six behaviours work.

## Deployment

Upload the contents of this directory to the GitHub Pages repository exactly as before. `index.html`, `main.js`, and `styles.css` must remain together.

## Scope

The MERA landscape remains intentionally absent. E2 begins only after this controller proof passes.
