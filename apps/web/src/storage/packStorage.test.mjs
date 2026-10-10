import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryPackStorage } from "./packStorage.js";

const pack = { revision: "r1", slots: [{ id: "s0", label: "s0", blob: new Blob(["image"]) }] };

test("memory pack storage round-trips saved image blobs", async () => {
  const storage = createMemoryPackStorage();
  await storage.save(pack);
  const loaded = await storage.load();
  assert.equal(loaded?.revision, "r1");
  assert.equal(await loaded?.slots[0].blob.text(), "image");
});

test("storage failures do not mutate the active pack", async () => {
  const storage = createMemoryPackStorage({ failSaves: true });
  await assert.rejects(storage.save(pack), /Quota exceeded/);
  assert.equal(await storage.load(), null);
});
