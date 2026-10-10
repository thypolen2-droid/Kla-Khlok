import test from "node:test";
import assert from "node:assert/strict";
import { GAME_NAME, SYMBOL_IDS } from "../dist/index.js";

test("shared package exposes the game identity and six symbol slots", () => {
  assert.equal(GAME_NAME, "Kla Khlok");
  assert.deepEqual(SYMBOL_IDS, ["s0", "s1", "s2", "s3", "s4", "s5"]);
});
