export type GameKind='rings'|'classic'|'ultimate';
export type Starter='X'|'O';
export type StarterHistory=Record<GameKind,Starter>;
export const emptyStarters=():StarterHistory=>({rings:'X',classic:'X',ultimate:'X'});
export function readStarters(raw:string|null):StarterHistory{const history=emptyStarters();try{const parsed=JSON.parse(raw||'null');for(const game of['rings','classic','ultimate']as const)if(parsed?.[game]==='X'||parsed?.[game]==='O')history[game]=parsed[game]}catch{}return history}
export function advanceStarter(history:StarterHistory,game:GameKind):{starter:Starter;next:StarterHistory}{const starter=history[game];return{starter,next:{...history,[game]:starter==='X'?'O':'X'}}}
