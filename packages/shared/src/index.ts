export const GAME_NAME = "Kla Khlok" as const;
export const GAME_VERSION = "0.1.0" as const;

export const SYMBOL_IDS = ["s0", "s1", "s2", "s3", "s4", "s5"] as const;
export type SymbolId = (typeof SYMBOL_IDS)[number];
