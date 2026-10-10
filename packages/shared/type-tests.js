const symbol = "s0";
const phase = "SELECTING";
const outcome = ["s0", "s1", "s2"];
void symbol;
void phase;
void outcome;
// @ts-expect-error Unknown symbols must not compile.
const invalidSymbol = "tiger";
// @ts-expect-error Unknown phases must not compile.
const invalidPhase = "ROLLING";
void invalidSymbol;
void invalidPhase;
export {};
