import test from "node:test";
import assert from "node:assert/strict";
import { MotionProcessor } from "../dist/index.js";

const acceleration = (timestamp, value) => ({
  timestamp,
  acceleration: { x: value, y: 0, z: 0 },
});

test("motion processor ignores quiet movement, detects strong movement, and bounds intensity", () => {
  const processor = new MotionProcessor();
  assert.equal(processor.push(acceleration(0, 0)).qualifyingShake, false);
  assert.equal(processor.push(acceleration(100, 4)).qualifyingShake, false);
  let result = processor.push(acceleration(200, 24));
  for (let time = 300; time <= 700; time += 100) {
    result = processor.push(acceleration(time, 24));
  }
  assert.equal(result.qualifyingShake, true);
  assert.ok(result.intensity >= 0 && result.intensity <= 1);
  const stopped = processor.push(acceleration(1_100, 0));
  assert.equal(stopped.stopConfirmed, true);
});

test("gravity-inclusive samples initialize gravity instead of treating it as a shake", () => {
  const processor = new MotionProcessor();
  assert.equal(processor.push({ timestamp: 0, accelerationIncludingGravity: { x: 0, y: 9.81, z: 0 } }).qualifyingShake, false);
  assert.equal(processor.push({ timestamp: 100, accelerationIncludingGravity: { x: 0, y: 9.81, z: 0 } }).qualifyingShake, false);
  assert.equal(processor.push({ timestamp: 200, accelerationIncludingGravity: { x: null, y: 9.81, z: 0 } }).valid, false);
});
