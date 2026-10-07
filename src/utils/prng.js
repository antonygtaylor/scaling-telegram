/**
 * Mulberry32 PRNG Implementation
 * Fast 32-bit PRNG generator with deterministic seeding.
 */
export class Mulberry32 {
  constructor(seed) {
    this.seed = seed >>> 0;
  }

  /**
   * Returns a pseudorandom float between 0 (inclusive) and 1 (exclusive).
   */
  nextFloat() {
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 8), t | 38);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudorandom integer between min (inclusive) and max (inclusive).
   */
  nextInt(min, max) {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Returns a pseudorandom float between min and max.
   */
  nextRange(min, max) {
    return this.nextFloat() * (max - min) + min;
  }
}

/**
 * 1D / 2D Perlin Noise Implementation using Mulberry32 PRNG.
 */
export class PerlinNoise {
  constructor(prng) {
    this.perm = new Uint8Array(512);
    this.p = new Uint8Array(256);

    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    // Shuffle array using PRNG
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(prng.nextFloat() * (i + 1));
      const temp = this.p[i];
      this.p[i] = this.p[j];
      this.p[j] = temp;
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad1D(hash, x) {
    const h = hash & 15;
    const grad = 1.0 + (h & 7); // Gradient value 1..8
    return (h & 8) ? -grad * x : grad * x;
  }

  /**
   * 1D Perlin Noise value between -1.0 and 1.0
   */
  noise1D(x) {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const u = this.fade(x);
    const g0 = this.grad1D(this.perm[X], x);
    const g1 = this.grad1D(this.perm[X + 1], x - 1);
    return this.lerp(u, g0, g1);
  }

  /**
   * Fractal Brownian Motion (fBm) for 1D noise heightmaps.
   */
  fbm1D(x, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise1D(x * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}
