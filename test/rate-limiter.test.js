import { describe, it, expect, vi, afterEach } from "vitest";
import { createRateLimiter } from "../server/rate-limiter.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter", () => {
  it("allows requests under the limit", () => {
    const check = createRateLimiter({ rpm: 5, rpd: 100 });
    expect(check()).toBeNull();
    expect(check()).toBeNull();
    expect(check()).toBeNull();
  });

  it("blocks when per-minute limit is reached", () => {
    const check = createRateLimiter({ rpm: 2, rpd: 100 });
    expect(check()).toBeNull();
    expect(check()).toBeNull();
    expect(check()).toMatch(/Rate limit reached/);
  });

  it("blocks when daily limit is reached", () => {
    const check = createRateLimiter({ rpm: 100, rpd: 3 });
    expect(check()).toBeNull();
    expect(check()).toBeNull();
    expect(check()).toBeNull();
    expect(check()).toMatch(/Daily rate limit/);
  });

  it("resets after minute window expires", () => {
    vi.useFakeTimers();
    const check = createRateLimiter({ rpm: 1, rpd: 100 });
    expect(check()).toBeNull();
    expect(check()).toMatch(/Rate limit/);
    vi.advanceTimersByTime(61_000);
    expect(check()).toBeNull();
  });

  it("uses default limits when no options provided", () => {
    const check = createRateLimiter();
    // Should allow at least one request (defaults are 60/min, 1000/day)
    expect(check()).toBeNull();
  });
});
