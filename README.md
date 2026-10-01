# MERA E3.9.2 — Path & Rock Collision Correction

Focused correction built directly on the accepted E3.9 storm environment. Gameplay, Heart audio, lexical logic, weather, wind physics, route locking, character, consequences and outpost ending are unchanged.

## Changes in E3.9.2

- Replaced subtle route markings with continuous, clearly visible hiking paths.
- Added a dedicated bundled dirt/gravel trail texture (`assets/trail_dirt.png`).
- Paths now have a broader worn shoulder plus a narrower compacted walking bed.
- Route widths remain differentiated: BOSKOT is narrower, FIFFIN broader, VIRDEX direct/narrow, TEEBU longer/winding.
- Raised path surfaces slightly and enabled polygon offset to prevent z-fighting in heavy rain.
- Added physical Rapier colliders to all meaningful landscape rocks (s >= 0.55). Tiny decorative path pebbles remain non-colliding.

## Deployment

Replace the five root files and upload/replace the `assets/` folder. Keep the existing fixed Heart `audio/` folder unchanged.

## Controls

WASD / arrows: move · Shift: run · Space: jump · mouse drag: camera.


E3.9.2 path correction: hiking trails use unlit pale gravel materials so they remain clearly visible during the storm; trail meshes are also wider and lifted slightly above terrain.
