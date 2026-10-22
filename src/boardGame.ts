import {lines} from './game.ts';
export type Mark='X'|'O';
export type BoardResult=Mark|'draw'|null;
export type Variant='classic'|'ultimate';
export type BoardDifficulty='beginner'|'intermediate'|'pro';
export type FlatBoard=(Mark|null)[];
export type Turn={board:number;cell:number;player:Mark};
export type BoardGame={variant:Variant;boards:FlatBoard[];resolved:BoardResult[];turn:Mark;starter:Mark;forced:number|null;history:Turn[];outcome:BoardResult;winLine:number[]};
export function inspect(board:(Mark|'draw'|null)[]):{outcome:BoardResult;line:number[]}{
 for(const line of lines){const p=board[line[0]];if((p==='X'||p==='O')&&line.every(i=>board[i]===p))return{outcome:p,line:[...line]}}
 return{outcome:board.every(Boolean)?'draw':null,line:[]};
}
export function newBoardGame(variant:Variant,starter:Mark='X'):BoardGame{return{variant,boards:Array.from({length:variant==='classic'?1:9},()=>Array<Mark|null>(9).fill(null)),resolved:Array(variant==='classic'?1:9).fill(null),turn:starter,starter,forced:null,history:[],outcome:null,winLine:[]}}
export function playableBoards(state:BoardGame):number[]{if(state.outcome)return[];if(state.variant==='classic')return[0];if(state.forced!==null&&!state.resolved[state.forced])return[state.forced];return state.resolved.flatMap((r,i)=>r?[]:[i])}
export function validTurns(state:BoardGame):Turn[]{return playableBoards(state).flatMap(board=>state.boards[board].flatMap((p,cell)=>p?[]:[{board,cell,player:state.turn}]))}
export function playTurn(state:BoardGame,board:number,cell:number):BoardGame{
 if(!Number.isInteger(board)||!Number.isInteger(cell)||cell<0||cell>8||!playableBoards(state).includes(board)||state.boards[board][cell])throw new Error('Illegal move');
 const boards=state.boards.map(b=>[...b]);boards[board][cell]=state.turn;
 const resolved=[...state.resolved];const local=inspect(boards[board]);resolved[board]=local.outcome;
 const global=state.variant==='classic'?local:inspect(resolved);
 return{...state,boards,resolved,turn:state.turn==='X'?'O':'X',history:[...state.history,{board,cell,player:state.turn}],outcome:global.outcome,winLine:global.line,forced:state.variant==='ultimate'&&!global.outcome&&!resolved[cell]?cell:null};
}
// Pro Classic searches to the end. Lower levels use random or immediate tactical moves.
export function classicAI(state:BoardGame):Turn|null{
 const choices=validTurns(state);if(!choices.length)return null;const me=state.turn;const cache=new Map<string,number>();
 function search(s:BoardGame,depth:number):number{if(s.outcome)return s.outcome==='draw'?0:s.outcome===me?20-depth:depth-20;const key=s.boards[0].map(p=>p||'-').join('')+s.turn;const known=cache.get(key);if(known!==undefined)return known;const values=validTurns(s).map(m=>search(playTurn(s,m.board,m.cell),depth+1));const value=s.turn===me?Math.max(...values):Math.min(...values);cache.set(key,value);return value}
 const ranked=choices.map(move=>({move,score:search(playTurn(state,move.board,move.cell),0)}));return ranked.reduce((best,item)=>item.score>best.score?item:best).move;
}
function potential(cells:(Mark|'draw'|null)[],me:Mark){let value=0;for(const line of lines){const own=line.filter(i=>cells[i]===me).length,empty=line.filter(i=>!cells[i]).length;if(own+empty===3)value+=[0,2,18,150][own]}return value}
function evaluate(s:BoardGame,me:Mark){const other=me==='X'?'O':'X';if(s.outcome)return s.outcome==='draw'?0:s.outcome===me?100000:-100000;let v=(potential(s.resolved,me)-potential(s.resolved,other))*35;for(let i=0;i<s.boards.length;i++){if(s.resolved[i]===me)v+=250;else if(s.resolved[i]===other)v-=250;else if(!s.resolved[i])v+=potential(s.boards[i],me)-potential(s.boards[i],other)}return v}
function tacticalUltimate(state:BoardGame):Turn|null{
 const choices=validTurns(state);if(!choices.length)return null;const me=state.turn;
 let best=choices[0],score=-Infinity;
 for(const move of choices){const next=playTurn(state,move.board,move.cell);let value=evaluate(next,me);if(!next.outcome){const replies=validTurns(next);value=Math.min(...replies.map(reply=>evaluate(playTurn(next,reply.board,reply.cell),me)));if(next.forced===null)value-=20}value+=(move.cell===4?1:0);if(value>score){best=move;score=value}}
 return best;
}
function randomTurn(choices:Turn[],random:()=>number){return choices[Math.max(0,Math.min(choices.length-1,Math.floor(random()*choices.length)))]}
function intermediateClassic(state:BoardGame,random:()=>number):Turn|null{
 const choices=validTurns(state);if(!choices.length)return null;
 const winning=choices.filter(move=>playTurn(state,move.board,move.cell).outcome===state.turn);
 if(winning.length)return randomTurn(winning,random);
 const opponent:Mark=state.turn==='X'?'O':'X';
 const safe=choices.filter(move=>{const next=playTurn(state,move.board,move.cell);return !validTurns(next).some(reply=>playTurn(next,reply.board,reply.cell).outcome===opponent)});
 const candidates=safe.length?safe:choices;
 if(candidates.some(move=>move.cell===4))return candidates.find(move=>move.cell===4)!;
 return randomTurn(candidates,random);
}
// Pro Ultimate searches four plies, with alpha-beta pruning and ten candidates per inner node.
// Every legal root move is examined. This is a bounded opponent, not a solved-game guarantee.
export function ultimateAI(state:BoardGame):Turn|null{
 const choices=validTurns(state);if(!choices.length)return null;const me=state.turn;
 const order=(s:BoardGame)=>validTurns(s).map(move=>({move,next:playTurn(s,move.board,move.cell)})).sort((a,b)=>(evaluate(b.next,me)-evaluate(a.next,me))*(s.turn===me?1:-1));
 function search(s:BoardGame,depth:number,alpha:number,beta:number):number{
  if(s.outcome)return evaluate(s,me)+(s.outcome==='draw'?0:s.outcome===me?depth:-depth);
  if(depth===0)return evaluate(s,me);
  const maximize=s.turn===me;let value=maximize?-Infinity:Infinity;
  for(const {next}of order(s).slice(0,10)){
   const score=search(next,depth-1,alpha,beta);value=maximize?Math.max(value,score):Math.min(value,score);
   if(maximize)alpha=Math.max(alpha,value);else beta=Math.min(beta,value);
   if(beta<=alpha)break;
  }
  return value;
 }
 let best=choices[0],bestScore=-Infinity;
 for(const {move,next}of order(state)){
  const score=search(next,3,bestScore,Infinity)+(move.cell===4?.01:0);
  if(score>bestScore){bestScore=score;best=move}
 }
 return best;
}
export function chooseBoardAI(state:BoardGame,difficulty:BoardDifficulty='pro',random:()=>number=Math.random):Turn|null{
 const choices=validTurns(state);if(!choices.length)return null;
 if(difficulty==='beginner')return randomTurn(choices,random);
 const winning=choices.find(move=>playTurn(state,move.board,move.cell).outcome===state.turn);
 if(winning)return winning;
 if(state.variant==='classic')return difficulty==='pro'?classicAI(state):intermediateClassic(state,random);
 return difficulty==='pro'?ultimateAI(state):tacticalUltimate(state);
}
