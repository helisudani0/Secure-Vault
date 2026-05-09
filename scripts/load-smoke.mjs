const targetUrl = process.env.TARGET_URL || "http://127.0.0.1:8000/api/health/";
const totalRequests = Number(process.env.REQUESTS || 100);
const concurrency = Number(process.env.CONCURRENCY || 10);
const timeoutMs = Number(process.env.TIMEOUT_MS || 5000);

const latencies = [];
const statuses = new Map();
let failures = 0;
let nextRequest = 0;

async function hit() {
  const started = performance.now();
  try {
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    const elapsed = performance.now() - started;
    latencies.push(elapsed);
    statuses.set(response.status, (statuses.get(response.status) || 0) + 1);
    if (!response.ok) failures += 1;
  } catch {
    failures += 1;
  }
}

async function worker() {
  while (nextRequest < totalRequests) {
    nextRequest += 1;
    await hit();
  }
}

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

const started = performance.now();
await Promise.all(Array.from({ length: concurrency }, () => worker()));
const totalMs = performance.now() - started;

const summary = {
  targetUrl,
  requests: totalRequests,
  concurrency,
  failures,
  statuses: Object.fromEntries(statuses),
  durationMs: Math.round(totalMs),
  requestsPerSecond: Number((totalRequests / (totalMs / 1000)).toFixed(2)),
  p50Ms: Math.round(percentile(latencies, 50)),
  p95Ms: Math.round(percentile(latencies, 95)),
  p99Ms: Math.round(percentile(latencies, 99)),
};

console.log(JSON.stringify(summary, null, 2));
if (failures > 0) process.exit(1);
