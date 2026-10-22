import{test}from"node:test";
import assert from"node:assert/strict";
import{fresh,applyMove,winner,legalMoves,aiMove,replay,patterns,lines,result,type State,type Player,type Size}from"../src/game.ts";
test("a cell holds three different concentric sizes without replacing owners",()=>{
 let state=fresh();state=applyMove(state,{cell:0,size:"L",player:"X"});state=applyMove(state,{cell:0,size:"M",player:"O"});state=applyMove(state,{cell:0,size:"S",player:"X"});
 assert.deepEqual(state.board[0],{L:"X",M:"O",S:"X"});assert.equal(state.inventory.X.L,2);assert.equal(state.inventory.O.M,2);assert.equal(state.inventory.X.S,2);
});
test("all five patterns win in all eight lines for either owner",()=>{
 for(const owner of ["X","O"]as Player[])for(const cells of lines)for(const pattern of patterns){const board=fresh().board;cells.forEach((cell,i)=>board[cell][pattern[i]]=owner);assert.equal(winner(board)?.player,owner)}
});
test("one full same-colour cell wins for every player; mixed cells do not",()=>{
 for(const player of ["X","O","G","Y"]as Player[]){
  const board=fresh("X",4).board;board[4]={L:player,M:player,S:player};
  assert.deepEqual(winner(board),{player,cells:[4,4,4],sizes:["L","M","S"],kind:"stack"});
 }
 const mixed=fresh("X",4).board;mixed[4]={L:"X",M:"O",S:"G"};assert.equal(winner(mixed),null);
 const nonprogression=fresh().board;nonprogression[0]={L:"X"};nonprogression[1]={L:"X"};nonprogression[2]={M:"X"};
 assert.equal(winner(nonprogression),null);
});
test("occupied size, out-of-turn moves and exhausted inventory are rejected without mutations",()=>{
 const initial=fresh();const first=applyMove(initial,{cell:0,size:"L",player:"X"});
 assert.deepEqual(initial.board[0],{});assert.equal(initial.inventory.X.L,3);
 assert.throws(()=>applyMove(first,{cell:0,size:"L",player:"O"}));
 assert.throws(()=>applyMove(first,{cell:1,size:"S",player:"X"}));
 const exhausted=fresh();exhausted.inventory.X.M=0;assert.throws(()=>applyMove(exhausted,{cell:1,size:"M",player:"X"}));
 assert.throws(()=>applyMove(fresh(),{cell:-1,size:"S",player:"X"}));
});
test("completing a stack ends play, highlights every size and replays the win",()=>{
 let state=fresh();
 for(const move of [
  {cell:4,size:"L",player:"X"},{cell:0,size:"L",player:"O"},
  {cell:4,size:"M",player:"X"},{cell:0,size:"M",player:"O"},
  {cell:4,size:"S",player:"X"},
 ]as const)state=applyMove(state,move);
 const win=winner(state.board);
 assert.equal(win?.kind,"stack");assert.deepEqual(win?.sizes,["L","M","S"]);
 assert.deepEqual(win?.cells,[4,4,4]);assert.equal(result(state)&&win?.player,"X");
 assert.equal(legalMoves(state).length,0);
 assert.throws(()=>applyMove(state,{cell:0,size:"S",player:"O"}));
 assert.deepEqual(replay(state.history,state.history.length),state);
 assert.equal(winner(replay(state.history,4).board),null);
});
test("AI takes an immediate win and blocks an immediate opponent threat",()=>{
 const win=fresh("O");win.board[0]={L:"O"};win.board[1]={M:"O"};win.inventory.O.L=2;win.inventory.O.M=2;
 for(const level of ["medium","hard"]as const){const move=aiMove(win,level,()=>0)!;assert.equal(winner(applyMove(win,move).board)?.player,"O")}
 const block=fresh("O");block.board[0]={L:"X"};block.board[1]={M:"X"};block.inventory.X.L=2;block.inventory.X.M=2;
 for(const level of ["medium","hard"]as const){const move=aiMove(block,level,()=>0)!;assert.equal(move.cell,2);assert.equal(move.size,"S")}
});
test("replay rebuilds history exactly and every AI move is legal",()=>{
 let state=fresh();for(let i=0;i<10;i++){const move=aiMove(state,i%2?"medium":"easy",()=>.31);if(!move)break;assert.ok(legalMoves(state).some(m=>m.cell===move.cell&&m.size===move.size));state=applyMove(state,move)}
 assert.deepEqual(replay(state.history,state.history.length),state);
});
test("terminal games reject further moves; no inventory means draw",()=>{
 const won=fresh();won.board[0]={S:"X"};won.board[1]={S:"X"};won.board[2]={S:"X"};
 assert.equal(legalMoves(won).length,0);assert.throws(()=>applyMove(won,{cell:3,size:"L",player:"X"}));
 const exhausted:State=fresh();for(const player of ["X","O"]as Player[])for(const size of ["L","M","S"]as Size[])exhausted.inventory[player][size]=0;
 assert.equal(result(exhausted),"draw");
});


test("three and four players receive inventories and take turns in colour order",()=>{
 for(const count of [3,4] as const){
  let state=fresh("X",count);
  assert.equal(state.players.length,count);
  for(const player of state.players)assert.deepEqual(state.inventory[player],{L:3,M:3,S:3});
  for(let i=0;i<count;i++){const player=state.players[i];assert.equal(state.turn,player);state=applyMove(state,{cell:i,size:"L",player})}
  assert.equal(state.turn,"X");
 }
});
test("green and yellow can win all five patterns",()=>{
 for(const player of ["G","Y"] as Player[])for(const pattern of patterns){
  const board=fresh("X",4).board;[0,1,2].forEach((cell,i)=>board[cell][pattern[i]]=player);
  assert.equal(winner(board)?.player,player);
 }
});
test("three colours coexist in one cell and replay preserves four-player turn order",()=>{
 let state=fresh("X",4);
 for(const move of [{cell:4,size:"L",player:"X"},{cell:4,size:"M",player:"O"},{cell:4,size:"S",player:"G"},{cell:0,size:"M",player:"Y"}] as const)state=applyMove(state,move);
 assert.deepEqual(state.board[4],{L:"X",M:"O",S:"G"});assert.equal(state.turn,"X");
 assert.deepEqual(replay(state.history,4,"X",4),state);
 assert.deepEqual(replay(state.history,2,"X",4).board[4],{L:"X",M:"O"});
});
test("inactive colours cannot place or become the starter",()=>{
 assert.throws(()=>fresh("G",2));
 const state=fresh();
 assert.equal(legalMoves(state,"G").length,0);
 assert.throws(()=>applyMove(state,{cell:0,size:"S",player:"G"}));
});
test("players with no legal placement are skipped, draw needs every colour blocked",()=>{
 let state=fresh("X",3);state.inventory.O={L:0,M:0,S:0};
 state=applyMove(state,{cell:0,size:"L",player:"X"});assert.equal(state.turn,"G");assert.equal(result(state),null);
 const drawn=fresh("X",4);for(const player of drawn.players)drawn.inventory[player]={L:0,M:0,S:0};
 assert.equal(result(drawn),"draw");
});
test("AI mode explicitly rejects a multiplayer game",()=>{assert.throws(()=>aiMove(fresh("X",3),"hard"))});
test("AI completes its stack or blocks a one-cell opponent win",()=>{
 for(const difficulty of ["medium","hard"]as const){
  const attack=fresh("O");attack.board[4]={L:"O",M:"O"};attack.inventory.O.L=2;attack.inventory.O.M=2;
  const move=aiMove(attack,difficulty,()=>0)!;
  assert.equal(move.cell,4);assert.equal(move.size,"S");
  assert.equal(winner(applyMove(attack,move).board)?.kind,"stack");
  const defence=fresh("O");defence.board[4]={L:"X",M:"X"};defence.inventory.X.L=2;defence.inventory.X.M=2;
  const block=aiMove(defence,difficulty,()=>0)!;
  assert.equal(block.cell,4);assert.equal(block.size,"S");
  assert.equal(winner(applyMove(defence,block).board),null);
 }
});


test('AI-first Ring Arena replay preserves the original opener and inventories',()=>{let s=fresh('O');for(let i=0;i<4;i++){const move=aiMove(s,'medium',()=>0)!;s=applyMove(s,move)}assert.equal(s.history[0].player,'O');assert.deepEqual(replay(s.history,s.history.length,'O',2),s);assert.equal(replay(s.history,0,'O',2).turn,'O')});
