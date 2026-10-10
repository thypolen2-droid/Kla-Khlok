import type { SymbolId } from "./index.js";

export const DIE_FACE_DIRECTIONS = ["+X", "-X", "+Y", "-Y", "+Z", "-Z"] as const;
export type DieFaceDirection = (typeof DIE_FACE_DIRECTIONS)[number];

export const DIE_FACE_SYMBOLS = ["s2", "s3", "s0", "s1", "s4", "s5"] as const satisfies readonly [
  SymbolId,
  SymbolId,
  SymbolId,
  SymbolId,
  SymbolId,
  SymbolId,
];

export function getSymbolForFaceIndex(index: number): SymbolId {
  const symbol = DIE_FACE_SYMBOLS[index];
  if (!symbol) {
    throw new RangeError(`Unknown die face index: ${index}`);
  }
  return symbol;
}

export function getFaceIndexForSymbol(symbolId: SymbolId): number {
  const index = DIE_FACE_SYMBOLS.indexOf(symbolId);
  if (index < 0) {
    throw new RangeError(`Unknown symbol ID: ${symbolId}`);
  }
  return index;
}
