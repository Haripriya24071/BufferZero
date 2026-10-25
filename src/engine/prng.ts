/**
 * Mulberry32 Seeded Pseudo-Random Number Generator
 * Produces deterministic 32-bit pseudo-random values.
 * Identical seed -> identical sequence.
 */
export class PRNG {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public setSeed(seed: number): void {
    this.state = seed >>> 0;
  }
}
