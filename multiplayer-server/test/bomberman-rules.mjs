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
