# MERA E3.2 — Consequence Expedition

Browser-playable pilot build for the MERA lexical-transfer study.

## Deploy
Upload these five files to the root of the GitHub Pages site:
- `index.html`
- `main.js`
- `styles.css`
- `README.md`
- `THIRD_PARTY_NOTICES.md`

There is no local assets folder in this build. The controller/framework, Soldier test character, and Poly Haven textures are loaded from public CDNs/hosts, as in E3.1. For the final study deployment these should be localized for reliability.

## E3.2 design
The opening is now a ~12 second MERA radio transmission with locally generated crackle. It establishes the storm, the damaged Northern Outpost relay, the approaching second front, and the need to restore the emergency uplink.

Each of the three decision stages is an irreversible branch. Once the participant commits, a physical obstacle closes the branch entrance behind them and the two routes are separated by terrain until they reconverge.

After each chosen route is completed, player movement is frozen for a ~3.3 second camera cut showing the unchosen alternative becoming unavailable:

1. River
   - bridge chosen -> rising water engulfs/blocks the stepping-stone ford
   - ford chosen -> bridge visibly drops/collapses into the river
2. Woodland
   - pine chosen -> a tree falls across the open/birch route
   - birch chosen -> a tree falls across the pine route
3. Final ascent
   - ridge chosen -> rockfall/landslide blocks the switchback
   - switchback chosen -> rockfall blocks the ridge

The destroyed alternative is also given a physical collider so it cannot simply be traversed after the cinematic.

## Lexical stimuli
Six nonce forms are retained; each participant encounters only the three forms belonging to the routes actually chosen:

- bridge: `menic` — old, narrow, single-file timber crossing
- ford: `blicket` — shallow, stone-set crossing with exposed rocks
- pine: `boskot` — dense, enclosed, wind-sheltered cover
- birch/open: `fiffin` — open, directly wind-exposed ground
- ridge: `virdex` — steep, direct, loose-rock ascent
- switchback: `teebu` — long, winding, gradual ascent

The nonce form is not used in the pre-choice description. After commitment it receives only two exposures: one short contextual introduction and one later bare reuse. Messages are deliberately much shorter than E3.1 and remain visible long enough to read.

## Logging
The exported pilot JSON records:
- build ID and timestamps
- the three route choices
- exposure counts for all six possible forms
- MERA messages and their exposure role
- environmental events/consequences
- final free-text guide

## Controls
- WASD / arrows: move
- Shift: run
- Space: jump
- Mouse drag: orbit camera

## Current limitations
This remains a prototype. The third-person Soldier is still the proven E1 test character. The waterfall is unchanged. Assets are still network-loaded rather than bundled locally. The build has been syntax-checked, but final visual/physics acceptance should be done in the same GitHub Pages/browser environment used for the pilot.
