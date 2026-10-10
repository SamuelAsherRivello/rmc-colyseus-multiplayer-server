import test from 'node:test';
import assert from 'node:assert/strict';
import {TetrisDuelRoom} from '../src/tetris-duel-room.ts';
test('room rate budget is seat-scoped and rejects excess messages until the window renews',()=>{
  const room=new TetrisDuelRoom(),a={sessionId:'a'},b={sessionId:'b'};
  for(let i=0;i<60;i++)assert.equal(room.accept(a),true);
  assert.equal(room.accept(a),false);assert.equal(room.accept(b),true);
  room.limits.get('a').time-=1000;assert.equal(room.accept(a),true);
});
test('snapshot envelope cannot leak opponent cells through presence players or local warnings',()=>{
  const room=new TetrisDuelRoom();room.simulation.add('a');const b=room.simulation.add('b');b.board[23][0]='PRIVATE';b.queue=['SECRET'];
  let payload;room.sendSnapshot({sessionId:'a',send:(type,data)=>{assert.equal(type,'snapshot');payload=data;}});
  assert.equal(JSON.stringify(payload).includes('PRIVATE'),false);assert.equal(JSON.stringify(payload).includes('SECRET'),false);
  assert.equal(payload.players.length,2);assert.equal(payload.gameState.opponent.height,1);
  for(const player of payload.players)assert.equal('board'in player,false);
});
