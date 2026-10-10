import type { DiceOutcome, RoundPhase, SymbolId } from "./index.js";
import {
  calculateRoundPoints,
  getRoundWinnerIds,
} from "./scoring.js";

export const SETTLE_DURATION_MS = 2_000;

export interface RoundPlayer {
  readonly playerId: string;
  readonly selection: SymbolId | null;
  readonly ready: boolean;
  readonly score: number;
}

export interface RoundResult {
  readonly roundId: string;
  readonly roundNumber: number;
  readonly outcome: DiceOutcome;
  readonly pointsDelta: Readonly<Record<string, number>>;
  readonly scoresAfter: Readonly<Record<string, number>>;
  readonly winnerIds: readonly string[];
}

export interface RoundState {
  readonly phase: RoundPhase;
  readonly hostPlayerId: string;
  readonly roundNumber: number;
  readonly roundId: string | null;
  readonly players: readonly RoundPlayer[];
  readonly outcome: DiceOutcome | null;
  readonly settleAt: number | null;
  readonly latestResult: RoundResult | null;
  readonly history: readonly RoundResult[];
}

export type RoundCommand =
  | { readonly type: "START_MATCH" }
  | { readonly type: "SET_SELECTION"; readonly playerId: string; readonly selection: SymbolId }
  | { readonly type: "READY"; readonly playerId: string }
  | { readonly type: "ARM"; readonly actorId: string }
  | { readonly type: "SHAKE_START"; readonly actorId: string }
  | { readonly type: "STOP"; readonly actorId: string; readonly now: number }
  | { readonly type: "TICK"; readonly now: number }
  | { readonly type: "NEXT" };

export interface RoundDependencies {
  readonly sampleOutcome: () => DiceOutcome;
}

export class RoundCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoundCommandError";
  }
}

export function createInitialRoundState(
  playerIds: readonly string[],
  hostPlayerId = playerIds[0],
): RoundState {
  if (!hostPlayerId || playerIds.length === 0 || !playerIds.includes(hostPlayerId)) {
    throw new RoundCommandError("A room needs at least one player and a valid host");
  }

  return {
    phase: "LOBBY",
    hostPlayerId,
    roundNumber: 0,
    roundId: null,
    players: playerIds.map((playerId) => ({
      playerId,
      selection: null,
      ready: false,
      score: 0,
    })),
    outcome: null,
    settleAt: null,
    latestResult: null,
    history: [],
  };
}

function requirePlayer(state: RoundState, playerId: string): RoundPlayer {
  const player = state.players.find((candidate) => candidate.playerId === playerId);
  if (!player) {
    throw new RoundCommandError(`Unknown player: ${playerId}`);
  }
  return player;
}

function replacePlayer(
  state: RoundState,
  playerId: string,
  update: (player: RoundPlayer) => RoundPlayer,
): readonly RoundPlayer[] {
  return state.players.map((player) =>
    player.playerId === playerId ? update(player) : player,
  );
}

function requirePhase(state: RoundState, ...phases: RoundPhase[]): void {
  if (!phases.includes(state.phase)) {
    throw new RoundCommandError(`Command is not allowed during ${state.phase}`);
  }
}

function requireHost(state: RoundState, actorId: string): void {
  if (actorId !== state.hostPlayerId) {
    throw new RoundCommandError("Only the host may control the roll");
  }
}

export function reduceRound(
  state: RoundState,
  command: RoundCommand,
  dependencies: RoundDependencies,
): RoundState {
  switch (command.type) {
    case "START_MATCH":
      requirePhase(state, "LOBBY");
      return { ...state, phase: "SELECTING", roundNumber: 1 };

    case "SET_SELECTION": {
      requirePhase(state, "SELECTING");
      const player = requirePlayer(state, command.playerId);
      if (player.ready) {
        throw new RoundCommandError("A ready player cannot change selection");
      }
      return {
        ...state,
        players: replacePlayer(state, command.playerId, (current) => ({
          ...current,
          selection: command.selection,
        })),
      };
    }

    case "READY": {
      requirePhase(state, "SELECTING");
      const player = requirePlayer(state, command.playerId);
      if (!player.selection) {
        throw new RoundCommandError("A player needs a selection before ready");
      }
      return {
        ...state,
        players: replacePlayer(state, command.playerId, (current) => ({
          ...current,
          ready: true,
        })),
      };
    }

    case "ARM":
      requirePhase(state, "SELECTING");
      requireHost(state, command.actorId);
      if (state.players.some((player) => !player.selection || !player.ready)) {
        throw new RoundCommandError("Every player must select and ready before arming");
      }
      return {
        ...state,
        phase: "ARMED",
        roundId: `round-${state.roundNumber}`,
        outcome: dependencies.sampleOutcome(),
        settleAt: null,
        latestResult: null,
      };

    case "SHAKE_START":
      requirePhase(state, "ARMED");
      requireHost(state, command.actorId);
      return { ...state, phase: "SHAKING" };

    case "STOP":
      requirePhase(state, "SHAKING");
      requireHost(state, command.actorId);
      return {
        ...state,
        phase: "SETTLING",
        settleAt: command.now + SETTLE_DURATION_MS,
      };

    case "TICK":
      if (state.phase === "SETTLING") {
        if (state.settleAt === null || command.now < state.settleAt) {
          return state;
        }
        return { ...state, phase: "REVEALING" };
      }

      if (state.phase === "REVEALING") {
        if (!state.roundId || !state.outcome) {
          throw new RoundCommandError("Cannot reveal a round without an outcome");
        }

        const selections = Object.fromEntries(
          state.players.map((player) => [player.playerId, player.selection]),
        ) as Record<string, SymbolId | null>;
        const pointsDelta = Object.fromEntries(
          state.players.map((player) => {
            const selection = selections[player.playerId];
            return [
              player.playerId,
              selection ? calculateRoundPoints(selection, state.outcome!) : 0,
            ];
          }),
        );
        const scoresAfter = Object.fromEntries(
          state.players.map((player) => [
            player.playerId,
            player.score + (pointsDelta[player.playerId] ?? 0),
          ]),
        );
        const result: RoundResult = {
          roundId: state.roundId,
          roundNumber: state.roundNumber,
          outcome: state.outcome,
          pointsDelta,
          scoresAfter,
          winnerIds: getRoundWinnerIds(pointsDelta),
        };

        return {
          ...state,
          phase: "RESULTS",
          players: state.players.map((player) => ({
            ...player,
            score: scoresAfter[player.playerId] ?? player.score,
          })),
          latestResult: result,
          history: [...state.history, result],
        };
      }

      return state;

    case "NEXT":
      requirePhase(state, "RESULTS");
      if (state.roundNumber >= 10) {
        return { ...state, phase: "MATCH_FINISHED" };
      }
      return {
        ...state,
        phase: "SELECTING",
        roundNumber: state.roundNumber + 1,
        roundId: null,
        outcome: null,
        settleAt: null,
        latestResult: null,
        players: state.players.map((player) => ({
          ...player,
          selection: null,
          ready: false,
        })),
      };
  }
}
