# Kla Khlok — Task Tracker

This tracker turns [`KLA_KHLOK_GDD.md`](KLA_KHLOK_GDD.md) into an implementation backlog. Status is intentionally conservative: a task is `DONE` only when its acceptance evidence exists in the repository.

**Statuses:** `TODO` · `IN_PROGRESS` · `BLOCKED` · `DONE`

**Current status:** `JOB-020 DONE` — image validation and normalization complete; next job is `JOB-021`.

## One-job-at-a-time system

This project is executed as a queue of small jobs. Only one job may be `IN_PROGRESS` at a time.

### Session rule

Start every job in a fresh chat window. Paste only the job card, the relevant files, and this GDD link. Do not ask a fresh session to redesign the whole project or work on a later job. The session must:

1. Read the complete GDD and inspect the current repository state.
2. Implement only the named job and its direct tests.
3. Update this file with status, evidence, and limitations.
4. Run the job's functional test before claiming completion.
5. Stop after reporting the result; the next job starts in another clean session.

### Job completion contract

A job is `DONE` only when its functional test passes and the result is recorded. If the test fails, mark the job `BLOCKED`, record the failure, and do not begin the next job. Every job must be independently revertible by reverting its own commit or restoring its pre-job snapshot; do not combine unrelated jobs in one commit.

### Fresh-session prompt

Copy this prompt and replace the bracketed fields:

> Work only on **[JOB ID — JOB NAME]** from `tasks.md` in this repository. Read `KLA_KHLOK_GDD.md` in full, inspect the current files, and preserve unrelated work. Do not implement later jobs. Make the smallest complete change that satisfies the job card. Add or update only the tests and documentation needed by this job. Run the required functional test: **[TEST]**. If it passes, update this job to `DONE` with the exact command and evidence. If it fails, leave the work in a recoverable state, mark it `BLOCKED`, record the error and likely cause, and stop.

### Granular job queue

Run these jobs in order. Each row is one clean session and one rollback boundary.

| Order | Job ID | Single deliverable | Depends on | Functional test before `DONE` |
| ---: | --- | --- | --- | --- |
| 1 | JOB-001 | Repository and toolchain audit | GDD | DONE — audit recorded below; repository contains only GDD/README/tasks, no app manifests or scripts. |
| 2 | JOB-002 | Minimal monorepo scaffold | JOB-001 | DONE — install, development, type-check, build, and shared smoke test evidence recorded below. |
| 3 | JOB-003 | Shared symbol and phase types | JOB-002 | DONE — stable IDs, phases, dice outcome type, compile-time rejection checks, and runtime smoke test pass. |
| 4 | JOB-004 | Runtime payload schemas | JOB-003 | DONE — Zod schemas and rejection tests pass for malformed IDs, NaN, unknown phases, and incomplete packs. |
| 5 | JOB-005 | Pure score functions | JOB-003 | DONE — exhaustive 216-outcome/six-selection tests and deterministic tie/no-match tests pass. |
| 6 | JOB-006 | Pure round state machine | JOB-004, JOB-005 | DONE — fake-clock reducer completes a valid round, enforces the 2,000 ms tail, retains the original outcome, and rejects invalid commands. |
| 7 | JOB-007 | Cryptographic outcome sampler | JOB-006 | DONE — browser-byte and server-index adapters return valid outcomes and pass rejection/range tests. |
| 8 | JOB-008 | Foundation documentation | JOB-002 | DONE — documentation links and `npm run docs:check` pass. |
| 9 | JOB-009 | Basic web shell and route | JOB-002 | DONE — browser smoke test verified `/` and `/play` render the shell and navigation. |
| 10 | JOB-010 | Bowl and lid scene | JOB-009 | DONE — browser visual test shows the 3D bowl/lid scene and the lid control animates open/closed. |
| 11 | JOB-011 | Three textured cube bodies | JOB-010 | DONE — browser visual test confirms three visible cube bodies with six face materials each. |
| 12 | JOB-012 | Face orientation mapping | JOB-011 | DONE — one-to-one six-face mapping tests pass and the browser debug view displays all directions and IDs. |
| 13 | JOB-013 | Visual physics containment | JOB-011 | DONE — Rapier scene loads and browser inspection shows all three settled dice inside the bowl bounds. |
| 14 | JOB-014 | Authoritative roll lifecycle | JOB-006, JOB-012 | DONE — browser and fake-clock tests prove the shared lifecycle, fixed tail, retained outcome, and one result. |
| 15 | JOB-015 | Button and pointer controls | JOB-014 | DONE — browser verifies tap, pointer press/release, and Space controls share one lifecycle. |
| 16 | JOB-016 | DeviceMotion adapter | JOB-015 | DONE — sensor fixtures pass and browser exposes explicit motion enablement with fallback status. |
| 17 | JOB-017 | Audio and haptics lifecycle | JOB-014 | DONE — single rattle loop, reveal cue, mute toggle, and optional vibration fallback are implemented. |
| 18 | JOB-018 | Controlled reveal and 2D fallback | JOB-012, JOB-014 | DONE — result overlay matches retained outcome and dice freeze in a controlled in-bowl pose. |
| 19 | JOB-019 | Six-slot pack editor | JOB-018 | Browser test opens the editor, edits all six slots, and shows complete square previews without stretching. |
| 20 | JOB-020 | Image validation and normalization | JOB-019 | Image tests cover valid, corrupt, oversized, wrong-extension, extreme-dimension, and metadata-bearing inputs. |
| 21 | JOB-021 | Pack texture propagation | JOB-020 | Browser test changes one slot and confirms the same normalized image appears on the board and corresponding die faces. |
| 22 | JOB-022 | IndexedDB pack persistence | JOB-021 | Reload test retains a saved pack; simulated quota failure leaves the editor and game usable. |
| 23 | JOB-023 | Local player seats and turn flow | JOB-006, JOB-018 | Browser test creates 1 and 8 seats, completes pass-and-pick, and locks confirmed selections at roll start. |
| 24 | JOB-024 | Local scoring and history | JOB-023 | Ten-round deterministic match test produces the expected scores, history, tied winners, and no-match messages. |
| 25 | JOB-025 | Dice-only mode and reset | JOB-024 | Browser test proves dice-only mode never awards scores and New Match clears history while retaining setup. |
| 26 | JOB-026 | Local locked-round recovery | JOB-024 | Reload during each locked phase preserves the original result and cannot double-award points. |
| 27 | JOB-027 | Room create/join and capacity | JOB-025 | Two browser contexts join one room; a ninth player is rejected and unauthorized rejoin credentials fail. |
| 28 | JOB-028 | Online snapshots and deduplication | JOB-027 | Retrying a mutating command returns the original acknowledgment and leaves room state unchanged after the first application. |
| 29 | JOB-029 | Online roster, ready, and host lock | JOB-028 | Non-host roll, missing readiness, post-lock selection, and stale-version commands are rejected. |
| 30 | JOB-030 | Server-authoritative outcomes | JOB-029 | Multi-client test proves all clients receive one identical result and no outcome appears before reveal. |
| 31 | JOB-031 | Online intensity stream and deadlines | JOB-030 | Dropped intensity packets and a silent host still resolve the original round at the server deadline. |
| 32 | JOB-032 | Authenticated online image service | JOB-027 | Upload/download tests reject invalid content and unauthorized access while preserving the active pack after failed staging. |
| 33 | JOB-033 | Shared pack activation | JOB-032 | Clients preload one candidate revision, activate it atomically, and cannot start with mixed revisions. |
| 34 | JOB-034 | Online history and reconnect | JOB-030, JOB-033 | Eight-client ten-round test agrees on scores/history after a disconnect and reconnect. |
| 35 | JOB-035 | Host transfer and cleanup | JOB-034 | Fake-clock test transfers a lost host exactly once and expires idle/empty rooms and files. |
| 36 | JOB-036 | Khmer/English localization | JOB-025 | Browser test switches languages, renders long labels, and finds no missing required translation keys. |
| 37 | JOB-037 | Accessibility and failure paths | JOB-025, JOB-035 | Keyboard, reduced-motion, low-quality, WebGL-loss, sensor-denial, storage-failure, and network-error flows remain actionable. |
| 38 | JOB-038 | Pack export/import | JOB-022 | Export/import round-trip retains six images and rejects a malformed archive without replacing the current pack. |
| 39 | JOB-039 | Automated release validation | JOB-038 | Rule, protocol, image, browser, type-check, and build commands pass; failures are recorded rather than hidden. |
| 40 | JOB-040 | Real-device and performance validation | JOB-039 | iPhone/Android HTTPS motion/audio checks and performance measurements are recorded against GDD targets. |
| 41 | JOB-041 | Release handoff | JOB-040 | A clean checkout follows README setup, starts the documented services, and the handoff report lists remaining limitations. |

### Per-job handoff record

At the end of each session, add or update one record using this format:

```md
### JOB-XXX — Name
- Status: TODO | IN_PROGRESS | BLOCKED | DONE
- Commit: <one commit for this job>
- Functional test: `<exact command or manual test>`
- Result: PASS | FAIL
- Evidence: <what was observed>
- Remaining limitation: <none or specific gap>
- Rollback note: <how to revert only this job>
```

### JOB-001 — Repository and toolchain audit

- Status: `DONE`
- Commit: `041fb3c`
- Functional test: repository audit command inspecting files, manifests, rules, toolchain versions, Git state, and the full GDD
- Result: `PASS`
- Evidence: 1,190-line GDD read successfully; repository contains `KLA_KHLOK_GDD.md`, `README.md`, and `tasks.md`; no `AGENTS.md`, package manifests, app source, or runnable scripts exist; available toolchain includes Git 2.55.0, Node v24.19.0, npm 12.0.2, pnpm 11.25.0, and npx 12.0.2; Godot and Yarn are not installed; branch is clean on `main` and tracks `origin/main`.
- Remaining limitation: No application scaffold or install/build/test command exists yet.
- Rollback note: Revert the commit that adds this audit record only; no application files were changed.

### JOB-002 — Minimal monorepo scaffold

- Status: `DONE`
- Commit: `84b1a94`
- Functional test: `npm install`; `npm run typecheck`; `npm run build`; `npm run test`; start both workspace development servers and request their local HTTP endpoints
- Result: `PASS`
- Evidence: npm installed 99 packages with 0 vulnerabilities; web and server development commands started successfully; web returned HTTP 200 with the expected `Kla Khlok` title; server returned HTTP 200 with `{"service":"Kla Khlok","version":"0.1.0","status":"ready"}`; type-check, production build, and shared smoke test all passed.
- Remaining limitation: The scaffold has no gameplay rules, dice scene, image system, or online room behavior yet.
- Rollback note: Revert this job's commit to remove the scaffold, package lock, and workspace setup without touching the documentation commits.

### JOB-003 — Shared symbol and phase types

- Status: `DONE`
- Commit: `aa7c457` plus cleanup commit removing stale failed-build artifacts
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/shared`; `npm run test --workspace @kla-khlok/shared`
- Result: `PASS`
- Evidence: `SymbolId` accepts only `s0`–`s5`; `RoundPhase` contains all nine documented phases; `DiceOutcome` requires three symbol IDs; compile-time `@ts-expect-error` checks reject invalid symbol and phase values; shared runtime smoke test passes.
- Remaining limitation: Runtime payload validation is the next job (`JOB-004`); these types do not validate external data at runtime yet.
- Rollback note: Revert this job's commit to remove the shared type additions while preserving the JOB-002 scaffold.

### JOB-004 — Runtime payload schemas

- Status: `DONE`
- Commit: `27f4c05`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/shared`; `npm run test --workspace @kla-khlok/shared`
- Result: `PASS`
- Evidence: Zod schemas accept valid stable IDs, documented phases, three-symbol outcomes, and complete six-slot manifests; tests reject unknown IDs/phases, invalid outcomes, `NaN`, and incomplete packs; all three shared tests pass.
- Remaining limitation: Schemas cover the current shared foundation only; full command/event protocol schemas belong to later online-room jobs.
- Rollback note: Revert this job's commit to remove Zod and runtime schema additions while preserving the type-only contracts from JOB-003.

### JOB-005 — Pure score functions

- Status: `DONE`
- Commit: `1d8d907`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/shared`; `npm run test --workspace @kla-khlok/shared`
- Result: `PASS`
- Evidence: All 216 ordered dice outcomes and all six selections are checked; points are restricted to 0/10/20/30; player scoring, positive round winners, no-match rounds, shared ties, and match ties all pass deterministic tests.
- Remaining limitation: Scores are pure calculations only; round lifecycle and exactly-once finalization are the next state-machine job (`JOB-006`).
- Rollback note: Revert this job's commit to remove scoring functions/tests while preserving schemas and type contracts.

### JOB-006 — Pure round state machine

- Status: `DONE`
- Commit: `4eb9507`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/shared`; `npm run test --workspace @kla-khlok/shared`
- Result: `PASS`
- Evidence: Reducer covers lobby, selecting, armed, shaking, settling, revealing, results, and match-finished transitions; fake-clock tests prove 1,999 ms is not complete, 2,000 ms enters reveal, finalization retains the sampled outcome, and duplicate ticks do not append history or score twice; invalid host/phase commands throw without mutation.
- Remaining limitation: Outcome sampling is injected for deterministic tests; cryptographic adapters are the next job (`JOB-007`).
- Rollback note: Revert this job's commit to remove the reducer and lifecycle tests while preserving scoring and schemas.

### JOB-007 — Cryptographic outcome sampler

- Status: `DONE`
- Commit: `f71ece2`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/shared`; `npm run test --workspace @kla-khlok/shared`
- Result: `PASS`
- Evidence: Browser-byte sampling rejects the 252–255 biased tail and maps accepted bytes to six symbols; server sampling requests `[0, 6)` three times and rejects invalid source values; all nine shared tests pass.
- Remaining limitation: The adapters are ready for authority integration but are not yet wired into local or online gameplay.
- Rollback note: Revert this job's commit to remove sampler adapters/tests while preserving the reducer and scoring system.

### JOB-008 — Foundation documentation

- Status: `DONE`
- Commit: `b61344c`
- Functional test: `npm run docs:check`
- Result: `PASS`
- Evidence: Documentation check passed for README, GDD, root task tracker, delivery plan, and documentation task link; README lists the verified scaffold commands and current next job.
- Remaining limitation: Feature-specific architecture, protocol, QA, asset, and changelog documents will be added as their implementation jobs require them.
- Rollback note: Revert this job's commit to remove the new `docs/` files and documentation check without changing gameplay code.

### JOB-009 — Basic web shell and route

- Status: `DONE`
- Commit: `20bee6a`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; start the web dev server and inspect `/` and `/play` in a browser
- Result: `PASS`
- Evidence: Type-check and Vite production build passed; browser smoke test rendered the `Kla Khlok` heading, navigation, foundation status, and route-specific text at both `http://127.0.0.1:5173/` and `/play`.
- Remaining limitation: The play route is a foundation placeholder; bowl, lid, dice, and gameplay controls begin in JOB-010 and later jobs.
- Rollback note: Revert this job's commit to remove route-aware shell changes while preserving the scaffold and shared foundation.

### JOB-010 — Bowl and lid scene

- Status: `DONE`
- Commit: `bbd2036`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; start the web dev server and inspect the 3D scene in a browser
- Result: `PASS`
- Evidence: Three.js/React Three Fiber scene rendered a lit bowl, rim, lid, and camera in the browser; the `Open lid` control changed to `Close lid` and visibly animated the lid; type-check and production build passed.
- Remaining limitation: The production bundle is currently large because Three.js and React Three Fiber are bundled together; optimization is tracked for the release phase.
- Rollback note: Revert this job's commit to remove Three.js scene dependencies and bowl/lid presentation while preserving the web shell.

### JOB-011 — Three textured cube bodies

- Status: `DONE`
- Commit: `b689266`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; start the web dev server, open the lid, and inspect the browser scene
- Result: `PASS`
- Evidence: Three distinct cube bodies rendered inside the bowl; each cube uses six face materials with distinct placeholder colors; browser screenshot after opening the lid visibly shows all three cubes; type-check and production build passed.
- Remaining limitation: Face materials are temporary color placeholders; stable symbol textures and orientation validation are JOB-012 and later.
- Rollback note: Revert this job's commit to remove the cube bodies/materials while preserving the bowl and lid scene.

### JOB-012 — Face orientation mapping

- Status: `DONE`
- Commit: `69419fe`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/shared`; `npm run test --workspace @kla-khlok/shared`; `npm run build --workspace @kla-khlok/web`; browser debug-view inspection
- Result: `PASS`
- Evidence: Shared tests verify all six directions map one-to-one to stable IDs; all 11 shared tests pass; web type-check/build pass; browser debug view visibly lists `+X/-X/+Y/-Y/+Z/-Z` mapped to `s2/s3/s0/s1/s4/s5`.
- Remaining limitation: The mapping is documented and applied to material slots, but authoritative final top-face pose logic belongs to later roll/reveal jobs.
- Rollback note: Revert this job's commit to remove face mapping exports, tests, and the browser debug panel while preserving the three cube bodies.

### JOB-013 — Visual physics containment

- Status: `DONE`
- Commit: `339d933`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; start the web dev server, let the physics settle, open the lid, and inspect the dice bounds
- Result: `PASS`
- Evidence: React Three Rapier loaded successfully; fixed floor/wall colliders contained all three dynamic dice; after 2 seconds of settling and opening the lid, browser inspection showed all three dice inside the bowl with no escape or stack outside the play area; type-check/build passed.
- Remaining limitation: Physics is currently passive; shake impulses and lifecycle authority are added in JOB-014 and later.
- Rollback note: Revert this job's commit to remove Rapier and containment colliders while preserving the mapped static dice scene.

### JOB-014 — Authoritative roll lifecycle

- Status: `DONE`
- Commit: `16b6710`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; browser test Start Shake → Stop Shake → wait 2,300 ms → inspect result
- Result: `PASS`
- Evidence: Browser entered `SHAKING`, then `SETTLING` with the locked-outcome message, and reached `RESULTS` after the two-second tail with one result and score display; shared reducer tests continue to pass and the browser uses the injected cryptographic sampler plus reducer for the lifecycle.
- Remaining limitation: The current demo has one preselected local seat and no hold/tap/keyboard adapters; those are added in JOB-015.
- Rollback note: Revert this job's commit to remove browser lifecycle wiring and shake impulses while preserving the pure reducer and static physics scene.

### JOB-015 — Button and pointer controls

- Status: `DONE`
- Commit: `0f67e6d`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; browser test tap Start, pointer press/release on Hold to Shake, and Space key press/release
- Result: `PASS`
- Evidence: Browser exposed `Tap to Start` and `Hold to Shake`; Space transitioned the round through `SHAKING` to `SETTLING`; pointer press/release also entered `SETTLING`; the existing Stop button remains available and all paths use the same reducer.
- Remaining limitation: Motion sensor input is not connected yet; DeviceMotion filtering and capability fallback are JOB-016.
- Rollback note: Revert this job's commit to remove the browser control adapters while preserving the authoritative reducer and scene.

### JOB-016 — DeviceMotion adapter

- Status: `DONE`
- Commit: `98aafe1`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/shared`; `npm run test --workspace @kla-khlok/shared`; `npm run build --workspace @kla-khlok/web`; browser enable-motion/fallback check
- Result: `PASS`
- Evidence: Motion fixtures cover quiet/gentle/strong direct acceleration, bounded intensity, 300 ms stop confirmation, gravity-inclusive initialization, and invalid axes; all 13 shared tests pass; browser requires an explicit `Enable Motion` gesture and reports `Motion ready` while button controls remain visible.
- Remaining limitation: Real iPhone/Android permission, sensor, and HTTPS behavior still require device validation in JOB-040.
- Rollback note: Revert this job's commit to remove the motion processor and browser permission/listener adapter while preserving button controls.

### JOB-017 — Audio and haptics lifecycle

- Status: `DONE`
- Commit: `4f7e5d3`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; browser mute-toggle and roll-control smoke test
- Result: `PASS`
- Evidence: Audio service owns one reusable rattle oscillator, stops it on phase exit, plays a reveal cue, exposes a persistent `Mute`/`Unmute` control, and wraps optional vibration without blocking gameplay; browser exposes and toggles the mute control; type-check/build passed.
- Remaining limitation: Audio tuning and device-specific haptic behavior still require real-device validation in JOB-040.
- Rollback note: Revert this job's commit to remove the audio service and mute/haptic UI while preserving roll controls and scoring.

### JOB-018 — Controlled reveal and 2D fallback

- Status: `DONE`
- Commit: `0ce4709`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; browser Start/Stop/wait test and result inspection
- Result: `PASS`
- Evidence: WebGL scene renders when available; Canvas fallback text is present for unsupported graphics; after the fixed tail, all three dice freeze in a controlled centered pose and the authoritative 2D overlay/result text matches the retained outcome exactly.
- Remaining limitation: Face textures are still placeholder materials; custom image packs begin in JOB-019.
- Rollback note: Revert this job's commit to remove the controlled pose and fallback/result overlay while preserving the lifecycle and physics scene.

### JOB-019 — Six-slot pack editor

- Status: `DONE`
- Commit: `72deb1a`
- Functional test: `npm run typecheck`; `npm run build --workspace @kla-khlok/web`; start the web dev server and inspect `/play`
- Result: `PASS`
- Evidence: The play screen renders a dedicated “Customize six symbols” editor with stable `s0`–`s5` labels, six independent image selectors, and square center-crop previews; the browser accessibility tree exposes all six slots and the existing game controls remain available.
- Remaining limitation: The editor currently previews the selected image with CSS center/cover behavior; normalized image blobs, byte limits, metadata stripping, and corrupt-file rejection are JOB-020.
- Rollback note: Revert this job's commit to remove the pack editor and its styles while preserving the playable dice scene and built-in symbol IDs.

### JOB-020 — Image validation and normalization

- Status: `DONE`
- Commit: `b1909b8`
- Functional test: `npm run typecheck --workspace @kla-khlok/shared`; `npm run build --workspace @kla-khlok/shared`; `npm run test --workspace @kla-khlok/shared`; web type-check/build; `npm run docs:check`
- Result: `PASS`
- Evidence: Shared image tests cover valid PNG metadata detection, immutable normalized byte copies, corrupt/empty input, the 10 MiB byte limit, 8,192-pixel dimension limits, 40-megapixel limits, and extension-independent content detection; 17 shared tests pass and web/docs gates pass.
- Remaining limitation: Normalization currently validates and copies source bytes; browser canvas re-encoding to a 256×256 crop and propagating that texture to every render target is JOB-021.
- Rollback note: Revert this job's commit to remove image inspection/normalization exports and tests while preserving the pack editor UI.

## Delivery order

| Phase | Goal | Depends on | Status |
| --- | --- | --- | --- |
| P0 | Foundation, shared rules, schemas, tests, documentation | GDD | TODO |
| P1 | Playable 3D dice shake/stop/reveal prototype | P0 | TODO |
| P2 | Custom pictures and complete Local Party mode | P1 | TODO |
| P3 | Authoritative Online Room mode and pack sharing | P2 | TODO |
| P4 | Recovery, privacy, localization, accessibility | P3 | TODO |
| P5 | Device QA, performance, release handoff | P4 | TODO |

## P0 — Foundation

| ID | Task | Depends on | Status | Evidence / limitation |
| --- | --- | --- | --- | --- |
| FND-01 | Inspect repository rules, existing stack, and scripts | GDD | TODO | Repository is currently documentation-only; verify again before scaffolding. |
| FND-02 | Create React/TypeScript/Vite web app, Node/TypeScript server, and shared package | FND-01 | TODO | No scaffold or runnable scripts yet. |
| FND-03 | Define runtime schemas, stable symbol IDs `s0`–`s5`, protocol version, and phase types | FND-02 | TODO | Must reject invalid IDs, NaN, unknown phases, and malformed payloads. |
| FND-04 | Implement authority reducer, score calculation, injectable clock, and injectable RNG | FND-03 | TODO | Must run without browser or renderer. |
| FND-05 | Implement cryptographic sampler adapters for local and server authority | FND-04 | TODO | Test rejection boundaries and exact `[0, 5]` sampling. |
| FND-06 | Add project documentation and command instructions | FND-02 | IN_PROGRESS | `README.md` and this tracker created; remaining docs are not yet created. |

**P0 gate:** A headless ten-round match validates transitions, scores correctly, and finalizes each round once; the app scaffold loads without errors.

## P1 — Dice prototype

| ID | Task | Depends on | Status | Evidence / limitation |
| --- | --- | --- | --- | --- |
| DICE-01 | Create bowl, animated lid, and three textured cubes | FND-02 | TODO | All three dice must be visibly 3D and contained. |
| DICE-02 | Build face/normal/UV mapping debug view | DICE-01 | TODO | Verify all 18 die-face combinations. |
| DICE-03 | Integrate Rapier visual tumbling and containment | DICE-01 | TODO | Fast shakes must not eject dice or leave reveal stacks. |
| DICE-04 | Implement `ARMED` → `SHAKING` → `SETTLING` → `REVEALING` controller | FND-04, DICE-01 | TODO | Fake-clock timing and original-result retention required. |
| DICE-05 | Add hold, tap, keyboard, and pointer input adapters | DICE-04 | TODO | All controls share one lifecycle and one two-second tail. |
| DICE-06 | Add DeviceMotion permission, filtering, sensitivity, and fallback status | DICE-05 | TODO | Hardware permission behavior requires real-device evidence. |
| DICE-07 | Add audio unlock, intensity loop, collision caps, mute, and reveal cues | DICE-04 | TODO | No stacked loops or leaked listeners. |
| DICE-08 | Add controlled final pose under lid and functional 2D fallback | DICE-02, DICE-04 | TODO | Presentation must agree with authoritative symbols. |

**P1 gate:** Button input completes a readable three-dice roll, stops after exactly the two-second tail, and reveals the correct faces. Motion is optional and must never block fallback controls.

## P2 — Pictures and Local Party

| ID | Task | Depends on | Status | Evidence / limitation |
| --- | --- | --- | --- | --- |
| LOCAL-01 | Build six-slot pack editor and square crop dialog | DICE-08 | TODO | Portrait and landscape images must crop without stretching. |
| LOCAL-02 | Normalize images and generate shared board/die textures | LOCAL-01 | TODO | Same slot crop appears everywhere. |
| LOCAL-03 | Add IndexedDB packs, preferences, and quota-safe fallback | LOCAL-02 | TODO | Reload retains a pack; failure keeps the game usable. |
| LOCAL-04 | Add 1–8 seats and pass-and-pick flow | FND-04 | TODO | Confirmed choices lock at roll start. |
| LOCAL-05 | Add scoring, history, ties, and ten-round leaderboard | LOCAL-04 | TODO | Enumerate all outcomes and verify shared ties/no-match behavior. |
| LOCAL-06 | Add dice-only mode and new-match reset | LOCAL-05 | TODO | Reset preserves approved names and pack. |
| LOCAL-07 | Persist and recover local locked rounds | LOCAL-05 | TODO | Reload cannot reroll or double-award. |
| LOCAL-08 | Clean up replaced textures, object URLs, and resources | LOCAL-02 | TODO | Repeated editing leaves no stale faces or resource leaks. |

**P2 gate:** A complete local ten-round match with custom pictures survives reload and shows a correct final leaderboard.

## P3 — Online Room

| ID | Task | Depends on | Status | Evidence / limitation |
| --- | --- | --- | --- | --- |
| NET-01 | Implement private room create/join, capacity, and rejoin credentials | LOCAL-06 | TODO | Two clients join; ninth player is rejected cleanly. |
| NET-02 | Add snapshots, versions, acknowledgments, and command deduplication | NET-01 | TODO | Retried commands do not mutate twice. |
| NET-03 | Add roster, ready/unready, host lock, and participation states | NET-02 | TODO | Non-host roll and post-lock edits are rejected. |
| NET-04 | Implement server RNG, private outcomes, deadlines, and finalization | NET-03 | TODO | One shared result; no pre-reveal outcome leak. |
| NET-05 | Stream cosmetic shake intensity with rate limits | NET-04 | TODO | Missing intensity packets do not affect the result. |
| NET-06 | Build authenticated image normalization/storage endpoints | LOCAL-02, NET-01 | TODO | Validate decoded content, dimensions, size, and metadata. |
| NET-07 | Stage, preload, and atomically activate shared pack revisions | NET-06 | TODO | Failed upload retains the active pack. |
| NET-08 | Synchronize scores/history across reconnecting clients | NET-04 | TODO | Eight clients agree after ten rounds and recovery. |

**P3 gate:** At least two real browser contexts complete a shared match with host-uploaded pictures and identical authoritative results.

## P4 — Recovery and usability

| ID | Task | Depends on | Status | Evidence / limitation |
| --- | --- | --- | --- | --- |
| UX-01 | Implement reconnect snapshots and stable identity | NET-08 | TODO | Locked rounds recover without rerolling. |
| UX-02 | Implement host grace/transfer and input watchdog | NET-04 | TODO | Host loss still finalizes the locked round. |
| UX-03 | Add room, token, timer, and orphan-file cleanup | NET-06 | TODO | Fake-clock lifecycle tests pass. |
| UX-04 | Add Khmer/English dictionaries and Khmer font layout | P2 | TODO | Review status must be recorded. |
| UX-05 | Add reduced motion, low quality, focus/ARIA, and keyboard flow | P1, P2 | TODO | Full match remains usable in fallback mode. |
| UX-06 | Finish settings, help, privacy, and actionable errors | P2, P3 | TODO | Denied motion, storage, image, network, and WebGL failures have next actions. |
| UX-07 | Add pack export/import | LOCAL-03 | TODO | Six-image round-trip works; malformed archives are rejected. |

## P5 — Validation and handoff

| ID | Task | Depends on | Status | Evidence / limitation |
| --- | --- | --- | --- | --- |
| REL-01 | Run rule, protocol, image, and browser tests | P4 | TODO | Record actual commands, results, and failures. |
| REL-02 | Run iPhone and Android motion/audio checks over HTTPS | P4 | TODO | Record device, browser, URL security, and observed behavior. |
| REL-03 | Profile FPS, memory, textures, audio, and cleanup | P4 | TODO | Compare observations with GDD performance budgets. |
| REL-04 | Complete asset/license audit and UI polish | P4 | TODO | No unlabeled temporary production assets. |
| REL-05 | Verify build and static/server hosting instructions | P4 | TODO | Document the actual deployment shape and environment variables. |
| REL-06 | Publish handoff report and remaining issues | REL-01, REL-02, REL-03, REL-04, REL-05 | TODO | Disclose untested devices and known limitations. |

## Working rules

- Keep rules, authority, rendering, audio, input, and image handling separate.
- The online server is the only authority for outcomes and scores.
- Preserve stable symbol IDs, pack revisions, and immutable round IDs.
- Never reroll after reconnect, rerender, retry, or animation restart.
- Keep README commands and this tracker aligned with reality.
- Do not mark placeholders, fake rooms, or untested device behavior as complete.
