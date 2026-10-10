import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePlayerPoints,
  calculateRoundPoints,
  countMatches,
  getMatchWinnerIds,
  getRoundWinnerIds,
} from "../dist/index.js";

const symbols = ["s0", "s1", "s2", "s3", "s4", "s5"];

test("scoring covers all 216 ordered outcomes and six selections", () => {
  let outcomesChecked = 0;

  for (const first of symbols) {
    for (const second of symbols) {
      for (const third of symbols) {
        const outcome = [first, second, third];
        outcomesChecked += 1;
        for (const selection of symbols) {
          const matches = outcome.filter((symbol) => symbol === selection).length;
          assert.equal(countMatches(selection, outcome), matches);
          assert.equal(calculateRoundPoints(selection, outcome), matches * 10);
          assert.ok([0, 10, 20, 30].includes(calculateRoundPoints(selection, outcome)));
        }
      }
    }
  }

  assert.equal(outcomesChecked, 216);
});

test("player points, round winners, no-match rounds, and shared ties are deterministic", () => {
  const points = calculatePlayerPoints(
    ["s1", "s1", "s4"],
    { alice: "s1", bob: "s4", carol: "s0" },
  );

  assert.deepEqual(points, { alice: 20, bob: 10, carol: 0 });
  assert.deepEqual(getRoundWinnerIds(points), ["alice"]);
  assert.deepEqual(getRoundWinnerIds({ alice: 0, bob: 0 }), []);
  assert.deepEqual(getRoundWinnerIds({ alice: 20, bob: 20, carol: 10 }), ["alice", "bob"]);
  assert.deepEqual(getMatchWinnerIds({ alice: 40, bob: 40, carol: 20 }), ["alice", "bob"]);
  assert.deepEqual(getMatchWinnerIds({ alice: 0, bob: 0 }), ["alice", "bob"]);
});
