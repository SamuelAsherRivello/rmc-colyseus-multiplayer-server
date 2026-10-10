/** Original Asteroids cooperative simulation. Browser-safe; seconds and logical pixels. */
export const TUNING = Object.freeze({
  id: "asteroids-v1",
  width: 640,
  height: 360,
  tick: 1 / 60,
  inputExpiry: 0.3,
  fireDelay: 0.18,
  bulletLife: 0.85,
  bulletSpeed: 310,
  thrust: 145,
  turnSpeed: 4.2,
  maxSpeed: 145,
  drag: 0.24,
  respawn: 2,
  protection: 2,
  intermission: 3,
  restart: 5,
  maxAsteroids: 72,
  maxBullets: 32,
  maxLedgers: 128,
});
export const wrap = (n, size) => ((n % size) + size) % size;
export const delta = (a, b, size) => wrap(b - a + size / 2, size) - size / 2;
export function overlaps(a, b, r) {
  return Math.hypot(delta(a.x, b.x, 640), delta(a.y, b.y, 360)) < r;
}
function random(s) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
const round = (n) => Math.round(n * 100) / 100;
export function waveTuning(w, players) {
  return {
    roots: w === 1 ? 3 : Math.min(8, 3 + Math.floor((w - 1) / 2) + players - 1),
    hp: Math.min(5, 1 + Math.floor(w / 2)),
    depth: w < 5 ? 1 : 2,
    threeChance: Math.min(0.6, 0.1 * (w - 1)),
    speed: Math.min(85, 22 + w * 2),
  };
}
export function createWorld(seed = 12345) {
  const s = {
    version: 1,
    runId: 1,
    tick: 0,
    time: 0,
    seed: seed >>> 0,
    nextId: 1,
    wave: 1,
    phase: "playing",
    until: 0,
    roster: 1,
    players: [],
    asteroids: [],
    bullets: [],
    events: [],
  };
  startWave(s);
  return s;
}
export function setConnected(s, id, connected, number = 1) {
  let p = s.players.find((p) => p.id === id);
  if (!p && connected) {
    if (s.players.length >= TUNING.maxLedgers)
      throw new Error("Session identity limit reached");
    p = {
      id,
      number,
      connected: true,
      lives: 3,
      score: 0,
      x: 320,
      y: 180,
      vx: 0,
      vy: 0,
      angle: Math.PI * 1.5,
      respawn: 0,
      protectedUntil: s.time + 2,
      fireAt: 0,
      ack: 0,
      input: { turn: 0, thrust: false, fire: false },
      inputAt: -1,
    };
    s.players.push(p);
    safeSpawn(s, p);
  }
  if (p) {
    p.connected = connected;
    p.number = number;
    p.input = { turn: 0, thrust: false, fire: false };
    p.inputAt = -1;
  }
  return p;
}
export function applyInput(s, id, input) {
  const p = s.players.find((p) => p.id === id);
  if (
    !p?.connected ||
    !Number.isSafeInteger(input?.seq) ||
    input.seq <= p.ack ||
    ![-1, 0, 1].includes(input.turn) ||
    typeof input.thrust !== "boolean" ||
    typeof input.fire !== "boolean" ||
    input.runId !== s.runId
  )
    return false;
  p.ack = input.seq;
  p.input = { turn: input.turn, thrust: input.thrust, fire: input.fire };
  p.inputAt = s.time;
  return true;
}
function safeSpawn(s, p) {
  let best = { x: 320, y: 180 },
    distance = -1;
  for (let i = 0; i < 24; i++) {
    const pos = { x: 40 + random(s) * 560, y: 40 + random(s) * 280 };
    const d = Math.min(
      999,
      ...s.asteroids.map(
        (a) =>
          Math.hypot(delta(pos.x, a.x, 640), delta(pos.y, a.y, 360)) - a.radius,
      ),
    );
    if (d > distance) {
      best = pos;
      distance = d;
    }
  }
  Object.assign(p, best, {
    vx: 0,
    vy: 0,
    angle: Math.PI * 1.5,
    protectedUntil: s.time + TUNING.protection,
  });
}
function asteroid(s, x, y, radius, hp, depth, speed) {
  const angle = random(s) * Math.PI * 2;
  return {
    id: s.nextId++,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    hp,
    maxHp: hp,
    depth,
    shape: Math.floor(random(s) * 4),
  };
}
export function startWave(s) {
  const count = s.players.filter((p) => p.connected && p.lives > 0).length || 1;
  s.roster = count;
  const t = waveTuning(s.wave, count);
  s.asteroids = [];
  s.bullets = [];
  for (let i = 0; i < t.roots; i++) {
    const a = asteroid(
      s,
      wrap(70 + i * 187, 640),
      i % 2 ? 310 : 45,
      22,
      t.hp,
      t.depth,
      t.speed,
    );
    s.asteroids.push(a);
  }
  s.phase = "playing";
}
export function hitAsteroid(s, id) {
  const index = s.asteroids.findIndex((a) => a.id === id);
  if (index < 0) return false;
  const a = s.asteroids[index];
  a.hp--;
  s.events.push({ type: "hit", x: a.x, y: a.y });
  if (a.hp > 0) return true;
  s.asteroids.splice(index, 1);
  s.events.push({ type: "fracture", x: a.x, y: a.y });
  if (a.depth > 0) {
    const t = waveTuning(s.wave, s.roster);
    const count = s.wave === 1 ? 2 : random(s) < t.threeChance ? 3 : 2;
    for (let i = 0; i < count; i++)
      s.asteroids.push(
        asteroid(
          s,
          a.x,
          a.y,
          a.radius * 0.57,
          Math.min(3, Math.max(1, Math.ceil(a.maxHp / 2))),
          a.depth - 1,
          Math.min(110, t.speed * 1.4),
        ),
      );
  }
  return true;
}
export function loseLife(s, p) {
  if (
    !p.connected ||
    p.lives <= 0 ||
    p.respawn > s.time ||
    p.protectedUntil > s.time
  )
    return false;
  p.lives--;
  p.respawn = p.lives > 0 ? s.time + TUNING.respawn : 0;
  p.vx = p.vy = 0;
  p.input = { turn: 0, thrust: false, fire: false };
  s.events.push({ type: "death", x: p.x, y: p.y });
  return true;
}
function reset(s) {
  s.runId++;
  s.wave = 1;
  s.bullets = [];
  for (const p of s.players) {
    p.lives = 3;
    p.score = 0;
    p.ack = 0;
    p.respawn = 0;
    p.fireAt = 0;
    p.inputAt = -1;
    p.input = { turn: 0, thrust: false, fire: false };
  }
  startWave(s);
  for (const p of s.players) if (p.connected) safeSpawn(s, p);
}
function move(o, dt) {
  o.x = wrap(o.x + o.vx * dt, 640);
  o.y = wrap(o.y + o.vy * dt, 360);
}
/** Movement-only prediction: never changes lives, damage, shots or wave outcomes. */
export function predictShip(p, input, dt = TUNING.tick) {
  p.angle = wrap(p.angle + input.turn * TUNING.turnSpeed * dt, Math.PI * 2);
  if (input.thrust) {
    p.vx += Math.cos(p.angle) * TUNING.thrust * dt;
    p.vy += Math.sin(p.angle) * TUNING.thrust * dt;
  }
  const speed = Math.hypot(p.vx, p.vy),
    scale = speed > TUNING.maxSpeed ? TUNING.maxSpeed / speed : 1;
  p.vx *= scale * Math.exp(-TUNING.drag * dt);
  p.vy *= scale * Math.exp(-TUNING.drag * dt);
  move(p, dt);
}
export function stepWorld(s, dt = TUNING.tick) {
  if (!(dt > 0 && dt <= 0.1)) throw new Error("Invalid timestep");
  s.tick++;
  s.time += dt;
  s.events = [];
  if (s.phase === "defeat") {
    if (s.time >= s.until) reset(s);
    return;
  }
  for (const p of s.players) {
    if (!p.connected || p.lives <= 0) continue;
    if (p.respawn) {
      if (s.time < p.respawn) continue;
      p.respawn = 0;
      safeSpawn(s, p);
    }
    const input =
      s.time - p.inputAt <= TUNING.inputExpiry
        ? p.input
        : { turn: 0, thrust: false, fire: false };
    predictShip(p, input, dt);
    if (
      input.fire &&
      s.time >= p.fireAt &&
      s.phase === "playing" &&
      s.bullets.length < TUNING.maxBullets
    ) {
      p.fireAt = s.time + TUNING.fireDelay;
      s.bullets.push({
        id: s.nextId++,
        owner: p.id,
        x: wrap(p.x + Math.cos(p.angle) * 11, 640),
        y: wrap(p.y + Math.sin(p.angle) * 11, 360),
        vx: p.vx + Math.cos(p.angle) * TUNING.bulletSpeed,
        vy: p.vy + Math.sin(p.angle) * TUNING.bulletSpeed,
        until: s.time + TUNING.bulletLife,
      });
      s.events.push({ type: "shot", x: p.x, y: p.y });
    }
  }
  if (s.phase === "intermission") {
    const active = s.players.filter((p) => p.connected);
    if (active.length && active.every((p) => p.lives <= 0)) {
      s.phase = "defeat";
      s.until = s.time + TUNING.restart;
    } else if (s.time >= s.until) {
      s.wave++;
      startWave(s);
    }
    return;
  }
  for (const a of s.asteroids) move(a, dt);
  for (const b of s.bullets) {
    move(b, dt);
    if (b.until <= s.time) continue;
    const a = s.asteroids.find((a) => overlaps(b, a, a.radius + 2));
    if (a) {
      b.until = 0;
      hitAsteroid(s, a.id);
      const p = s.players.find((p) => p.id === b.owner);
      if (p) p.score += a.hp <= 0 ? 100 : 10;
    }
  }
  s.bullets = s.bullets.filter((b) => b.until > s.time);
  for (const p of s.players)
    if (s.asteroids.some((a) => overlaps(p, a, a.radius + 6))) loseLife(s, p);
  const active = s.players.filter((p) => p.connected);
  if (active.length && active.every((p) => p.lives <= 0)) {
    s.phase = "defeat";
    s.until = s.time + TUNING.restart;
    s.bullets = [];
  } else if (s.asteroids.length === 0) {
    s.phase = "intermission";
    s.until = s.time + TUNING.intermission;
  }
}
/** Compact complete wire frame, with only connected ships; the host retains the full recovery ledger. */
export function snapshot(s, membership) {
  return {
    version: 1,
    runId: s.runId,
    tick: s.tick,
    time: round(s.time),
    wave: s.wave,
    phase: s.phase,
    until: round(s.until),
    membership,
    players: s.players
      .filter((p) => p.connected)
      .map((p) => [
        p.id,
        p.number,
        p.lives,
        p.score,
        round(p.x),
        round(p.y),
        round(p.vx),
        round(p.vy),
        round(p.angle),
        round(p.respawn),
        round(p.protectedUntil),
        p.ack,
      ]),
    asteroids: s.asteroids.map((a) => [
      a.id,
      round(a.x),
      round(a.y),
      round(a.vx),
      round(a.vy),
      round(a.radius),
      a.hp,
      a.maxHp,
      a.depth,
      a.shape,
    ]),
    bullets: s.bullets.map((b) => [
      b.id,
      b.owner,
      round(b.x),
      round(b.y),
      round(b.vx),
      round(b.vy),
      round(b.until),
    ]),
  };
}
