import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { NeonBreakerSimulation } from "../multiplayer-server/src/neon-breaker-simulation.js";

if (!process.argv.includes("--create-scratch")) {
  throw new Error("Pass --create-scratch to create a no-signup Upstash database that expires automatically after 72 hours.");
}

const provision = await fetch("https://upstash.com/start-redis", {
  method: "POST",
  headers: {
    "User-Agent": "codex",
    Accept: "text/markdown",
    "Idempotency-Key": "cfc9fa2a-568d-4d2f-a252-c0b829b760d4",
  },
  signal: AbortSignal.timeout(30_000),
});
if (!provision.ok) throw new Error(`Free scratch database request failed (${provision.status})`);
const credentials = await provision.text();
const field = (name) => {
  const line = credentials.split(/\r?\n/).find((value) => new RegExp(`^\\s*(?:[-*]\\s*)?(?:\\*\\*)?${name}(?:\\*\\*)?:`, "i").test(value));
  return line?.replace(new RegExp(`^\\s*(?:[-*]\\s*)?(?:\\*\\*)?${name}(?:\\*\\*)?:\\s*`, "i"), "").trim().split(String.fromCharCode(96))[0].replace(/^[*_\s<>]+|[*_\s<>]+$/g, "");
};
const endpoint = field("Endpoint");
const token = field("Token");
if (!endpoint || !token) {
  const safeFields = credentials.split(/\r?\n/).slice(0, 12).map((line) =>
    line.replace(/https?:\/\/\S+/g, "<redacted-url>").replace(/\S{20,}/g, "<redacted-value>"),
  );
  console.error("Safe credential-field shape:", safeFields);
  throw new Error("Could not parse scratch Redis credentials; values were kept private");
}

let commands = 0;
let requestBodyBytes = 0;
let responseBodyBytes = 0;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function redis(args) {
  const body = JSON.stringify(args);
  commands++;
  requestBodyBytes += Buffer.byteLength(body);
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  responseBodyBytes += Buffer.byteLength(text);
  if (!response.ok) throw new Error(`Redis REST command failed (${response.status})`);
  const payload = JSON.parse(text);
  if (payload.error) throw new Error("Redis REST command returned an error");
  return payload.result;
}

function subscribe(channel) {
  const controller = new AbortController();
  const messages = [];
  let streamBytes = 0;
  let resolveAck;
  let resolveMessage;
  const ack = new Promise((resolve) => { resolveAck = resolve; });
  let nextMessage = new Promise((resolve) => { resolveMessage = resolve; });
  const running = (async () => {
    try {
      const response = await fetch(`${endpoint}/subscribe/${encodeURIComponent(channel)}`, {
        method: "POST",
        headers: { ...headers, Accept: "text/event-stream" },
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`Redis subscription failed (${response.status})`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        streamBytes += value.byteLength;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith(`data: subscribe,${channel},`)) resolveAck();
          const prefix = `data: message,${channel},`;
          if (!line.startsWith(prefix)) continue;
          try {
            const message = JSON.parse(line.slice(prefix.length));
            messages.push(message);
            resolveMessage(message);
            nextMessage = new Promise((resolve) => { resolveMessage = resolve; });
          } catch { /* Ignore non-message SSE events. */ }
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") throw error;
    }
  })();
  return {
    controller,
    messages,
    ack,
    running,
    next: () => nextMessage,
    get streamBytes() { return streamBytes; },
  };
}

const channel = `prototype:${randomUUID()}`;
const codeKey = `prototype:code:${randomUUID()}`;
const stateKey = `prototype:state:${randomUUID()}`;
const owners = await Promise.all([
  redis(["SET", codeKey, "instance-a", "NX", "EX", 180]),
  redis(["SET", codeKey, "instance-b", "NX", "EX", 180]),
]);
assert.equal(owners.filter((value) => value === "OK").length, 1, "atomic code reservation has one winner");
assert.equal(owners.filter((value) => value === null).length, 1, "the competing instance observes code-in-use");

const first = subscribe(channel);
await Promise.race([first.ack, delay(10_000).then(() => { throw new Error("Redis SSE subscription did not acknowledge"); })]);
const simulation = new NeonBreakerSimulation();
const publishSnapshot = "local current=redis.call('GET',KEYS[1]); local seq=tonumber(ARGV[1]); if current and tonumber(cjson.decode(current).seq)>=seq then return 0 end; local payload=ARGV[2]; redis.call('SET',KEYS[1],payload,'EX',180); return redis.call('PUBLISH',ARGV[3],payload)";
const started = performance.now();
const ticks = 200;
const pending = [];
for (let sequence = 0; sequence < ticks; sequence++) {
  const wait = started + sequence * 50 - performance.now();
  if (wait > 0) await delay(wait);
  simulation.step(1 / 30);
  const snapshot = JSON.stringify({ sequence, gameState: simulation.snapshot() });
  pending.push(redis(["EVAL", publishSnapshot, "1", stateKey, String(sequence), snapshot, channel]));
}
await Promise.all(pending);
const durationSeconds = (performance.now() - started) / 1000;
await Promise.race([
  (async () => { while (first.messages.length < ticks) await delay(25); })(),
  delay(10_000).then(() => { throw new Error(`Only ${first.messages.length}/${ticks} snapshots reached the other instance`); }),
]);
assert.deepEqual(first.messages.map((message) => message.sequence), Array.from({ length: ticks }, (_, index) => index), "the remote subscriber receives ordered full snapshots");

first.controller.abort();
await first.running;
const restored = JSON.parse(await redis(["GET", stateKey]));
assert.equal(restored.sequence, ticks - 1, "a replacement instance reads the newest authoritative snapshot");
assert.deepEqual(restored.gameState.bricks, simulation.snapshot().bricks, "the restored game state includes the current brick rows");

const replacement = subscribe(channel);
await Promise.race([replacement.ack, delay(10_000).then(() => { throw new Error("Replacement subscriber did not acknowledge"); })]);
const finalSnapshot = JSON.stringify({ sequence: ticks, gameState: simulation.snapshot() });
await redis(["EVAL", publishSnapshot, "1", stateKey, String(ticks), finalSnapshot, channel]);
const resumedMessage = await Promise.race([
  replacement.next(),
  delay(10_000).then(() => { throw new Error("Replacement subscriber missed the next room update"); }),
]);
assert.equal(resumedMessage.sequence, ticks, "the replacement receives the next ordered state update");
replacement.controller.abort();
await replacement.running;

const measuredCommands = commands + 2; // Count each long-lived SUBSCRIBE request.
const measuredBytes = requestBodyBytes + responseBodyBytes + first.streamBytes + replacement.streamBytes;
const commandsPerRoomHour = measuredCommands / (durationSeconds / 3600);
console.log(JSON.stringify({
  result: "PASS",
  scratchDatabaseExpiresInHours: 72,
  atomicCodeRace: owners,
  orderedSnapshots: first.messages.length,
  restoredSequence: restored.sequence,
  measuredCommands,
  measuredSeconds: Number(durationSeconds.toFixed(2)),
  scheduledUpdatesPerSecond: Number((ticks / durationSeconds).toFixed(2)),
  measuredBodyAndStreamBytes: measuredBytes,
  singleSnapshotBytes: Buffer.byteLength(JSON.stringify(simulation.snapshot())),
  projectedRoomHoursAt500kCommands: Number((500_000 / commandsPerRoomHour).toFixed(2)),
  caveat: "Two local roles over Upstash REST/SSE; no Vercel two-instance deployment was tested.",
}));
