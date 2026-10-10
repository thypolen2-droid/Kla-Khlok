# Kla Khlok Delivery Plan

This plan follows the implementation order in [`KLA_KHLOK_GDD.md`](../KLA_KHLOK_GDD.md) and the isolated job queue in [`tasks.md`](../tasks.md).

## Execution rules

- Work on one numbered job at a time.
- Begin each job from a clean session and inspect the current repository first.
- Keep the job's change in its own commit.
- End every job with its listed functional test.
- Mark a job `BLOCKED` when its test fails; do not start the next job until the failure is resolved.

## Milestones

| Milestone | Outcome | Jobs |
| --- | --- | --- |
| P0 Foundation | Scaffold, contracts, schemas, reducer, sampler, and documentation | JOB-001–JOB-008 |
| P1 Dice prototype | Bowl, lid, 3D dice, controls, timing, audio, and fallback | JOB-009–JOB-018 |
| P2 Local Party | Custom images, persistence, seats, scoring, history, and recovery | JOB-019–JOB-026 |
| P3 Online Room | Private rooms, authority, protocol, image sharing, and reconnect | JOB-027–JOB-034 |
| P4 Usability | Host recovery, cleanup, localization, accessibility, and export | JOB-035–JOB-038 |
| P5 Release | Automated validation, device checks, performance, and handoff | JOB-039–JOB-041 |

## Current position

`JOB-008` is the active documentation job. The next implementation job after its test passes is `JOB-009`, the basic web shell and route.

## Completion standard

The project is ready only when the final release build, local mode, online mode, recovery paths, accessibility paths, and documented device checks satisfy the acceptance criteria in the GDD. A successful compile alone is not release evidence.
