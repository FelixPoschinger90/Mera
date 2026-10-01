# MERA E3.9 — Realistic Storm / Route Legibility Pass

This build is based on the verified E3.8/E3.6.1 study flow. The character, Heart voice pack, lexical exposure logic, route-choice timing, consequence clips and outpost writing task are intentionally retained.

## What changed in E3.9

- **Storm visibly active during gameplay**: the malformed E3.8 weather CSS was repaired; a strong screen-space rain layer is supplemented by 3D rain streaks in the world. Lightning now flashes both the screen overlay and an in-scene light, with thunder.
- **Directional wind physics** on the exposed eastern woodland route: walking toward the outpost faces the prevailing headwind and is substantially slower; turning back puts the wind behind the player and increases movement speed; cross-wind has an intermediate effect.
- **Branches are physically separated until reconvergence**: continuous rock spines/colliders now divide bridge/ford, forest/open, and ridge/switchback branches after commitment. The existing commitment seal remains as a second safeguard.
- **Clear walking paths**: every route now has a wider worn verge plus a narrower darker dirt/gravel core so the intended way forward reads visually without constraining free movement to a rail.
- **More realistic vegetation presentation**: the old procedural cone/card tree silhouettes are replaced in the main forest rendering by crossed static impostors made from Poly Haven's CC0 Pine Tree 01, Fir Tree 01 and Tree Small 02 renders. These are cheap, unshadowed and deliberately suited to a browser game.
- **Denser sheltered forest**: additional trees are concentrated along the BOSKOT route while the FIFFIN route remains visually exposed.
- **More realistic rock presentation**: most decorative rock scatter is now overlaid/replaced by static cards using Poly Haven's CC0 Rock Moss Set 01 render, while a smaller number of textured 3D rocks and all physical colliders remain for silhouette and gameplay.
- **Shadows disabled** for environment rendering to spend the performance budget on storm density, vegetation and route legibility.

## Deployment

Replace the five root files from this package and keep/upload the included `assets/` folder. Keep the existing generated `audio/` folder from E3.6 unchanged; audio is not included here.

The runtime still loads Three.js Soldier, Ecctrl/React libraries, Poly Haven PBR terrain textures, and the new Poly Haven CC0 static render images from their public CDNs.

## Test priorities

1. Rain is unmistakably visible after the intro; lightning recurs during gameplay.
2. On FIFFIN, walking north/toward the outpost is a strong headwind; walking back south is noticeably boosted.
3. After committing to any branch, crossing to the other branch is not possible until the paths merge.
4. All routes read as visible worn paths.
5. BOSKOT feels crowded/sheltered and FIFFIN feels open/exposed.
6. Inspect tree/rock realism and FPS before approving this as the visual baseline.
