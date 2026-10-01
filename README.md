# MERA E3.7 — Landscape & Atmosphere (visual pass)

E3.7 builds on the user-tested **E3.6.1** baseline. This is a visual-production pass, **not** a change to the experiment, route/commitment logic, control scheme, fixed Heart speech, optional text-only MERA chat, or the ending. All three choice sets and the final writing task remain in place.

## How to update your existing GitHub Pages repository

**KEEP the entire existing `audio/` directory.** It already contains your fixed Kokoro Heart WAV recordings; this release does not include, replace or regenerate them.

Upload/replace the five root files:

- `index.html`
- `main.js`
- `styles.css`
- `README.md`
- `THIRD_PARTY_NOTICES.md`

**NEW: upload the complete `assets/` directory from this ZIP** to the repository root as well. The nine image files inside it are required for the updated vegetation and bark. Do not upload only the root files: the new local textures would be missing and the game would fail to initialize. Do not upload the optional artwork-generation script, which is deliberately not included in the deployment ZIP.

Your repo should contain `index.html`, `main.js`, `styles.css`, `README.md`, `THIRD_PARTY_NOTICES.md`, `assets/` (nine PNGs), and your **existing** `audio/` folder (23 fixed Heart WAVs).

After the GitHub Pages deployment completes, hard-refresh (`Ctrl+Shift+R`). If the scene fails to load, check that `assets/pine_branch.png` and `assets/grass_tuft.png` are publicly accessible at your Pages URL; leave `audio/` intact.

## Visual changes

- Replaces the obvious conical pines and polyhedral round foliage with instanced three-dimensional branch-and-leaf assemblies using **nine bundled procedural alpha-cutout artwork textures** (pine boughs, broadleaf clusters, birch leaves, grasses, reed heads, ferns, meadow flowers, tree bark and birch bark).
- Populates pine forest with fern understory and the exposed alternative with sparse meadow flowers. Adds small rocks along trail verges while retaining the existing physical obstacle layout.
- Adds more terrain-color variety, worn earth near pathways and irregular erosion at the far valley walls.
- Replaces the flat striped waterfall rectangle with layered, shaped water geometry, animated water shading, splash mist, bankside rocks and a foam ring at the plunge pool. River water also receives subtler flow/shallow-bank highlights.
- Replaces the distant row of cones with layered irregular ridge meshes, and adjusts daylight, atmospheric fog and colour grading.
- Adds structural details to the existing outpost tower without moving its physical colliders or arrival trigger.

## What has deliberately NOT changed

- Stable Ecctrl Soldier skeleton, input and animation. The Soldier model remains an **external development placeholder**, not a newly licensed detailed expedition-character asset.
- River/woodland/ascent path geometry and route triggers, lexical signs, consequences and route-locking colliders.
- MERA's exact approved script, fixed local Heart WAV filenames, lexical exposures, optional text-only assistant and final guide task.
- The existing CC0 Poly Haven ground, path, wood and rock texture URLs. React/Three/Ecctrl and the example Soldier still load from existing external hosts. **The new nine textures are local**, but the whole game is not yet fully offline/self-contained.

## Limits and testing

The new foliage is authored geometry with alpha-cutout textures, **not purchased or downloaded photorealistic tree meshes**. It is a significant improvement over geometric cones/green rods, but a final character/vegetation asset pipeline remains a separate step for higher-end realism. This container could perform source syntax checks, asset integrity checks, and ZIP verification; it could **not run the full 3D game against the external CDNs**. Check the actual appearance and FPS on GitHub Pages, especially around the pine trail and waterfall. Use E3.6.1 as your rollback if necessary.

No server-side study-data collection has been added; final responses remain downloadable as pilot JSON.
