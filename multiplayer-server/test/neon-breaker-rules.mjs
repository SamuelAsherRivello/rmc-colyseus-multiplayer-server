import test from 'node:test';
import assert from 'node:assert/strict';
import { NeonBreakerSimulation } from '../src/neon-breaker-simulation.js';
test('Neon Breaker bounds paddle input and launches only from waiting state',()=>{const s=new NeonBreakerSimulation();assert.equal(s.input(0,{x:1.2}),false);assert.equal(s.input(0,{x:.5}),true);s.step();assert.ok(s.snapshot().paddles[0].x<=140);assert.equal(s.launch(1),true);assert.equal(s.launch(0),false);});
test('brick destruction scores, waves advance, and terminal match can restart',()=>{const s=new NeonBreakerSimulation();s.bricks=[{id:0,x:100,y:100,w:24,h:14,hp:1,maxHp:1,kind:'normal'}];s.balls=[{id:0,x:112,y:115,vx:0,vy:-120,r:4,attached:false}];s.step(1/30);assert.equal(s.score,10);assert.equal(s.wave,1);for(let i=0;i<3;i++){s.bricks=[];s.step();}assert.equal(s.outcome,'victory');s.restart();assert.equal(s.lives,3);assert.equal(s.score,0);assert.equal(s.outcome,'playing');});
test('last ball consumes one shared life and waits for launch',()=>{const s=new NeonBreakerSimulation();s.balls=[{id:0,x:50,y:590,vx:0,vy:1,r:4,attached:false}];s.step();assert.equal(s.lives,2);assert.equal(s.balls[0].attached,true);assert.equal(s.launch(1),true);});

test('wide paddle powerup affects both paddles and multiball remains capped',()=>{const s=new NeonBreakerSimulation();s.effects.wideUntil=0;s.drops=[{id:1,x:80,y:540,type:'wide'}];s.step(1/1000);s.step(1/1000);assert.ok(s.snapshot().paddles.every(p=>p.width===54));s.balls=[{id:0,x:100,y:200,vx:90,vy:-150,r:4,attached:false},{id:1,x:120,y:200,vx:-90,vy:-150,r:4,attached:false},{id:2,x:140,y:200,vx:0,vy:-175,r:4,attached:false}];s.drops=[{id:2,x:80,y:540,type:'multiball'}];s.step(1/1000);assert.equal(s.snapshot().balls.length,3);});

