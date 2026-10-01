import { Room, type Client } from '@colyseus/core';
import { BombermanSimulation } from './bomberman-simulation.js';
export class BombermanRoom extends Room {
  maxClients=4;
  simulation=new BombermanSimulation();
  limits=new Map<string,{time:number;count:number}>();
  onCreate(options:{code:string}){
    this.simulation.code=options.code;this.setMetadata({code:options.code});
    this.onMessage('input',(client,data)=>{if(this.accept(client))this.simulation.input(client.sessionId,data);});
    this.onMessage('ready',client=>{if(this.accept(client))this.simulation.ready(client.sessionId);});
    this.onMessage('rematch',client=>{if(this.accept(client))this.simulation.rematch(client.sessionId);});
    this.onMessage('options',(client,data)=>{if(this.accept(client))this.simulation.configure(client.sessionId,data);});
    this.onMessage('color',(client,data)=>{if(this.accept(client))this.simulation.color(client.sessionId,data);});
    this.onMessage('snapshot',client=>{if(this.accept(client))this.snapshot(client);});
    // Timers can arrive unevenly. Advance fixed simulation ticks from elapsed
    // monotonic time so movement and fuses do not slow with timer jitter.
    let last=performance.now(),accumulator=0;
    this.setSimulationInterval(()=>{
      const now=performance.now();accumulator+=Math.min((now-last)/1000,.25);last=now;
      while(accumulator>=1/60){this.simulation.step();accumulator-=1/60;}
    },1000/60);
    this.clock.setInterval(()=>this.broadcast('gameState',this.simulation.snapshot()),50);
  }
  accept(client:Client){const now=Date.now();let limit=this.limits.get(client.sessionId);if(!limit||now-limit.time>=1000){limit={time:now,count:0};this.limits.set(client.sessionId,limit);}return ++limit.count<=60;}
  playerList(){return [...this.simulation.players.values()];}
  snapshot(client:Client){client.send('snapshot',{players:this.playerList(),capacity:4,strokes:[],gameState:this.simulation.snapshot()});}
  onJoin(client:Client){this.simulation.add(client.sessionId);this.broadcast('presence',{players:this.playerList(),capacity:4});}
  async onDrop(client:Client){this.simulation.connected(client.sessionId,false);try{await this.allowReconnection(client,15);}catch{this.simulation.remove(client.sessionId);}}
  onReconnect(client:Client){this.simulation.connected(client.sessionId,true);this.snapshot(client);}
  onLeave(client:Client){this.simulation.remove(client.sessionId);this.limits.delete(client.sessionId);this.broadcast('presence',{players:this.playerList(),capacity:4});}
}
