# TAC - TIQ

Three games, one arena. A browser game collection by Adin. React, TypeScript and Vite; no account, API keys or backend required.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5182/. Choose a game before configuring opponents.

```sh
npm test
npm run build
npm run preview
```

## The three games

**Size Wars / Ring Arena** — 2–4 local players or a two-player match against Beginner, Intermediate or Pro AI. Each colour has three large, three medium and three small pieces. Different sizes can share a cell. Win with a straight line of identical sizes, ascending or descending sizes, or a complete same-colour stack in one cell. Pro AI searches a bounded game tree; it is not guaranteed unbeatable.

**Classic Tic-Tac-Toe** — two players, one 3×3 board. X opens local games; AI games alternate who starts. Three matching symbols in a row, column or diagonal win; a full board without a winner draws. Local play or three AI levels: Beginner samples legal moves; Intermediate takes immediate wins and blocks immediate losses; Pro uses full minimax and cannot lose under these rules.

**Ultimate Tic-Tac-Toe** — nine 3×3 boards arranged in a 3×3 grid (81 cells). The starting player may choose any board. A move's cell position directs the next player to the board in the same position: centre cell sends to the centre board; middle-right cell sends to the middle-right board. A local win claims that board with a large X or O; a local draw closes it with =. If the directed board is already won or drawn, the next player may choose any open board. Three claimed boards in a row, column or diagonal win the match. If every board closes without a macro winner, the match draws. Local play and three AI levels are available. Beginner samples legal moves; Intermediate evaluates the next reply; Pro searches four plies with alpha-beta pruning and up to ten candidates per inner node. All legal root moves are considered. Ultimate Pro is not guaranteed unbeatable.

## Fair starts, sound and rules

Against AI, the opening player alternates on every new game: you (blue / X), then AI (red / O). Identities stay fixed. Each game remembers its own next starter on the current browser and origin. Opening a menu, changing language or difficulty, reading rules, and clearing scores do not advance it. Starting or restarting an AI match advances it once. Local games keep X / blue first.

The header has independent controls for quiet background music and game effects. The original 32-note ambient loop uses soft sine tones and slow chords. It starts after a user gesture, pauses when the tab is hidden and can be switched off without muting move, win or draw sounds. All audio is synthesized locally with Web Audio; there are no downloads or external services. Both preferences are remembered between games and reloads.

Classic rules show winning lines and a drawn board. Ultimate rules include an interactive cell-to-board example, board claims, closed targets and the overall win. Both guides support English and Bosanski.

The TAC - TIQ logo is shared by every game and returns to the dashboard. An unfinished game asks before leaving. Player cards show wins in the current mode. The expandable Overall scores section at the bottom combines every game, mode and legacy record; per-mode viewing and clearing remain available there.

## Languages and scores

English is the default for a new visitor. The corner language selector offers English and Bosanski. Changing language preserves the active match; the choice is remembered on that browser.

AI scores combine matches across difficulty levels. Scores are local to the browser and origin, with separate categories for each game and opponent mode. Size Wars additionally separates 2/3/4-player local matches. Older unclassified Ring Arena results remain in Earlier games / Ranije partije. Reset controls require confirmation and do not interrupt a match. The active board itself is held in memory; refreshing or closing the page ends that match.

Storage keys:
- `tac-tiq.music.v1`: background music preference.
- `taktixo.ai-starters.v1`: next opening player for each game.
- `taktixo.sound.v1`: shared sound preference.
- `sizewars.language`: preferred language.
- `sizewars.stats.v3`: Ring Arena scores; v1/v2 migration is preserved.
- `sizewars.board-scores.v1`: Classic and Ultimate scores, each separated into local and AI.

## Deploy

The repository includes a test-and-deploy GitHub Actions workflow. Enable **Settings > Pages > Source: GitHub Actions**. It builds with `--base /tac-tiq/` for the project URL; the regular build keeps the default root path for other hosts. Deployment status is available in Actions.

See [Objava i testiranje](OBJAVA-I-TESTIRANJE.md) for Bosnian instructions, a feedback checklist and the Android/iOS roadmap.

Run `npm ci` and `npm run build`. Deploy the **contents of `dist/`** to any static host. For Vercel, import this project with build command `npm run build` and output directory `dist`. No environment variables are needed. Localhost is a local preview; a public link requires deployment.

## Original standalone version

Before this collection was added, the existing standalone Size Wars project was preserved on the Desktop:
- `Size-Wars-Original-2026-10-22/`: original source, lockfile, tests and prebuilt `dist/` (dependencies intentionally excluded).
- `Size-Wars-za-objavu.zip`: original built site with `index.html` and `assets/` at archive root, ready for a static host.

To publish only the original Ring Arena, use that saved version. This folder contains the newer TAC - TIQ collection.

## Structure

- `src/main.tsx`: collection and navigation.
- `src/RingApp.tsx`, `src/game.ts`, `src/scores.ts`: original Ring Arena UI, engine, AI and migrated scores.
- `src/BoardApp.tsx`, `src/boardGame.ts`, `src/boardScores.ts`: Classic / Ultimate UI, pure game rules, AI and scores.
- `src/i18n.tsx`: language provider and translations.
- `src/rounds.ts`, `src/RoundContext.tsx`: alternating AI opening players and persistence.
- `src/SoundContext.tsx`, `src/ambientMusic.ts`: independent music / effect controls and the ambient loop.
- `src/Brand.tsx`, `src/AllScores.tsx`, `src/summary.ts`: shared dashboard navigation, inline result presentation and combined score history.
- `src/GameRules.tsx`, `src/Pieces.tsx`: visual rulebook, interactive routing demo and metallic symbols.
- `src/styles.css`, `src/collection.css`: responsive arena and collection styles.
- `tests/`: terminal tests for winning patterns, legal moves, turn routing, draws, AI, score separation, persistence and resets.

All fonts and visuals are rendered locally with CSS and icons. There are no external runtime services.

