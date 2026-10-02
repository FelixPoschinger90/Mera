# MERA E4.0 — Counterbalanced Study Pilot

MERA E4.0 is the counterbalanced research-instrument build of *The Northern Outpost*. The accepted E3.9.5 gameplay, Adventurer character, terrain, storm system, route consequences and physical route locks are retained. The E4.0 layer adds controlled lexical assignment, exposure logging, post-game response tasks and a complete local pilot export.

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

## Voice stimuli

The `audio/` directory contains the fixed Heart (`af_heart`) stimulus pack. Lexical recordings follow the naming convention:

`lex_<route-slot>_<target-form>_<context|reinforce>.wav`

The full matrix contains 72 lexical recordings: six route slots × six target forms × two spoken encounters. Fixed intro, decision, consequence and outpost recordings are separate. Speech synthesis does not run during a study session.

## Post-game measures

After relay restoration, MERA reports that its local navigation cache is empty and asks the participant to leave directions for the approaching rescue team. This free-text route handover is the first post-game response.

A single generalisation task follows. Three new visual route sections are shown, corresponding to the three route properties encountered during gameplay. Their order is randomised. The participant describes sections A, B and C in one free-text response. No target forms are displayed or suggested during either response task.

## Recorded session data

The pilot export preserves both summary variables and the raw event history so that additional measures can be derived later. The session record includes:

- anonymous session UUID, build and schema version;
- counterbalance condition and complete target-form-to-route mapping;
- route choices, commitment positions and decision latencies;
- each lexical voice event and playback result;
- sign exposure, proximity-defined sign dwell time and target-form exposure counts;
- intro, route, environmental, consequence, outpost and task events;
- optional MERA text interactions;
- one-second player trajectory samples with position, movement state, stage and route state;
- total gameplay duration;
- walking, running, stationary, airborne, cinematic and chat time;
- total, walking, running and airborne distance;
- jump count, run-key activations and movement-state transitions;
- visibility/focus interruptions and audio/exposure quality flags;
- complete unedited route-handover text and response timing;
- generalisation stimulus order, corresponding route slots, complete unedited response text and response timing;
- coarse technical diagnostics required to interpret runtime failures.

The pilot build does not submit data remotely. Completion automatically exports one JSON session record to the local machine; the completion screen also supports a manual repeat export. The production storage layer is intentionally separated from the gameplay and measurement logic.

## Study integrity

The session record retains the raw chronological `events` array and `trajectory` samples in addition to derived summaries. This makes later reconstruction of alternative process variables possible without changing the instrument after data collection. Visual sign exposure is defined by proximity and logged as such; it is not treated as direct evidence of visual attention.
