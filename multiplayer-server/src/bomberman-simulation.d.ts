export interface BombermanPerson { id:string;number:number;name:string;color:number;ready:boolean;connected:boolean;score:number;ack:number; }
export class BombermanSimulation {
  constructor(code?:string);
  code:string;
  players:Map<string,BombermanPerson>;
  phase:string;
  clock:number;
  add(id:string):boolean;
  remove(id:string):void;
  connected(id:string,value:boolean):void;
  ready(id:string):void;
  color(id:string,color:unknown):void;
  input(id:string,data:unknown):boolean;
  step():void;
  snapshot():unknown;
}
