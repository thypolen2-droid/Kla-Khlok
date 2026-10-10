import type { DiceOutcome, RoundPhase, SymbolId } from "./index.js";

const symbol: SymbolId = "s0";
const phase: RoundPhase = "SELECTING";
const outcome: DiceOutcome = ["s0", "s1", "s2"];

void symbol;
void phase;
void outcome;

// @ts-expect-error Unknown symbols must not compile.
const invalidSymbol: SymbolId = "tiger";

// @ts-expect-error Unknown phases must not compile.
const invalidPhase: RoundPhase = "ROLLING";

void invalidSymbol;
void invalidPhase;
