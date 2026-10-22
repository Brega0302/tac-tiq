import React, { useState } from 'react';
import type { BoardGame } from './boardGame.ts';
import { MarkSymbol } from './Pieces.tsx';
import { useI18n } from './i18n.tsx';

export function FocusedBoard({ game, active, canPlay, position, onPlace }: {
  game: BoardGame; active: number[]; canPlay: boolean;
  position: (index: number) => string; onPlace: (board: number, cell: number) => void;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(active[0] ?? 0);
  const board = active.includes(selected) ? selected : active[0] ?? 0;
  return <div className={'focused-content mark-' + game.turn}>
    <p className="eyebrow">ULTIMATE · {game.turn} {t('je na potezu', 'to play')}</p>
    <h2>{t('Ploča', 'Board')} {board + 1} · {position(board)}</h2>
    <p>{active.length > 1
      ? t('Izaberi osvijetljenu ploču, pa odigraj potez na velikim poljima.', 'Choose a highlighted board, then tap a large cell to play.')
      : t('Ovo je tvoja sljedeća ploča. Dodirni slobodno polje.', 'This is your next board. Tap an empty cell.')}</p>
    {active.length > 1 && <div className="focus-board-picker" role="group" aria-label={t('Izaberi ploču', 'Choose a board')}>
      {game.resolved.map((resolved, index) => <button key={index}
        disabled={!canPlay || !active.includes(index)} aria-pressed={board === index}
        aria-label={t('Ploča', 'Board') + ' ' + (index + 1) + ': ' + position(index)}
        onClick={() => setSelected(index)}>
        {resolved ? <MarkSymbol mark={resolved} /> : index + 1}
      </button>)}
    </div>}
    <div className="focus-cells" role="group" aria-label={t('Uvećana ploča', 'Enlarged board')}>
      {game.boards[board].map((mark, cell) => <button key={cell}
        className={'tic-cell ' + (mark ? 'placed mark-' + mark : '')}
        disabled={!canPlay || !active.includes(board) || !!mark || !!game.resolved[board]}
        aria-label={t('Ploča', 'Board') + ' ' + (board + 1) + ', ' + t('Polje', 'Cell') + ' ' + (cell + 1) + ': ' + (mark || t('prazno', 'empty'))}
        onClick={() => onPlace(board, cell)}>
        {mark ? <MarkSymbol mark={mark} /> : <span className="cell-dot" />}
      </button>)}
    </div>
  </div>;
}
