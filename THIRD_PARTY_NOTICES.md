# Third-party notices — MERA E3.9.1

## Poly Haven — CC0
MERA uses Poly Haven assets under the CC0 license. E3.9 adds static render/impostor images from:
- Pine Tree 01 — modeling Rico Cilliers, photography Rob Tuytel
- Fir Tree 01 — Rico Cilliers / Rob Tuytel
- Tree Small 02 — Rico Cilliers
- Rock Moss Set 01 — Kless Gyzen

The project also retains Poly Haven forest-ground, path, mossy-rock and weathered-plank PBR textures. These resources are fetched from Poly Haven's public CDN at runtime.

## MERA local procedural artwork
The bundled `assets/*.png` ground-cover/bark textures from the earlier visual pass remain local and were generated specifically for this prototype.

## Kokoro / Heart voice
The fixed WAV recordings in the user's existing `audio/` directory were generated with Kokoro Heart (`af_heart`). They are not modified or included by this patch. Kokoro ONNX model licensing: Apache-2.0.

## Quaternius Adventurer
The player character uses the Quaternius Adventurer low-poly humanoid (CC0 release), loaded at runtime from the public OpenCombat GitHub mirror through jsDelivr. MERA uses the model's Idle and Run clips; walking reuses Run at reduced playback speed, while jump states retain the upright Idle pose because this GLB has no authored jump clip.

## Open-source libraries
The application uses React, React Three Fiber, Drei, Three.js, Rapier, Zustand and Ecctrl through browser ESM/CDN imports. Refer to their upstream projects for exact license texts.


`assets/trail_dirt.png` is a locally generated texture created for MERA E3.9.1 and has no third-party licensing requirement.
