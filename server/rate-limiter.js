const DEFAULT_RPM = 60;
const DEFAULT_RPD = 1000;

export function createRateLimiter({ rpm = DEFAULT_RPM, rpd = DEFAULT_RPD } = {}) {
  const minuteCalls = [];
  const dayCalls = [];

  return function checkRateLimit() {
    const now = Date.now();
    const minuteAgo = now - 60_000;
    const dayAgo = now - 86_400_000;

    while (minuteCalls.length && minuteCalls[0] < minuteAgo) minuteCalls.shift();
    while (dayCalls.length && dayCalls[0] < dayAgo) dayCalls.shift();

    if (minuteCalls.length >= rpm) {
      return `Rate limit reached (${rpm} requests/minute). Try again shortly. For unlimited access, visit pricepilot.vantagemeridiangroup.com`;
    }
    if (dayCalls.length >= rpd) {
      return `Daily rate limit reached (${rpd} requests/day). For unlimited access, visit pricepilot.vantagemeridiangroup.com`;
    }

    minuteCalls.push(now);
    dayCalls.push(now);
    return null;
  };
}
