import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@colyseus/sdk';
import {consumeReservedSeat} from '../packages/client/seat-reservation.js';

async function fixture(run) {
  const factory=Client.prototype.createRoom,consume=Client.prototype.consumeSeatReservation;
  const listeners=new Set();let closes=0,requests=0;
  const leave=fn=>listeners.add(fn);leave.remove=fn=>listeners.delete(fn);
  const room={reconnection:{},onLeave:leave,connection:{close(){closes++;for(const fn of listeners)fn();}}};
  Client.prototype.createRoom=()=>room;
  Client.prototype.consumeSeatReservation=function(){requests++;this.createRoom('private');return new Promise(()=>{});};
  try{await run({room,fireClose:()=>{for(const fn of listeners)fn();},stats:()=>({closes,requests,listeners:listeners.size})});}
  finally{Client.prototype.createRoom=factory;Client.prototype.consumeSeatReservation=consume;}
}
test('pre-join socket close rejects promptly and cleans the original attempt',()=>fixture(async({fireClose,stats})=>{
  const result=consumeReservedSeat('https://example.invalid',{sessionId:'original'},{timeoutMs:1000});
  fireClose();await assert.rejects(result,/closed before/);
  assert.deepEqual(stats(),{closes:1,requests:1,listeners:0});
}));
test('silent handshake timeout closes its socket without reserving another seat',()=>fixture(async({stats})=>{
  await assert.rejects(consumeReservedSeat('https://example.invalid',{sessionId:'original'},{timeoutMs:30}),/timed out/);
  assert.deepEqual(stats(),{closes:1,requests:1,listeners:0});
}));
test('leaving during an unfinished handshake aborts immediately and detaches listeners',()=>fixture(async({stats})=>{
  const controller=new AbortController();
  const result=consumeReservedSeat('https://example.invalid',{sessionId:'original'},{signal:controller.signal,timeoutMs:1000});
  controller.abort();await assert.rejects(result,/canceled/);
  assert.deepEqual(stats(),{closes:1,requests:1,listeners:0});
}));
