# Kla Khlok — Task Tracker

This tracker turns [`KLA_KHLOK_GDD.md`](KLA_KHLOK_GDD.md) into an implementation backlog. Status is intentionally conservative: a task is `DONE` only when its acceptance evidence exists in the repository.

**Statuses:** `TODO` · `IN_PROGRESS` · `BLOCKED` · `DONE`

**Current status:** `TODO` — planning baseline only; no application scaffold exists yet.

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
