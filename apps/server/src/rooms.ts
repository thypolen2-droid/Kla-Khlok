import { randomUUID } from "node:crypto";

export const MAX_ROOM_PLAYERS = 8;

export interface RoomPlayer {
  readonly playerId: string;
  name: string;
  readonly rejoinToken: string;
}

export interface RoomSnapshot {
  readonly roomId: string;
  readonly roomVersion: number;
  readonly hostPlayerId: string;
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
    const room: Room = { roomId, hostPlayerId, players: [{ playerId: hostPlayerId, name: hostName, rejoinToken: credential }], roomVersion: 1, deduplicatedCommands: new Map() };
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
    room.players.push({ playerId, name: normalizeName(nameInput), rejoinToken });
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
    if (!command || typeof command !== "object" || (command as { type?: unknown }).type !== "player:rename") throw new RoomError(400, "Unsupported room command");
    actor.name = normalizeName((command as { name?: unknown }).name);
    room.roomVersion += 1;
    const acknowledgment = { snapshot: this.snapshot(room) };
    room.deduplicatedCommands.set(commandId, acknowledgment);
    return acknowledgment;
  }

  private snapshot(room: Room): RoomSnapshot {
    return { roomId: room.roomId, roomVersion: room.roomVersion, hostPlayerId: room.hostPlayerId, players: room.players.map(({ rejoinToken: _token, ...player }) => player) };
  }
}
