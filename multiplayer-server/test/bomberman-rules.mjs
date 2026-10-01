import test from 'node:test';
import assert from 'node:assert/strict';
import { BombermanSimulation } from '../src/bomberman-simulation.js';
const run=(s,n)=>{for(let i=0;i<n;i++)s.step();};
test('two ready humans start countdown; inputs expire and forged input is rejected',()=>{
 const s=new BombermanSimulation('ABC123');s.add('a');s.ready('a');run(s,10);assert.equal(s.phase,'lobby');
 s.add('b');s.ready('b');run(s,181);assert.equal(s.phase,'playing');
 assert.equal(s.input('a',{seq:1,x:100,y:0,bomb:false}),false);
 assert.equal(s.input('a',{seq:1,x:1,y:0,bomb:false}),true);assert.equal(s.input('a',{seq:1,x:-1,y:0,bomb:false}),false);
 assert.equal(s.players.get('a').ack,-1,'receipt does not acknowledge unprocessed movement');s.step();assert.equal(s.players.get('a').ack,1);
 run(s,30);const x=s.game.players[0].x;run(s,30);assert.equal(s.game.players[0].x,x);
});
test('disconnect neutralizes input without removing vulnerable character',()=>{
 const s=new BombermanSimulation();s.add('a');s.add('b');s.ready('a');s.ready('b');run(s,181);
 s.input('a',{seq:1,x:0,y:0,bomb:true});run(s,1);s.connected('a',false);run(s,150);
 assert.equal(s.game.players.find(p=>p.id==='a').alive,false);assert.equal(s.phase,'results');assert.equal(s.players.get('b').score,1);
 s.connected('a',true);assert.equal(s.players.get('a').connected,true);assert.equal(s.players.get('a').ack,1);
});
test('same-tick final eliminations draw and late players spectate',()=>{
 const s=new BombermanSimulation();s.add('a');s.add('b');s.ready('a');s.ready('b');run(s,181);s.add('c');
 assert.ok(!s.game.players.some(p=>p.id==='c'));s.game.players.forEach(p=>p.alive=false);s.step();assert.equal(s.winner,null);assert.ok([...s.players.values()].every(p=>p.score===0));
});

function playing(){const s=new BombermanSimulation('MATCH1');s.add('a');s.add('b');s.ready('a');s.ready('b');run(s,181);return s;}
test('first-to-three advances rounds automatically and ready rematch resets everything',()=>{
 const s=playing();const match=s.match;
 for(let round=1;round<=3;round++){
  assert.equal(s.phase,'playing');assert.equal(s.round,round);
  const a=s.game.players.find(p=>p.id==='a');a.capacity=5;a.range=8;a.speedLevel=3;a.speed=4.35;
  s.game.players.find(p=>p.id==='b').alive=false;s.step();assert.equal(s.players.get('a').score,round);
  if(round<3){assert.equal(s.phase,'results');run(s,180);assert.equal(s.phase,'countdown');
   assert.equal(s.game.players[0].capacity,1);assert.equal(s.game.players[0].range,2);assert.equal(s.game.players[0].speedLevel,0);assert.equal(s.game.bombs.length,0);run(s,180);}
 }
 assert.equal(s.phase,'matchResults');assert.equal(s.matchWinner,'a');run(s,300);assert.equal(s.phase,'matchResults');
 s.rematch('a');s.step();assert.equal(s.phase,'matchResults');s.rematch('b');s.step();
 assert.equal(s.phase,'countdown');assert.equal(s.match,match+1);assert.equal(s.round,1);
 assert.ok([...s.players.values()].every(p=>p.score===0&&!p.ready&&p.ack===-1));
 assert.equal(s.game.bombs.length,0);assert.equal(s.game.blasts.length,0);assert.equal(s.game.powerups.length,0);assert.equal(s.inputs.size,0);assert.equal(s.received.size,0);
});
test('two-minute timeout draws without a single survivor and awards no score',()=>{
 const s=playing();assert.equal(s.until-s.clock,7200);
 // Isolate the timer from the separately tested crushing mechanic.
 s.game.waves=[];s.clock=s.until-1;s.step();assert.equal(s.phase,'results');assert.equal(s.winner,null);
 assert.ok([...s.players.values()].every(p=>p.score===0));run(s,180);assert.equal(s.phase,'countdown');
});
test('simultaneous blast eliminations draw and late joins enter only the next round',()=>{
 const s=playing();s.add('c');assert.ok(!s.game.players.some(p=>p.id==='c'));
 s.game.board.fill(0);s.game.players[0].x=3.5;s.game.players[0].y=3.5;s.game.players[1].x=4.5;s.game.players[1].y=3.5;
 s.input('a',{seq:1,x:0,y:0,bomb:true});s.step();s.game.bombs[0].deadline=s.game.tick+1;s.step();
 assert.equal(s.phase,'results');assert.equal(s.winner,null);assert.ok([...s.players.values()].every(p=>p.score===0));
 run(s,180);assert.equal(s.phase,'countdown');assert.ok(s.game.players.some(p=>p.id==='c'));
});
test('one remaining connection returns to lobby after round resolution',()=>{
 const s=playing();s.connected('b',false);s.game.players.find(p=>p.id==='b').alive=false;s.step();
 assert.equal(s.phase,'results');run(s,180);assert.equal(s.phase,'lobby');assert.ok([...s.players.values()].every(p=>!p.ready));
});
test('snapshot hides unrevealed items and inputs cannot grant upgrades or victory',()=>{
 const s=playing();const snapshot=s.snapshot();assert.equal(snapshot.hidden,undefined);assert.equal(snapshot.pendingPowerups,undefined);assert.equal(snapshot.waves,undefined);
 s.rematch('a');assert.equal(s.players.get('a').ready,false);
 assert.equal(s.input('a',{seq:1,x:0,y:0,bomb:false,capacity:99,range:99,score:3,matchWinner:'a'}),true);s.step();
 assert.equal(s.game.players[0].capacity,1);assert.equal(s.game.players[0].range,2);assert.equal(s.players.get('a').score,0);assert.equal(s.matchWinner,null);
});
