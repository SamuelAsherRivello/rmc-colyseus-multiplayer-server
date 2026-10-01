import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {MultiplayerClient} from '../packages/client/index.js';
const endpoint=process.env.SERVER_URL||'http://127.0.0.1:2686', clients=[];
async function until(fn,message,timeout=15000){const end=Date.now()+timeout;while(!fn()){if(Date.now()>end)throw Error(message);await delay(30);}}
async function join(game='neon-breaker-duo'){const c=new MultiplayerClient(endpoint,game);clients.push(c);void c.connect();await until(()=>['connected','full','error'].includes(c.state.status),'join: '+c.state.error);return c;}
test('Neon Breaker synchronizes actions, admits two, snapshots late joins, frees seats, and isolates games',{timeout:90000},async()=>{let server;try{
 if(!process.env.SERVER_URL){server=spawn(process.execPath,['--import','tsx','server.ts'],{env:{...process.env,PORT:'2686'},stdio:'ignore',windowsHide:true});let ready=false;for(let i=0;i<100;i++){try{ready=(await fetch(endpoint+'/api/health')).ok;}catch{}if(ready)break;await delay(100);}assert(ready);}
 const health=await (await fetch(endpoint+'/api/health')).json();assert.ok(health.games.includes('neon-breaker-duo'));const a=await join();await until(()=>a.state.gameState?.paddles?.length===2,'initial snapshot');assert.equal(a.state.gameState.lives,3);const initial=a.state.gameState.paddles[0].x;a.send('input',{x:.9});await until(()=>a.state.gameState.paddles[0].x>initial+20,'input sync');a.send('launch');await until(()=>a.state.gameState.balls.some(ball=>!ball.attached),'launch sync');const b=await join();assert.equal(a.state.roomId,b.state.roomId);await until(()=>b.state.gameState.balls.some(ball=>!ball.attached),'late join snapshot');assert.ok(Math.abs(b.state.gameState.paddles[0].x-a.state.gameState.paddles[0].x)<10,'late snapshot paddle position');const c=await join();assert.equal(c.state.status,'full');const isolated=await join('sumo-battle');assert.notEqual(isolated.state.roomId,a.state.roomId);assert.equal(isolated.state.gameState?.paddles,undefined);a.disconnect();await until(()=>b.state.players.length===1&&Math.abs(b.state.gameState.paddles[0].x-80)<1,'departure and centered lane');const retry=await join();assert.equal(retry.state.status,'connected');assert.equal(retry.state.roomId,b.state.roomId);
 }finally{clients.forEach(c=>c.disconnect());await delay(300);server?.kill();}});





