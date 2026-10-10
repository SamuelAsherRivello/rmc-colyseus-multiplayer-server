export interface CombatPerson {id:string;slot:number;connected:boolean;ready:boolean;waiting:boolean;seq:number;ack:number;}
export class CombatSimulation {
 constructor(code?:string,seed?:number);
 code:string;players:Map<string,CombatPerson>;
 add(id:string):boolean;remove(id:string):void;connected(id:string,value:boolean):void;
 ready(id:string):void;configure(id:string,data:unknown):boolean;input(id:string,data:unknown):boolean;
 step():void;snapshot():unknown;
}
