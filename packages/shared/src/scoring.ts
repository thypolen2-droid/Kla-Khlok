import type { DiceOutcome, SymbolId } from "./index.js";

export function countMatches(selection: SymbolId, outcome: DiceOutcome): number {
  return outcome.filter((symbol) => symbol === selection).length;
}

export function calculateRoundPoints(selection: SymbolId, outcome: DiceOutcome): number {
  return countMatches(selection, outcome) * 10;
}

export function calculatePlayerPoints(
  outcome: DiceOutcome,
  selections: Record<string, SymbolId>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(selections).map(([playerId, selection]) => [
      playerId,
      calculateRoundPoints(selection, outcome),
    ]),
  );
}

export function getRoundWinnerIds(points: Record<string, number>): string[] {
  const positivePoints = Object.entries(points).filter(([, score]) => score > 0);
  if (positivePoints.length === 0) {
    return [];
  }

  const highestScore = Math.max(...positivePoints.map(([, score]) => score));
  return positivePoints
    .filter(([, score]) => score === highestScore)
    .map(([playerId]) => playerId);
}

export function getMatchWinnerIds(scores: Record<string, number>): string[] {
  const players = Object.entries(scores);
  if (players.length === 0) {
    return [];
  }

  const highestScore = Math.max(...players.map(([, score]) => score));
  return players.filter(([, score]) => score === highestScore).map(([playerId]) => playerId);
}
