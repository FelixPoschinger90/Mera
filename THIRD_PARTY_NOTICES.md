# Third-party notices — MERA E4.4

## Poly Haven — CC0

MERA uses Poly Haven assets under the CC0 license, including static render/impostor images and retained PBR terrain, rock and weathered-plank textures.

Referenced environment assets include:

- Pine Tree 01 — modeling Rico Cilliers, photography Rob Tuytel
- Fir Tree 01 — Rico Cilliers / Rob Tuytel
- Tree Small 02 — Rico Cilliers
- Rock Moss Set 01 — Kless Gyzen

Some Poly Haven resources are fetched from the public Poly Haven CDN at runtime.

## MERA local artwork

The bundled `assets/*.png` ground-cover, bark and trail textures are local MERA project assets. `assets/trail_dirt.png` is the compacted wet dirt/gravel trail texture used by the E3.9.4 incised-trail pass.

## Pexels photographic generalisation stimuli

The E4.4 generalisation task uses fixed photographs made available as free-to-use images through Pexels. The image source pages are retained in each session record.

- River / bridge — Connor Scott McManus: https://www.pexels.com/photo/stream-in-forest-17479947/
- River / ford — James Goddard: https://www.pexels.com/photo/tranquil-pathway-over-stepping-stones-in-a-stream-32286784/
- Woodland / pine — Andrey Kirsanov: https://www.pexels.com/photo/an-empty-forest-path-4856731/
- Woodland / open — Jan van der Wolf: https://www.pexels.com/photo/footpath-in-a-meadow-with-trees-in-a-distance-17166390/
- Ascent / ridge — Pawel Kalisinski: https://www.pexels.com/photo/path-along-the-ridge-of-the-mountain-17731161/
- Ascent / switchback — Kristina Kutleša: https://www.pexels.com/photo/zigzag-path-on-the-slope-of-a-rocky-mountain-16643312/

Pexels license: https://www.pexels.com/license/

## Kokoro / Heart voice

The fixed WAV stimuli in `audio/` were synthesized with Kokoro Heart (`af_heart`). Kokoro ONNX model licensing: Apache-2.0. The E4.4 game plays only pre-rendered WAV files; no speech-synthesis model is loaded during participant sessions.

## Quaternius Adventurer

The player character uses the Quaternius Adventurer low-poly humanoid under the Quaternius asset terms applicable to the downloaded asset. The game uses the model's Idle and Run clips; walking reuses Run at reduced playback speed, while jump states retain the upright Idle pose because the model has no authored jump clip.

## Open-source libraries

The application uses React, React Three Fiber, Drei, Three.js, Rapier, Zustand and Ecctrl through browser ESM/CDN imports. Refer to the respective upstream projects for their license texts.
