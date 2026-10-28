/**
 * BingeByte — Jikan Rate Limiter
 * Enforces Jikan API published limits:
 * - Max 3 requests per second
 * - Max 60 requests per minute
 *
 * Implements sliding-window throttling with token queueing and 429 backoff synchronization.
 */

export class JikanRateLimiter {
  private readonly maxPerSecond = 3;
  private readonly maxPerMinute = 60;

  private timestamps: number[] = [];
  private blockedUntil = 0;

  /**
   * Waits for a rate-limit slot to become available before allowing execution.
   */
  public async acquire(): Promise<void> {
    while (true) {
      const now = Date.now();

      // Check if temporarily blocked by a 429 response
      if (now < this.blockedUntil) {
        const waitTime = this.blockedUntil - now;
        await this.sleep(waitTime);
        continue;
      }

      // Evict timestamps older than 60 seconds
      this.timestamps = this.timestamps.filter((t) => now - t < 60000);

      // Check per-second constraint (last 1000ms)
      const lastSecondCount = this.timestamps.filter((t) => now - t < 1000).length;

      // Check per-minute constraint (last 60000ms)
      const lastMinuteCount = this.timestamps.length;

      if (lastSecondCount >= this.maxPerSecond) {
        const oldestInLastSecond = this.timestamps.slice(-this.maxPerSecond)[0];
        const waitMs = Math.max(10, 1000 - (now - oldestInLastSecond) + 50);
        await this.sleep(waitMs);
        continue;
      }

      if (lastMinuteCount >= this.maxPerMinute) {
        const oldestInMinute = this.timestamps[0];
        const waitMs = Math.max(10, 60000 - (now - oldestInMinute) + 100);
        await this.sleep(waitMs);
        continue;
      }

      // Slot acquired
      this.timestamps.push(Date.now());
      break;
    }
  }

  /**
   * Notifies the rate limiter that an HTTP 429 was encountered.
   * Pauses subsequent requests for the given duration (or 2 seconds by default).
   */
  public reportRateLimit(retryAfterSeconds?: number): void {
    const pauseDuration = (retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : 2) * 1000;
    this.blockedUntil = Math.max(this.blockedUntil, Date.now() + pauseDuration);
  }

  /**
   * Resets rate limiter state (useful in test suites).
   */
  public reset(): void {
    this.timestamps = [];
    this.blockedUntil = 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const jikanRateLimiter = new JikanRateLimiter();
