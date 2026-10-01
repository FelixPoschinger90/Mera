# MERA E3.8 — Storm Ascent environmental rebuild

E3.8 builds on the working E3.7/E3.6.1 study game. The player character, Heart voice pack, lexical exposure logic, chatbot, irreversible route choices, consequence scenes and outpost writing task are preserved. This release changes the environment and route mechanics only.

## GitHub Pages update

Keep your existing `audio/` directory unchanged. It contains the fixed Heart WAV recordings and is not included in this ZIP.

Upload/replace the five root files:

- `index.html`
- `main.js`
- `styles.css`
- `README.md`
- `THIRD_PARTY_NOTICES.md`

Keep/upload the included `assets/` directory. The nine PNG assets are the same local vegetation/bark artwork used by E3.7, so if they are already present on GitHub you do not need to delete them first.

After deployment, hard-refresh with `Ctrl+Shift+R`.

## E3.8 changes

- Persistent rain is visible during gameplay rather than only in the opening sequence.
- Intermittent lightning continues during the field run; the HUD and study interfaces remain above the weather layer.
- The decorative waterfall has been removed completely from the rendered world. Its former cliff is reduced to an ordinary rocky shoulder.
- The exposed eastern woodland route now contains visibly stronger gust particles and **significantly reduces movement speed** while the player remains in the exposed wind zone.
- The sheltered pine route is substantially denser: more pines, more physical trunks, heavier fern understory and a narrower trail corridor.
- The upper map has been reshaped. The Northern Outpost now sits roughly 27 world units above the third decision area instead of on a low hill.
- The virdex ridge climbs almost directly toward the outpost and becomes markedly steep near the summit.
- The teebu switchback reaches the same summit over roughly twice the walking distance, with broad lateral turns and a much lower average grade.
- The former flat/shared gap between the end of the two ascent routes and the outpost has been reduced to only the final few metres.
- Ascent signs, route locks, rockfall consequence positions and cinematic cameras were moved to match the new mountain geometry.
- The overall lighting/fog is darker and cooler to match the incoming-storm narrative.

## Deliberately unchanged

- Current Soldier character and its proven Ecctrl animation/controller setup. Character replacement is postponed until this environmental build passes.
- River decision and bridge/ford consequences.
- Approved Heart voice clips and subtitles.
- Six lexical items and their current route assignments.
- Optional text-only MERA assistant.
- Outpost completion sequence and final guide task.

## Technical validation performed

- `main.js` passes Node JavaScript syntax validation.
- All nine bundled `assets/*.png` references are present in the package.
- The direct ridge and long switchback reach the same summit. Numerically, the ridge is about 129 world units long while the switchback is about 243; the direct ridge therefore carries approximately twice the average grade.
- The steepest direct-ridge segment remains below the Ecctrl configured walkable-slope limit.

The container could not complete a reliable full rendered browser playthrough against all external CDN resources, so actual appearance, collision feel and FPS still require the GitHub Pages field test.
