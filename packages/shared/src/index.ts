export { GAME_NAME, GAME_VERSION, ROUND_PHASES, SYMBOL_IDS } from "./constants.js";
import { ROUND_PHASES, SYMBOL_IDS } from "./constants.js";
export type SymbolId = (typeof SYMBOL_IDS)[number];

export type RoundPhase = (typeof ROUND_PHASES)[number];

export type DiceOutcome = readonly [SymbolId, SymbolId, SymbolId];

export {
  DiceOutcomeSchema,
  RoundPhaseSchema,
  SymbolIdSchema,
  SymbolPackManifestSchema,
  SymbolSlotSchema,
} from "./schemas.js";
export {
  calculatePlayerPoints,
  calculateRoundPoints,
  countMatches,
  getMatchWinnerIds,
  getRoundWinnerIds,
} from "./scoring.js";
export {
  SETTLE_DURATION_MS,
  RoundCommandError,
  createInitialRoundState,
  reduceRound,
} from "./round.js";
export type {
  RoundCommand,
  RoundDependencies,
  RoundPlayer,
  RoundResult,
  RoundState,
} from "./round.js";
export {
  createBrowserCryptoSampler,
  createServerCryptoSampler,
  sampleOutcomeFromByteSource,
  sampleSymbolIndexFromByteSource,
} from "./random.js";
export type { RandomByteSource, RandomIndexSource } from "./random.js";
