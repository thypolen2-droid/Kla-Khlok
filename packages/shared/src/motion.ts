export interface MotionVector {
  readonly x: number | null;
  readonly y: number | null;
  readonly z: number | null;
}

export interface MotionSample {
  readonly timestamp: number;
  readonly acceleration?: MotionVector | null;
  readonly accelerationIncludingGravity?: MotionVector | null;
}

export interface MotionResult {
  readonly valid: boolean;
  readonly qualifyingShake: boolean;
  readonly intensity: number;
  readonly smoothedMagnitude: number;
  readonly stopConfirmed: boolean;
}

export interface MotionProcessorOptions {
  readonly threshold?: number;
  readonly energyRange?: number;
  readonly gravityFilterTimeConstant?: number;
  readonly magnitudeFilterTimeConstant?: number;
  readonly stopQuietWindowMs?: number;
}

const DEFAULTS = {
  threshold: 8,
  energyRange: 16,
  gravityFilterTimeConstant: 0.5,
  magnitudeFilterTimeConstant: 0.08,
  stopQuietWindowMs: 300,
} as const;

function finiteVector(vector: MotionVector | null | undefined): vector is { x: number; y: number; z: number } {
  return Boolean(
    vector &&
      Number.isFinite(vector.x) &&
      Number.isFinite(vector.y) &&
      Number.isFinite(vector.z),
  );
}

function subtract(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function magnitude(vector: { x: number; y: number; z: number }): number {
  return Math.hypot(vector.x, vector.y, vector.z);
}

export class MotionProcessor {
  private readonly options: Required<MotionProcessorOptions>;
  private gravity: { x: number; y: number; z: number } | null = null;
  private smoothedMagnitude = 0;
  private lastTimestamp: number | null = null;
  private lastShakeAt: number | null = null;

  constructor(options: MotionProcessorOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  push(sample: MotionSample): MotionResult {
    const direct = finiteVector(sample.acceleration);
    const gravityInclusive = !direct && finiteVector(sample.accelerationIncludingGravity);
    const raw = direct ? sample.acceleration : gravityInclusive ? sample.accelerationIncludingGravity : null;

    if (!raw) {
      return this.result(false, sample.timestamp, false);
    }

    const dt = this.lastTimestamp === null
      ? 0.016
      : Math.max(0.001, Math.min((sample.timestamp - this.lastTimestamp) / 1000, 1));
    this.lastTimestamp = sample.timestamp;

    let linear = raw;
    if (gravityInclusive) {
      if (!this.gravity) {
        this.gravity = { ...raw };
        return this.result(true, sample.timestamp, false);
      }
      const alpha = 1 - Math.exp(-dt / this.options.gravityFilterTimeConstant);
      this.gravity = {
        x: this.gravity.x + alpha * (raw.x - this.gravity.x),
        y: this.gravity.y + alpha * (raw.y - this.gravity.y),
        z: this.gravity.z + alpha * (raw.z - this.gravity.z),
      };
      linear = subtract(raw, this.gravity);
    }

    const rawMagnitude = magnitude(linear);
    const smoothAlpha = 1 - Math.exp(-dt / this.options.magnitudeFilterTimeConstant);
    this.smoothedMagnitude += smoothAlpha * (rawMagnitude - this.smoothedMagnitude);
    const qualifyingShake = this.smoothedMagnitude >= this.options.threshold;
    if (qualifyingShake) {
      this.lastShakeAt = sample.timestamp;
    }
    return this.result(true, sample.timestamp, qualifyingShake);
  }

  private result(valid: boolean, timestamp: number, qualifyingShake: boolean): MotionResult {
    const intensity = Math.max(
      0,
      Math.min(1, (this.smoothedMagnitude - this.options.threshold) / this.options.energyRange),
    );
    return {
      valid,
      qualifyingShake,
      intensity,
      smoothedMagnitude: this.smoothedMagnitude,
      stopConfirmed: this.lastShakeAt !== null && timestamp - this.lastShakeAt >= this.options.stopQuietWindowMs,
    };
  }
}
