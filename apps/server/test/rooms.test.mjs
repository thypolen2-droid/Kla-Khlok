import test from "node:test";
import assert from "node:assert/strict";
import { RoomManager, RoomError } from "../dist/rooms.js";

test("room create/join supports eight players and hides rejoin credentials", () => {
  const manager = new RoomManager();
  const created = manager.createRoom("Host");
  let snapshot = created.snapshot;
  for (let index = 2; index <= 8; index += 1) snapshot = manager.joinRoom(snapshot.roomId, `Player ${index}`).snapshot;
  assert.equal(snapshot.players.length, 8);
  assert.equal("rejoinToken" in snapshot.players[0], false);
  assert.throws(() => manager.joinRoom(snapshot.roomId, "Ninth"), (error) => error instanceof RoomError && error.statusCode === 409);
});

test("invalid rejoin credentials are rejected while valid credentials return the same player", () => {
  const manager = new RoomManager();
  const created = manager.createRoom("Host");
  assert.throws(() => manager.joinRoom(created.snapshot.roomId, "Host", "wrong"), (error) => error instanceof RoomError && error.statusCode === 403);
  const rejoined = manager.joinRoom(created.snapshot.roomId, "Ignored", created.credential);
  assert.equal(rejoined.snapshot.players.length, 1);
  assert.equal(rejoined.snapshot.players[0].name, "Host");
});

test("retrying a command ID returns the original snapshot without applying twice", () => {
  const manager = new RoomManager();
  const created = manager.createRoom("Host");
  const first = manager.applyCommand(created.snapshot.roomId, created.credential, "cmd-1", { type: "player:rename", name: "Renamed", expectedVersion: 1 });
  const retry = manager.applyCommand(created.snapshot.roomId, created.credential, "cmd-1", { type: "player:rename", name: "Changed twice", expectedVersion: 1 });
  assert.deepEqual(retry, first);
  assert.equal(manager.getRoom(created.snapshot.roomId).roomVersion, 2);
  assert.equal(manager.getRoom(created.snapshot.roomId).players[0].name, "Renamed");
});

test("only the host can lock a fully ready roster and locked selections cannot change", () => {
  const manager = new RoomManager();
  const created = manager.createRoom("Host");
  const joined = manager.joinRoom(created.snapshot.roomId, "Guest");
  assert.throws(() => manager.applyCommand(created.snapshot.roomId, joined.credential, "bad-lock", { type: "round:lock", expectedVersion: 1 }), /Only the host/);
  const hostSelect = manager.applyCommand(created.snapshot.roomId, created.credential, "host-select", { type: "player:select", selection: "s0", expectedVersion: 1 });
  assert.throws(() => manager.applyCommand(created.snapshot.roomId, created.credential, "host-lock-early", { type: "round:lock", expectedVersion: hostSelect.snapshot.roomVersion }), /Every player/);
  const guestSelect = manager.applyCommand(created.snapshot.roomId, joined.credential, "guest-select", { type: "player:select", selection: "s1", expectedVersion: hostSelect.snapshot.roomVersion });
  const guestReady = manager.applyCommand(created.snapshot.roomId, joined.credential, "guest-ready", { type: "player:ready", expectedVersion: guestSelect.snapshot.roomVersion });
  const hostReady = manager.applyCommand(created.snapshot.roomId, created.credential, "host-ready", { type: "player:ready", expectedVersion: guestReady.snapshot.roomVersion });
  const locked = manager.applyCommand(created.snapshot.roomId, created.credential, "host-lock", { type: "round:lock", expectedVersion: hostReady.snapshot.roomVersion });
  assert.equal(locked.snapshot.phase, "LOCKED");
  assert.throws(() => manager.applyCommand(created.snapshot.roomId, joined.credential, "late-select", { type: "player:select", selection: "s2", expectedVersion: locked.snapshot.roomVersion }), /locked/);
});
