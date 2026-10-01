# MERA Character Proof C2 — Quaternius fixed

Standalone test only. It does not replace or modify MERA E3.9.4.

## Changes from C1
- Corrected the visual facing used by the Quaternius proof so forward movement no longer presents the character backwards.
- Added a render-only field outfit attached to the existing Quaternius skeleton: olive jacket/sleeves, dark trousers, boots and simple webbing.
- No MERA terrain, decision logic, lexical items, audio, route state, or study code is present here.

## Test
Upload the four files together and open `MERA_CHARACTER_PROOF.html`. Test W/S, strafing/turning, running, jumping, slopes/steps, and look for clothing clipping at shoulders, elbows, hips and knees.

If this proof does not look stable, keep the existing Soldier character. Do not transplant it into MERA.
