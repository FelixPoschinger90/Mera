# MERA — The Northern Outpost

**Current production build:** `MERA_E4_5_COUNTERBALANCED_PRODUCTION`  
**Session schema:** `6`  
**Study format:** browser-based 3D field simulation with counterbalanced lexical exposure, free-text transfer measures and remote research-data storage.

MERA is a compact experimental environment for studying whether novel lexical forms introduced by an AI navigation guide are later reused in independent human-directed descriptions and transferred to new but analogous situations. The participant crosses a storm-damaged reserve, makes three consequential route decisions, reaches the Northern Outpost, gives directions to a rescue team, and completes one photographic generalisation task.

The production instrument is intentionally narrow: the environment provides a reason to use language, but the lexical manipulation, exposure sequence and recorded outcomes remain controlled.

## Repository structure

```text
/
├── index.html                Participant screens, consent, HUD and post-game tasks
├── main.js                   Game world, MERA logic, counterbalancing, telemetry and submission
├── styles.css                Interface and presentation styles
├── study-config.js           Production storage configuration
├── SUPABASE_SCHEMA.sql       Reproducible database table + Row Level Security policy
├── THIRD_PARTY_NOTICES.md    Asset, image, voice and library provenance
├── audio/                    Fixed pre-rendered MERA speech stimuli
└── assets/                   Local textures and supporting visual assets
```

The application has no compilation/build step. `index.html` uses a pinned browser import map for React, Three.js, React Three Fiber, Drei, Rapier, Zustand and Ecctrl. The production build should be served over HTTP/HTTPS rather than opened with `file://`.

For local inspection, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

The deployed study additionally requires network access for the pinned ESM modules, selected remote visual assets/generalisation photographs, and Supabase submission.

## Participant flow

1. **Entry / consent.** The participant is introduced as an environmental field intern entering a remote reserve after a severe storm. MERA is identified as the reserve's AI navigation guide. Controls, approximate duration, recorded data and research use are stated before `ENTER`.
2. **Emergency transmission.** MERA establishes the damaged communications, injured/missing team members and objective: reach the Northern Outpost and restore the emergency uplink.
3. **Decision 1 — river.** Bridge or ford.
4. **Decision 2 — woodland.** Sheltered pine route or exposed/open route.
5. **Decision 3 — ascent.** Direct ridge or longer switchback.
6. **Outpost.** The emergency relay is restored.
7. **Route handover.** With MERA's navigation cache unavailable, the participant writes directions for the approaching rescue team.
8. **Generalisation.** Three new photographic route sections corresponding to the three experienced route properties are shown in randomised A/B/C order. The participant describes them without lexical prompts.
9. **Submission.** The complete session record is written to the production database. The completion screen is shown only after successful submission.

Controls: **WASD** move · **Shift** run · **Space** jump · **mouse drag** camera.

## Experimental structure

The six lexical forms are:

`menic` · `blicket` · `boskot` · `fiffin` · `virdex` · `teebu`

`blicket`, `boskot`, `fiffin`, `virdex` and `teebu` were selected from an established pseudoword stimulus inventory; `menic` is a researcher-generated comparison item.

The six physical lexical slots are:

- `river_bridge`
- `river_ford`
- `woodland_pine`
- `woodland_birch`
- `ascent_ridge`
- `ascent_switchback`

Each session receives one of six cyclic counterbalance conditions. Each lexical form therefore occupies every physical slot once across the six conditions.

| Condition | Bridge | Ford | Pine | Open/Birch | Ridge | Switchback |
|---|---|---|---|---|---|---|
| 1 | menic | blicket | boskot | fiffin | virdex | teebu |
| 2 | blicket | boskot | fiffin | virdex | teebu | menic |
| 3 | boskot | fiffin | virdex | teebu | menic | blicket |
| 4 | fiffin | virdex | teebu | menic | blicket | boskot |
| 5 | virdex | teebu | menic | blicket | boskot | fiffin |
| 6 | teebu | menic | blicket | boskot | fiffin | virdex |

Assignment is random in production. For controlled testing, a fixed condition can be requested with `?condition=1` through `?condition=6`.

A completed participant encounters **exactly three lexical forms**, one on each chosen route. Each encountered form has exactly three nominal exposures:

1. **context voice** — MERA names and characterises the chosen route;
2. **lexical sign** — the assigned form appears on the selected route marker;
3. **reinforcement voice** — MERA repeats the form during traversal.

The three forms assigned to unchosen routes remain unexposed. The optional MERA text interaction does not introduce target forms.

## Voice stimulus matrix

Speech is fixed and pre-rendered with Kokoro Heart (`af_heart`); no speech model runs during participation.

Lexical filenames follow:

```text
audio/lex_<route-slot>_<target-form>_<context|reinforce>.wav
```

The counterbalanced lexical matrix contains:

```text
6 route slots × 6 lexical forms × 2 spoken encounters = 72 WAV files
```

The `audio/` directory also contains fixed intro, decision, consequence and outpost speech. Metadata files document the generated stimulus set and counterbalance mapping.

Environmental rain, wind and thunder are procedural. Ambient levels are fixed; rain/wind are ducked while MERA speaks and thunder is suppressed during active MERA voice playback to reduce masking of controlled lexical stimuli.

## Generalisation stimuli

The final task uses one fixed photographic exemplar for each physical route concept:

- bridge;
- ford / stepping-stone crossing;
- sheltered pine path;
- exposed/open path;
- steep/direct ridge;
- switchback ascent.

Only the three concepts actually encountered during gameplay are displayed. Their A/B/C order is randomised. The session record stores the `stimulusId`, source page, route slot and target word for every displayed image.

Image provenance is documented in `THIRD_PARTY_NOTICES.md`.

## Recorded data

Each session receives a random UUID. No name, email address or account identifier is requested by the study interface.

The stored record contains both derived summaries and the underlying event history, including:

- build and schema version;
- consent status, timestamp and consent-text version;
- counterbalance condition and full lexical mapping;
- route choices, commitment positions and decision latencies;
- target-word context/sign/reinforcement events and audio completion status;
- proximity-defined sign exposure and dwell time;
- environmental/consequence/outpost events;
- optional MERA text interactions;
- one-second trajectory samples;
- walking, running, stationary, airborne and cinematic time;
- total and movement-specific distance;
- off-trail time/distance;
- jumps, run activations and movement-state transitions;
- backtracking episodes;
- browser visibility/focus interruptions;
- audio/exposure integrity flags;
- complete unedited route-handover response;
- complete unedited generalisation response;
- displayed generalisation stimuli and order;
- coarse runtime diagnostics needed to interpret failures.

Sign exposure is explicitly treated as **proximity-defined opportunity for visual exposure**, not as evidence of visual attention.

### Time model

Events retain two clocks:

- `sessionTime` — continuous monotonic time from session creation;
- `gameplayTime` — time from the start of controllable gameplay and frozen when gameplay ends.

Post-game response timing uses `sessionTime`, so route-handover and generalisation durations remain measurable after arrival at the outpost. Visibility intervals allow wall-clock gameplay to be separated from active visible gameplay.

## Data storage

Production records are submitted to Supabase/PostgreSQL. `study-config.js` contains the browser-safe project URL and publishable key; no secret/service-role credential is shipped to clients.

`SUPABASE_SCHEMA.sql` reproduces the production table and access model:

- table: `public.mera_sessions`;
- Row Level Security enabled;
- anonymous study client: **INSERT only**;
- no anonymous `SELECT`, `UPDATE` or `DELETE` privileges;
- inserted metadata must agree with the JSON payload and accepted consent record.

One row stores the complete record for one completed session. There is no participant-side local fallback in the production build. If remote submission fails, the final task remains open and the participant can retry; successful completion is shown only after the database confirms submission.

## Development history

The E-series records the progression from controller proof to production research instrument. Early subversions were iterative working builds; later versions correspond to explicit experimental or storage changes.

- **E1 — controller proof · 09/2026.** Minimal third-person browser prototype. Established React Three Fiber + Rapier + Ecctrl movement, camera, WASD control, running, jumping, grounding and collision behaviour. A simple Soldier model was used as the initial animated humanoid.

- **E2 — environment proof · 09/2026.** Moved the controller into the first Northern Outpost landscape. Added bounded terrain, trees, grass, rocks, water, bridge/ford geometry and a visible destination. Introduced instancing and simplified rendering to retain browser performance.

- **E3.0 — route experiment prototype · 09/2026.** Converted the landscape into a short directed journey with three branching decisions and later route reconvergence. Added MERA navigation, the storm/outpost objective, route triggers and the first post-game description task.

- **E3.1–E3.3 — consequential choices · 09/2026.** Made decisions irreversible within each branch. Added storm-driven route consequences (flooding/route loss, tree obstruction, rockfall), cinematic consequence moments and branch-specific navigation logic.

- **E3.4–E3.5 — lexical interaction prototype · 09/2026.** Added novel route labels and repeated lexical encounters. Expanded to six lexical forms, moved target exposure away from unconstrained chatbot generation and toward deterministic route-linked stimuli, and separated target-word exposure from neutral decision guidance.

- **E3.6 — fixed voice pipeline · 09/2026.** Replaced variable/browser speech with pre-rendered Kokoro Heart audio. Introduced deterministic audio filenames and fixed speech playback so linguistic stimuli could be reproduced exactly across sessions.

- **E3.7–E3.8 — landscape and performance passes · 09/2026.** Refined forest density, rocks, waterfall, outpost visibility and collision geometry. Reduced expensive rendering where it did not improve the experimental scene. Preserved limited off-trail movement while preventing passage through major physical obstacles.

- **E3.9.0–E3.9.3 — route readability · late 09/2026.** Added continuous light hiking trails, then narrowed/lowered them to function as visual guidance rather than movement rails. Improved rock/terrain boundaries, route separation and physical colliders. Iteratively aligned route prompts and consequences with actual traversal positions.

- **E3.9.4 — reference gameplay baseline · late 09/2026.** Stabilised the current valley layout, three decision points, signs, outpost progression, environmental consequences and movement behaviour. Lexical lettering became visible only after commitment and proximity, preventing exposure on the unchosen branch.

- **E3.9.5 — Adventurer + route locking · 01/10/2026.** Replaced the Soldier with the Quaternius Adventurer after isolated character tests. Corrected orientation/animation mapping; walking reuses the Run clip at reduced speed and jump states remain upright. Corrected route-lock placement so the **non-selected** branch becomes physically unavailable after commitment.

- **E4.0 — counterbalanced pilot · 02/10/2026.** Decoupled lexical forms from fixed physical routes through six counterbalance conditions. Formalised the 3-item × 3-exposure protocol, added sign dwell and audio-completion logging, one-second trajectory sampling, movement summaries and local JSON pilot export. Added route handover + one generalisation task.

- **E4.1 — environmental sound + photographic transfer · 02/10/2026.** Added procedural rain/wind/thunder with voice ducking, moved ford reinforcement earlier, and replaced schematic generalisation drawings with fixed real photographs.

- **E4.2 — participant framing + consent · 02/10/2026.** Added the field-intern scenario, explicit MERA role, study duration/research information, consent-by-ENTER record, stronger thunder presentation and final participant thank-you screen.

- **E4.3 — telemetry/storage preparation · 02/10/2026.** Added separate session/gameplay clocks, visibility/focus logging, active/hidden gameplay measures, consent-text versioning, expanded derived telemetry and the reproducible Supabase schema.

- **E4.4 — production database · 02/10/2026.** Connected direct insert-only Supabase storage and removed participant-side local export. Completion became conditional on successful remote submission.

- **E4.5 — post-game timing correction · 02/10/2026.** Corrected route-handover and generalisation timing to use the continuously running session clock after gameplay ends. Current production candidate; gameplay and experimental stimuli otherwise unchanged from the validated E4.4 run.

## Reproducing the current instrument

To reproduce the production instrument rather than only its visual game state:

1. serve the repository over HTTP/HTTPS;
2. retain the pinned import-map versions in `index.html`;
3. retain the complete `audio/` stimulus matrix and its filenames;
4. retain the six cyclic counterbalance conditions and slot order in `main.js`;
5. retain the fixed generalisation stimulus IDs/source mapping;
6. create the database by running `SUPABASE_SCHEMA.sql` in the target Supabase project;
7. set the target project URL, publishable key and table name in `study-config.js`;
8. verify one complete session reaches `mera_sessions` and that the record contains three encountered words with `nominalExposureCount = 3` each and `nominalExposureTotal = 9`;
9. verify route-handover and generalisation response times are non-zero in E4.5 before opening formal data collection.

For controlled QA, append `?condition=N` to force a specific counterbalance condition. Formal participant deployment should use random assignment.

## External dependencies and provenance

The production page currently relies on pinned browser ESM packages and selected externally hosted visual resources. Local project textures and the fixed audio stimulus pack are stored in the repository. Full attribution/licensing notes for Poly Haven, Pexels, Kokoro/Heart, Quaternius and the open-source JavaScript libraries are maintained in `THIRD_PARTY_NOTICES.md`.

For archival reproducibility, a frozen study release should preserve the exact repository state, audio directory, third-party notices, database schema, consent-text version, build identifier and session schema used during data collection.
