# ខ្លាឃ្លោក — Kla Khlok Custom 3D

A planned mobile and desktop web game inspired by Khmer ខ្លាឃ្លោក. Players customize six symbols with their own pictures, roll three 3D dice, and play either a one-device Local Party match or a private Online Room.

## Project status

This repository currently contains the product specification and implementation tracker. The playable web application has not been scaffolded yet.

- Product specification: [`KLA_KHLOK_GDD.md`](KLA_KHLOK_GDD.md)
- Implementation backlog and one-job-at-a-time session queue: [`tasks.md`](tasks.md)
- Current milestone: JOB-008 — Foundation documentation
- Planned stack: React, TypeScript, Vite, Three.js, React Three Fiber, Rapier, IndexedDB, Node.js, Socket.IO, and shared runtime schemas

The task tracker is deliberately evidence-based. Features are not marked complete until the required tests, device checks, or acceptance evidence exist.

## How work is executed

Implementation is intentionally sequential. Each numbered job in `tasks.md` gets a fresh chat session, one focused deliverable, one commit, and one functional test. A job is not complete until its test passes and the result is recorded. If it fails, the job is marked `BLOCKED` and can be reverted without rolling back unrelated work.

## Planned gameplay

- Six stable symbol slots shared by the selection board and every die face
- Three physical-feeling 3D dice inside a bowl with an animated lid
- Phone shake when available, plus hold, tap, pointer, and keyboard controls
- A fixed two-second rolling tail after confirmed stop
- Local Party mode for 1–8 named seats
- Private Online Room mode for up to 8 players
- One-symbol predictions, 0/10/20/30 round scoring, history, and a ten-round leaderboard
- Khmer and English UI, sound, optional vibration, reduced motion, low graphics, and a 2D fallback

Virtual points have no cash value. The first release does not include betting, deposits, payouts, accounts, public matchmaking, chat, or public image galleries.

## Planned repository layout

```text
apps/
  web/       # React client
  server/    # Node authoritative room server
packages/
  shared/    # Rules, schemas, protocol types
docs/        # Architecture, QA, assets, and release notes
tests/       # Rule, image, protocol, and browser tests
```

## Development commands

No install, development, build, or test scripts exist yet because the application scaffold is not present. The next implementation job is `JOB-002` in [`tasks.md`](tasks.md). Once the scaffold is added, this section must be updated with the exact commands that were actually run.

## Design constraints

- Local and server authorities sample outcomes with browser/server cryptographic randomness; visual shake intensity never changes probability.
- Online outcomes and scores are server-authoritative. Clients only render and submit validated commands.
- Round outcomes are sampled once and retained across rerenders, retries, reconnects, and presentation restarts.
- Image uploads must be decoded and normalized rather than trusted by extension or browser MIME type.
- Motion permission denial, unavailable WebGL, storage failure, and network failure must leave a usable fallback route.
- Real phone motion testing requires a trusted HTTPS origin.

## Contributing workflow

1. Read the complete GDD before changing product behavior.
2. Inspect existing code and repository rules before choosing new folders or dependencies.
3. Work through P0–P5 in order and keep each phase runnable.
4. Update [`tasks.md`](tasks.md) with status, evidence, and remaining limitations.
5. Record actual test commands, device/browser details, and known gaps; do not infer support from compilation alone.

## License and assets

No license or production asset policy has been selected yet. Add licensing and asset-origin documentation before distributing a release build.

# Kla-Khlok
