import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { MultiplayerClient } from '../packages/client/index.js';

const endpoint = process.env.SERVER_URL || 'http://127.0.0.1:2696';
const clients = [];
const until = async (predicate, label, ms = 15000) => {
  const end = Date.now() + ms;
  while (!predicate()) { if (Date.now() > end) throw Error(label); await delay(25); }
};
async function join(options) {
  const c = new MultiplayerClient(endpoint, 'space-invaders', options);
  clients.push(c); void c.connect();
  await until(() => ['connected', 'full', 'error'].includes(c.state.status), 'join '+c.state.error);
  return c;
}
const ready = async c => {
  c.send('hostReady', { epoch: c.state.epoch });
  await until(() => c.state.ready, 'host readiness');
};
const checkpoint = (c, seq, state = { lives: [0, 3], wave: 2, random: 982, aliens: [{ id: 8, hp: 2 }], timer: 120 }) => ({
  protocolVersion: 1, epoch: c.state.epoch, runId: c.state.runId, tick: 180,
  lastAppliedRelaySeq: seq, random: 982, state,
});

test('Space Invaders private relay: recovery, capacity, isolation, journal and authority', { timeout: 100000 }, async () => {
  let server;
  try {
    if (!process.env.SERVER_URL) {
      server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], { env: { ...process.env, PORT: '2696' }, stdio: 'ignore', windowsHide: true });
      await until(async () => false, '', 1).catch(() => {});
      for (let i=0;i<100;i++) { try { if ((await fetch(endpoint+'/api/health')).ok) break; } catch {} await delay(100); }
    }
    const a = await join({ create: true }); assert.equal(a.state.status, 'connected');
    await ready(a);
    const b = await join({ code: a.state.code.toLowerCase() });
    await until(() => a.state.lastAction?.type === 'membership', 'join journal');
    assert.equal(a.state.roomId, b.state.roomId);
    assert.equal(a.state.hostId, a.state.sessionId);
    assert.equal(a.state.players.length, 2);
    const seat = b.state.players.find(p => p.sessionId === b.state.sessionId).id;
    const token = b.state.reconnectToken;
    const seq = a.state.lastAction.sequence;
    a.send('hostSnapshot', checkpoint(a,seq));
    await until(() => b.state.transfer?.state?.tick === 180, 'checkpoint');
    const committed = b.state.transfer.sequence;
    b.send('hostSnapshot', checkpoint(b,seq,{ forged: true }));
    a.send('hostSnapshot', { ...checkpoint(a,seq), lastAppliedRelaySeq: 999999 });
    a.send('hostSnapshot', checkpoint(a,seq,{ tooLarge: 'x'.repeat(12500) }));
    await delay(150); assert.equal(b.state.transfer.sequence, committed);
    const authority = { epoch: b.state.epoch, runId: b.state.runId };
    b.send('action', { ...authority, sequence: 1, type: 'input', payload: { move: 1, fire: true }, sender: 'spoofed' });
    await until(() => a.state.lastAction?.type === 'input', 'ordered input');
    assert.equal(a.state.lastAction.sender, seat);
    const pendingSeq = a.state.lastAction.sequence;
    b.send('action', { ...authority, sequence: 1, type: 'input', payload: { move: -1, fire: false } });
    b.send('action', { ...authority, sequence: 2, type: 'input', payload: { move: 99, fire: false } });
    await delay(150); assert.equal(a.state.lastAction.sequence, pendingSeq);
    const c = await join({ code: a.state.code }), d = await join({ code: a.state.code });
    assert.equal(c.state.status, 'connected'); assert.equal(d.state.status, 'connected');
    assert.equal((await join({ code: a.state.code })).state.status, 'full');
    const other = await join({ create: true }); assert.notEqual(other.state.roomId, a.state.roomId);
    const bad = await join({ code: a.state.code, reconnectToken: 'invalid' }); assert.equal(bad.state.status, 'error');
    const oldEpoch = a.state.epoch;
    a.disconnect();
    await until(() => b.state.hostId === b.state.sessionId && b.state.epoch > oldEpoch, 'host migration');
    assert.deepEqual(b.state.transfer.state.state.lives, [0,3], 'eliminated spectator state survives');
    assert.equal(b.state.transfer.state.state.wave, 2);
    assert.equal(b.state.transfer.state.random, 982);
    assert.ok(b.state.journal.some(action => action.sequence === pendingSeq), 'unacknowledged input preserved');
    await ready(b);
    b.disconnect(); await delay(200);
    const recovered = await join({ code: c.state.code, reconnectToken: token });
    assert.equal(recovered.state.status, 'connected');
    assert.equal(recovered.state.players.find(p=>p.sessionId===recovered.state.sessionId).id, seat);
    assert.deepEqual(recovered.state.transfer.state.state.lives, [0,3]);
    await until(() => c.state.hostId === c.state.sessionId, 'next successor');
    const send = c.room.send.bind(c.room);
    c.room.send = (type, payload) => { if(type !== 'heartbeat') send(type,payload); };
    const before = Date.now();
    await until(() => d.state.hostId === d.state.sessionId, 'silent host migration', 6000);
    assert.ok(Date.now()-before < 5000, 'silent migration exceeded target');
    await ready(d);
    c.room.send = send; send('heartbeat');
    await delay(200);
    assert.equal(d.state.hostId,d.state.sessionId,'old host must return behind the successor');
    const last = d.state.transfer.sequence;
    c.send('hostSnapshot',checkpoint(c,seq));
    await delay(100); assert.equal(d.state.transfer.sequence,last,'stale host published');
  } finally { for (const c of clients) c.disconnect(); await delay(300); server?.kill(); }
});
