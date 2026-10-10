import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { MultiplayerClient } from '../multiplayer-server/packages/client/index.js';
const endpoint = process.env.SERVER_URL;
if (!endpoint) throw Error('SERVER_URL required');
const seconds = Number(process.env.LONG_SESSION_SECONDS || 240);
const a = new MultiplayerClient(endpoint,'space-invaders',{create:true});
let b;
const until = async fn => { const end=Date.now()+20000; while(!fn()) { if(Date.now()>end) throw Error('Relay timeout'); await delay(50); } };
try {
  void a.connect(); await until(()=>a.state.status==='connected');
  b = new MultiplayerClient(endpoint,'space-invaders',{code:a.state.code});
  void b.connect(); await until(()=>b.state.status==='connected');
  a.send('hostReady',{epoch:a.state.epoch}); await until(()=>a.state.ready);
  const start=Date.now(); let tick=0;
  while(Date.now()-start < seconds*1000) {
    assert.equal(a.state.status,'connected'); assert.equal(b.state.status,'connected');
    a.send('hostSnapshot',{protocolVersion:1,epoch:a.state.epoch,runId:a.state.runId,tick:++tick,lastAppliedRelaySeq:a.state.lastAction?.sequence ?? 0,random:19,state:{wave:2,lives:[2,3],tick}});
    await delay(1000);
    assert.ok(b.state.transfer?.state?.tick >= tick-2,'peer checkpoint stalled');
  }
  a.disconnect(); await until(()=>b.state.hostId===b.state.sessionId);
  assert.equal(b.state.transfer.state.state.wave,2);
  b.send('hostReady',{epoch:b.state.epoch}); await until(()=>b.state.ready);
  console.log(JSON.stringify({result:'PASS',game:'space-invaders',seconds,checkpointTick:b.state.transfer.state.tick,migration:true}));
} finally { a.disconnect(); b?.disconnect(); }
