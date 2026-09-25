# MERA E3.6 — Heart Locked

This build locks the approved spoken script, the Heart voice, and branch-specific lexical signage into the E3 consequence architecture.

## What changed

- The participant runtime no longer loads a TTS model or uses browser speech synthesis.
- MERA voice is expected as fixed local WAV files generated once with Kokoro `af_heart`, speed `0.96`.
- The opening transmission now contains the complete approved emergency narrative, including the final mission instruction and “Move.”
- All three choice prompts are voiced and subtitled.
- Each chosen lexical item receives exactly two controlled voiced + subtitled exposures.
- After commitment, the chosen route gains a persistent in-world lexical sign:
  - MENIC BRIDGE
  - BLICKET CROSSING
  - BOSKOT TRAIL
  - FIFFIN TRAIL
  - VIRDEX RIDGE
  - TEEBU PATH
- Unchosen lexical signs never appear.
- The six environmental consequence reactions are voiced.
- Reaching the outpost now triggers a voiced relay-restoration / route-handover sequence before the free-text guide task.
- Optional MERA ASSIST remains text-only.

## IMPORTANT: generate the Heart audio once

The game package deliberately does **not** contain low-quality fallback speech. Before deploying the build to participants, generate the fixed Heart audio pack:

1. Upload `HEART_AUDIO_GENERATOR.html` to the root of your GitHub Pages repository.
2. Open `.../HEART_AUDIO_GENERATOR.html` in Chrome.
3. Click **LOAD HEART**.
4. When ready, click **GENERATE & DOWNLOAD AUDIO ZIP**.
5. Extract `MERA_HEART_AUDIO_PACK.zip`.
6. Upload the resulting `audio/` folder beside `index.html`.
7. You may then delete `HEART_AUDIO_GENERATOR.html` from the public repository if desired.

The generator loads Kokoro only during this one development step. Study participants receive only the fixed WAV files and therefore do not wait for the model to load.

## Required deployed structure

```text
index.html
main.js
styles.css
README.md
THIRD_PARTY_NOTICES.md
audio/
  intro.wav
  decision_river.wav
  menic_intro.wav
  menic_bare.wav
  blicket_intro.wav
  blicket_bare.wav
  consequence_river_bridge.wav
  consequence_river_ford.wav
  decision_wood.wav
  boskot_intro.wav
  boskot_bare.wav
  fiffin_intro.wav
  fiffin_bare.wav
  consequence_wood_pine.wav
  consequence_wood_birch.wav
  decision_ascent.wav
  virdex_intro.wav
  virdex_bare.wav
  teebu_intro.wav
  teebu_bare.wav
  consequence_ascent_ridge.wav
  consequence_ascent_switchback.wav
  outro.wav
  VOICE_MANIFEST.json
```

The boot screen checks the complete fixed voice pack and will stop with a clear error if a required clip is missing.

## Runtime dependencies

The existing game code still loads its Three.js / React / Ecctrl dependencies, Soldier model, and Poly Haven materials from their existing public hosts. This E3.6 change only localizes the MERA speech stimuli.

## Controls

- WASD / arrows — move
- Shift — run
- Space — jump
- Mouse drag — camera
- MERA icon — optional text-only route assistant

## Research note

The six lexical forms remain `menic`, `blicket`, `boskot`, `fiffin`, `virdex`, and `teebu`. A participant encounters only the three attached to the routes they actually commit to. The fixed exposures are logged separately from optional text-chat exposures.
