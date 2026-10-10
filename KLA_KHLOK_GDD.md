# ខ្លាឃ្លោក — Custom 3D Web Game

## Game Design Document and AI Agent Implementation Specification

**Document version:** 1.0  
**Created:** 2026-10-10  
**Project name:** Kla Khlok Custom 3D  
**Platforms:** Mobile and desktop web browsers  
**Modes:** Local Party and Online Room  
**Languages:** Khmer and English  
**Document status:** Implementation baseline; proposed defaults are identified below.

> Build a real interactive 3D dice game inspired by Khmer ខ្លាឃ្លោក. Users customize the six symbols with their own pictures. All three dice and the selection board use the same six pictures. Shaking a phone drives the dice animation and sound. When shaking stops, the dice keep rolling for two seconds, stop, and reveal the result. Support one-device local parties and synchronized online rooms.

This document defines the product, rules, architecture, content pipeline, implementation order, tests, and completion criteria. It authorizes planning and development of the specified game; deployment, account creation, and paid services depend on the project owner's instructions.

## Contents

1. Product goals and scope
2. Player experience and game rules
3. Round state machine and timing
4. Local Party mode
5. Online Room mode
6. Custom image and symbol pack system
7. 3D scene, dice, and result orientation
8. Phone shake, touch, and desktop controls
9. Audio and haptics
10. Screens, UI, language, and accessibility
11. Technical architecture and data contracts
12. Networking protocol and server rules
13. Storage, privacy, and room lifecycle
14. Performance and compatibility
15. Development phases and agent tasks
16. QA scenarios and acceptance criteria
17. Agent working rules and handoff
18. Future features and reference documentation

---

## 1. Product goals and scope

### 1.1 Core pillars

| Pillar | Required behavior |
| --- | --- |
| Personal pictures | Six editable picture slots drive the board and every die face. |
| Physical feeling | Three actual 3D cubes tumble, collide, and rattle inside a bowl. |
| Motion input | A phone shake changes animation intensity while an armed round is active. |
| Reliable timing | Stop detection begins a 2,000 ms rolling tail; the game never waits indefinitely for physics. |
| Social play | One device can track friends locally; online friends join the same room. |
| Consistent results | Every online participant receives the same outcome and scores from the server. |
| Khmer identity | Warm wood, restrained Khmer ornament, and complete Khmer/English UI. |
| Practical access | Play without an account; button controls work without motion permission. |

### 1.2 Required first release

- Three 3D dice, a visible bowl, and an animated lid for shaking and reveal.
- Six built-in symbols, with user uploads and square cropping.
- Local symbol pack saving, rename, duplication, deletion, and reset.
- Local Party mode for 1–8 named player seats on one device.
- Online Room mode for 1–8 players total, including a playing host.
- One-symbol predictions, match scoring, round history, and a match leaderboard.
- Phone shaking, press-and-hold shaking, tap-to-roll, sound, and optional vibration.
- Server-controlled online rounds, reconnect, host transfer, and room expiry.
- A working mobile portrait layout and desktop layout.
- Khmer/English localization, mute, reduced motion, and low graphics settings.
- A functional 2D fallback if 3D rendering fails.

### 1.3 Proposed design defaults

The user requested custom pictures, 3D dice, phone shaking, sound, and both modes. The following details are proposed implementation defaults rather than claims about every traditional version of ខ្លាឃ្លោក:

| Setting | Initial default |
| --- | --- |
| Rules | Casual predictions with virtual score points |
| Selection | One symbol per player per round |
| Score | 10 points for each matching die; 0/10/20/30 per round |
| Match length | 10 completed rounds |
| Local solo option | Dice-only mode without scores |
| Players | 1–8; no extra spectator seats in V1 |
| Symbol names | Tiger, Gourd, Rooster, Shrimp, Crab, Fish |
| Symbols | Stable IDs `s0` through `s5`, independent of pictures and labels |
| Ready timeout | No automatic selection timeout in V1 |
| Shake tail | Exactly 2,000 ms from confirmed stop |
| Maximum active shake | 15 seconds |
| Arm timeout | 10 seconds without a qualifying shake, then automatic roll |
| Host reconnect grace | 30 seconds |
| Room idle expiry | 30 minutes without accepted game/lobby activity |
| Empty room expiry | 5 minutes after the last connection leaves |

Virtual points have no cash value. V1 contains no deposits, withdrawals, purchases, bets, stake deduction, or payout system. Do not silently substitute a traditional wagering formula for the defined scoring system.

### 1.4 Outside first-release scope

Public matchmaking, chat, accounts, cloud pack libraries, paid cosmetics, tournaments, native apps, user-generated public galleries, full server dice physics, and cross-device local multiplayer are deferred. Private invite rooms are sufficient for V1.

## 2. Player experience and game rules

### 2.1 Local player journey

1. Open the app and choose **Local Party**.
2. Pick an existing pack or customize six pictures.
3. Add 1–8 player names; choose scored match or solo dice-only mode.
4. Each player taps one symbol on their turn; confirm the prediction.
5. The roller presses **Start Shake** and chooses motion or button controls.
6. Predictions lock; the lid closes; three dice shake in the bowl.
7. Stop shaking or release the button.
8. Dice continue moving and rattling for two seconds.
9. Dice stop, the lid opens, and three picture results appear.
10. Highlight matching symbols, award points, and show the round summary.
11. Press **Next Round**; after round 10 show the final leaderboard.

### 2.2 Online player journey

1. Host chooses **Create Room**, sets a display name, and receives a room code/link.
2. Friends choose **Join Room** and enter the code or open the invite link.
3. Host selects the shared symbol pack; all clients download the same revision.
4. Host starts the match once current players have loaded the pack.
5. Every active player picks one symbol and presses **Ready**.
6. Host presses **Start Shake** once every active player is ready.
7. Host's shake intensity drives the shared presentation. Other players watch.
8. The server determines the outcome; the host cannot choose winning faces.
9. All clients receive the same result, scores, round number, and history entry.
10. Host advances the round or ends the match.

### 2.3 Predictions

- A player has exactly one selected `symbolId`, or no selection before confirming.
- Several players may select the same symbol.
- Selecting a different symbol before lock replaces the earlier selection.
- Online **Ready** freezes that player's choice until **Unready** is accepted.
- Ready players can unready before the host locks the round.
- All players participating in the round must have a valid selection and be ready.
- Local confirmation acts as ready; local seats can be edited before roll lock.
- At lock, copy selections and eligible player IDs into an immutable round snapshot.
- Edits after lock fail even if an old client UI still appears enabled.
- Late joiners wait until the next round; they receive the current visual result.

### 2.4 Dice and fairness

There are three independent six-sided dice. Each die uses the same six symbol IDs. Duplicate symbols in an outcome are valid, including three identical results.

- Sample each die uniformly from integers 0–5.
- Shaking strength, duration, pictures, file size, readiness order, and score never affect probability.
- Local authority uses browser cryptographic randomness with rejection sampling.
- Online authority uses server cryptographic randomness, such as Node `crypto.randomInt(0, 6)`.
- Do not use `% 6` directly on an arbitrary random byte or integer; it can bias sampling.
- Do not generate a new outcome on rerender, audio replay, reconnect, or retry.
- Local device owners can inspect or modify local code; local mode is not tamper-proof.
- Online trusts the room server, not the host client. Cryptographic proof of server fairness is outside V1.

### 2.5 Scoring and winner calculation

For selected symbol `p` and the three-symbol outcome `D`:

```text
matches(player) = count(d in D where d == p)
roundPoints(player) = matches(player) * 10
totalScoreAfter = totalScoreBefore + roundPoints(player)
```

| Matching dice | Round points | UI message |
| --- | --- | --- |
| 0 | 0 | No match this round |
| 1 | 10 | One match |
| 2 | 20 | Double match |
| 3 | 30 | Triple match |

**Example:** outcome `[s1, s1, s4]`. Player A chose `s1`, so gains 20. Player B chose `s4`, so gains 10. Player C chose `s0`, so gains 0. Two players choosing `s1` both gain 20.

- Round winners are every eligible player with the highest positive round points.
- If nobody matches, display **No matches**; do not declare a winner.
- Match winners are all players with the highest cumulative score after 10 rounds.
- Ties are shared wins. No automatic sudden death in V1.
- Finished or abandoned players remain in match history; display connection/left status.
- A scored round is immutable; corrections require ending/resetting the match, not silently editing history.
- Dice-only mode displays face counts and history without player scoring.

### 2.6 New match and reset

- **Next Round** advances only from `RESULTS` and clears selections/readiness.
- After round 10, move to `MATCH_FINISHED`; offer **New Match**.
- New Match resets scores, round number, and match history; preserve names and pack.
- Require a confirmation before discarding an unfinished match.
- Host may end a match between rounds. There is no mid-roll cancel/reroll in V1.
- If the application server fails, follow the explicit recovery limitation in Section 13; never fabricate a replacement result.

## 3. Round state machine and timing

### 3.1 States

| State | Meaning | Allowed transition |
| --- | --- | --- |
| `LOBBY` | Pack/player setup; no active match | `SELECTING` |
| `SELECTING` | Players choose and ready | `ARMED`, `MATCH_FINISHED` |
| `ARMED` | Selections locked, lid closed, waiting for first shake | `SHAKING` |
| `SHAKING` | Shake input drives visual physics | `SETTLING` |
| `SETTLING` | Fixed 2-second rolling tail; input ignored | `REVEALING` |
| `REVEALING` | Dice stopped; authoritative poses applied under lid, then lid opens | `RESULTS` |
| `RESULTS` | Immutable outcome, points, and summary | `SELECTING`, `MATCH_FINISHED` |
| `MATCH_FINISHED` | Final leaderboard | `LOBBY`, new-match `SELECTING` |
| `CLOSED` | Room expired or ended | None |

Connection status, graphics fallback, and pack-loading status are separate concerns; they do not create alternate round states.

### 3.2 Authority and lock

Local mode runs the reducer/authority on the one hosting device. Online mode runs it on the server. Rendering is never authoritative.

When Start Shake is accepted, atomically:

1. Validate host role, phase, pack readiness, selections, and player readiness.
2. Allocate `roundId`; snapshot eligible players, selections, and `packRevision`.
3. Sample and retain the three private outcomes once.
4. Enter `ARMED`; publish the lock and `armedAt`.
5. Reject subsequent selection/pack changes for that round.

Dice-only local mode skips readiness checks. If the host has no motion input, choose a button/tap control; lack of sensor access never blocks a round.

### 3.3 The two-second stop contract

Distinguish physical stillness from confirmed stop. Motion detection confirms stop after **300 ms** without a qualifying sample. This avoids treating gaps between shaking impulses as stops.

```text
last qualifying sample: tLast
motion stop confirmation: tStop = tLast + 300 ms
roll tail deadline: revealAt = tStop + 2,000 ms
```

For button hold, release confirms stop immediately. Tap-to-roll supplies 1,200 ms of synthetic shake, then confirms stop. All three input methods share the same reducer.

- During the first 1,700 ms of `SETTLING`, decay forces and keep dice visibly tumbling.
- During the final 300 ms, damp/sleep or transition to a controlled resting presentation.
- At 2,000 ms, freeze motion and end the rolling sound.
- The lid stays closed until the authoritative result is available.
- Apply final separated positions and correct face-up rotations under the closed lid.
- Open the lid over approximately 300 ms; show scoreboard after the face presentation is ready.
- The lid animation occurs after rolling stops; it does not add more rolling time.
- A late network result keeps stopped dice covered and shows **Waiting for result**. It never invents an outcome.
- Shakes during `SETTLING` cannot extend the tail, unlock selections, or start a new roll.

For online play, deadlines use server time. Clients estimate the server clock offset and use absolute deadlines. Network delay can affect when a client sees the lid open, but not the logical stop time, outcome, or score.

### 3.4 Timeouts and interruptions

- No qualifying shake within 10 seconds in `ARMED`: authority starts a 1,200 ms automatic shake, then settles.
- Continuous shake reaches 15 seconds: authority forces stop and starts the tail.
- Online authority receives no input heartbeat for 500 ms in `SHAKING`: force stop. A valid explicit stop can arrive sooner.
- Button `pointercancel`, lost pointer capture, window blur, or host tab backgrounding: send stop and stop local input.
- Local backgrounding: record a forced-stop deadline; on return, resolve the original round by elapsed time without replaying scoring.
- Online backgrounding: server continues; returning client requests current state/history.
- No visible roll waits forever for Rapier to sleep.

### 3.5 Exactly-once effects

Deduplicate every authoritative mutation by `requestId` and every scored round by `roundId`. Do not rely on an animation callback for scoring. Persist the immutable result before broadcasting it. Duplicate result events may update presentation but never add points twice.

## 4. Local Party mode

### 4.1 Party setup

- Add, rename, and remove seats before starting a match.
- Assign immutable player IDs; names may duplicate but IDs may not.
- Names are plain text, 1–24 grapheme clusters; preserve Khmer characters.
- Each seat gets a distinct color and a text label, not color alone.
- Present a pass-and-pick panel showing whose turn it is.
- Show all confirmed choices for this casual shared-device game; V1 has no secret-pick requirement.
- Roller seat defaults to the first player and can rotate between rounds.
- Host/roller selection does not affect the rules or score.

### 4.2 Local save behavior

Persist settings, normalized symbol packs, and the current match snapshot after accepted mutations. Reload restores the match and retains scores/history. An unfinished locked round retains its original sampled outcome and deadlines; resume that round rather than sample again. If storage is unavailable, show session-only status and keep playing in memory.

### 4.3 Local limits

No backend is required for local play after the app/assets load. Offline availability requires the later cache/PWA task; do not claim offline reload works before implementing and testing it. Local mode shares one device and has no separate-phone synchronization.

## 5. Online Room mode

### 5.1 Room creation and joining

- Generate a six-character room code from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- Check uniqueness; retry collisions. Code comparison is case-insensitive.
- Join link format: `/join/CODE`; use the room code only, never embed player tokens.
- Assign the creator as host; count the host among the eight player seats.
- Return an opaque private reconnect credential per player.
- Room codes locate rooms; they do not authorize host actions.
- Show clear errors for invalid code, full room, expired room, or version incompatibility.
- Private invite-only rooms; no room directory.

### 5.2 Roster and participation

- A player joining in `LOBBY` or `SELECTING` can participate after loading the pack and selecting.
- If a player joins during `SELECTING`, invalidate the host's all-ready condition until the new player is ready or moved to waiting status.
- A player joining after lock occupies a seat but is marked `WAITING_NEXT_ROUND`.
- A player disconnected before lock is marked inactive and excluded; on reconnect before lock, re-enter selection and unready them.
- A player disconnected after lock remains in the immutable eligible roster and earns points from their locked prediction.
- Seats of disconnected players are reserved for two minutes; after that, new joiners may use capacity, while former player history remains.
- If a reclaimed former seat reconnects to a now-full room, show room-full rather than removing another player.
- Players entering partway through a match start at zero; label their joined round. New Match provides an equal starting point.

### 5.3 Host responsibilities and transfer

Host controls pack selection, match start, roll start, next round, and between-round match end. Host has no ability to set results or alter player scores.

- Host transfer is allowed in `LOBBY`, `SELECTING`, `RESULTS`, or `MATCH_FINISHED`.
- Voluntary transfer requires a connected target player and is an authoritative action.
- Host disconnect: show a 30-second reconnect grace timer.
- If a locked round is active, the server finishes it using its normal timeouts; a new host never rerolls it.
- After grace, choose the longest-connected eligible player, with join order as deterministic tie-breaker.
- An old host reconnecting after transfer returns as an ordinary player.
- If nobody is connected, keep the room through the empty-room expiry window.
- Local authority remains the same device; online host transfer never moves server authority to a browser.

### 5.4 Reconnect and late packets

Every public snapshot contains `roomVersion`, `roundId`, phase, deadlines, roster, current pack, and finalized results/history. It never contains private outcomes before reveal or another player's reconnect credential.

- Reauthenticate player identity with the private credential.
- Request a fresh snapshot after every connection or page reload.
- Socket.IO recovery is an optimization; the snapshot route must work when recovery fails.
- Ignore stale round commands and apply only newer compatible snapshot versions.
- History recovery must fill missing scored rounds, not just the latest outcome.
- Resume at the current phase; if already revealed, display the original result.
- Do not queue offline roll-start or selection commands for automatic execution later.

## 6. Custom image and symbol pack system

### 6.1 Six-slot invariant

Each pack has exactly six slots, IDs `s0`–`s5`. Each slot has a label, normalized image, and metadata. The same ID maps to the same picture on the board, all three dice, results, and history.

- Default pack ships with six distinct readable illustrations.
- Uploads replace slot content, not the slot's logical ID.
- A partial custom pack uses defaults for untouched slots.
- Duplicate images are allowed; show a friendly reminder that distinct images are easier to recognize.
- Optional custom labels: 1–32 grapheme clusters. Keep labels available for accessibility.
- Reset one slot or reset the entire pack with confirmation.
- Do not permit arbitrary remote image URLs in V1.

### 6.2 Upload and crop flow

1. Tap a slot and select a file from the device.
2. Check file size and attempt supported image decoding.
3. Show an adjustable square crop with pan, zoom, and optional 90-degree rotation.
4. Center the chosen area; preserve the aspect ratio until cropping.
5. Normalize to 512×512 pixels for board/storage.
6. Generate a 256×256 dice texture from the same crop.
7. Encode to WebP with JPEG/PNG fallback; apply a neutral backing for transparency.
8. Save a new immutable pack revision; update board and all dice together.

Never stretch portraits to fill a square. Do not request camera access merely to choose a file. HEIC/HEIF is accepted only if decoding actually works on the active device; otherwise show **Convert this image to JPG or PNG**.

### 6.3 Limits

| Item | Initial limit |
| --- | --- |
| Original upload | 10 MiB per file |
| Decoded dimensions | Maximum 8,192 on either axis and 40 megapixels total |
| Normalized face | 512×512, target at most 256 KiB |
| Online pack payload | At most 1.5 MiB of normalized image bytes |
| Saved local packs | 20 initially, subject to available browser storage |
| Dice textures | 256×256 for default mobile quality |

Use a bounded header parser/server image library to inspect dimensions before full decoding where supported. Browser full decode may allocate memory before dimensions are known; handle failures and keep the original byte cap. Server validation always enforces pixel limits before expensive processing. Invalid images never partially replace the active pack.

### 6.4 Local storage

Use IndexedDB for blobs, pack manifests, and recoverable match snapshots. Store preferences in a small settings record. Do not put base64 photo strings in localStorage. Catch quota/private-browsing failures and offer session-only play and export of the pack.

Local packs stay on the device unless the player explicitly selects one for an online room. Deleting an in-use pack requires switching to defaults or making a retained match reference; do not break an active session's textures.

### 6.5 Online sharing and atomic switching

Only the host chooses or changes the shared pack. Allowed in lobby or between-round selection, never during a locked roll.

1. Client normalizes six slots and sends them to an authenticated room upload endpoint.
2. Server checks room membership, host role, phase, byte/pixel limits, and decoded format.
3. Server re-encodes accepted images to strip original metadata and assigns content hashes.
4. Stage the complete manifest as a pending revision; never publish a half-uploaded pack.
5. Publish the candidate revision; clients preload board and dice textures, then acknowledge loaded hashes.
6. When all connected participants are ready, activate the revision atomically and reset prediction readiness.
7. Failed clients receive defaults only through an explicit synchronized switch, or are held in waiting status; never use different live packs per player.

During preload the UI shows loading status and prevents roll start. If the host abandons a failed candidate, retain the previous active revision. Asset identifiers are immutable; no overwriting URLs with different bytes.

### 6.6 Picture privacy and export

- Inform users that room members can view and save shared pictures.
- No face recognition or analysis; pictures are textures only.
- Online upload sends the processed crop, not the original camera file.
- Remove image EXIF/location metadata by server re-encoding.
- Room assets are available only through authenticated room membership or short-lived authorized URLs.
- No public indexing or public gallery.
- Local export is a ZIP containing a versioned JSON manifest and six normalized images; validate paths and sizes on import.
- Pack export is P1 after the main playable features; basic save/reload is P0.

## 7. 3D scene, dice, and result orientation

### 7.1 Visual direction

Build a warm, polished tabletop: dark carved wood bowl, ivory dice, red cloth, gold accent trim, and restrained Khmer-inspired ornament. Prioritize uploaded image readability. Avoid busy decoration behind the board or heavy shine over pictures. Custom pictures can be photographs or drawings and must remain recognizable.

Camera: fixed elevated perspective centered on the bowl, with all three resting top faces visible. Adjust framing for portrait/landscape without rotating symbol mappings. The main scene should feel three-dimensional even without background scenery.

### 7.2 Geometry and colliders

- Three rounded-looking cubes with simple box/rounded-box colliders.
- One shared geometry where possible; six reusable image materials shared across dice.
- Bowl collider: floor plus approximately 16 simple wall segments; avoid a dynamic concave mesh.
- Lid is visual during shaking; add a simple containment plane if needed for physics.
- Dice cannot escape the bowl, intersect at rest, or remain stacked after reveal.
- Use actual 3D mesh face artwork; a flat rotating picture is not a valid 3D implementation.

Proposed scene scale: each die is 0.75 units wide; bowl inner radius is 2.3 units; wall height is 0.9. Gravity starts at `(0, -9.81, 0)`, physics at fixed 1/60-second steps, with bounded frame catch-up. Restitution, friction, impulse strength, and damping require on-device tuning; do not treat placeholder coefficients as tested values.

### 7.3 Face mapping

Use `+Y` as world up. Define a single mapping module used by textures, result alignment, and tests:

| Slot | Cube local normal | Picture |
| --- | --- | --- |
| `s0` | `(+1, 0, 0)` | Slot 0 |
| `s1` | `(-1, 0, 0)` | Slot 1 |
| `s2` | `(0, +1, 0)` | Slot 2 |
| `s3` | `(0, -1, 0)` | Slot 3 |
| `s4` | `(0, 0, +1)` | Slot 4 |
| `s5` | `(0, 0, -1)` | Slot 5 |

Inspect actual geometry material groups and UVs before assigning materials; custom rounded geometry need not use the same group order as a basic box. Provide a development debug texture with slot IDs and arrows on all faces. Test all six results on each of the three dice, including photo orientation and mirrored UVs.

### 7.4 Correct result orientation

For target local face normal `n` and world up vector `u = (0,1,0)`:

1. Calculate a normalized quaternion `qFace` rotating `n` onto `u`.
2. Apply a controlled yaw around world up: `qFinal = qYaw * qFace`.
3. Account for per-face UV orientation so the top picture reads upright toward the camera.
4. Set angular/linear velocity to zero and use controlled/fixed presentation bodies.
5. Place dice at three separated, stable reveal anchors inside the bowl.

Test that `dot(qFinal.rotate(n), u) >= 0.999`. Also verify the screen-facing image's upright direction; correct normal alone is insufficient.

Visual physics never decides the result. The authority samples once, and the presentation aligns to that result under the closed lid. Do not imply online clients simulate identical physics trajectories. They must agree on results, phases, and timing; intermediate tumbles may differ.

### 7.5 Animation controls

- Map normalized input intensity `[0,1]` to bounded impulses and angular impulses.
- Apply impulses on physics ticks, not once per incoming sensor event.
- Clamp vertical velocity and angular speed to keep dice contained and readable.
- Add small cosmetic bowl/lid vibration; avoid moving the entire screen aggressively.
- During settling, stop injected shake energy and progressively damp motion.
- Snap/align only under the closed lid. Never show a visible winning-face teleport.
- On result arrival, apply final poses, verify readiness, then open the lid.
- On context loss, dispose/recreate assets or fall back to 2D without changing the outcome.

### 7.6 Required assets

| Asset | Requirement |
| --- | --- |
| Six default symbols | Distinct original illustrations, transparent or consistent backing |
| Dice body | Lightweight rounded mesh; readable flat artwork areas |
| Bowl and lid | Lightweight wood models or procedural geometry |
| Table trim | Restrained red/gold decoration, optional low-quality removal |
| Texture backing | Neutral background behind user photos |
| UI icons | Sound, motion, upload, edit, reset, invite, settings |
| Audio | Licensed/self-created click, rattle, settle, result cues |

Track asset origins and licenses in `docs/ASSETS.md`. Placeholder assets are acceptable during development but must be labeled. Never invent missing production asset paths.

## 8. Phone shake, touch, and desktop controls

### 8.1 Permission and feature detection

Motion is optional and must be explicitly enabled with a user gesture. Use HTTPS on deployed and real-phone test builds. Check the existence of `DeviceMotionEvent` and its `requestPermission` method. If permission is required, call it directly from the button handler before unrelated awaited work.

If the permission method is absent, attach the motion listener and verify useful events arrive. Permission granted does not guarantee non-null sensor samples. Permission denial, unsupported browser, missing events, and insecure context all expose the button controls with a concise status message. Do not repeatedly prompt on every roll.

No motion permission request on initial page load. Detach listeners when leaving the game; avoid duplicates across React mounts. Keep permission state separate from round state.

### 8.2 Motion algorithm

Process valid device samples using monotonic timestamps:

```text
1. Prefer event.acceleration when x/y/z are finite and available.
2. Otherwise use accelerationIncludingGravity.
3. For gravity-inclusive data, estimate gravity with a time-based low-pass filter:
   alpha = 1 - exp(-dt / gravityFilterTimeConstant)
   gravity = gravity + alpha * (sample - gravity)
   linear = sample - gravity
4. magnitude = length(linear)
5. smooth magnitude with a separate time-based exponential filter.
6. qualifyingShake = smoothedMagnitude >= threshold
7. intensity = clamp((smoothedMagnitude - threshold) / energyRange, 0, 1)
8. Refresh lastShakeAt for each qualifying sample.
9. Confirm stop after 300 ms without a qualifying sample.
```

Initialize the gravity estimate from the first gravity-inclusive sample, not zero. Warm up the filter briefly so a stationary phone's gravity is not treated as a shake. Prefer vector magnitude to avoid orientation dependence. Missing/NaN axes do not count as stillness samples; the independent stop watchdog still resolves input loss.

Suggested starting values: threshold 8 m/s², energy range 16 m/s², gravity filter time constant 0.5 seconds, magnitude filter time constant 0.08 seconds. These are tuning defaults, not universal phone calibration. UI sensitivity adjusts threshold over a bounded range, such as 4–16 m/s²; greater sensitivity means a lower threshold.

### 8.3 Armed behavior

- Ordinary phone movements in lobby/selection never begin a roll.
- Motion becomes a gameplay input only after authorized Start Shake.
- First qualifying sample enters `SHAKING`.
- Local visual feedback begins immediately; online phase lock must be acknowledged before starting.
- Send online intensity at at most 10 Hz with a heartbeat, including low/zero intensity while awaiting stop confirmation.
- Never transmit raw accelerometer streams or use them to sample outcomes.
- The authority enforces timeouts independent of the phone.

### 8.4 Touch and desktop controls

| Control | Behavior |
| --- | --- |
| Start Shake | Validates readiness, locks round, arms the selected input mode |
| Hold to Shake | Pointer down injects shake; release confirms stop |
| Tap Roll | Locks and supplies a 1,200 ms synthetic shake, then two-second tail |
| Keyboard | Enter activates focused controls; Space supports hold/release when focused |
| Stop | Explicit stop control available while shaking |
| Drag gesture | P1 polish; may vary intensity, not outcomes |

Use pointer capture for hold controls and handle `pointercancel`. Disable browser scrolling only within the active gesture area, not the whole page. Control sizes should be at least 44×44 CSS pixels. Non-host online clients never see actionable roll controls.

### 8.5 Motion acceptance

A stationary phone does not roll without arming. Repeated shaking feels stronger than a gentle movement. Stop creates one tail timer. Repeated permission attempts do not duplicate listeners. Denied permission still allows a full playable match. Actual iPhone and Android tests are mandatory before claiming motion support.

## 9. Audio and haptics

### 9.1 Audio implementation

Use a single sound service over Web Audio; Howler is optional rather than mandatory. Unlock/resume the audio context through a player gesture. Audio failures never block phase transitions.

| Event | Sound behavior |
| --- | --- |
| Symbol select | Quiet tap/click |
| Start/lock | Soft start cue and lid-close sound |
| Active shake | One looping wooden rattle; gain follows intensity |
| Dice impact | Rate-limited short clack, based on impulse/collision strength |
| Settling | Decaying rattle/roll loop over the two-second tail |
| Stop | Final subdued landing cue |
| Reveal | Clear short reveal cue |
| Positive match | Modest celebration; optional stronger triple-match variant |
| New round | Brief transition cue |

- One rattle loop per client; never create one loop per sensor sample.
- Clamp volume; limit impact samples to approximately eight per second and four concurrent voices.
- Add restrained pitch variation to avoid repetition.
- Stop/fade loops on backgrounding, disconnect, room exit, and unmount.
- Remember mute and volume settings locally.
- Remote players hear the shared phase sounds using streamed intensity; no raw-sensor audio dependency.
- Do not replay celebration after reconnect if the result was already acknowledged on that device.

### 9.2 Haptics

Feature-detect `navigator.vibrate`; unsupported devices skip it silently. Short pulses on start, selected impacts, and reveal are optional and rate-limited. Haptics default off and must have a user setting. Do not promise identical vibration support across phones or use haptics to communicate essential information.

## 10. Screens, UI, language, and accessibility

### 10.1 Screen inventory

| Screen/panel | Required elements |
| --- | --- |
| Home | Title, Local Party, Create Room, Join Room, Customize Pictures, language/settings |
| Local setup | Player names, add/remove seat, scored/dice-only toggle, pack preview |
| Create/join | Name, room code, copy invite, join errors |
| Lobby | Roster, host badge, loaded state, shared six-picture preview, start |
| Pack editor | Six editable slots, crop dialog, labels, save/reset actions |
| Game | 3D bowl, phase text, round number, six-symbol grid, readiness, controls |
| Round result | Three outcomes, match counts, per-player gains, Next Round |
| Match result | Leaderboard, shared winners, New Match, leave |
| Settings | Khmer/English, audio, haptics, sensitivity, quality, reduced motion |
| Reconnect overlay | Connection status, room info, retry/leave; preserves match state |

### 10.2 Mobile layout

Top: compact room/round information and settings. Center: bowl occupying approximately the upper-middle screen. Below: 2×3 symbol cards with image, label, and selected/ready markers. Bottom: large control/status area. Roster and history open in a sheet so the bowl and board remain usable.

Use safe-area padding, stable viewport handling, and scrollable dialogs. At 360 CSS pixels wide, no core action is offscreen or clipped. Landscape uses a side-by-side scene/board layout. Desktop centers the game with roster/history beside it.

### 10.3 Selection and result presentation

- Selected card: strong outline, check icon, and text status.
- Ready card: lock/check marker; provide Unready before round lock.
- Results: face counts `×1`, `×2`, `×3` on relevant cards.
- Round summary distinguishes no match, positive points, and shared winner.
- Announce all three result labels in an accessible live region once.
- Custom pictures always have text labels; do not require recognizing a photo alone.
- Avatar/name colors are decorative, not the only identity indicator.

### 10.4 Localization

Keep every user-facing string in translation dictionaries, including errors and phase announcements. Internal IDs remain English constants. Use a Khmer-capable font with adequate line height; avoid tight letter spacing on Khmer text. Test real Khmer labels at narrow widths. English UI can be the fallback for missing translations, but untranslated release strings must be tracked and corrected. Have a fluent speaker review Khmer wording rather than treating machine output as final.

Examples of English keys: `home.localParty`, `room.join`, `game.selectSymbol`, `game.startShake`, `game.holdToShake`, `game.rolling`, `game.waitingResult`, `result.noMatch`, `settings.enableMotion`.

### 10.5 Reduced motion and fallback

- Respect reduced-motion preference and provide an explicit override.
- Reduced motion keeps the same round timing but uses gentle dice movement and a simple reveal.
- 2D fallback displays three changing image cards during shaking and the exact authoritative three images afterward.
- Clearly label fallback mode. It must still support selections, uploads, audio, and online rooms.
- Keyboard navigation, focus-visible states, modal focus management, and accessible button labels are required.
- Gameplay text should meet WCAG AA contrast targets; no flashing effects.

## 11. Technical architecture and data contracts

### 11.1 Stack baseline

| Responsibility | Choice |
| --- | --- |
| Web UI | React + TypeScript + Vite |
| 3D renderer | Three.js with React Three Fiber |
| Visual physics | Rapier through a compatible React wrapper |
| Motion | DeviceMotion API with fallback controls |
| Images | Browser crop/Canvas + server normalization |
| Local persistence | IndexedDB |
| Real-time server | Node.js + TypeScript + Socket.IO |
| HTTP server | Fastify or Express; choose one at scaffold |
| Server validation | Shared runtime schemas, e.g. Zod |
| MVP room storage | One authoritative server process, in-memory rooms |
| Room image storage | Temporary files behind authenticated endpoints |
| Unit/integration tests | Vitest or compatible test runner |
| Browser tests | Playwright plus real-phone manual tests |

Do not add a paid AI API or backend to local mode. Online play needs a reachable running server and may have hosting costs. Choose currently compatible package versions at implementation time, record them in the lockfile, and check official documentation. This document does not pin speculative versions.

### 11.2 Separation of responsibilities

- Shared game rules: IDs, validation, state transitions, score calculation, protocol types.
- Local authority: cryptographic outcome sampler, reducer, deadlines, persistence.
- Server authority: room ownership, player identity, outcomes, deadlines, scoring, history.
- Client controller: commands, snapshots, input adaptation, capability status.
- Renderer: dice/bowl presentation; reads phases/intensity/outcomes, never awards points.
- Audio: event/phase presentation with its own lifecycle.
- Image service: crop, normalized blobs, preload, revision/cache management.

Prefer one reducer/rules module shared by local and server authorities. Inject RNG and clock interfaces for deterministic tests. Do not require React or WebGL to run game-rule tests.

### 11.3 Suggested repository

```text
khla-khlok/
  apps/
    web/
      src/
        app/
        components/
        game/
        scenes/
        input/
        audio/
        images/
        multiplayer/
        storage/
        i18n/
      public/assets/
    server/
      src/
        rooms/
        game/
        sockets/
        images/
        security/
  packages/
    shared/src/
  docs/
    PLAN.md
    TASKS.md
    GAME_RULES.md
    ARCHITECTURE.md
    PROTOCOL.md
    QA.md
    ASSETS.md
    CHANGELOG.md
  tests/
  AGENTS.md
  README.md
  KLA_KHLOK_GDD.md
```

### 11.4 Core TypeScript contracts

These are design shapes; production code also needs runtime validation and separate private/public serialization.

```ts
type SymbolId = "s0" | "s1" | "s2" | "s3" | "s4" | "s5";
type DiceOutcome = [SymbolId, SymbolId, SymbolId];
type RoundPhase =
  | "LOBBY" | "SELECTING" | "ARMED" | "SHAKING"
  | "SETTLING" | "REVEALING" | "RESULTS"
  | "MATCH_FINISHED" | "CLOSED";

interface SymbolSlot {
  id: SymbolId;
  label: string;
  assetId: string;
  contentHash: string;
  width: number;
  height: number;
}

interface SymbolPackManifest {
  packId: string;
  revision: string;
  name: string;
  slots: [SymbolSlot, SymbolSlot, SymbolSlot,
          SymbolSlot, SymbolSlot, SymbolSlot];
}

interface PlayerPublic {
  playerId: string;
  displayName: string;
  isHost: boolean;
  connected: boolean;
  joinedOrder: number;
  participation: "ACTIVE" | "WAITING_NEXT_ROUND" | "LEFT";
  selection: SymbolId | null;
  ready: boolean;
  score: number;
  loadedPackRevision: string | null;
}

interface RoundResult {
  matchId: string;
  roundId: string;
  roundNumber: number;
  packRevision: string;
  outcome: DiceOutcome;
  lockedSelections: Record<string, SymbolId>;
  pointsDelta: Record<string, number>;
  scoresAfter: Record<string, number>;
  winnerIds: string[];
  finalizedAt: number;
}

interface RoomSnapshotPublic {
  roomId: string;
  roomCode: string;
  roomVersion: number;
  matchId: string | null;
  roundId: string | null;
  roundNumber: number;
  phase: RoundPhase;
  hostPlayerId: string;
  players: PlayerPublic[];
  activePack: SymbolPackManifest;
  retainedPacks: SymbolPackManifest[]; // revisions referenced by room history
  armedAt: number | null;
  shakeStartedAt: number | null;
  settleStartedAt: number | null;
  revealAt: number | null;
  serverNow: number;
  latestResult: RoundResult | null;
  history: RoundResult[];
}

interface CommandEnvelope<T> {
  protocolVersion: number;
  requestId: string;
  roomId: string;
  matchId: string | null;
  roundId: string | null;
  expectedRoomVersion: number;
  payload: T;
}
```

Private server state additionally holds credential hashes, private sampled outcomes, eligible round roster, candidate uploads, request deduplication records, and timers. Never serialize the private state object directly to clients.

## 12. Networking protocol and server rules

### 12.1 Client commands

| Command | Caller | Key validation |
| --- | --- | --- |
| `room:create` | New player | Name, rate limits, protocol version |
| `room:join` | New/rejoining player | Code, credential if rejoining, capacity |
| `room:sync` | Member | Membership; return authoritative snapshot |
| `pack:loaded` | Member | Active/candidate revision and expected hashes |
| `match:start` | Host | Lobby/finished state, active pack ready |
| `prediction:set` | Active player | Selecting state, valid ID, not ready |
| `player:ready` | Active player | Valid selection, pack loaded |
| `player:unready` | Active player | Selecting state only |
| `roll:arm` | Host | All active players ready, compatible pack |
| `roll:intensity` | Host | Locked round ID, finite clamped `[0,1]`, rate limit |
| `roll:stop` | Host | Current shaking round, idempotent |
| `round:next` | Host | Results state, match not complete |
| `host:transfer` | Host | Transfer-allowed state, connected target |
| `match:end` | Host | Between-round state only |
| `room:leave` | Member | Current identity; preserves locked-round result |

Pack upload/staging happens via HTTP. Candidate activation is another host-authorized command after all required loaded acknowledgments. Room settings become immutable for a running match except client-local audio, graphics, language, and sensitivity.

### 12.2 Server events

| Event | Meaning |
| --- | --- |
| `room:snapshot` | Full authoritative state for initial sync/recovery |
| `room:updated` | New roster/selection/readiness/version |
| `pack:pending` | Candidate manifest ready for preload |
| `pack:activated` | Shared revision activated; readiness reset |
| `round:armed` | Lock accepted; arm/shake timeout information |
| `roll:started` | Shake start time and maximum active duration |
| `roll:intensity` | Cosmetic stream; missing samples are tolerable |
| `roll:settling` | Authoritative settle start and `revealAt` |
| `round:revealed` | Original outcome and finalized score result |
| `host:changed` | New host identity |
| `match:finished` | Final leaderboard derived from history |
| `room:closed` | Expiry or closure reason |

Outcome data is not included in armed/started/settling events or snapshots before `revealAt`. At reveal, commit score/history once, transition to `REVEALING`, and broadcast. The server can advance to `RESULTS` after its short presentation interval; clients still wait for local assets/poses before visually opening. If snapshot includes the latest finalized result during `REVEALING`, it is safe to display because the reveal deadline passed.

### 12.3 Ordering, acknowledgment, and retries

- Mutating commands receive structured acknowledgments: accepted or rejected, code, authoritative version.
- A deduplicated retry returns the original acknowledgment/result; it never executes again.
- Use reliable acknowledged messages for state changes and a volatile stream for intensity.
- Clients should refresh a snapshot on `STALE_VERSION`; do not blindly replay stale commands.
- Server validates phases atomically; serialize mutations per room.
- Client timestamps are advisory. Authority chooses settle deadlines on accepted stop/watchdog events.
- Use round-scoped sequence numbers for the cosmetic intensity stream; ignore duplicate/out-of-order samples without rejecting an otherwise valid sample just because a selection-related room version changed.
- Keep `roundId` checks even with room versions; a delayed command must not affect the next round.
- Register socket listeners once and remove them on teardown.

### 12.4 Input and network limits

Starting limits: ten intensity updates per second per host, twenty normal commands per second per player with a small burst allowance, and strict room/create/join/upload limits by session plus IP where appropriate. Shared IPs must still permit an eight-player household room.

Validate finite numbers, payload sizes, lengths, and IDs. Render names/labels as plain text. Authenticate every image request and host mutation. Room membership alone is not host authorization. Whitelist deployment origins for CORS/connection checks; do not treat CORS as authentication. Use HTTPS and secure credentials. Avoid logging private credentials or picture contents.

## 13. Storage, privacy, and room lifecycle

### 13.1 Local and server records

| Data | Local device | Online server |
| --- | --- | --- |
| Personal saved packs | IndexedDB | Only a shared room copy when selected |
| Preferences | Persist locally | Not required |
| Local match | IndexedDB snapshot/history | None |
| Room membership | Private credential and public state cache | Authoritative room state |
| Online outcomes/scores | Display/cache only | Authoritative immutable history |
| Shared images | Cached normalized images | Temporary room assets |

Store private credentials separately from shareable state. Prefer secure session cookies when hosting architecture allows; otherwise use a narrowly scoped reconnect token and protect it from logs/URLs. A stolen token can impersonate a player; bind it to room/player and expire it with the room.

### 13.2 Expiry and cleanup

- Only accepted participant game/lobby actions refresh the idle timer; transport pings alone do not keep a room alive.
- An active timed roll completes before an ordinary idle cleanup.
- Empty rooms remain recoverable for five minutes.
- Expired rooms are closed; invalidate tokens and stop all timers.
- Delete temporary room files promptly after closure, targeting within five minutes.
- Startup cleanup removes orphan files older than the maximum room lifecycle plus grace.
- Retain every pack revision referenced by current room history until that room closes; never break earlier result thumbnails when switching packs.
- Include retained manifests in snapshots (or provide an authenticated revision lookup) so reconnecting clients can resolve historic labels/images, not just the current pack.
- Shared room deletion does not delete players' original local packs.
- Describe actual retention behavior in the app; do not promise deletion before jobs are implemented.

### 13.3 MVP server restart limitation

Single-process in-memory room state is an intentional V1 simplification. Server restart ends active rooms. On reconnect, clients show **Room no longer available** and offer a new room; never claim restart recovery or reconstruct authoritative state from a client. Temporary assets still require orphan cleanup.

If persistent restart recovery is later required, write state/result transactions to a database, restore deadlines and private outcomes, and test crash recovery before changing the user promise. Scaling multiple server processes also requires shared authority/locking and a compatible messaging adapter; adding an adapter alone does not make game state durable.

## 14. Performance and compatibility

### 14.1 Performance targets

Targets are acceptance budgets to measure, not guarantees:

- At least 30 FPS during shaking on the agreed baseline phone; aim for 60 on capable hardware.
- Default render pixel ratio cap 1.5; low quality cap 1.0.
- Three dice, simple bowl colliders, restrained shadows, and no mandatory postprocessing.
- Approximately 50 or fewer scene draw calls and under 50,000 visible triangles initially.
- Reuse six image textures across all three dice where possible.
- Run UI updates at meaningful changes; do not update React state for every physics tick.
- Default 3D asset budget under 5 MiB compressed, excluding app code and user uploads.
- Dispose stale GPU textures, materials, object URLs, physics worlds, and audio nodes.
- Ten pack replacements and twenty rounds must not show continuously growing resource usage.

### 14.2 Capability matrix

| Environment | Expected path | Required verification |
| --- | --- | --- |
| iPhone Safari | 3D + permission-gated motion where supported | Real HTTPS device test |
| Android Chrome | 3D + feature-detected motion | Real device test |
| Windows Chrome/Edge | 3D + hold/tap/keyboard | Desktop browser test |
| macOS Safari/Chrome | 3D + button input | Desktop browser test if available |
| Restricted/in-app browser | Button fallback; possibly 2D | Graceful unavailable-permission handling |
| No WebGL/context failure | Full 2D game path | Simulated context/capability failure |

Phone hardware, browser versions, permission state, and embedded contexts vary. Feature detection plus fallbacks are mandatory. Do not claim tested support for an environment that was not exercised.

### 14.3 Deployment shape

Local-only release can be served as a static app over HTTPS. Online release also needs a continuously running Node service supporting Socket.IO and authenticated HTTP image endpoints. A static frontend host alone cannot provide online room authority. Real-phone motion testing needs a trusted HTTPS origin; a plain HTTP LAN IP is not an adequate permission test.

Prefer same-origin frontend/server routing when feasible to simplify secure sessions and image loading. Keep server secrets out of client environment variables. Provide `.env.example` with variable names and safe placeholders, not real credentials. Use one instance for the MVP until state sharing is deliberately implemented.

## 15. Development phases and agent tasks

### 15.1 Delivery order

Build the core roll first, complete local mode, then online mode. Each phase must leave a runnable state. Do not implement disconnected placeholder multiplayer buttons and count them as working rooms.

Effort estimates below are rough planning ranges for one developer with agent assistance. Asset production, device access, and debugging may change them. Completion is determined by gates, not elapsed days.

| Phase | Deliverable | Dependencies | Rough effort |
| --- | --- | --- | --- |
| P0 | Scaffold, contracts, rule tests, documentation | This GDD | 1–2 working days |
| P1 | Playable 3D shake/stop/reveal prototype | P0 | 3–5 days |
| P2 | Custom pictures and complete local match | P1 | 3–5 days |
| P3 | Authoritative online rooms and pack sharing | P2 | 5–8 days |
| P4 | Recovery, privacy, localization, accessibility | P3 | 3–5 days |
| P5 | Device QA, performance, release handoff | P4 | 2–4 days |

### 15.2 P0 — Foundation

| Task ID | Task | Completion evidence |
| --- | --- | --- |
| FND-01 | Inspect repository, applicable agent rules, existing stack, and scripts | Written findings; preserve unrelated existing work |
| FND-02 | Create TypeScript workspace and web/server/shared packages | Documented install/dev/build commands run |
| FND-03 | Define runtime schemas and protocol version | Invalid IDs/NaN/unknown phases rejected |
| FND-04 | Implement authority reducer, score function, injectable clock/RNG | Unit tests run without browser/renderer |
| FND-05 | Implement crypto sampler adapter for local and server | Rejection boundaries/server range tested |
| FND-06 | Create project README, task tracker, rules, architecture, QA docs | Actual commands, current limitations, owner task IDs |

**Gate:** A headless ten-round match computes correct scores, validates transitions, and finalizes each round once. App scaffold loads without errors.

### 15.3 P1 — Dice prototype

| Task ID | Task | Completion evidence |
| --- | --- | --- |
| DICE-01 | Create bowl, lid, and three textured cubes | All three dice are visibly 3D with six distinct faces |
| DICE-02 | Build face/normal/UV mapping debug view | All 18 die/face combinations render correctly |
| DICE-03 | Integrate Rapier visual tumbling and containment | Fast shakes do not eject dice or leave reveal stacks |
| DICE-04 | Implement ARMED/SHAKING/SETTLING/REVEALING controller | Fake-clock timing and original-result retention pass |
| DICE-05 | Build hold/tap/keyboard input adapters | Same lifecycle; release/cancel creates one tail |
| DICE-06 | Add DeviceMotion permission/filter/sensitivity | Real phone or recorded sample fixture; device gaps documented |
| DICE-07 | Add audio unlock, intensity loop, collision caps | No stacked loops; mute stops audio |
| DICE-08 | Add controlled final pose under lid and 2D fallback | Presentation always agrees with authoritative symbols |

**Gate:** Three dice roll from button input, stop after the two-second tail, and reveal readable correct faces. Motion, if tested on a device, drives the same lifecycle. Unavailable motion does not block play.

### 15.4 P2 — Pictures and Local Party

| Task ID | Task | Completion evidence |
| --- | --- | --- |
| LOCAL-01 | Build six-slot pack editor and crop dialog | Portrait and landscape photos crop without stretching |
| LOCAL-02 | Normalize images and generate textures | Board and all dice show the same crop per ID |
| LOCAL-03 | Add IndexedDB packs/preferences and session fallback | Reload retains pack; quota failure keeps game usable |
| LOCAL-04 | Add 1–8 seats and pass-and-pick flow | Valid confirmed choices lock at roll start |
| LOCAL-05 | Add scoring, round history, ties, and ten-round match | Worked scoring example and tied winners pass |
| LOCAL-06 | Add dice-only mode and new-match reset | No scoring in dice-only; reset preserves pack/names |
| LOCAL-07 | Persist/recover local locked rounds | Reload cannot reroll or double-award |
| LOCAL-08 | Implement photo/texture replacement cleanup | Repeated editing leaves no stale faces/resource leaks |

**Gate:** A complete local ten-round match with custom pictures survives reload and shows a correct final leaderboard.

### 15.5 P3 — Online Room

| Task ID | Task | Completion evidence |
| --- | --- | --- |
| NET-01 | Implement room create/join/capacity and private credentials | Two independent clients join; unauthorized identity reuse rejected |
| NET-02 | Add snapshots, versions, acknowledgments, deduplication | Duplicate commands do not mutate twice |
| NET-03 | Add active/waiting roster, ready/unready, and host lock | Non-host cannot roll; post-lock edits rejected |
| NET-04 | Implement server RNG, private outcomes, deadlines, finalization | No outcome leaked before reveal; one shared result |
| NET-05 | Stream cosmetic intensity with rate limits | Remote shake follows phase; missing packets do not break result |
| NET-06 | Build authenticated image normalization/storage endpoints | Invalid/oversized files rejected; metadata removed |
| NET-07 | Stage/preload/activate shared pack revisions | All clients use same revision; failed upload retains previous pack |
| NET-08 | Synchronize history and score snapshots | Eight clients agree after ten rounds and reconnect |

**Gate:** At least two actual browser contexts play a full shared match with host-uploaded pictures. Automated eight-client testing confirms capacity, matching results, and scoring invariants.

### 15.6 P4 — Recovery and usability

| Task ID | Task | Completion evidence |
| --- | --- | --- |
| UX-01 | Implement reconnect snapshots and stable identity | Mid-round disconnect recovers original result/history |
| UX-02 | Implement host grace/transfer and input watchdog | Host loss finishes the locked round and elects one host |
| UX-03 | Add room/file/token cleanup | Fake-clock lifecycle and orphan-file tests pass |
| UX-04 | Add Khmer/English dictionaries and Khmer font layout | Reviewed strings or explicitly tracked review gap |
| UX-05 | Add reduced motion, low quality, focus/ARIA | Full match playable by keyboard and in fallback |
| UX-06 | Finish settings/help/privacy and actionable errors | Sensor/image/network errors provide a working next action |
| UX-07 | Add P1 pack export/import | Round-trip retains six images; malformed archives rejected |

**Gate:** Disconnects, denials, upload failures, and graphics failures resolve predictably without corrupting outcomes or blocking normal button play.

### 15.7 P5 — Validation and handoff

| Task ID | Task | Completion evidence |
| --- | --- | --- |
| REL-01 | Run rule/protocol/image and browser tests | Record passing commands and actual failures |
| REL-02 | Run real iPhone and Android motion/audio checks | Device/browser/HTTPS details and observed behavior |
| REL-03 | Profile performance and resource lifecycle | Recorded FPS/resource observations against budgets |
| REL-04 | Finish assets/license audit and UI polish | No unlabeled temporary production assets |
| REL-05 | Verify build/configuration/hosting instructions | Static + server deployment requirements accurately documented |
| REL-06 | Publish final handoff report and remaining issues | Ready features, test evidence, untested devices, limitations |

**Gate:** Release build works; local and online core requirements pass; incomplete device checks are disclosed. Do not mark the release tested merely because compilation succeeds.

## 16. QA scenarios and acceptance criteria

### 16.1 Meaningful automated rule tests

Use deterministic outcomes and fake clocks. Enumerate all 216 ordered outcomes and all six possible selections to validate counts/points. A random histogram alone is not proof of correctness and should not be a flaky release gate.

Test these invariants:

- Outcome always contains exactly three valid symbol IDs.
- Points are always 0, 10, 20, or 30 for an eligible player.
- Duplicate finalization cannot change scores/history after the first commit.
- Selections and pack revision are immutable after lock.
- Invalid role/phase/stale-round commands have no side effects.
- At 1,999 ms after confirmed stop, rolling tail is not complete; at 2,000 ms it is complete.
- Motion stop has the separate 300 ms quiet-window delay.
- A new shake during settling cannot restart or extend the timer.
- ARMED and SHAKING timeouts finalize the original outcome.
- New Match clears scores/history but retains approved setup.
- Match/round winners follow the shared-tie and no-match rules.

### 16.2 Image tests

Valid JPG/PNG/WebP; wrong extension with real image content; fake image bytes; corrupt/truncated input; oversize bytes; extreme dimensions; transparent image; unsupported HEIC; portrait crop; duplicate image; six-slot completeness; deletion while in use; quota failure; failed staged upload; stale revision acknowledgment; unauthorized fetch/upload; metadata stripping; old-history thumbnail retention.

Server must validate decoded content rather than trusting extension or browser MIME alone. Texture-load failures must not create a mixed pack that can begin a round.

### 16.3 Network integration tests

1. Host plus seven players join; ninth join fails cleanly.
2. All players receive the same locked roster and pack revision.
3. Non-host roll, forged player identity, and forged points payloads are rejected.
4. Duplicate `roll:arm` and duplicate `round:next` execute once.
5. Host stops, disconnects, or goes silent; server deadline still resolves.
6. Player disconnects after selection lock; their points are still awarded.
7. Late joiner waits until the next round and gets current result history.
8. Reconnect after missing several rounds restores all scores/history.
9. Stale stop/selection packet from round N cannot affect round N+1.
10. Host grace expiry elects exactly one replacement; old host returns as player.
11. Candidate pack upload fails; previous pack remains active.
12. Server restart produces explicit room-unavailable behavior, not false recovery.
13. Idle/empty expiry stops timers, invalidates credentials, and deletes room files.

### 16.4 Manual phone checks

Record device model, OS/browser version, test URL security, and results:

- Motion permission allowed, denied, previously denied, and absent API.
- Permission granted but null/no samples.
- Stationary phone at different angles, gentle shakes, and fast shakes.
- Stopping while holding the phone still; ensure a single two-second tail.
- Screen rotation, app switch, screen lock, and return.
- Audio before/after interaction, mute, silent-mode behavior as observed.
- Unsupported vibration does not produce an error.
- Photo upload from camera roll, crop, save/reload, and six-picture replacement.
- Remote room on Wi-Fi and mobile data; temporary drop and rejoin.
- Low quality, reduced motion, and full 2D fallback.

Sensor fixtures can validate filtering math but cannot replace browser/hardware permission testing.

### 16.5 Visual checks

Capture portrait at 360 and 390 CSS pixels, landscape, desktop, Khmer/English, long labels, selected/ready/result states, crop dialog, and reconnect errors. Inspect clipping, photo sharpness, contrast, top-face readability, lid visibility, and no result-face teleport. Do not generate static screenshots and describe them as proof of a working game.

### 16.6 Final feature acceptance

| Requirement | Pass condition |
| --- | --- |
| Custom pictures | Any valid slot replacement appears consistently on board and all dice |
| 3D dice | Three textured cubes tumble inside the bowl and reveal correct top faces |
| Shake controls | Motion when available and fallback controls share one reliable roll flow |
| Two-second tail | Authority timing tests pass; foreground presentation stops at the deadline within normal frame tolerance |
| Sound | Intensity-responsive rattle, bounded impacts, stop/reveal cues, persistent mute |
| Local mode | 1–8 seats, complete match, correct scores/history, reload recovery |
| Online mode | Private rooms, server outcomes, shared images, synchronized scores |
| Recovery | Reconnect and host loss preserve locked outcomes and avoid duplicate score |
| Khmer UI | Complete dictionary/layout; native-language review status documented |
| Failure paths | Motion denial, storage failure, image failure, and WebGL loss leave a usable route |
| Agent handoff | Runnable commands, tracked tasks, tests, limitations, and decisions documented |

## 17. Agent working rules and handoff

### 17.1 How the AI agent should begin

1. Read this entire GDD and repository `AGENTS.md` if present.
2. Inspect existing code before choosing folder changes or installing packages.
3. Create/update the documentation in the suggested structure.
4. Record proposed defaults from Section 1.3 in `docs/GAME_RULES.md`.
5. Start with P0, then deliver P1 before building full multiplayer.
6. Keep development artifacts runnable after each task.
7. Ask only about a genuine unresolved product conflict or external action; routine technical choices can use this baseline.

### 17.2 Required task tracking

Every task entry contains ID, description, dependency, status, evidence, and remaining limitation. Statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`. Keep only genuinely active tasks in progress. A task is done only when its acceptance evidence exists.

Example:

```md
| ID | Task | Depends on | Status | Evidence / limitation |
| --- | --- | --- | --- | --- |
| DICE-04 | Round timing controller | FND-04 | DONE | Fake-clock tests pass; device timing pending |
| DICE-06 | Phone motion input | DICE-04 | IN_PROGRESS | Android checked; iPhone permission check pending |
```

### 17.3 Must do

- Keep gameplay rules separate from rendering/audio/input.
- Preserve stable symbol IDs, pack revisions, and immutable round IDs.
- Treat the online server as the sole score/outcome authority.
- Use runtime payload validation and cryptographic outcome sampling.
- Handle all relevant listener/timer/texture/audio/object-URL cleanup.
- Keep README commands and task status current as implementation changes.
- Document architecture decisions and material deviations from this GDD.
- Test meaningful timing, scoring, reconnect, and image-validation behavior.
- Report actual tests run and real devices checked.
- Preserve existing user code/assets and unrelated changes.

### 17.4 Must not do

- Replace the 3D requirement with only flat CSS spinning images and call it complete.
- Let a browser submit authoritative outcomes, scores, or host identity.
- Alter results based on shake intensity or player photos.
- Reroll because a client disconnects, a render restarts, or physics appears awkward.
- Allow changing a prediction or pack after round lock.
- Expose private outcomes/tokens in pre-reveal snapshots or logs.
- Depend on an animation-finished callback to compute points.
- Assume Socket.IO guarantees exactly-once delivery without application deduplication.
- Store large base64 photos in localStorage or keep original EXIF online.
- Add paid services, real-money features, accounts, or public galleries without a new requirement.
- Claim permission, haptics, Khmer review, device support, or restart recovery without evidence.
- Mark stubs, fake online rooms, or placeholder TODO handlers as completed features.

### 17.5 Documentation responsibilities

| File | Content |
| --- | --- |
| `README.md` | Product overview, installation, actual scripts, local/server setup, troubleshooting |
| `docs/PLAN.md` | Phase order, current scope, milestone gates |
| `docs/TASKS.md` | Backlog, dependencies, status, acceptance evidence |
| `docs/GAME_RULES.md` | Predictions, scores, winners, timeouts, joining/host rules |
| `docs/ARCHITECTURE.md` | Authority boundaries, storage, rendering/input separation |
| `docs/PROTOCOL.md` | Commands/events, payload schemas, validation, retry behavior |
| `docs/QA.md` | Automated results, device matrix, visual checks, known gaps |
| `docs/ASSETS.md` | Files, purpose, origin/license, placeholder status |
| `docs/CHANGELOG.md` | Meaningful completed changes and decisions |
| `AGENTS.md` | Repository working conventions and implementation constraints |

These are files the implementation agent should maintain; this deliverable is the single master GDD requested by the owner.

### 17.6 Copy-paste implementation prompt

> Read `KLA_KHLOK_GDD.md` in full. Implement Kla Khlok Custom 3D according to its requirements. First inspect the repository and existing agent rules. Create/update README, PLAN, TASKS, GAME_RULES, ARCHITECTURE, PROTOCOL, QA, ASSETS, CHANGELOG, and repository AGENTS documentation. Work through P0–P5 in dependency order, beginning with shared game rules and a playable three-dice prototype. Use stable six-slot pictures on every die and the board, phone motion plus accessible fallback controls, a fixed two-second rolling tail, and a closed-lid authoritative reveal. Complete local matches before adding server-controlled online rooms. Never let clients choose outcomes or scores. Preserve original locked outcomes across retries/reconnects and finalize each round once. Validate images, sync pack revisions atomically, implement sound and cleanup, and test the specified failure paths. Keep tasks and actual run/test commands current. Report what works, evidence, remaining limitations, and the next unfinished task. Do not claim untested device support or replace working features with stubs.

## 18. Future features and reference documentation

### 18.1 Candidate future scope

- True spectator mode without using player seats.
- Optional hidden predictions before lock.
- Alternative casual scoring modes configured before a match.
- PWA caching for verified offline local reloads.
- More Khmer table themes and cosmetic dice bodies.
- Pack galleries only with explicit sharing and moderation design.
- Persistent rooms/accounts and server restart recovery.
- Public matchmaking after abuse controls and room scaling exist.
- Commit/reveal verification if transparent server randomness becomes a requirement.

Each feature needs updated rules, task scope, tests, and privacy behavior. Do not implement them merely because they are listed here.

### 18.2 Official implementation references

Reference checks performed on 2026-10-10. Recheck compatibility and API signatures when installing dependencies. Links provide implementation background; the product rules and tuning constants above are this document's design decisions.

- [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/) — motion event model and permission/security requirements.
- [MDN DeviceMotionEvent.requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static) — user-gesture requirement, permission return values, and compatibility caveats.
- [Three.js BoxGeometry](https://threejs.org/docs/pages/BoxGeometry.html) — cube construction; inspect material groups/UVs before extending geometry.
- [Rapier JavaScript rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/) — dynamic/fixed/kinematic presentation bodies and simulation controls.
- [Rapier forces and impulses](https://rapier.rs/docs/user_guides/javascript/rigid_body_forces_and_impulses/) — bounded forces/impulses for visual shaking.
- [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees) — default delivery limitations; motivates acknowledgments and application deduplication.
- [Socket.IO connection state recovery](https://socket.io/docs/v4/connection-state-recovery) — temporary recovery support; retain an explicit full-snapshot path.
- [Socket.IO client socket instance](https://socket.io/docs/v4/client-socket-instance) — socket identity lifecycle; use stable application player credentials.

**First implementation milestone:** a runnable browser prototype with three real 3D dice, six shared image slots, hold/tap controls, phone-motion capability handling, sound, and verified two-second stop/reveal behavior.

