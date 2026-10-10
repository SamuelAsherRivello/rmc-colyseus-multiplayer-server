/** Browser-safe deterministic aim-and-release rules. Coordinates include four hidden rows. */
export const WIDTH = 10, HEIGHT = 24, HIDDEN = 4;
export const AIM_MS = 5000, FALL_MS = 200, WARNING_MS = 1000;
const bases = { I: ['1111'], O: ['11','11'], T: ['010','111'], S: ['011','110'], Z: ['110','011'], J: ['100','111'], L: ['001','111'] };
export const SHAPES = Object.keys(bases);
export const COLORS = { I:'#50dce7', O:'#ffcd58', T:'#bf8df2', S:'#80da88', Z:'#ff768b', J:'#6c9fff', L:'#ffac69', G:'#647890' };
export function cells(shape, rotation = 0) {
  if (!bases[shape]) return [];
  let result = bases[shape].flatMap((row,y) => [...row].flatMap((v,x) => v === '1' ? [[x,y]] : []));
  for (let n = 0; n < ((rotation % 4) + 4) % 4; n++) {
    result = result.map(([x,y]) => [-y,x]);
    const minX = Math.min(...result.map(c=>c[0])), minY = Math.min(...result.map(c=>c[1]));
    result = result.map(([x,y]) => [x-minX,y-minY]);
  }
  return result;
}
export const emptyBoard = () => Array.from({length:HEIGHT}, () => Array(WIDTH).fill(null));
export function fits(board, piece, y) {
  return cells(piece.shape,piece.rotation).every(([dx,dy]) => {
    const x = piece.x+dx, row = y+dy;
    return x >= 0 && x < WIDTH && row >= 0 && row < HEIGHT && !board[row][x];
  });
}
export function landing(board, piece) {
  if (!fits(board,piece,0)) return null;
  let y = 0; while (fits(board,piece,y+1)) y++;
  return y;
}
export function aim(piece, action) {
  if (!piece || piece.stage !== 'aiming') return piece;
  let next = {...piece};
  if (action === 'left' || action === 'right') next.x += action === 'left' ? -1 : 1;
  else if (action === 'cw' || action === 'ccw') next.rotation = (next.rotation+(action==='cw'?1:3))%4;
  else return next;
  const legal = x => cells(next.shape,next.rotation).every(([dx])=>x+dx>=0&&x+dx<WIDTH);
  for (const kick of action==='left'||action==='right' ? [0] : [0,-1,1,-2,2]) if (legal(next.x+kick)) return {...next,x:next.x+kick};
  return {...piece};
}
function random(state) { state.value = (Math.imul(1664525,state.value)+1013904223)>>>0; return state.value/4294967296; }
function take(player) {
  if (!player.bag.length) {
    player.bag = [...SHAPES];
    for (let i=6;i>0;i--) { const j=Math.floor(random(player.rng)*(i+1)); [player.bag[i],player.bag[j]]=[player.bag[j],player.bag[i]]; }
  }
  return player.bag.shift();
}
function fillQueue(player) { while (player.queue.length < 6) player.queue.push(take(player)); }
function spawn(player, time) {
  fillQueue(player);
  player.piece = {shape:player.queue.shift(),rotation:0,x:3,id:++player.pieceId,stage:'aiming',deadline:time+AIM_MS};
  fillQueue(player);
  if (landing(player.board,player.piece)===null) player.out = true;
}
function clear(board) {
  const rows = board.filter(row=>row.some(cell=>!cell));
  const count = HEIGHT-rows.length;
  while (rows.length<HEIGHT) rows.unshift(Array(WIDTH).fill(null));
  return {board:rows,count};
}
function cancel(player, amount) {
  while (amount>0 && player.incoming.length) {
    const packet=player.incoming[0], n=Math.min(amount,packet.rows);
    packet.rows-=n; amount-=n; if(!packet.rows) player.incoming.shift();
  }
  return amount;
}
function insert(player,time) {
  while (player.incoming[0]?.eligibleAt<=time) {
    const packet=player.incoming.shift();
    for(let i=0;i<packet.rows;i++) {
      if(player.board[0].some(Boolean)) player.out=true;
      player.board.shift(); player.board.push(Array.from({length:WIDTH},(_,x)=>x===packet.gap?null:'G'));
    }
  }
}
export function stackHeight(board) {
  const i=board.slice(HIDDEN).findIndex(row=>row.some(Boolean)); return i<0?0:20-i;
}
export class TetrisDuel {
  constructor(seed = 1) {
    this.seed=seed>>>0; this.gapRng={value:(this.seed^0xa15ed)>>>0};
    this.players=[null,null]; this.time=0; this.accumulator=0; this.phase='lobby'; this.epoch=0; this.revision=0; this.packetId=0; this.winner=null;
  }
  add(id, number = this.players.findIndex(p=>!p)) {
    if(number<0 || number>1 || this.players[number]) return null;
    this.players[number]={id,seat:number+1,name:number===0?'Amber Fox':'Azure Finch',color:number===0?'#ffac69':'#50dce7',connected:true,ready:false,board:emptyBoard(),queue:[],bag:[],rng:{value:this.seed},piece:null,pieceId:0,ack:0,lines:0,placements:0,incoming:[],out:false,recoveryUsed:0};
    this.revision++; return this.players[number];
  }
  player(id) { return this.players.find(p=>p?.id===id); }
  ready(id,value) {
    const p=this.player(id); if(!p || !['lobby','results','aborted'].includes(this.phase) || typeof value!=='boolean') return false;
    p.ready=value; this.revision++;
    if(this.players.every(p=>p?.connected&&p.ready)) {
      this.epoch++; this.phase='countdown'; this.startsAt=this.time+3000; this.winner=null;
      for(const p of this.players) Object.assign(p,{board:emptyBoard(),queue:[],bag:[],rng:{value:this.seed},piece:null,pieceId:0,ack:0,lines:0,placements:0,incoming:[],out:false,recoveryUsed:0,ready:false});
    }
    return true;
  }
  command(id, input) {
    const p=this.player(id);
    if(!p || !p.connected || this.phase!=='playing' || this.paused || !input || typeof input!=='object' || input.protocolVersion!==1 || input.epoch!==this.epoch || input.pieceId!==p.piece?.id || !Number.isSafeInteger(input.seq) || input.seq<=p.ack || !['left','right','cw','ccw','commit'].includes(input.action) || p.piece.stage!=='aiming') return false;
    if(this.time>=p.piece.deadline) { this.commit(p); return false; }
    p.ack=input.seq;
    if(input.action==='commit') this.commit(p); else p.piece=aim(p.piece,input.action);
    this.revision++; return true;
  }
  commit(p) {
    p.piece={...p.piece,stage:'falling',landing:landing(p.board,p.piece),committedAt:this.time,resolvesAt:this.time+FALL_MS};
    this.revision++;
  }
  get paused() { return ['countdown','playing'].includes(this.phase) && this.players.some(p=>!p?.connected); }
  advance(elapsed) {
    if(!Number.isFinite(elapsed) || elapsed<0 || this.paused) return;
    // Fixed event ordering even if one callback arrives late.
    this.accumulator+=elapsed;
    while(this.accumulator>=20) { this.accumulator-=20; this.time+=20; this.tick(); }
  }
  tick() {
    if(this.phase==='countdown'&&this.time>=this.startsAt) {
      this.phase='playing'; for(const p of this.players) spawn(p,this.time); this.results(); this.revision++;
    }
    if(this.phase!=='playing') return;
    for(const p of this.players) if(p.piece?.stage==='aiming'&&this.time>=p.piece.deadline) this.commit(p);
    const resolving=this.players.filter(p=>p.piece?.stage==='falling'&&p.piece.resolvesAt<=this.time);
    if(!resolving.length) return;
    const attacks=[0,0];
    for(const p of resolving) {
      const piece=p.piece;
      if(piece.landing===null) p.out=true;
      else for(const [dx,dy] of cells(piece.shape,piece.rotation)) p.board[piece.landing+dy][piece.x+dx]=piece.shape;
      const cleared=clear(p.board); p.board=cleared.board; p.lines+=cleared.count; p.placements++;
      attacks[p.seat-1]=cancel(p,[0,0,1,2,4][cleared.count]??0);
    }
    const neutral=Math.min(...attacks); attacks[0]-=neutral; attacks[1]-=neutral;
    for(let i=0;i<2;i++) if(attacks[i]) this.players[1-i].incoming.push({id:++this.packetId,rows:attacks[i],eligibleAt:this.time+WARNING_MS,gap:Math.floor(random(this.gapRng)*WIDTH)});
    for(const p of resolving) {
      insert(p,this.time);
      if(p.board.slice(0,HIDDEN).some(row=>row.some(Boolean))) p.out=true;
      if(!p.out) spawn(p,this.time); else p.piece=null;
    }
    this.results(); this.revision++;
  }
  results() {
    if(!this.players.some(p=>p?.out)) return;
    this.phase='results'; const alive=this.players.filter(p=>p&&!p.out); this.winner=alive.length===1?alive[0].seat:null;
    for(const p of this.players) if(p) p.ready=false;
  }
  disconnect(id) { const p=this.player(id); if(p) {p.connected=false;this.revision++;} }
  reconnect(id,newId=id) { const p=this.player(id); if(p) {p.id=newId;p.connected=true;this.revision++;} }
  forfeit(id) {
    const p=this.player(id); if(!p)return;
    p.connected=false; p.out=true;
    if(this.players.every(p=>!p?.connected)) {this.phase='aborted';this.winner=null;}
    else if(['playing','countdown'].includes(this.phase)) this.results();
    else if(this.phase==='lobby') this.players[p.seat-1]=null;
    this.revision++;
  }
  publicPlayer(p) {
    return p ? {id:p.id,seat:p.seat,name:p.name,color:p.color,connected:p.connected,ready:p.ready,height:stackHeight(p.board),aim:p.piece?.stage==='aiming'?{shape:p.piece.shape,rotation:p.piece.rotation,x:p.piece.x}:null,out:p.out} : null;
  }
  project(id) {
    const p=this.player(id); if(!p) return null;
    const own={...this.publicPlayer(p),board:p.board.map(row=>[...row]),piece:p.piece?{...p.piece}:null,queue:p.queue.slice(0,5),ack:p.ack,lines:p.lines,placements:p.placements,incoming:p.incoming.map(({id,rows,eligibleAt})=>({id,rows,eligibleAt})),recoveryRemaining:Math.max(0,15000-p.recoveryUsed)};
    return {protocolVersion:1,epoch:this.epoch,revision:this.revision,serverTime:this.time,phase:this.phase,paused:this.paused,startsAt:this.startsAt??null,winner:this.winner,own,opponent:this.publicPlayer(this.players[1-(p.seat-1)])};
  }
}
