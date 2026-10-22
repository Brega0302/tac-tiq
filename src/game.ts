export type Player="X"|"O"|"G"|"Y";
export type PlayerCount=2|3|4;
export const allPlayers:Player[]=["X","O","G","Y"];
export type Size="L"|"M"|"S";
export type Cell=Partial<Record<Size,Player>>;
export type Move={cell:number;size:Size;player:Player};
export type Inventory=Record<Player,Record<Size,number>>;
export type State={board:Cell[];inventory:Inventory;turn:Player;history:Move[];players:Player[]};
export type Win={player:Player;cells:number[];sizes:Size[];kind:"line"|"stack"};
export const sizes:Size[]=["L","M","S"];
export const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export const patterns:Size[][]=[["L","L","L"],["M","M","M"],["S","S","S"],["L","M","S"],["S","M","L"]];
export const other=(player:Player):Player=>player==="X"?"O":"X";
export function fresh(starter:Player="X",playerCount:PlayerCount=2):State{
 const players=allPlayers.slice(0,playerCount);
 if(!players.includes(starter))throw new Error("Početni igrač mora učestvovati u partiji.");
 return{board:Array.from({length:9},()=>({})),inventory:{X:{L:3,M:3,S:3},O:{L:3,M:3,S:3},G:{L:3,M:3,S:3},Y:{L:3,M:3,S:3}},turn:starter,history:[],players};
}
function hasPlacement(state:State,player:Player){
 return sizes.some(size=>state.inventory[player][size]>0&&state.board.some(cell=>!cell[size]));
}
export function winner(board:Cell[]):Win|null{
 for(const player of allPlayers){
  const stack=board.findIndex(cell=>sizes.every(size=>cell[size]===player));
  if(stack!==-1)return{player,cells:[stack,stack,stack],sizes:[...sizes],kind:"stack"};
  for(const cells of lines)for(const pattern of patterns)if(cells.every((cell,i)=>board[cell][pattern[i]]===player))return{player,cells,sizes:pattern,kind:"line"};
 }
 return null;
}
export function legalMoves(state:State,player:Player=state.turn):Move[]{
 if(!state.players.includes(player)||winner(state.board))return[];
 return sizes.flatMap(size=>state.inventory[player][size]>0?state.board.flatMap((cell,index)=>!cell[size]?[{cell:index,size,player}]:[]):[]);
}
export function applyMove(state:State,move:Move):State{
 if(!state.players.includes(move.player))throw new Error("Ova boja ne učestvuje u partiji.");
 if(move.player!==state.turn)throw new Error("Nije tvoj potez.");
 if(!Number.isInteger(move.cell)||move.cell<0||move.cell>8||!sizes.includes(move.size))throw new Error("Neispravan potez.");
 if(winner(state.board))throw new Error("Partija je završena.");
 if(state.inventory[move.player][move.size]<=0)throw new Error("Nema više prstenova te veličine.");
 if(state.board[move.cell][move.size])throw new Error("Ta veličina je već zauzeta u ovom polju.");
 const next:State={board:state.board.map(cell=>({...cell})),inventory:{X:{...state.inventory.X},O:{...state.inventory.O},G:{...state.inventory.G},Y:{...state.inventory.Y}},turn:move.player,history:[...state.history,move],players:[...state.players]};
 next.board[move.cell][move.size]=move.player;next.inventory[move.player][move.size]--;
 const index=state.players.indexOf(move.player);
 const order=state.players.map((_,offset)=>state.players[(index+offset+1)%state.players.length]);
 next.turn=order.find(player=>hasPlacement(next,player))||order[0];
 return next;
}
export function result(state:State):Win|"draw"|null{
 const win=winner(state.board);if(win)return win;
 if(!state.players.some(player=>hasPlacement(state,player)))return"draw";
 return null;
}
// Evaluation counts only still-achievable patterns, weighted toward immediate threats.
function evaluate(state:State,player:Player){
 const win=winner(state.board);if(win)return win.player===player?100000:-100000;
 let score=0;
 for(const owner of [player,other(player)]){
  const sign=owner===player?1:-1;
  // A same-colour stack is another three-piece formation to attack or defend.
  for(const cell of state.board){
   const missing=sizes.filter(size=>!cell[size]);
   if(sizes.every(size=>!cell[size]||cell[size]===owner)&&missing.every(size=>state.inventory[owner][size]>0)){
    const owned=3-missing.length;
    score+=sign*[0,3,55,5000][owned];
   }
  }
  for(const cells of lines)for(const pattern of patterns){
   let count=0,blocked=false;
   const missing:Record<Size,number>={L:0,M:0,S:0};
   cells.forEach((cell,i)=>{const value=state.board[cell][pattern[i]];if(value===owner)count++;else if(value)blocked=true;else missing[pattern[i]]++});
   if(!blocked&&sizes.every(s=>missing[s]<=state.inventory[owner][s]))score+=sign*[0,2,45,5000][count];
  }
 }
 // A small positional preference breaks otherwise-equivalent choices.
 for(const size of sizes)if(state.board[4][size]===player)score+=1;
 return score;
}
export function aiMove(state:State,difficulty:"easy"|"medium"|"hard",random:()=>number=Math.random):Move|null{
 if(state.players.length!==2)throw new Error("AI režim podržava dva igrača.");
 const options=legalMoves(state);if(!options.length)return null;
 const pick=(moves:Move[])=>moves[Math.min(moves.length-1,Math.floor(random()*moves.length))];
 if(difficulty==="easy")return pick(options);
 const player=state.turn;
 const immediate=options.filter(move=>winner(applyMove(state,move).board)?.player===player);
 if(immediate.length)return pick(immediate);
 // Exclude moves that allow a one-turn opponent victory whenever a safe move exists.
 const safe=options.filter(move=>{const next=applyMove(state,move);return !legalMoves(next).some(reply=>winner(applyMove(next,reply).board)?.player===other(player))});
 const candidates=safe.length?safe:options;
 if(difficulty==="medium")return candidates.reduce((best,move)=>evaluate(applyMove(state,move),player)>evaluate(applyMove(state,best),player)?move:best,candidates[0]);
 const search=(position:State,depth:number,alpha:number,beta:number):number=>{
  const win=winner(position.board);if(win)return win.player===player?100000+depth:-100000-depth;
  if(depth===0)return evaluate(position,player);
  const moves=legalMoves(position);if(!moves.length)return 0;
  const maximizing=position.turn===player;
  moves.sort((a,b)=>(evaluate(applyMove(position,b),player)-evaluate(applyMove(position,a),player))*(maximizing?1:-1));
  let best=maximizing?-Infinity:Infinity;
  for(const move of moves.slice(0,10)){
   const value=search(applyMove(position,move),depth-1,alpha,beta);
   best=maximizing?Math.max(best,value):Math.min(best,value);
   if(maximizing)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);
   if(beta<=alpha)break;
  }
  return best;
 };
 let best=-Infinity,selected=candidates[0];
 for(const move of candidates){
  const value=search(applyMove(state,move),2,-Infinity,Infinity);
  if(value>best){best=value;selected=move}
 }
 return selected;
}
export function replay(history:Move[],count:number,starter:Player="X",playerCount:PlayerCount=2){
 return history.slice(0,count).reduce((state,move)=>applyMove(state,move),fresh(starter,playerCount));
}
