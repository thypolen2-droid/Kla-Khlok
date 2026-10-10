import type { DiceOutcome, SymbolId } from "./index.js";
import { SYMBOL_IDS } from "./constants.js";

const BYTE_SPACE = 256;
const ACCEPTED_BYTE_LIMIT = BYTE_SPACE - (BYTE_SPACE % SYMBOL_IDS.length);

export type RandomByteSource = () => number;
export type RandomIndexSource = (maxExclusive: number) => number;

export function sampleSymbolIndexFromByteSource(nextByte: RandomByteSource): number {
  for (;;) {
    const byte = nextByte();
    if (!Number.isInteger(byte) || byte < 0 || byte >= BYTE_SPACE) {
      throw new RangeError("Random byte source must return an integer from 0 to 255");
    }
    if (byte < ACCEPTED_BYTE_LIMIT) {
      return byte % SYMBOL_IDS.length;
    }
  }
}

export function sampleOutcomeFromByteSource(nextByte: RandomByteSource): DiceOutcome {
  return [
    SYMBOL_IDS[sampleSymbolIndexFromByteSource(nextByte)]!,
    SYMBOL_IDS[sampleSymbolIndexFromByteSource(nextByte)]!,
    SYMBOL_IDS[sampleSymbolIndexFromByteSource(nextByte)]!,
  ];
}

export function createBrowserCryptoSampler(
  getRandomValues: (array: Uint8Array) => Uint8Array = (array) =>
    globalThis.crypto.getRandomValues(array),
): () => DiceOutcome {
  return () => sampleOutcomeFromByteSource(() => getRandomValues(new Uint8Array(1))[0]!);
}

export function createServerCryptoSampler(randomInt: RandomIndexSource): () => DiceOutcome {
  return () => {
    const sample = (): SymbolId => {
    const index = randomInt(SYMBOL_IDS.length);
    if (!Number.isInteger(index) || index < 0 || index >= SYMBOL_IDS.length) {
      throw new RangeError("Server random source returned an invalid symbol index");
    }
      return SYMBOL_IDS[index]!;
    };
    return [sample(), sample(), sample()];
  };
}
