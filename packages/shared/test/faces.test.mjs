import test from "node:test";
import assert from "node:assert/strict";
import {
  DIE_FACE_DIRECTIONS,
  DIE_FACE_SYMBOLS,
  getFaceIndexForSymbol,
  getSymbolForFaceIndex,
} from "../dist/index.js";

test("all six material faces have a stable one-to-one symbol mapping", () => {
  assert.equal(DIE_FACE_DIRECTIONS.length, 6);
  assert.equal(DIE_FACE_SYMBOLS.length, 6);
  assert.equal(new Set(DIE_FACE_SYMBOLS).size, 6);

  for (const [index, symbolId] of DIE_FACE_SYMBOLS.entries()) {
    assert.equal(getSymbolForFaceIndex(index), symbolId);
    assert.equal(getFaceIndexForSymbol(symbolId), index);
  }
});

test("face mapping rejects unknown indexes", () => {
  assert.throws(() => getSymbolForFaceIndex(-1), RangeError);
  assert.throws(() => getSymbolForFaceIndex(6), RangeError);
});
