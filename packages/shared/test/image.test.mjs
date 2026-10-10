import test from "node:test";
import assert from "node:assert/strict";
import { ImageValidationError, inspectImageBytes, MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS, normalizeImageBytes } from "../dist/index.js";

const png = (width, height, metadata = false) => {
  const bytes = new Uint8Array(33 + (metadata ? 12 : 0));
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([0, 0, 0, 13, 73, 72, 68, 82], 8);
  bytes.set([(width >>> 24) & 255, (width >>> 16) & 255, (width >>> 8) & 255, width & 255], 16);
  bytes.set([(height >>> 24) & 255, (height >>> 16) & 255, (height >>> 8) & 255, height & 255], 20);
  if (metadata) bytes.set([0, 0, 0, 0, 116, 69, 88, 116, 0, 0, 0, 0], 33);
  return bytes;
};

test("image inspection accepts PNG and reports dimensions and metadata", () => {
  assert.deepEqual(inspectImageBytes(png(640, 480, true)), { format: "png", width: 640, height: 480, byteLength: 45, hasMetadata: true });
});

test("normalization returns an immutable byte copy", () => {
  const source = png(256, 256);
  const normalized = normalizeImageBytes(source);
  source[0] = 0;
  assert.equal(normalized.bytes[0], 137);
  assert.equal(normalized.width, 256);
});

test("invalid, corrupt, oversized, and extreme-dimension inputs are rejected", () => {
  assert.throws(() => inspectImageBytes(new Uint8Array([1, 2, 3])), ImageValidationError);
  assert.throws(() => inspectImageBytes(new Uint8Array(MAX_IMAGE_BYTES + 1)), /10 MiB/);
  assert.throws(() => inspectImageBytes(png(MAX_IMAGE_DIMENSION + 1, 1)), /dimensions/);
  assert.throws(() => inspectImageBytes(png(MAX_IMAGE_DIMENSION, Math.ceil(MAX_IMAGE_PIXELS / MAX_IMAGE_DIMENSION) + 1)), /dimensions/);
});

test("wrong extensions do not matter when decoded bytes are valid", () => {
  const validBytes = png(32, 32);
  assert.equal(inspectImageBytes(validBytes).format, "png");
});
