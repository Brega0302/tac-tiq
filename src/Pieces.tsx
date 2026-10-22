import React from'react';import type{Mark}from'./boardGame.ts';
export function MarkSymbol({mark}:{mark:Mark|'draw'}){return <span aria-hidden="true" className={'mark-symbol mark-'+mark}>{mark==='draw'?'=':mark}</span>}
