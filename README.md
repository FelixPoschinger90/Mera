# MERA E3.6.1 — Signs & Outpost correction

This is a **targeted patch** to the verified E3.6 game. The controller, existing terrain, six lexical forms, fixed Heart WAV names, decision/consequence logic, and text-only chat remain unchanged.

## Upload / existing audio

**Your populated `audio/` directory must stay exactly where it is in the GitHub repository. Do not delete it or regenerate the Heart recordings.** This ZIP contains only the five replacement root files:

- `index.html`
- `main.js`
- `styles.css`
- `README.md`
- `THIRD_PARTY_NOTICES.md`

Use **Add file → Upload files** in GitHub to replace the files with the same names. Upload to the repository root. The game continues to read the existing `audio/*.wav` files, including `outro.wav`. The Heart generator is no longer needed to apply this patch.

## Correction 1: permanent branch-specific signs

All six physical markers now exist in the landscape from the initial render, *further ahead* on the paths rather than behind the route-commitment triggers. From a distance their boards are visible but their labels are not legible. Lettering is shown only if (a) the player commits to that branch and (b) gets within 17 world units of the marker. The unchosen form is never disclosed by the sign. Proximity is logged as `lexical_sign_in_range`, and is **not** treated as proof that the participant actually looked at the sign.

## Correction 2: outpost completion

E3.6 froze because `finishStudy()` referenced `OUTPOST` and `terrainHeight`, which were scoped inside the 3D scene setup. E3.6.1 explicitly passes the outpost coordinates and terrain height to the completion function.

The relay cinematic now also includes a **CONTINUE TO ROUTE GUIDE** control, which becomes available after 1.8 seconds. Normally the writing task opens after Heart finishes the outro recording. If the recording fails, is blocked, or never signals completion, an independent watchdog opens the writing task rather than leaving the participant trapped. The transition reason is logged as `guide_task_displayed`.

The final free-text guide is still stored in the current session until the pilot JSON is downloaded; there is **no server-side collection** in this build.

## Check on GitHub Pages

1. Hard refresh the game (Ctrl+Shift+R).
2. Approach each branch: the marker should already be visible ahead; after choosing it, the relevant label becomes readable nearby.
3. Reach the outpost: the full Heart outro should play, then the writing interface should open. The continue control can also open it early.
4. Enter a guide and save/download the pilot JSON.

The runtime continues to fetch React/Three/Ecctrl, Soldier and landscape textures from the same external hosts as E3.6; only the existing fixed Heart WAV pack is local.
