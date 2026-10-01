# MERA Character Proof C1 — Quaternius

Isolated character test. This does **not** modify MERA.

## Candidate
- Visual model: Quaternius Universal Base Character, repackaged as `night-striker.glb` in the public `blood-league-kickoff` repository.
- Animations: Quaternius Universal Animation Library, matched to the same humanoid skeleton.
- License: CC0 1.0 for the Quaternius model and animation assets; the source repository documents hashes and provenance.

The proof loads the two public assets through jsDelivr so no binary model is bundled here. If accepted, the final MERA integration should localize the chosen character and animation files rather than depend on a remote CDN.

## What to test
- Full body visibly renders (not skeleton-only)
- feet remain at ground level
- WASD movement
- Shift run
- Space jump
- walk/run/jump animation switching
- slope and stair traversal
- camera orbit

If any of these fail, do not integrate it into MERA.

## GitHub Pages entry point
Open `MERA_CHARACTER_PROOF.html` on the same GitHub Pages site used for the previous character proof. This package deliberately uses the same proof filenames and does not contain MERA's main `index.html`, `main.js`, or `styles.css`.
