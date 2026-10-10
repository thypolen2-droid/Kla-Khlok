import test from "node:test";
import assert from "node:assert/strict";
import {
  createBrowserCryptoSampler,
  createServerCryptoSampler,
  sampleOutcomeFromByteSource,
  sampleSymbolIndexFromByteSource,
} from "../dist/index.js";

test("byte sampler rejects the biased tail and maps accepted bytes uniformly", () => {
  const sequence = [252, 5, 6, 251];
  let position = 0;
  const nextByte = () => sequence[position++];
  assert.equal(sampleSymbolIndexFromByteSource(nextByte), 5);
  assert.deepEqual(sampleOutcomeFromByteSource(() => 0), ["s0", "s0", "s0"]);
  assert.deepEqual(sampleOutcomeFromByteSource(() => 251), ["s5", "s5", "s5"]);
});

test("browser and server adapters return three valid symbols and reject invalid sources", () => {
  const browserSampler = createBrowserCryptoSampler((bytes) => {
    bytes[0] = 7;
    return bytes;
  });
  assert.deepEqual(browserSampler(), ["s1", "s1", "s1"]);

  const calls = [];
  const serverSampler = createServerCryptoSampler((maxExclusive) => {
    calls.push(maxExclusive);
    return 4;
  });
  assert.deepEqual(serverSampler(), ["s4", "s4", "s4"]);
  assert.deepEqual(calls, [6, 6, 6]);
  assert.throws(() => createServerCryptoSampler(() => 6)(), RangeError);
  assert.throws(() => createServerCryptoSampler(() => -1)(), RangeError);
  assert.throws(() => sampleSymbolIndexFromByteSource(() => 256), RangeError);
});
