# MERA E3.3.1 — Assisted Navigation / Fixed Voice

Browser-playable pilot build for the MERA lexical-transfer study.

## Deploy
Upload the following to the root of the GitHub Pages site:
- `index.html`
- `main.js`
- `styles.css`
- `README.md`
- `THIRD_PARTY_NOTICES.md`
- the complete `audio/` folder

The controller/framework, Soldier test character, and Poly Haven textures are still loaded from public CDNs/hosts. The MERA speech files are now local and bundled with the game.

## Why E3.3.1 exists
E3.3 used browser `speechSynthesis`. On some Chrome configurations the generated radio crackle played but speech did not: the crackle was unlocked directly by the participant's ENTER click, while the first speech call occurred after asynchronous delays and could be blocked by browser media/user-gesture rules.

E3.3.1 removes browser TTS from the experimental voice path. All spoken MERA lines are fixed pre-generated synthetic audio files. The ENTER click explicitly unlocks media playback before the opening sequence begins.

## Spoken MERA
Voice remains limited to consequential moments:
- opening radio transmission / mission framing
- the three route-choice prompts
- the three post-choice environmental consequences

Routine lexical messages and all MERA ASSIST chatbot responses remain silent.

The bundled voice is intentionally synthetic and lightly radio-filtered. Every participant receives the same audio files, pronunciation, rate and prosody.

## MERA ASSIST — text only
A circular MERA icon opens a silent contextual assistant. The player can select suggested questions or type a short free-text question. The assistant is deterministic: questions are mapped to a bounded set of route intents; no generative model or external AI service is called.

Unsupported or overly broad questions receive a limited-access fallback such as: `I cannot access that data. Limited uplink availability.`

## Controlled optional lexical exposure
The six retained nonce forms are:
- bridge: `menic`
- ford: `blicket`
- pine/sheltered: `boskot`
- open/exposed: `fiffin`
- ridge/steep: `virdex`
- switchback/winding: `teebu`

Fixed route messages provide two short exposures only after route commitment. A few specific information-seeking chat intents may contain the relevant target form. Each target-bearing chatbot response is capped at one optional exposure per nonce form per session; repeat questions switch to ordinary vocabulary.

## Irreversible route consequences
The three decisions remain commitments:
1. River: rising water removes the ford, or the bridge collapses.
2. Woodland: stormfall blocks the unchosen path.
3. Final ascent: rockfall/slope failure closes the unchosen ascent.

Routes remain physically separated until the authored reconvergence point.

## Pilot logging
The downloadable JSON records route choices, fixed/optional lexical exposures, chat interaction and resolved intents, environmental consequences, final guide text, timestamps, and whether bundled audio was successfully unlocked.

Persistent study storage/transmission is intentionally not implemented yet.

## Controls
- WASD / arrows: move
- Shift: run
- Space: jump
- Mouse drag: orbit camera
- MERA icon: open text assistant
- Escape: close text assistant

## Current limitations
The E1 Soldier character remains temporary. The waterfall is not refined. Several visual/runtime dependencies still load from the network and should eventually be localized for the final experiment.
