import type { RoundState } from "@kla-khlok/shared";

const STORAGE_KEY = "kla-khlok-active-round";
const phases = new Set(["LOBBY", "SELECTING", "ARMED", "SHAKING", "SETTLING", "REVEALING", "RESULTS", "MATCH_FINISHED"]);

function isRoundState(value: unknown): value is RoundState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RoundState>;
  return typeof candidate.scoringEnabled === "boolean" && typeof candidate.phase === "string" && phases.has(candidate.phase) &&
    Array.isArray(candidate.players) && typeof candidate.roundNumber === "number" && Array.isArray(candidate.history);
}

export function loadRoundState(fallback: RoundState): RoundState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isRoundState(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveRoundState(state: RoundState): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Session storage is optional; gameplay continues in memory when unavailable.
  }
}
