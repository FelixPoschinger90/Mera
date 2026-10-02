# MERA E4.5 — Counterbalanced Production Study

MERA developed iteratively from a movement and environment prototype into a controlled browser-based research instrument. The version sequence reflects changes in both technical implementation and experimental design rather than a series of independent game builds.
E1 — Controller proof.
The first version established the basic third-person interaction model using Ecctrl/Rapier: player movement, camera behaviour, collision handling and a controllable character in a minimal test environment. Its purpose was to determine whether a sufficiently smooth browser-based third-person experience could be achieved before constructing the experimental world.
E2 — Environment prototype.
E2 transferred the controller into the first compact version of The Northern Outpost. The focus shifted from isolated movement testing to environmental navigation: terrain, vegetation, route structure and a traversable valley were assembled into a coherent play space. The outpost became the visible destination and the map was deliberately constrained so that participants could explore locally without becoming lost in a large open world.
E3 — Experimental gameplay structure.
E3 established the core five-to-eight-minute gameplay loop and introduced three consequential route decisions: bridge versus ford, sheltered forest versus exposed route, and ridge versus switchback. Route selection began to affect subsequent access to the environment, and the outpost became the formal endpoint of the journey. This stage also introduced novel lexical items into MERA's guidance, route logging and a post-game free-text route description. The lexical inventory and exposure structure were subsequently revised as the experimental design became more precise.
E3.9 — Environment, consequence and presentation refinement.
The E3.9 series concentrated on making the environment legible and the decisions physically meaningful without substantially changing the underlying study concept. Storm rendering, rain and lightning were improved; directional wind effects were added; route branches were physically separated until their intended reconvergence; the woodland environment was made denser; and higher-quality CC0 vegetation and rock assets were introduced. Performance was also stabilised, including the removal of expensive shadow rendering where it did not materially improve the scene.
E3.9.1 — Route readability and collision refinement.
Continuous light dirt/gravel trails were added to make the intended hiking routes visible without forcing the participant to remain on them. Rock geometry and colliders were revised so that visually substantial objects also behaved as physical obstacles. The path texture was subsequently lightened to remain readable against the surrounding grass while retaining a relatively narrow, natural trail appearance.
E3.9.4 — Reference gameplay baseline.
By E3.9.4, the map layout, three decision sequence, environmental consequences, lexical signs, MERA guidance, outpost progression and general movement behaviour had stabilised sufficiently to serve as the reference build for later experimental changes. Subsequent development therefore avoided unnecessary alterations to terrain, navigation and decision geometry.
E3.9.5 — Character and route-lock revision.
The previous soldier character was replaced by a Quaternius Adventurer model after separate character-controller testing. Animation handling was adapted so that walking, running and jumping remained stable without changing the underlying Ecctrl controller. The non-selected branches were also corrected so that commitment to one route genuinely prevented traversal of the alternative route until the branches reconverged.
E4.0 — Counterbalanced study pilot.
E4.0 marked the transition from a gameplay prototype to a structured experimental instrument. The six final lexical forms — menic, blicket, boskot, fiffin, virdex and teebu — were decoupled from fixed physical routes through six counterbalanced mappings. Each participant therefore encounters exactly three lexical items, determined by their three route choices. Each encountered item receives three controlled exposures: one contextual spoken exposure, one route sign, and one spoken reinforcement. The three unchosen items remain unexposed. The post-game procedure was also formalised as a spontaneous route-description task followed by one generalisation task. E4.0 initially stored the complete study record as a locally exported JSON file for validation.
E4.1 — Environmental audio and generalisation stimuli.
Continuous rain and wind audio were added to reduce the otherwise empty acoustic environment, with environmental audio automatically attenuated while MERA speaks. Thunder was linked to lightning events. The timing of the second ford instruction was moved earlier so that its wording remained contextually appropriate during traversal. The generalisation task was redesigned to use fixed real-world photographic stimuli rather than schematic illustrations, with the exact stimulus identifier retained in the study record.
E4.2 — Participant briefing and study framing.
The entry sequence was expanded to establish the participant's role as an environmental field intern, the storm emergency, MERA's function as an AI navigation system and the objective of reaching the northern outpost to restore emergency communication. The same screen also introduced the study duration, research-data use and consent procedure. Completion messaging was revised to provide an explicit end to the participant experience. Thunder rendering was strengthened while remaining suppressed during controlled speech stimuli.
E4.3 — Research telemetry and storage preparation.
E4.3 expanded the event model so that behaviour could be reconstructed rather than represented only by summary values. Events began recording both session-relative and gameplay-relative timing, visibility interruptions, active versus hidden gameplay time, explicit consent acceptance and consent-text version. The storage schema for remote research-data submission was also introduced, using an insert-only Supabase configuration while local export remained active during validation.
E4.4 — Production database integration.
Remote storage was connected to a Frankfurt-hosted Supabase PostgreSQL database. Completion now submits the complete anonymous session record directly to the research database using a browser-safe publishable key and Row Level Security. Public clients have INSERT permission only and cannot retrieve, modify or delete existing records. Local participant-side JSON export was removed. A participant reaches the completion screen only after successful remote submission; failed submissions remain retryable from the final task.
E4.5 — Production timing correction and instrument freeze candidate.
The final production refinement separated the continuously running session clock from the gameplay clock after arrival at the outpost. This corrected response-time measurement for the route-description and generalisation tasks while preserving gameplay-duration measures independently. E4.5 retains the established gameplay, six-condition counterbalancing, fixed Heart/Kokoro speech stimuli, three-exposure lexical protocol, photographic generalisation task, consent logging, behavioural telemetry and remote database storage. It represents the production version intended for pilot validation and subsequent data collection.
Across these iterations, the central experimental structure remained progressively more constrained rather than more complex: three consequential route choices, three encountered lexical items, three exposures per encountered item, spontaneous post-game production, and one transfer/generalisation measure. Later versions primarily improved stimulus control, environmental credibility, measurement precision and reproducibility while preserving the established navigation task.

## Experimental structure

Each session is assigned one of six counterbalance conditions. The six target forms — `menic`, `blicket`, `boskot`, `fiffin`, `virdex`, and `teebu` — rotate across the six physical route slots:

- river / bridge
- river / ford
- woodland / pine
- woodland / birch
- ascent / ridge
- ascent / switchback

Each target form occupies each physical route slot exactly once across the six conditions. Assignment is random unless a condition is explicitly fixed with the `condition=1` to `condition=6` URL parameter for controlled testing.

A completed participant encounters exactly three target forms: one on the selected route at each of the three decisions. Each selected form has three controlled encounters in the same order:

1. spoken contextualisation;
2. lexical sign exposure;
3. spoken reinforcement.

The three target forms attached to unchosen routes are not exposed. The optional MERA text link remains descriptive and does not introduce target forms.

## Participant entry and consent record

The entry screen establishes the participant as an environmental field intern and identifies MERA as the reserve's AI navigation guide before the field run begins. It states the approximate study duration, the categories of recorded study data, the voluntary nature of participation and the scientific-research purpose of the data.

Pressing `ENTER` creates an explicit consent event in the session record. The record stores the acceptance timestamp, session-relative acceptance time and the consent-text version identifier `MERA_CONSENT_V1_2026_10_02`. No name, email address or account identifier is requested by the study interface.

## Time model

Every chronological event stores two clocks:

- `sessionTime`: monotonic time from initial page/session creation;
- `gameplayTime`: monotonic time from the start of controllable gameplay, or `null` for pre-game events.

The compatibility field `t` uses `gameplayTime` when gameplay has begun and `sessionTime` beforehand. This prevents loading, consent, intro, visibility and environmental events from collapsing to time zero.

Visibility interruptions are stored as explicit intervals. Derived timing contains both wall-clock gameplay duration and `hiddenDuringGameplay` / `activeGameplay`, allowing analyses to distinguish elapsed run duration from time during which the study page was not visible.

Post-game response timestamps use the continuously running `sessionTime` clock rather than the gameplay clock, which stops when the outpost is reached. This preserves actual guide and generalisation response durations after gameplay has ended.

## Field presentation

The spoken emergency transmission establishes the storm damage, injured and missing team members, failed outpost relay and time pressure. Continuous procedural rain and wind run during the field journey, with thunder coupled to lightning. Environmental audio is automatically ducked while MERA speaks, and field thunder is suppressed during active MERA voice playback.

## Voice stimuli

The `audio/` directory contains the fixed Heart (`af_heart`) stimulus pack. Lexical recordings follow the naming convention:

`lex_<route-slot>_<target-form>_<context|reinforce>.wav`

The full matrix contains 72 lexical recordings: six route slots × six target forms × two spoken encounters. Fixed intro, decision, consequence and outpost recordings are separate. Speech synthesis does not run during a study session.

## Post-game measures

After relay restoration, MERA reports that its local navigation cache is empty and asks the participant to leave directions for the approaching rescue team. This free-text route handover is the first post-game response.

A single generalisation task follows. Three fixed photographic route sections corresponding to the three route properties encountered during gameplay are shown in randomised order. The participant describes sections A, B and C in one free-text response. No target forms are displayed or suggested during either response task.

The session record stores each photograph's stimulus identifier and source page together with the route slot and target form so that the presented exemplar can be reconstructed later.

## Recorded session data

The session record preserves summary variables and the raw event history. It includes:

- random session UUID, build and schema version;
- consent status, consent timestamp and consent-text version;
- counterbalance condition and complete target-form-to-route mapping;
- route choices, commitment positions and decision latencies;
- each lexical voice event and playback result;
- sign exposure, proximity-defined sign dwell time and target-form exposure counts;
- intro, route, environmental, consequence, outpost and task events;
- session-relative and gameplay-relative timestamps for every event;
- environmental-audio start/stop/failure events and fixed sound configuration;
- optional MERA text interactions;
- one-second player trajectory samples with position, movement state, stage and route state;
- wall-clock gameplay duration, hidden-during-gameplay duration and active gameplay duration;
- walking, running, stationary, airborne, cinematic and chat time;
- total, walking, running and airborne distance;
- off-trail time and distance;
- wind-exposure time;
- jump count, run-key activations and movement-state transitions;
- visibility/focus interruptions and audio/exposure quality flags;
- complete unedited route-handover text and response timing;
- generalisation stimulus order, stimulus identifiers, corresponding route slots, complete unedited response text and response timing;
- coarse technical diagnostics required to interpret runtime failures.

## Storage architecture

`study-config.js` contains the browser-safe Supabase project URL and publishable key used by the production study. On completion, one row is submitted to the `mera_sessions` table through the Supabase REST endpoint. The submitted row contains the session UUID, build/schema identifiers, counterbalance condition, completion timestamp and the complete JSON study record.

The database schema in `SUPABASE_SCHEMA.sql` enables Row Level Security, revokes public read/update/delete privileges and grants the unauthenticated study client INSERT permission only. Existing session rows are therefore not readable, editable or deletable through the public study client.

There is no local participant-data fallback. If submission fails, the completion screen is not shown. The final task remains open and the participant is asked to check the network connection and press `COMPLETE` again. This avoids storing study records on participant devices while preventing a failed submission from being mistaken for successful completion.

## Study integrity

The raw chronological `events` array and `trajectory` samples are retained in addition to derived summaries so that alternative process variables can be reconstructed after data collection. Visual sign exposure is defined by proximity and logged as such; it is not treated as direct evidence of visual attention.

Environmental sound levels are fixed for all participants. MERA voice playback temporarily reduces ambient rain/wind, and field thunder is suppressed during active MERA speech, limiting uncontrolled masking of lexical stimuli.
