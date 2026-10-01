export const WIDTH = 320;
export const HEIGHT = 576;
export const PADDLE_Y = 540;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const waves = [
  ['11111111111','12222222221','11111111111','00111111100'],
  ['21212121212','11111111111','12222222221','11111111111','00111111100'],
  ['22211111122','21122222112','11211111211','11122222111','01111111110','00111111100']
];
export class NeonBreakerSimulation {
  constructor() { this.reset(); }
  reset() {
    this.score=0; this.lives=3; this.wave=0; this.outcome='playing'; this.time=0;
    this.paddles=[{seat:0,x:80,target:80,width:38},{seat:1,x:240,target:240,width:38}];
    this.balls=[]; this.drops=[]; this.dropSerial=0; this.rng=0x4e424432; this.effects={wideUntil:0};
    this.bricks=[]; this.loadWave(0);
  }
  random(){ this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0; return this.rng/4294967296; }
  loadWave(index){
    this.wave=index; this.bricks=[];
    waves[index].forEach((row,ry)=>[...row].forEach((v,c)=>{const hp=Number(v); if(hp)this.bricks.push({id:this.bricks.length,x:18+c*26,y:74+ry*20,w:24,h:14,hp,maxHp:hp,kind:hp===2?'reinforced':'normal'});}));
    this.balls=[{id:0,x:160,y:520,vx:0,vy:0,r:4,attached:true}]; this.drops=[];
  }
  join(seat){ const p=this.paddles[seat]; if(p)p.x=p.target=seat===0?80:240; }
  leave(seat){ const p=this.paddles[seat]; if(p)p.x=p.target=seat===0?80:240; for(const b of this.balls)if(b.attached&&b.seat===seat)b.seat=0; }
  input(seat,data){
    if(!Number.isInteger(seat)||seat<0||seat>1||!data||typeof data!=='object')return false;
    const x=data.x;
    if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)return false;
    const lo=seat===0?20:180, hi=seat===0?140:300;
    this.paddles[seat].target=clamp(lo+x*(hi-lo),lo,hi); return true;
  }
  launch(seat){ if(this.outcome!=='playing'||!this.balls.some(b=>b.attached))return false;
    for(const b of this.balls)if(b.attached){b.attached=false;b.seat=seat;b.vx=seat===0?-95:95;b.vy=-175;} return true;
  }
  restart(){this.reset();}
  step(dt=1/30){
    if(!Number.isFinite(dt)||dt<=0||dt>.1)return;
    this.time+=dt;
    if(this.outcome!=='playing')return;
    for(const p of this.paddles){const seat=p.seat,lo=seat===0?20:180,hi=seat===0?140:300;p.x+=clamp(p.target-p.x,-260*dt,260*dt);p.x=clamp(p.x,lo,hi);p.width=this.effects.wideUntil>this.time?54:38;}
    for(const b of this.balls){if(b.attached){b.x=this.paddles[b.seat||0].x;b.y=520;continue;}
      const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}if(b.x>WIDTH-b.r){b.x=WIDTH-b.r;b.vx=-Math.abs(b.vx);}if(b.y<b.r+42){b.y=b.r+42;b.vy=Math.abs(b.vy);}
      if(b.vy>0&&b.y+b.r>=PADDLE_Y-3&&oy<=PADDLE_Y+2){
        for(const p of this.paddles){if(Math.abs(b.x-p.x)<=p.width/2+b.r&&Math.abs(b.y-PADDLE_Y)<12){const off=clamp((b.x-p.x)/(p.width/2),-1,1);b.vx=off*210+(p.seat===0?-18:18);b.vy=-Math.max(125,Math.sqrt(Math.max(20000, b.vx*b.vx+Math.abs(b.vy*b.vy))));b.y=PADDLE_Y-7;break;}}
      }
      if(b.vy<0){const hit=this.bricks.find(k=>ox+b.r>=k.x&&ox-b.r<=k.x+k.w&&oy+b.r>=k.y&&oy-b.r<=k.y+k.h);if(hit){hit.hp--;b.vy=Math.abs(b.vy);if(hit.hp<=0){this.score+=hit.kind==='reinforced'?25:10;this.bricks.splice(this.bricks.indexOf(hit),1);if(this.random()<.125)this.drops.push({id:this.dropSerial++,x:hit.x+hit.w/2,y:hit.y,type:this.random()<.5?'wide':'multiball'});}}}
    }
    this.balls=this.balls.filter(b=>b.y<HEIGHT+10);
    for(const d of this.drops){d.y+=90*dt;for(const p of this.paddles){if(Math.abs(d.x-p.x)<p.width/2+5&&Math.abs(d.y-PADDLE_Y)<10){if(d.type==='wide')this.effects.wideUntil=this.time+8;else if(this.balls.length<3&&this.balls.length){const src=this.balls[0];this.balls.push({id:++this.dropSerial,x:src.x,y:src.y,vx:-src.vx,vy:src.vy, r:4,attached:false});}d.caught=true;}}}
    this.drops=this.drops.filter(d=>!d.caught&&d.y<HEIGHT);
    if(!this.balls.length){this.lives--;if(this.lives<=0)this.outcome='defeat';else this.balls=[{id:0,x:this.paddles[0].x,y:520,vx:0,vy:0,r:4,attached:true,seat:0}];}
    if(!this.bricks.length){if(this.wave===2)this.outcome='victory';else this.loadWave(this.wave+1);}
  }
  snapshot(){return {width:WIDTH,height:HEIGHT,wave:this.wave+1,waves:3,score:this.score,lives:this.lives,outcome:this.outcome,time:this.time,paddles:this.paddles.map(p=>({...p})),balls:this.balls.map(b=>({...b})),bricks:this.bricks.map(b=>({...b})),drops:this.drops.map(d=>({...d})),effects:{wide:this.effects.wideUntil>this.time}};}
}


