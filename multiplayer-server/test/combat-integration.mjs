import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {MultiplayerClient} from '../packages/client/index.js';
const port=23000+(process.pid%17000),endpoint=process.env.SERVER_URL||`http://127.0.0.1:${port}`;
const clients=[];
async function until(fn,label,ms=20000){const end=Date.now()+ms;while(!fn()){if(Date.now()>end)throw Error(label);await delay(30);}}
async function join(options){const c=new MultiplayerClient(endpoint,'combat',options);clients.push(c);void c.connect();await until(()=>['connected','full','error'].includes(c.state.status),'Combat admission: '+JSON.stringify(c.state));return c;}
test('Combat real private admission, authoritative motion/fire, populations, recovery races and isolation',{timeout:95000},async()=>{
 let server;
 try{
  if(!process.env.SERVER_URL){server=spawn(process.execPath,['--import','tsx','server.ts'],{env:{...process.env,PORT:String(port)},stdio:'ignore',windowsHide:true});let ok=false;for(let i=0;i<100;i++){try{ok=(await fetch(endpoint+'/api/health')).ok;}catch{}if(ok)break;await delay(100);}assert.ok(ok,'local server started');}
  assert.ok((await (await fetch(endpoint+'/api/health')).json()).games.includes('combat'));
  const a=await join({create:true});assert.equal(a.state.status,'connected');const code=a.state.code;assert.match(code,/^[A-Z0-9]{4}$/);
  assert.equal(a.state.gameState.protocol,1);assert.equal(a.state.gameState.tanks.length,4);assert.equal(a.state.gameState.tanks.filter(t=>t.cpu).length,3);
  const b=await join({code});assert.equal(b.state.roomId,a.state.roomId);await until(()=>a.state.gameState.people.length===2,'two people');assert.equal(a.state.gameState.tanks.filter(t=>t.cpu).length,2);
  b.send('options',{mode:'ricochet',difficulty:'high',arena:'switchback'});await delay(120);assert.equal(a.state.gameState.mode,'classic');
  a.send('options',{mode:'ricochet',difficulty:'high',arena:'switchback'});await until(()=>b.state.gameState.mode==='ricochet','host options');assert.equal(b.state.gameState.arena,'switchback');
  a.send('ready');await delay(100);assert.equal(b.state.gameState.phase,'lobby');b.send('ready');await until(()=>a.state.gameState.phase==='playing','start countdown');
  const start={...a.state.gameState.tanks[0]};let seq=0;const controls=setInterval(()=>a.send('input',{seq:++seq,drive:1,turn:0,fire:true}),50);
  try{await until(()=>b.state.gameState.tanks[0].ack>=2&&b.state.gameState.tanks[0].cooldown>0,'authoritative controls and shots');assert.ok(Math.hypot(b.state.gameState.tanks[0].x-start.x,b.state.gameState.tanks[0].y-start.y)>0);}finally{clearInterval(controls);a.send('input',{seq:++seq,drive:0,turn:0,fire:false});}
  const c=await join({code});await until(()=>a.state.gameState.people.length===3,'late arrival');assert.equal(c.state.gameState.people.find(p=>p.id===c.state.sessionId).waiting,true);assert.equal(c.state.gameState.tanks.filter(t=>t.cpu).length,2);
  const d=await join({code});assert.equal(d.state.roomId,a.state.roomId);const full=await join({code});assert.equal(full.state.status,'full');
  const id=a.state.sessionId,slot=a.state.gameState.people.find(p=>p.id===id).slot;
  a.room.connection.close();await until(()=>a.state.status==='reconnecting','drop');await until(()=>a.state.status==='connected'&&a.state.sessionId===id,'same session recovery');assert.equal(a.state.gameState.people.find(p=>p.id===id).slot,slot);
  const lost=d.state.sessionId;d.room.reconnection.enabled=false;d.stopped=true;d.room.connection.close();await until(()=>b.state.gameState.people.some(p=>p.id===lost&&!p.connected),'CPU takeover');
  const protectedJoin=await join({code});assert.equal(protectedJoin.state.status,'full','code stranger cannot steal recovery reservation');
  await until(()=>!b.state.gameState.people.some(p=>p.id===lost),'expired recovery removes reservation',22000);const replacement=await join({code});assert.equal(replacement.state.status,'connected');assert.equal(replacement.state.gameState.tanks.length,4);
  const other=await join({create:true,code});assert.equal(other.state.status,'error','duplicate code rejected');
  const independent=await join({create:true});assert.notEqual(independent.state.roomId,b.state.roomId);
  const invalid=await join({code:'BAD'});assert.equal(invalid.state.status,'error');
  const wrong=await fetch(endpoint+'/api/join/gungeon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});assert.equal(wrong.status,404,'cross-game code isolation');
  console.log(JSON.stringify({combatProbe:'passed',endpoint,room:b.state.roomId,protocol:b.state.gameState.protocol,tanks:b.state.gameState.tanks.length,tick:b.state.gameState.tick,mode:b.state.gameState.mode}));
 }finally{clients.forEach(c=>c.disconnect());await delay(250);server?.kill();}
});

