# MERA E4.1 — Counterbalanced Study Pilot

MERA E4.1 is the counterbalanced research-instrument build of *The Northern Outpost*. The accepted E3.9.5 gameplay, Adventurer character, terrain, storm system, route consequences and physical route locks are retained. The E4 layer adds controlled lexical assignment, exposure logging, post-game response tasks and complete pilot-session export. E4.1 additionally introduces fixed environmental storm audio, an expanded participant-facing field briefing, an earlier ford reinforcement trigger and photographic generalisation stimuli.

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

## Field presentation

The entry screen establishes the participant as a reserve field worker and identifies MERA as the reserve's AI navigation guide before the field run begins. The spoken emergency transmission then establishes the storm damage, injured and missing team members, failed outpost relay and time pressure.

The journey uses fixed procedural environmental audio generated in the browser: continuous rain and low wind, plus thunder coupled to field lightning. Environmental audio is automatically ducked while MERA speaks so the pre-rendered lexical stimuli remain intelligible. Thunder is not played over an active MERA voice line.

## Voice stimuli

The `audio/` directory contains the fixed Heart (`af_heart`) stimulus pack. Lexical recordings follow the naming convention:

`lex_<route-slot>_<target-form>_<context|reinforce>.wav`

The full matrix contains 72 lexical recordings: six route slots × six target forms × two spoken encounters. Fixed intro, decision, consequence and outpost recordings are separate. Speech synthesis does not run during a study session.

The ford reinforcement is queued earlier than in E4.0 so that the second spoken encounter is delivered while the participant is still on the crossing rather than after the far bank has already been reached.

## Post-game measures

After relay restoration, MERA reports that its local navigation cache is empty and asks the participant to leave directions for the approaching rescue team. This free-text route handover is the first post-game response.

A single generalisation task follows. Three new photographic route sections are shown, corresponding to the three route properties encountered during gameplay. Their order is randomised. The photographs are fixed external stimuli and are preloaded before the field run is enabled. The participant describes sections A, B and C in one free-text response. No target forms are displayed or suggested during either response task.

The session record stores the generalisation stimulus identifier and source page alongside the route slot and target form so that every displayed exemplar can be reconstructed later.

## Recorded session data

The pilot export preserves both summary variables and the raw event history so that additional measures can be derived later. The session record includes:

- anonymous session UUID, build and schema version;
- counterbalance condition and complete target-form-to-route mapping;
- route choices, commitment positions and decision latencies;
- each lexical voice event and playback result;
- sign exposure, proximity-defined sign dwell time and target-form exposure counts;
- intro, route, environmental, consequence, outpost and task events;
- environmental-audio start/stop/failure events and the fixed sound configuration;
- optional MERA text interactions;
- one-second player trajectory samples with position, movement state, stage and route state;
- total gameplay duration;
- walking, running, stationary, airborne, cinematic and chat time;
- total, walking, running and airborne distance;
- off-trail time and distance;
- wind-exposure time;
- jump count, run-key activations and movement-state transitions;
- visibility/focus interruptions and audio/exposure quality flags;
- complete unedited route-handover text and response timing;
- generalisation stimulus order, stimulus identifiers, corresponding route slots, complete unedited response text and response timing;
- coarse technical diagnostics required to interpret runtime failures.

The pilot build does not submit data remotely. Completion automatically exports one JSON session record to the local machine; the completion screen also supports a manual repeat export. The production storage layer remains separated from the gameplay and measurement logic.

## Study integrity

The session record retains the raw chronological `events` array and `trajectory` samples in addition to derived summaries. This makes later reconstruction of alternative process variables possible without changing the instrument after data collection. Visual sign exposure is defined by proximity and logged as such; it is not treated as direct evidence of visual attention.

Environmental sound levels are fixed for all participants. MERA voice playback temporarily reduces the ambient rain/wind level, and field thunder is suppressed during active MERA speech, limiting uncontrolled masking of lexical stimuli.
