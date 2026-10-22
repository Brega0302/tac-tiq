import type{Variant,Mark}from'./boardGame.ts';
export type MatchMode='local'|'ai';
export type BoardScore={X:number;O:number;draw:number};
export type BoardScores=Record<Variant,Record<MatchMode,BoardScore>>;
export const zeroScore=():BoardScore=>({X:0,O:0,draw:0});
export const emptyBoardScores=():BoardScores=>({classic:{local:zeroScore(),ai:zeroScore()},ultimate:{local:zeroScore(),ai:zeroScore()}});
export function loadBoardScores(raw:string|null):BoardScores{const scores=emptyBoardScores();try{const parsed=JSON.parse(raw||'null');for(const v of['classic','ultimate']as const)for(const m of['local','ai']as const)for(const p of['X','O','draw']as const){const n=parsed?.[v]?.[m]?.[p];if(Number.isSafeInteger(n)&&n>=0)scores[v][m][p]=n}}catch{}return scores}
export function addBoardResult(scores:BoardScores,variant:Variant,mode:MatchMode,winner:Mark|'draw'):BoardScores{const previous=scores[variant][mode];return{...scores,[variant]:{...scores[variant],[mode]:{...previous,[winner]:Math.min(Number.MAX_SAFE_INTEGER,previous[winner]+1)}}}}
export function resetBoardScores(scores:BoardScores,variant:Variant,mode:MatchMode|'all'):BoardScores{return{...scores,[variant]:mode==='all'?{ai:zeroScore(),local:zeroScore()}:{...scores[variant],[mode]:zeroScore()}}}
