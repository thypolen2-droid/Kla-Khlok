import test from "node:test";
import assert from "node:assert/strict";
import {
  SETTLE_DURATION_MS,
  RoundCommandError,
  createInitialRoundState,
  reduceRound,
} from "../dist/index.js";

const outcome = ["s1", "s1", "s4"];
const deps = { sampleOutcome: () => outcome };
const command = (state, next) => reduceRound(state, next, deps);

function readyRound() {
  let state = createInitialRoundState(["alice", "bob"], "alice");
  state = command(state, { type: "START_MATCH" });
  state = command(state, { type: "SET_SELECTION", playerId: "alice", selection: "s1" });
  state = command(state, { type: "SET_SELECTION", playerId: "bob", selection: "s4" });
  state = command(state, { type: "READY", playerId: "alice" });
  state = command(state, { type: "READY", playerId: "bob" });
  return state;
}

test("fake clock preserves the original outcome and completes the two-second tail once", () => {
  let state = readyRound();
  state = command(state, { type: "ARM", actorId: "alice" });
  assert.equal(state.phase, "ARMED");
  assert.deepEqual(state.outcome, outcome);
  state = command(state, { type: "SHAKE_START", actorId: "alice" });
  state = command(state, { type: "STOP", actorId: "alice", now: 10_000 });
  assert.equal(state.phase, "SETTLING");
  assert.equal(state.settleAt, 10_000 + SETTLE_DURATION_MS);
  state = command(state, { type: "TICK", now: 11_999 });
  assert.equal(state.phase, "SETTLING");
  state = command(state, { type: "TICK", now: 12_000 });
  assert.equal(state.phase, "REVEALING");
  state = command(state, { type: "TICK", now: 12_001 });
  assert.equal(state.phase, "RESULTS");
  assert.deepEqual(state.latestResult.pointsDelta, { alice: 20, bob: 10 });
  assert.equal(state.history.length, 1);
  const finalized = command(state, { type: "TICK", now: 12_002 });
  assert.strictEqual(finalized, state);
  assert.equal(finalized.history.length, 1);
});

test("invalid roles and phases have no side effects", () => {
  let state = readyRound();
  assert.throws(
    () => command(state, { type: "ARM", actorId: "bob" }),
    RoundCommandError,
  );
  state = command(state, { type: "ARM", actorId: "alice" });
  assert.throws(
    () => command(state, { type: "SET_SELECTION", playerId: "alice", selection: "s2" }),
    RoundCommandError,
  );
  assert.throws(() => command(state, { type: "NEXT" }), RoundCommandError);
});

test("ten-round deterministic match retains history, ties, and no-match rounds", () => {
  const outcomes = [
    ["s1", "s1", "s4"], ["s2", "s3", "s5"], ["s0", "s0", "s2"], ["s4", "s4", "s4"], ["s1", "s2", "s3"],
    ["s5", "s5", "s0"], ["s2", "s2", "s1"], ["s3", "s4", "s5"], ["s0", "s1", "s2"], ["s4", "s5", "s4"],
  ];
  let index = 0;
  const deterministic = { sampleOutcome: () => outcomes[index++] };
  let state = createInitialRoundState(["alice", "bob"], "alice");
  state = reduceRound(state, { type: "START_MATCH" }, deterministic);
  for (let round = 0; round < 10; round += 1) {
    state = reduceRound(state, { type: "SET_SELECTION", playerId: "alice", selection: round % 2 ? "s2" : "s1" }, deterministic);
    state = reduceRound(state, { type: "SET_SELECTION", playerId: "bob", selection: round % 2 ? "s2" : "s1" }, deterministic);
    state = reduceRound(state, { type: "READY", playerId: "alice" }, deterministic);
    state = reduceRound(state, { type: "READY", playerId: "bob" }, deterministic);
    state = reduceRound(state, { type: "ARM", actorId: "alice" }, deterministic);
    state = reduceRound(state, { type: "SHAKE_START", actorId: "alice" }, deterministic);
    state = reduceRound(state, { type: "STOP", actorId: "alice", now: round * 10_000 }, deterministic);
    state = reduceRound(state, { type: "TICK", now: round * 10_000 + SETTLE_DURATION_MS }, deterministic);
    state = reduceRound(state, { type: "TICK", now: round * 10_000 + SETTLE_DURATION_MS + 1 }, deterministic);
    assert.equal(state.history.length, round + 1);
    if (round < 9) state = reduceRound(state, { type: "NEXT" }, deterministic);
  }
  assert.equal(state.phase, "RESULTS");
  assert.equal(state.history.length, 10);
  assert.equal(state.history[7].winnerIds.length, 0);
  assert.deepEqual(state.history[0].winnerIds, ["alice", "bob"]);
});
