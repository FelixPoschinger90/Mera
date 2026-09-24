# MERA E3.3 — Assisted Navigation

Browser-playable pilot build for the MERA lexical-transfer study.

## Deploy
Upload these five files to the root of the GitHub Pages site:
- `index.html`
- `main.js`
- `styles.css`
- `README.md`
- `THIRD_PARTY_NOTICES.md`

There is no local assets folder in this build. The controller/framework, Soldier test character, and Poly Haven textures are loaded from public CDNs/hosts. For the final study deployment these resources should be localized for reliability.

## E3.3 interaction architecture
E3.3 keeps the E3.2 landscape, irreversible route commitments and environmental consequence cinematics, and adds two deliberately separate MERA channels.

### 1. Spoken MERA
Voice is reserved for consequential moments only:
- opening radio transmission / mission framing
- the three choice-architecture prompts
- the three post-choice environmental consequences

Routine lexical messages and chatbot responses are not voiced.

The pilot uses the browser `speechSynthesis` API plus locally generated radio crackle. The exact installed voice can differ across computers; fixed pre-generated audio is preferable for a final controlled study.

### 2. MERA ASSIST — text only
A circular MERA icon opens a silent contextual assistant. The player can:
- choose one of the context-sensitive suggested questions, or
- type a short free-text question.

The assistant is deterministic. Questions are matched to a small set of route intents; no generative model or external AI service is called. Unsupported or overly broad questions receive a bounded fallback such as: `I cannot access that data. Limited uplink availability.`

Suggested prompts change by stage. Examples include:
- Is the bridge safe?
- What about the rocks?
- Which route is faster?
- What about the pine route?
- How exposed is the open route?
- How difficult is the ridge?
- Can I change my mind?

Opening the text assistant pauses player movement until the panel is closed.

## Controlled optional lexical exposure
The six retained nonce forms are:
- bridge: `menic`
- ford: `blicket`
- pine/sheltered: `boskot`
- open/exposed: `fiffin`
- ridge/steep: `virdex`
- switchback/winding: `teebu`

Fixed route messages still provide two short exposures only after a route has been committed to.

A small number of specific information-seeking intents may contain the relevant target form. Example: asking `Is the bridge safe?` can return a response beginning `It is menic — old and narrow ...`.

Each target-bearing chatbot response is capped at **one optional exposure per nonce form per session**. Repeated questions about the same feature switch to ordinary vocabulary. This prevents repeated chatbot use from mechanically producing repeated target-word exposure.

Because a participant can ask about an unchosen route, optional chat exposure is logged separately from route exposure and should be treated as self-selected information seeking rather than a randomized manipulation.

## Irreversible route consequences
The three route decisions remain commitments. After completion of each chosen branch, a short camera event makes the rejected alternative unavailable:
1. River: rising water removes the ford, or the bridge collapses.
2. Woodland: stormfall blocks the unchosen path.
3. Final ascent: rockfall/slope failure closes the unchosen ascent.

The branches remain physically separated until their authored reconvergence point.

## Pilot logging
The downloadable JSON currently records:
- build ID and timestamps
- route choices
- fixed and optional lexical exposure events
- optional target exposure counts by form
- chat openings, questions, resolved intents and deterministic responses
- environmental consequences
- final free-text route guide
- browser voice identity used for the spoken MERA layer where available

This is still local pilot logging. Persistent study storage / transmission is intentionally not implemented yet.

## Controls
- WASD / arrows: move
- Shift: run
- Space: jump
- Mouse drag: orbit camera
- MERA icon: open text assistant
- Escape: close text assistant

## Current limitations
This remains a prototype. The E1 Soldier character is still used. The waterfall has not yet been refined. Runtime assets remain network-loaded. Browser TTS is suitable for piloting but is not acoustically standardized across participant devices.
