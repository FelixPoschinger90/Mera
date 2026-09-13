# MERA — Professional Adventure Slice v3

This build deliberately removes the research task and concentrates on the thing that must work first: **game feel**.

## What changed

- Uses a **real rigged/skinned humanoid** with embedded locomotion animation when the CC0 model loads.
- Uses a **real rigged animated deer model** with idle/eating/gallop-style clips when the CC0 wildlife asset loads.
- Movement now has acceleration, deceleration, smooth turning and animation blending.
- Camera is a closer third-person adventure camera with spring-like follow and terrain avoidance.
- Terrain is smooth and authored around the route rather than constructed from cubes.
- Animated water shader, grass, atmospheric particles, distant islands, fog and warm directional lighting.
- Ambient wind, water and bird audio is generated locally with Web Audio.
- The stream decision is genuinely exclusive:
  - bridge -> western animal trail
  - ford -> eastern hollow
- The unused branch remains visible across the central rock spine but is inaccessible.
- Each crossing has a short controlled traversal sequence.
- Deer react to the player and flee rather than sliding as static block props.
- No lexical task or study UI is implemented yet.

## Browser / GitHub Pages

This is intended to be hosted rather than opened through an Android `content://` local-file URL.

1. Create a GitHub repository, e.g. `mera-game`.
2. Upload **all three files** from this folder to the repository root:
   - `index.html`
   - `styles.css`
   - `game.js`
3. Open **Settings -> Pages**.
4. Select **Deploy from a branch**.
5. Select `main` and `/(root)`.
6. Save and open the Pages URL GitHub gives you.

The build loads Three.js and open CC0 3D assets from public CDNs, so internet access is required while playing.

## Controls

Desktop:
- WASD / arrow keys — move
- Shift — run
- drag mouse — orbit camera

Mobile:
- left virtual joystick — move
- drag right half — orbit camera
- RUN — sprint

## Asset provenance

The prototype attempts to load:

- Rigged humanoid derived from Quaternius, redistributed as CC0 by UMRAM-Bilkent (`supine-human-model`, `assets/human.glb`). The repository documents eight walk/idle animations.
- Animated deer from the AnimaSim project by Dan Wahl, derived from Quaternius' *Ultimate Animated Animals* CC0 pack. AnimaSim documents preservation of the original skeletal clips including Idle, Walk, Gallop and Eating.
- Optional Quaternius Stylized Nature MegaKit assets from a public CC0 mirror. If these fail to load, MERA keeps its built-in authored vegetation fallback.

All project-specific code, level layout, water shader, procedural audio and interaction logic in this prototype were created for MERA. The prototype does not use Nintendo assets, Link, Hyrule geometry, Zelda music, UI, maps or other proprietary content. “BotW-like” here means the target level of readable stylised third-person adventure presentation and environmental game feel, not reproduction of Nintendo material.

## Important

This is still a **vertical slice**. The next development decision should be based on whether the character motion, camera, wildlife, traversal and landscape now feel sufficiently game-like to justify expanding the world. The linguistic manipulation should remain frozen until that bar is met.
