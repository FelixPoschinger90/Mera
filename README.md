# MERA E3.4 — Storm Link

Pilot browser build of the MERA lexical-propagation game.

## What changed from E3.3.1

- Replaced the clipped bundled eSpeak clips with browser speech synthesis and explicit preference for a natural English female voice (e.g. Microsoft Aria/Jenny/Sonia, Google UK English Female, Samantha/Zira where available).
- The opening is one continuous spoken emergency transmission rather than many chopped clips.
- Added animated rain and timed lightning/thunder cues during the opening cinematic.
- Opening establishes stakes: prior storm damage, two injured, two missing, player is the only mobile field worker, Northern Outpost relay failure, incoming second front, MERA emergency power and damaged terrain data.
- Spoken + subtitled: opening, route-choice prompts, two controlled lexical exposures on the chosen route, and environmental consequence lines.
- Text only: optional MERA ASSIST chat. Chat never calls the voice system.
- Voiced navigation subtitles remain visible through the utterance and for ~1.5 seconds afterwards.
- Route commitment/consequence logic from E3.2/E3.3 remains intact.

## Important voice note

This pilot selects the best matching English female/natural voice exposed by the participant's browser/operating system. This is much smoother than the previous offline eSpeak assets but is not yet stimulus-identical across machines. For the final study, once the script and voice are approved, replace these calls with fixed neural-voice audio files generated from one selected provider/voice.

## Deploy

Upload these five files to the repository root:

- index.html
- main.js
- styles.css
- README.md
- THIRD_PARTY_NOTICES.md

The old `audio/` directory from E3.3.1 is not used by this build and can be deleted.

The build still loads the Ecctrl/R3F/Rapier stack, Soldier test character and Poly Haven textures from public hosts at runtime.
