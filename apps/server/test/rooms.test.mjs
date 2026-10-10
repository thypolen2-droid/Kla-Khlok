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
  const first = manager.applyCommand(created.snapshot.roomId, created.credential, "cmd-1", { type: "player:rename", name: "Renamed" });
  const retry = manager.applyCommand(created.snapshot.roomId, created.credential, "cmd-1", { type: "player:rename", name: "Changed twice" });
  assert.deepEqual(retry, first);
  assert.equal(manager.getRoom(created.snapshot.roomId).roomVersion, 2);
  assert.equal(manager.getRoom(created.snapshot.roomId).players[0].name, "Renamed");
});
