import { randomUUID } from "node:crypto";
import { SYMBOL_IDS, type SymbolId } from "@kla-khlok/shared";

export const MAX_ROOM_PLAYERS = 8;

export interface RoomPlayer {
  readonly playerId: string;
  name: string;
  readonly rejoinToken: string;
  selection: SymbolId | null;
  ready: boolean;
}

export interface RoomSnapshot {
  readonly roomId: string;
  readonly roomVersion: number;
  readonly hostPlayerId: string;
  readonly phase: "SELECTING" | "LOCKED";
  readonly players: readonly Omit<RoomPlayer, "rejoinToken">[];
}

export class RoomError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
    this.name = "RoomError";
  }
}

interface Room {
  readonly roomId: string;
  readonly hostPlayerId: string;
  readonly players: RoomPlayer[];
  roomVersion: number;
  phase: "SELECTING" | "LOCKED";
  readonly deduplicatedCommands: Map<string, { readonly snapshot: RoomSnapshot }>;
}

const normalizeName = (value: unknown): string => {
  if (typeof value !== "string") throw new RoomError(400, "Player name is required");
  const name = value.trim();
  if (!name || name.length > 24) throw new RoomError(400, "Player name must be 1–24 characters");
  return name;
};

export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  createRoom(hostNameInput: unknown): { snapshot: RoomSnapshot; credential: string } {
    const hostName = normalizeName(hostNameInput);
    const roomId = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    const hostPlayerId = `player-${randomUUID().slice(0, 8)}`;
    const credential = randomUUID();
    const room: Room = { roomId, hostPlayerId, phase: "SELECTING", players: [{ playerId: hostPlayerId, name: hostName, rejoinToken: credential, selection: null, ready: false }], roomVersion: 1, deduplicatedCommands: new Map() };
    this.rooms.set(roomId, room);
    return { snapshot: this.snapshot(room), credential };
  }

  joinRoom(roomIdInput: unknown, nameInput: unknown, credentialInput?: unknown): { snapshot: RoomSnapshot; credential: string } {
    const roomId = typeof roomIdInput === "string" ? roomIdInput.toUpperCase() : "";
    const room = this.rooms.get(roomId);
    if (!room) throw new RoomError(404, "Room not found");
    const credential = typeof credentialInput === "string" ? credentialInput : null;
    if (credential) {
      const existing = room.players.find((player) => player.rejoinToken === credential);
      if (!existing) throw new RoomError(403, "Invalid rejoin credential");
      return { snapshot: this.snapshot(room), credential: existing.rejoinToken };
    }
    if (room.players.length >= MAX_ROOM_PLAYERS) throw new RoomError(409, "Room is full");
    const playerId = `player-${randomUUID().slice(0, 8)}`;
    const rejoinToken = randomUUID();
    room.players.push({ playerId, name: normalizeName(nameInput), rejoinToken, selection: null, ready: false });
    return { snapshot: this.snapshot(room), credential: rejoinToken };
  }

  getRoom(roomIdInput: unknown): RoomSnapshot {
    const room = this.rooms.get(typeof roomIdInput === "string" ? roomIdInput.toUpperCase() : "");
    if (!room) throw new RoomError(404, "Room not found");
    return this.snapshot(room);
  }

  applyCommand(roomIdInput: unknown, credentialInput: unknown, commandIdInput: unknown, command: unknown): { snapshot: RoomSnapshot } {
    const room = this.rooms.get(typeof roomIdInput === "string" ? roomIdInput.toUpperCase() : "");
    if (!room) throw new RoomError(404, "Room not found");
    const credential = typeof credentialInput === "string" ? credentialInput : "";
    const actor = room.players.find((player) => player.rejoinToken === credential);
    if (!actor) throw new RoomError(403, "Invalid room credential");
    if (typeof commandIdInput !== "string" || !commandIdInput.trim()) throw new RoomError(400, "commandId is required");
    const commandId = commandIdInput.trim();
    const previous = room.deduplicatedCommands.get(commandId);
    if (previous) return previous;
    if (!command || typeof command !== "object") throw new RoomError(400, "Unsupported room command");
    const typed = command as { type?: unknown; name?: unknown; selection?: unknown; expectedVersion?: unknown };
    if (typed.expectedVersion !== room.roomVersion) throw new RoomError(409, "Stale room version");
    if (typed.type === "player:rename") actor.name = normalizeName(typed.name);
    else if (typed.type === "player:select") {
      if (room.phase === "LOCKED") throw new RoomError(409, "Selections are locked");
      if (!SYMBOL_IDS.includes(typed.selection as SymbolId)) throw new RoomError(400, "Invalid symbol selection");
      actor.selection = typed.selection as SymbolId;
      actor.ready = false;
    } else if (typed.type === "player:ready") {
      if (room.phase === "LOCKED") throw new RoomError(409, "Round is locked");
      if (!actor.selection) throw new RoomError(409, "Player must select a symbol first");
      actor.ready = true;
    } else if (typed.type === "round:lock") {
      if (actor.playerId !== room.hostPlayerId) throw new RoomError(403, "Only the host may lock the round");
      if (room.players.some((player) => !player.ready || !player.selection)) throw new RoomError(409, "Every player must be ready");
      room.phase = "LOCKED";
    } else throw new RoomError(400, "Unsupported room command");
    room.roomVersion += 1;
    const acknowledgment = { snapshot: this.snapshot(room) };
    room.deduplicatedCommands.set(commandId, acknowledgment);
    return acknowledgment;
  }

  private snapshot(room: Room): RoomSnapshot {
    return { roomId: room.roomId, roomVersion: room.roomVersion, phase: room.phase, hostPlayerId: room.hostPlayerId, players: room.players.map(({ rejoinToken: _token, ...player }) => player) };
  }
}
