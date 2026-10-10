import test from "node:test";
import assert from "node:assert/strict";
import {
  DiceOutcomeSchema,
  RoundPhaseSchema,
  SymbolPackManifestSchema,
  SymbolIdSchema,
} from "../dist/index.js";

const validPack = {
  packId: "default",
  revision: "r1",
  name: "Default symbols",
  slots: ["s0", "s1", "s2", "s3", "s4", "s5"].map((id) => ({
    id,
    label: id,
    assetId: `${id}-asset`,
    contentHash: `${id}-hash`,
    width: 256,
    height: 256,
  })),
};

test("runtime schemas accept valid IDs, phases, outcomes, and six-slot packs", () => {
  assert.equal(SymbolIdSchema.parse("s3"), "s3");
  assert.equal(RoundPhaseSchema.parse("SETTLING"), "SETTLING");
  assert.deepEqual(DiceOutcomeSchema.parse(["s0", "s1", "s5"]), ["s0", "s1", "s5"]);
  assert.deepEqual(SymbolPackManifestSchema.parse(validPack), validPack);
});

test("runtime schemas reject invalid IDs, phases, NaN, and incomplete packs", () => {
  assert.equal(SymbolIdSchema.safeParse("tiger").success, false);
  assert.equal(RoundPhaseSchema.safeParse("ROLLING").success, false);
  assert.equal(DiceOutcomeSchema.safeParse(["s0", "s1", "s9"]).success, false);

  const nanPack = structuredClone(validPack);
  nanPack.slots[0].width = Number.NaN;
  assert.equal(SymbolPackManifestSchema.safeParse(nanPack).success, false);

  const incompletePack = structuredClone(validPack);
  incompletePack.slots.pop();
  assert.equal(SymbolPackManifestSchema.safeParse(incompletePack).success, false);
});
