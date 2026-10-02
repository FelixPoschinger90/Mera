# MERA E4.5 — Counterbalanced Production Study

MERA E4.5 is the counterbalanced production research-instrument build of *The Northern Outpost*. The accepted gameplay, Adventurer character, terrain, storm system, route consequences, physical route locks, counterbalanced lexical stimuli, environmental audio and photographic generalisation task are retained. E4.5 uses insert-only production storage in Supabase. Completed records are submitted directly to the study database and are not exported to participant devices.

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
