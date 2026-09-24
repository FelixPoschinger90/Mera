# MERA E3.5 — Local Voice

Pilot browser build of the MERA lexical-propagation game.

## Voice architecture

E3.5 no longer uses the Web Speech API. Every spoken MERA stimulus is a fixed MP3 bundled in `audio/`, rendered offline with the local CMU Flite `slt` female English voice. There is no TTS service, API key, account, or runtime network dependency for speech.

Spoken + subtitled:
- the continuous emergency opening transmission;
- each of the three route-choice prompts;
- both controlled lexical exposures for the route actually chosen;
- each route-consequence line.

Text only:
- optional MERA ASSIST chatbot interaction.

Canonical target spellings shown in subtitles/data are `menic`, `blicket`, `boskot`, `fiffin`, `virdex`, and `teebu`. The fixed recordings use stable pronunciations for those nonce forms.

## Opening

The storm cinematic establishes: severe damage during the previous storm; two injured and two missing team members; the player is the only mobile field worker; the Northern Outpost relay is down; rescue cannot be contacted until its uplink is restored; a second front is approaching; MERA is on emergency power; and its terrain data is damaged.

## Deploy

Upload these five root files plus the complete `audio/` folder:

- index.html
- main.js
- styles.css
- README.md
- THIRD_PARTY_NOTICES.md
- audio/

Do not omit the `audio/` directory. The game still loads the Ecctrl/R3F/Rapier stack, Soldier test character and Poly Haven textures from public hosts at runtime.
