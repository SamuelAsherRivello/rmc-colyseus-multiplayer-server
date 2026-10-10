import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { connectSharedAsteroids } from "../multiplayer-server/packages/client/asteroids-shared-connection.js";
import {
  createWorld,
  setConnected,
  snapshot,
  applyInput,
} from "../multiplayer-server/packages/client/asteroids-rules.js";

export async function verifyAsteroidsSession(endpoint, seconds = 8) {
  const base = endpoint.replace(/\/$/, ""),
    world = createWorld(6026),
    connections = [];
  let serial = 0,
    latest,
    ended,
    renewals = 0,
    frames = 0,
    previousTick = -1,
    failure;
  async function admission(body, expected = 200) {
    const response = await fetch(base + "/api/join/asteroids-coop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    assert.equal(
      response.status,
      expected,
      data.error || "Unexpected admission response",
    );
    return data;
  }
  async function until(fn, label, ms = 15000) {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      if (failure) throw failure;
      if (fn()) return;
      await delay(40);
    }
    throw new Error(label);
  }
  const hostData = await admission({ create: true });
  assert.equal(hostData.transport, "asteroids-shared-v1");
  const host = await connectSharedAsteroids(base, hostData, {
    onPresence: (p) => {
      if (p.serial === serial) return;
      serial = p.serial;
      for (const old of world.players) setConnected(world, old.id, false);
      for (const member of p.players)
        setConnected(world, member.id, true, member.number);
    },
    onInput: (input) => applyInput(world, input.id, input),
    onEnded: (reason) => {
      ended = reason;
    },
    onStatus: (status) => {
      if (status.startsWith("Refreshing")) renewals++;
    },
  });
  connections.push(host);
  world.wave = 3;
  world.asteroids[0].hp = 2;
  world.asteroids[0].maxHp = 3;
  const publish = setInterval(() => {
    world.tick++;
    world.time += 0.05;
    host.publish(snapshot(world, serial));
  }, 50);
  const guestData = await admission({ code: hostData.code });
  function callbacks() {
    return {
      onState: (frame) => {
        try {
          if (frame.membership < serial) return;
          assert.equal(frame.wave, 3);
          assert.equal(frame.asteroids[0][6], 2);
          assert.ok(frame.tick >= previousTick);
          previousTick = frame.tick;
          latest = frame;
          frames++;
        } catch (error) {
          failure = error;
        }
      },
      onEnded: (reason) => {
        ended = reason;
      },
      onStatus: (status) => {
        if (status.startsWith("Refreshing")) renewals++;
      },
    };
  }
  let guest = await connectSharedAsteroids(base, guestData, callbacks());
  connections.push(guest);
  try {
    await until(
      () => latest?.players.length === 2,
      "Two-client damaged baseline missing",
    );
    guest.input({
      runId: 1,
      seq: Date.now(),
      turn: 1,
      thrust: true,
      fire: false,
    });
    await until(
      () => world.players.find((p) => p.id === guestData.id)?.ack > 0,
      "Guest input did not reach creator",
    );
    world.players.find((p) => p.id === guestData.id).lives = 0;
    await until(
      () => latest?.players.find((p) => p[0] === guestData.id)?.[2] === 0,
      "Eliminated guest state missing",
    );
    guest.leave();
    await until(
      () => world.players.filter((p) => p.connected).length === 1,
      "Hot drop did not free the seat",
    );
    const recovered = await admission({
      code: guestData.code,
      identityToken: guestData.token,
    });
    assert.equal(recovered.id, guestData.id);
    guest = await connectSharedAsteroids(base, recovered, callbacks());
    connections.push(guest);
    await until(
      () =>
        latest?.players.length === 2 &&
        latest.players.find((p) => p[0] === guestData.id)?.[2] === 0,
      "Guest recovery reset lives",
    );
    const start = Date.now();
    let lastLog = start;
    while (Date.now() - start < seconds * 1000) {
      if (failure) throw failure;
      if (ended) throw new Error(ended);
      assert.ok(Date.now() - lastLog < 65000);
      await delay(500);
      if (Date.now() - lastLog >= 30000) {
        console.log(
          JSON.stringify({
            asteroids: "continuity",
            elapsedSeconds: Math.floor((Date.now() - start) / 1000),
            tick: latest?.tick,
            frames,
            renewals,
          }),
        );
        lastLog = Date.now();
      }
    }
    assert.ok(frames > seconds * 3, "Insufficient live snapshots");
    if (seconds >= 600)
      assert.ok(
        renewals >= 4,
        "Two planned connection windows were not exercised for both participants",
      );
    assert.equal(latest.players.find((p) => p[0] === guestData.id)[2], 0);
    assert.equal(latest.wave, 3);
    assert.equal(latest.asteroids[0][6], 2);
    host.leave();
    await until(() => ended, "Host closure was not terminal");
    await admission({ code: hostData.code }, 404);
    const result = {
      asteroids: "passed",
      endpoint: base,
      durationSeconds: seconds,
      frames,
      renewals,
      guestRecovery: true,
      hostLossTerminal: true,
    };
    console.log(JSON.stringify(result));
    return result;
  } finally {
    clearInterval(publish);
    for (const c of connections) c.leave();
  }
}
if (process.argv[1]?.endsWith("asteroids-live-session.mjs"))
  await verifyAsteroidsSession(
    process.env.SERVER_URL,
    Number(process.env.LONG_SESSION_SECONDS || 600),
  );
