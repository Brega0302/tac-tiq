import React, { useCallback, useEffect, useRef, useState } from "react";
import {useI18n,LanguageSwitch} from "./i18n.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { Orbit, Volume2, VolumeX, Moon, Sun, RotateCcw, ArrowRight, ChevronLeft, ChevronRight, Play, Pause, X, Users, Bot, HelpCircle, Trophy, Target, Check, Flag } from "lucide-react";
import { fresh, applyMove, result, aiMove, replay, sizes, allPlayers, type PlayerCount, type Player, type Size, type State } from "./game.ts";
import { readScoreHistory, matchCategory, recordResult, clearResults, scoreTotal, categoryLabels, scoreCategories, type ScoreHistory, type ScoreCategory } from "./scores.ts";
import "./styles.css";
import{useRounds}from"./RoundContext.tsx";
import{useSound,SoundButton,MusicButton}from"./SoundContext.tsx";
import{Brand}from"./Brand.tsx";
import{AllScores}from"./AllScores.tsx";
type Mode = "ai" | "local";
type Difficulty = "easy" | "medium" | "hard";
const rawTeams: Record<Player, {
    name: string;
    team: string;
    adjective: string;
    css: string;
}> = {
    X: { name: "Plava", team: "Plavi tim", adjective: "plavi", css: "blue" },
    O: { name: "Crvena", team: "Crveni tim", adjective: "crveni", css: "red" },
    G: { name: "Zelena", team: "Zeleni tim", adjective: "zeleni", css: "green" },
    Y: { name: "Žuta", team: "Žuti tim", adjective: "žuti", css: "yellow" },
};
const rawSizeNames: Record<Size, string> = { L: "Veliki", M: "Srednji", S: "Mali" };
const coords = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];
function readStats(): ScoreHistory {
    try {
        return readScoreHistory(localStorage.getItem("sizewars.stats.v3"), localStorage.getItem("sizewars.stats.v2") || localStorage.getItem("sizewars.stats.v1"));
    }
    catch {
        return readScoreHistory(null, null);
    }
}
function ComboCell({ pieces }: {
    pieces: Size[];
}) {
    return <span className="diagram-cell owner-X" aria-hidden="true">{pieces.map(size => <span key={size} className={"ring " + size}/>)}</span>;
}
const rawCombinations: {
    title: string;
    description: string;
    pieces: Size[][];
}[] = [
    { title: "Tri velika", description: "Tri velika prstena iste boje u ravnoj liniji.", pieces: [["L"], ["L"], ["L"]] },
    { title: "Tri srednja", description: "Tri srednja prstena iste boje u ravnoj liniji.", pieces: [["M"], ["M"], ["M"]] },
    { title: "Tri mala", description: "Tri mala kruga iste boje u ravnoj liniji.", pieces: [["S"], ["S"], ["S"]] },
    { title: "Od velikog ka malom", description: "Veliki, srednji pa mali iste boje u ravnoj liniji.", pieces: [["L"], ["M"], ["S"]] },
    { title: "Od malog ka velikom", description: "Mali, srednji pa veliki iste boje u ravnoj liniji.", pieces: [["S"], ["M"], ["L"]] },
    { title: "Sve u jednom polju", description: "Veliki, srednji i mali iste boje u jednom polju.", pieces: [["L", "M", "S"]] },
];
export default function RingApp({onHome}:{onHome:()=>void}) {
const {t,locale}=useI18n();
const{nextStarters,claimStarter}=useRounds();const{unlock,play}=useSound();const[roundStarter,ROUNDSTARTER]=useState<Player>("X");
const teams=Object.fromEntries(Object.entries(rawTeams).map(([key,v])=>[key,{...v,name:t(v.name),team:t(v.team),adjective:t(v.adjective)}])) as typeof rawTeams;
const sizeNames=Object.fromEntries(Object.entries(rawSizeNames).map(([key,value])=>[key,t(value)])) as typeof rawSizeNames;
const combinations=rawCombinations.map(c=>({...c,title:t(c.title),description:t(c.description)}));
useEffect(()=>HINT(t("Odaberi veličinu, pa polje na ploči.")),[locale]);
    const [game, G] = useState<State>(() => fresh());
    const [screen, SCREEN] = useState<"setup" | "arena">("setup");
    const [draftMode, DM] = useState<Mode>("ai"), [draftDifficulty, DD] = useState<Difficulty>("medium"), [draftCount, DC] = useState<PlayerCount>(2);
    const [mode, M] = useState<Mode>("ai"), [difficulty, D] = useState<Difficulty>("medium"), [playerCount, PC] = useState<PlayerCount>(2);
    const [selected, SEL] = useState<Size>("L"), [theme, THEME] = useState("dark");
    const [help, HELP] = useState(false), [confirm, CONFIRM] = useState<"restart" | "menu" | "clear-scores" | "hub" | null>(null);
    const [stats, STATS] = useState<ScoreHistory>(readStats), [hint, HINT] = useState(t("Odaberi veli\u010Dinu, pa polje na plo\u010Di."));
    const [replayIndex, REPLAY] = useState<number | null>(null), [playing, PLAYING] = useState(false);
    const [victoryOpen, VICTORY] = useState(false);
    const [scoreView, SCOREVIEW] = useState<ScoreCategory | null>(null), [clearScope, CLEARSCOPE] = useState<"current" | "all">("current");
    const activeScoreCategory = matchCategory(mode, game.players.length as PlayerCount);
    const visibleScoreCategory = scoreView || activeScoreCategory;
    const visibleScore = stats.tables[visibleScoreCategory];
    const scorePlayers = allPlayers.slice(0, visibleScoreCategory === "ai" || visibleScoreCategory === "local-2" ? 2 : visibleScoreCategory === "local-3" ? 3 : 4);
    const counted = useRef(false);
    const outcome = result(game);
    const isReplay = replayIndex !== null;
    const shown = isReplay ? replay(game.history, replayIndex!, roundStarter, game.players.length as PlayerCount) : game;
    const shownOutcome = result(shown);
    const aiThinking = screen === "arena" && mode === "ai" && game.turn === "O" && !outcome && !isReplay && !confirm && !help;
    const interactive = screen === "arena" && !outcome && !isReplay && !(mode === "ai" && game.turn === "O");
    const availableSizes = sizes.filter(size => shown.inventory[shown.turn][size] > 0 && shown.board.some(cell => !cell[size]));
    const effective = availableSizes.includes(selected) ? selected : availableSizes[0] || selected;
    useEffect(() => { try {
        localStorage.setItem("sizewars.stats.v3", JSON.stringify(stats));
    }
    catch { } }, [stats]);
    useEffect(() => { if (outcome && !counted.current) {
        counted.current = true;
        const key = outcome === "draw" ? "draw" : outcome.player;
        STATS(previous => recordResult(previous, activeScoreCategory, key));
        VICTORY(true);
    } }, [outcome, activeScoreCategory]);
    const commit = useCallback((state: State, cell: number, size: Size) => {
        try {
            const next = applyMove(state, { cell, size, player: state.turn });
            G(next);
            const end = result(next);
            HINT(end ? (end === "draw" ? t("Nijedan igra\u010D nema legalan potez.") : t("Pobijedila je ") + teams[end.player].name.toLowerCase() + t(" boja!")) : t("Prsten je postavljen. Sljede\u0107i igra\u010D je na potezu."));
            play(end === "draw" ? "draw" : end ? "win" : "move",state.turn);
        }
        catch (e) {
            HINT((e as Error).message);
        }
    }, [play,t]);
    useEffect(() => { if (!aiThinking)
        return; const timer = setTimeout(() => { const move = aiMove(game, difficulty); if (move)
        commit(game, move.cell, move.size); }, 450); return () => clearTimeout(timer); }, [aiThinking, game, difficulty, commit]);
    useEffect(() => { if (!playing || replayIndex === null)
        return; if (replayIndex >= game.history.length) {
        PLAYING(false);
        return;
    } const timer = setTimeout(() => REPLAY(i => (i ?? 0) + 1), 800); return () => clearTimeout(timer); }, [playing, replayIndex, game.history.length]);
    useEffect(() => { function key(e: KeyboardEvent) { if (e.key === "Escape") {
        HELP(false);
        CONFIRM(null);
        VICTORY(false);
    } } window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, []);
    useEffect(() => {
        if (!help && !confirm && !victoryOpen)
            return;
        const previous = document.activeElement as HTMLElement | null;
        const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
        const dialog = dialogs[dialogs.length - 1];
        if (!dialog)
            return;
        const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,[tabindex="0"]'));
        focusables()[0]?.focus();
        const old = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const trap = (event: KeyboardEvent) => {
            if (event.key !== "Tab")
                return;
            const list = focusables(), first = list[0], last = list[list.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };
        document.addEventListener("keydown", trap);
        return () => { document.body.style.overflow = old; document.removeEventListener("keydown", trap); previous?.focus(); };
    }, [help, confirm, victoryOpen]);
    function reset(nextMode = mode, nextDifficulty = difficulty, nextCount = playerCount) { unlock(); const starter = nextMode === "ai" ? claimStarter("rings") : "X"; ROUNDSTARTER(starter); G(fresh(starter, nextMode === "ai" ? 2 : nextCount)); M(nextMode); D(nextDifficulty); PC(nextCount); SCOREVIEW(null); SEL("L"); REPLAY(null); PLAYING(false); counted.current = false; CONFIRM(null); VICTORY(false); HINT(starter === "X" ? t("Ti počinješ. Plava je tvoja boja.","You start. Blue is your colour.") : t("Računar počinje. Ti igraš plavom bojom.","AI starts. You play blue.")); }
    function requestReset() { if (game.history.length && !outcome)
        CONFIRM("restart");
    else
        reset(); }
    function showMenu() { DM(mode); DD(difficulty); DC(playerCount); SCREEN("setup"); CONFIRM(null); VICTORY(false); REPLAY(null); PLAYING(false); window.scrollTo({ top: 0 }); }
    function requestMenu() { if (game.history.length && !outcome)
        CONFIRM("menu");
    else
        showMenu(); }
    function startMatch() { reset(draftMode, draftDifficulty, draftCount); SCREEN("arena"); window.scrollTo({ top: 0 }); }
    function place(cell: number) { if (!interactive)
        return; unlock(); commit(game, cell, effective); }
    function startReplay() { if (!game.history.length)
        return; VICTORY(false); REPLAY(0); PLAYING(true); }
    const win = shownOutcome && shownOutcome !== "draw" ? shownOutcome : null;
    const turnText = isReplay ? t("Ponovni pregled") : outcome ? outcome === "draw" ? t("Nerije\u0161ena partija") : t("Pobijedila je ") + teams[outcome.player].name.toLowerCase() + t(" boja!") : aiThinking ? t("Ra\u010Dunar razmi\u0161lja\u2026") : teams[shown.turn].name + t(" je na potezu");
    function playerCard(player: Player) {
        const index = shown.players.indexOf(player), active = !shownOutcome && shown.turn === player;
        return <section key={player} className={"player-card " + teams[player].css + (active ? " active-player" : "")} aria-label={teams[player].team}>
   <div className="player-top"><span className="player-badge" aria-hidden="true"><i /></span><div><h2>{teams[player].team}</h2><p>{mode === "ai" ? (player === "X" ? t("Tvoja boja") : t("Ra\u010Dunarski protivnik")) : t("Igra\u010D ") + (index + 1)}</p></div><div className="inline-wins" aria-label={teams[player].name+" · "+t("Pobjede")+": "+stats.tables[activeScoreCategory][player]}><small>{t("Pobjede","Wins")}</small><strong>{stats.tables[activeScoreCategory][player]}</strong></div></div>
   <div className="inventory" role="group" aria-label={t("Prstenovi: ") + teams[player].name.toLowerCase() + t(" boja")}>{sizes.map(size => <button key={size} className={"inventory-item " + (active && effective === size ? "selected" : "")} disabled={!interactive || shown.turn !== player || shown.inventory[player][size] === 0 || !shown.board.some(cell => !cell[size])} aria-label={sizeNames[size] + " " + teams[player].adjective + t(" prsten, preostalo ") + shown.inventory[player][size]} aria-pressed={active && effective === size} onClick={() => { SEL(size); HINT(t("Odabran ") + sizeNames[size].toLowerCase() + t(" prsten. Klikni slobodno polje.")); }}><div className="inventory-ring-space"><span className={"sample-ring " + size}/></div><span className="size-name">{sizeNames[size]}</span><span className="remaining"><b>{shown.inventory[player][size]}</b><small> / 3</small></span></button>)}</div>
   <div className="player-bottom"><span>{sizes.reduce((n, size) => n + shown.inventory[player][size], 0)}{" "+t("prstenova u rezervi","rings in reserve")}</span><span className="player-state">{active ? t("NA POTEZU") : t("SPREMAN")}</span></div>
  </section>;
    }
    return <div className={"app " + theme + " screen-" + screen + " players-" + game.players.length}>
  <div className="ambient ambient-blue"/><div className="ambient ambient-red"/>
  <header className="header"><Brand onHome={()=>{if(screen==="arena"&&game.history.length&&!outcome)CONFIRM("hub");else onHome()}}/><span className="header-tag">{screen === "setup" ? t("MALA PLO\u010CA. VELIKA IGRA.") : game.players.length + t(" BOJE \u00B7 JEDNA ARENA")}</span><div className="header-controls"><MusicButton/><SoundButton/><LanguageSwitch/><button onClick={() => THEME(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? t("Svijetla tema") : t("Tamna tema")}>{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="help-button" onClick={() => HELP(true)}><HelpCircle size={17}/><span>{t("Pravila")}</span></button></div></header>
  {screen === "setup" ? <main className="setup-screen">
   <section className="setup-hero"><p className="eyebrow"><span />{" " + t("DOBRO DO\u0160AO U SIZE WARS")}</p><h1>{t("Tvoj sljede\u0107i")}<br /><span>{t("dobar potez.")}</span></h1><p className="hero-copy">{t("Nadmudri protivnike bojom, veli\u010Dinom")}<br className="desktop-break"/>{" " + t("i jednim savr\u0161eno postavljenim krugom.")}</p><div className="hero-token-art" aria-label={t("Veliki plavi prsten, srednji crveni prsten i popunjen zeleni centar")}><div className="token-orbit"/><div className="hero-token"><span className="demo-ring L"/><span className="demo-ring M"/><span className="demo-ring S"/></div><span className="token-tag tag-one"><i />{t("VELIKI PRSTEN")}</span><span className="token-tag tag-two"><i />{t("SREDNJI PRSTEN")}</span><span className="token-tag tag-three"><i />{t("MALI KRUG")}</span><span className="token-spark">✦</span></div><div className="hero-features"><span><Users size={15}/>{t("2\u20134 igra\u010Da")}</span><span><Bot size={15}/>{t("AI protivnik")}</span><span><Trophy size={15}/>{t("\u0160est na\u010Dina za pobjedu")}</span></div></section>
   <section className="setup-card" aria-labelledby="setup-title"><div className="setup-card-title"><span className="eyebrow">{t("POSTAVI SVOJU PARTIJU")}</span><h2 id="setup-title">{t("Kako \u017Eeli\u0161 igrati?")}</h2><p>{t("Izaberi ekipu. Ostalo te \u010Deka u areni.")}</p></div>
    <div className="mode-cards" role="group" aria-label={t("Na\u010Din igre")}>{(["ai", "local"] as Mode[]).map(option => <button key={option} className={draftMode === option ? "selected" : ""} onClick={() => DM(option)} aria-pressed={draftMode === option}><span className="mode-icon">{option === "ai" ? <Bot size={25}/> : <Users size={25}/>}</span><strong>{option === "ai" ? t("Protiv ra\u010Dunara") : t("S prijateljima")}</strong><small>{option === "ai" ? t("Ti protiv AI izaziva\u010Da") : t("2, 3 ili 4 na istom ure\u0111aju")}</small><span className="mode-check">{draftMode === option && <Check size={12}/>}</span></button>)}</div>
    {draftMode === "ai" ? <div className="setup-section"><div className="setup-label"><span>{t("TE\u017DINA PROTIVNIKA")}</span><span>01 — 03</span></div><div className="difficulty" role="group" aria-label={t("Te\u017Eina protivnika")}>{(["easy", "medium", "hard"] as Difficulty[]).map((level, i) => <button key={level} className={draftDifficulty === level ? "active" : ""} onClick={() => DD(level)} aria-pressed={draftDifficulty === level}><span className="difficulty-bars">{[0, 1, 2].map(j => <i key={j} className={j <= i ? "filled" : ""}/>)}</span>{[t("Lako"), t("Srednje"), t("Te\u0161ko")][i]}</button>)}</div><p className="setup-note">{draftDifficulty === "hard" ? t("Planira unaprijed. Svaki prsten je va\u017Ean.") : draftDifficulty === "medium" ? t("Pravi balans za dobru, neizvjesnu partiju.") : t("Upoznaj igru bez pritiska. Dobar prvi korak.")}</p></div> : <div className="setup-section"><div className="setup-label"><span>{t("KOLIKO VAS IGRA?")}</span><span>02 — 04</span></div><div className="player-count" role="group" aria-label={t("Broj igra\u010Da")}>{([2, 3, 4] as PlayerCount[]).map(count => <button key={count} className={draftCount === count ? "active" : ""} onClick={() => DC(count)} aria-pressed={draftCount === count}><strong>{count}</strong><span>{t("igra\u010Da")}</span></button>)}</div><p className="setup-note">{t("Svako bira svoje poteze. Svaka boja ima po 9 krugova.")}</p></div>}
    <div className="lineup"><span>{t("BOJE U PARTIJI")}</span><div>{allPlayers.slice(0, draftMode === "ai" ? 2 : draftCount).map(player => <span key={player} className={"lineup-colour " + teams[player].css}><i />{teams[player].name}</span>)}</div></div>{draftMode === "ai"&&<p className="starter-note"><RotateCcw size={12}/>{nextStarters.rings === "X" ? t("Sljedeću partiju počinješ ti.","You start the next game.") : t("Sljedeću partiju počinje računar.","AI starts the next game.")}</p>}<button className="start-game" onClick={startMatch}>{t("U\u0110I U ARENU")}<ArrowRight size={20}/></button><p className="start-note"><Check size={12}/>{t("Bez tajmera. Samo ti i sljede\u0107i dobar potez.")}</p>
   </section>
   <footer className="setup-footer"><span>{t("TRI VELI\u010CINE.") + " "}<b>{t("BESKRAJ DOBRIH PARTIJA.")}</b></span><span>TAC - TIQ / ADIN</span></footer>
  </main> : <main className="game-screen">
   <div className="match-header"><button className="menu-button" onClick={requestMenu}><ChevronLeft size={16}/>{t("Promijeni igru")}</button><div className="match-name"><strong>{mode === "ai" ? t("TI PROTIV RA\u010CUNARA") : game.players.length + t(" IGRA\u010CA U ARENI")}</strong><span>{mode === "ai" ? { easy: t("Lako"), medium: t("Srednje"), hard: t("Te\u0161ko") }[difficulty] : t("Lokalna partija")}<i />{t("Potez") + " "}{shown.history.length + (!shownOutcome ? 1 : 0)} / {Math.min(27, game.players.length * 9)}</span></div><button className="header-new-game" onClick={() => requestReset()}><RotateCcw size={15}/>{t("Nova partija")}</button></div>
   <div className="arena-layout">
    <aside className="player-lane left-lane" aria-label={t("Igra\u010Di lijevo od plo\u010De")}>{shown.players.filter((_, index) => index % 2 === 0).map(playerCard)}</aside>
    <section className="arena-center">
     <div className={"turn-banner " + (shownOutcome ? "finished" : teams[shown.turn].css)} role="status" aria-live="polite"><span className="turn-symbol">{shownOutcome ? <Trophy size={21}/> : isReplay ? <Play size={20}/> : <i />}</span><div><strong>{turnText}</strong><small>{isReplay ? t("Pogledaj svaki potez, od prvog do posljednjeg.") : shownOutcome ? shownOutcome === "draw" ? t("Nova partija, nova prilika.") : t("Odli\u010Dna kombinacija. Vrijeme za revan\u0161?") : aiThinking ? t("Ra\u010Dunar priprema svoj potez\u2026") : sizeNames[effective] + (effective === "S" ? t(" krug") : t(" prsten")) + t(" je odabran. Klikni slobodno polje.")}</small></div>{!shownOutcome && !isReplay && <span className={"turn-pulse " + (aiThinking ? "thinking" : "")}/>}</div>
     <div className={"mobile-picker " + teams[shown.turn].css} role="group" aria-label={t("Brzi odabir veli\u010Dine")}>{sizes.map(size => <button key={size} disabled={!interactive || !availableSizes.includes(size)} className={effective === size ? "selected" : ""} aria-pressed={effective === size} onClick={() => SEL(size)}><span className={"picker-ring " + size}/>{sizeNames[size]}<b>{shown.inventory[shown.turn][size]}</b></button>)}</div>
     <div className="board-frame"><div className="board-columns" aria-hidden="true"><span>1</span><span>2</span><span>3</span></div><div className="board-rows" aria-hidden="true"><span>A</span><span>B</span><span>C</span></div><div className={"board " + (aiThinking ? "thinking-board" : "")} role="group" aria-label={t("Plo\u010Da sa devet polja")}>{shown.board.map((cell, index) => { const legal = interactive && !cell[effective] && shown.inventory[shown.turn][effective] > 0; return <button key={index} className={"cell " + (legal ? "legal" : "") + (win?.cells.includes(index) ? " winning-cell" : "")} disabled={!legal} onClick={() => place(index)} aria-label={coords[index] + ": " + (sizes.filter(size => cell[size]).map(size => sizeNames[size] + " (" + teams[cell[size]!].name.toLowerCase() + t(" boja)"," colour)")).join(", ") || t("prazno")) + (legal ? t(", postavi ") + sizeNames[effective].toLowerCase() : "")}><span className="cell-guide" aria-hidden="true">+</span>{sizes.map(size => { const owner = cell[size]; return owner ? <motion.span key={size + owner} initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 350, damping: 23 }} className={"ring " + size + " owner-" + owner + (win && win.cells.some((c, i) => c === index && win.sizes[i] === size) ? " winning-ring" : "")}/> : null; })}{legal && <span className={"ghost-ring ring " + effective + " owner-" + shown.turn} aria-hidden="true"/>}<span className="cell-coord">{coords[index]}</span></button>; })}</div></div>
     <div className="board-hint" role="status"><Target size={13}/><span>{t(hint)}</span></div>
     {isReplay ? <div className="replay-controls"><button onClick={() => { PLAYING(false); REPLAY(i => Math.max(0, (i ?? 0) - 1)); }} disabled={replayIndex === 0} aria-label={t("Prethodni potez")}><ChevronLeft size={17}/></button><button onClick={() => PLAYING(!playing)} aria-label={playing ? t("Pauziraj replay") : t("Pokreni replay")}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button><input type="range" aria-label={t("Potez u ponovnom pregledu")} min={0} max={game.history.length} value={replayIndex!} onChange={e => { PLAYING(false); REPLAY(Number(e.target.value)); }}/><span>{replayIndex}/{game.history.length}</span><button onClick={() => { PLAYING(false); REPLAY(i => Math.min(game.history.length, (i ?? 0) + 1)); }} disabled={replayIndex === game.history.length} aria-label={t("Sljede\u0107i potez")}><ChevronRight size={17}/></button><button onClick={() => { REPLAY(null); PLAYING(false); }} aria-label={t("Zatvori replay")}><X size={17}/></button></div> : <div className="board-actions"><button className="new-game" onClick={() => requestReset()}><RotateCcw size={17}/>{t("Nova partija")}</button><button className="replay-button" disabled={!game.history.length || aiThinking} onClick={startReplay}><Play size={16}/>{t("Pregled poteza")}</button></div>}
     <button className="winning-guide" onClick={() => HELP(true)}><span className="guide-symbol"><ComboCell pieces={["L", "M", "S"]}/></span><span><strong>{t("Kako pobijediti?")}</strong><small>{t("Pogledaj kombinacije krugova")}</small></span><ArrowRight size={15}/></button>
    </section>
    <aside className="player-lane right-lane" aria-label={t("Igra\u010Di desno od plo\u010De")}>{shown.players.filter((_, index) => index % 2 === 1).map(playerCard)}<details className="side-details"><summary><Flag size={14}/>{t("Historija poteza")}<span className="history-count">{shown.history.length}</span></summary>{shown.history.length ? <ol className="history-list">{shown.history.slice(-6).reverse().map((move, index) => <li key={shown.history.length - index}><span className={"history-dot " + teams[move.player].css}/><span>{teams[move.player].name} · {sizeNames[move.size]}</span><strong>{coords[move.cell]}</strong></li>)}</ol> : <p className="history-empty">{t("Prvi krug pokre\u0107e pri\u010Du.")}</p>}</details></aside>
   </div>
   <AllScores rings={stats}><section className="scoreboard" aria-labelledby="scoreboard-title"><div className="scoreboard-heading"><Trophy size={16}/><h2 id="scoreboard-title">{t("Pobjede")}</h2></div><select aria-label={t("Pregled pobjeda")} value={visibleScoreCategory} onChange={event => SCOREVIEW(event.target.value as ScoreCategory)}>{scoreCategories.filter(category => category !== "legacy" || scoreTotal(stats.tables.legacy) > 0 || visibleScoreCategory === "legacy").map(category => <option key={category} value={category}>{t(categoryLabels[category])}</option>)}</select><div className="score-list">{scorePlayers.map(player => <div key={player} className={teams[player].css}><span><i />{visibleScoreCategory === "ai" ? (player === "X" ? t("Ti \u00B7 Plava") : t("AI \u00B7 Crvena")) : teams[player].name}</span><strong>{visibleScore[player]}</strong></div>)}<div className="draw-score"><span>{t("Nerije\u0161eno")}</span><strong>{visibleScore.draw}</strong></div></div><div className="scoreboard-bottom"><span>{scoreTotal(visibleScore)}{" " + t("partija")}</span><button disabled={scoreTotal(visibleScore) === 0 && scoreCategories.every(category => scoreTotal(stats.tables[category]) === 0)} onClick={() => { CLEARSCOPE("current"); CONFIRM("clear-scores"); }} aria-label={t("Obri\u0161i historiju pobjeda")}><RotateCcw size={12}/>{t("Obri\u0161i rezultate")}</button></div></section></AllScores><footer className="match-footer"><span><Check size={12}/>{t("Odaberi veli\u010Dinu. Izaberi polje. Nadmudri protivnike.")}</span><button onClick={() => HELP(true)}>{t("Kako pobijediti?")}<HelpCircle size={13}/></button></footer>
  </main>}
  <AnimatePresence>{victoryOpen && outcome && !isReplay && <motion.div className="modal-overlay victory-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className={"modal victory-modal " + (outcome === "draw" ? "draw" : teams[outcome.player].css)} initial={{ scale: .85, y: 25 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 22 }} role="dialog" aria-modal="true" aria-labelledby="victory-title"><button className="modal-close" onClick={() => VICTORY(false)} aria-label={t("Zatvori rezultat")}><X size={20}/></button><div className="victory-particles" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <span key={i} style={{ left: ((i * 31) % 100) + "%", top: ((i * 23) % 100) + "%", animationDelay: (i % 5) * .15 + "s" }}/>)}</div><div className="victory-emblem"><Trophy size={43} strokeWidth={1.5}/></div><p className="eyebrow">{t("PARTIJA JE ZAVR\u0160ENA")}</p><h2 id="victory-title">{outcome === "draw" ? t("Nerije\u0161ena partija") : <>{t("Pobijedila je")}<br /><span>{teams[outcome.player].name.toLowerCase()}{" " + t("boja!")}</span></>}</h2><p>{outcome === "draw" ? t("Svi legalni potezi su odigrani. Vrijeme je za revan\u0161.") : outcome.kind === "stack" ? t("Veliki, srednji i mali u jednom polju \u2014 sve u tvojoj boji!") : t("Tri prstena u pravoj liniji. Ova arena ima svog pobjednika.")}</p><div className="victory-actions"><button autoFocus className="new-game" onClick={() => reset()}><RotateCcw size={16}/>{t("Nova partija")}</button><button className="replay-button" onClick={() => { VICTORY(false); startReplay(); }}><Play size={15}/>{t("Pogledaj poteze")}</button></div><button className="view-board" onClick={() => VICTORY(false)}>{t("Pogledaj pobjedni\u010Dku plo\u010Du")}<ArrowRight size={14}/></button></motion.div></motion.div>}</AnimatePresence>
  <AnimatePresence>{help && <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={event => { if (event.target === event.currentTarget)
        HELP(false); }}><div className="modal combinations-modal" role="dialog" aria-modal="true" aria-labelledby="combination-title"><button className="modal-close" autoFocus onClick={() => HELP(false)} aria-label={t("Zatvori pravila")}><X size={20}/></button><span className="eyebrow">{t("POGLEDAJ. SPOJI. POBIJEDI.")}</span><h2 id="combination-title">{t("Ovako se pobje\u0111uje.")}</h2><p className="combinations-intro">{t("Svaka slika pokazuje jednu pobjedni\u010Dku kombinaciju. Krugovi moraju biti tvoje boje.")}</p><div className="combination-grid">{combinations.map((combo, index) => <section className={"combination-card " + (index === 5 ? "stack-combination" : "")} key={combo.title}><div className="combination-title"><span>0{index + 1}</span><h3>{combo.title}</h3><Check size={13}/></div><div className="combination-diagram" role="img" aria-label={combo.description}>{combo.pieces.map((pieces, i) => <ComboCell key={i} pieces={pieces}/>)}</div><p>{index === 5 ? t("Sve tri veli\u010Dine u istom polju.") : index < 3 ? t("Ista veli\u010Dina u tri polja.") : t("Tri veli\u010Dine u pravom redoslijedu.")}</p></section>)}</div><div className="orientation-examples" aria-label={t("Dozvoljeni smjerovi linije")}>{[{ name: t("Vodoravno"), cells: [3, 4, 5] }, { name: t("Uspravno"), cells: [1, 4, 7] }, { name: t("Dijagonalno"), cells: [0, 4, 8] }].map(example => <div key={example.name}><span className="orientation-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} className={example.cells.includes(index) ? "connected" : ""}/>)}</span><span>{example.name}</span></div>)}</div><div className="rules-reminder"><span><Target size={16}/></span><p>{t("Linija mo\u017Ee biti") + " "}<strong>{t("vodoravna, uspravna ili dijagonalna.")}</strong>{" " + t("Pravila vrijede za sve boje. Svako ima po 3 velika, 3 srednja i 3 mala kruga. Razli\u010Dite veli\u010Dine mogu dijeliti polje, ali svaka veli\u010Dina samo jednom.")}</p></div><button className="new-game modal-cta" onClick={() => HELP(false)}>{t("Jasno, idemo igrati")}<ArrowRight size={16}/></button></div></motion.div>}</AnimatePresence>
  {confirm && <div className="modal-overlay"><div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><RotateCcw size={28}/><h2 id="confirm-title">{confirm === "clear-scores" ? t("Obrisati pobjede?") : confirm === "hub" ? t("Vratiti se na početni ekran?","Return to dashboard?") : confirm === "menu" ? t("Promijeniti igru?") : t("Po\u010Deti ispo\u010Detka?")}</h2><p>{confirm === "clear-scores" ? t("Izaberi koje rezultate \u017Eeli\u0161 obrisati. Trenutna partija se nastavlja.") : confirm === "hub" ? t("Vraćaš se na glavni ekran. Trenutna partija će biti prekinuta, a rezultati ostaju sačuvani.","Return to the dashboard? Your current game will end and your scores will stay saved.") : confirm === "menu" ? t("Vra\u0107a\u0161 se na izbor na\u010Dina igre. Trenutna partija \u0107e biti prekinuta.") : t("Trenutna partija \u0107e biti prekinuta. Zabilje\u017Eeni rezultati ostaju sa\u010Duvani.")}</p>{confirm === "clear-scores" && <fieldset className="clear-scope"><legend>{t("Historija pobjeda")}</legend><label><input type="radio" name="clear-scope" checked={clearScope === "current"} onChange={() => CLEARSCOPE("current")}/><span>{t("Samo") + " "}{t(categoryLabels[visibleScoreCategory]).toLowerCase()}<small>{scoreTotal(visibleScore)}{" " + t("sa\u010Duvanih partija")}</small></span></label><label><input type="radio" name="clear-scope" checked={clearScope === "all"} onChange={() => CLEARSCOPE("all")}/><span>{t("Svi rezultati")}<small>{t("Sve kategorije na ovom ure\u0111aju")}</small></span></label></fieldset>}<div><button autoFocus className="replay-button" onClick={() => CONFIRM(null)}>{confirm === "clear-scores" ? t("Odustani") : t("Nastavi partiju")}</button><button className={"new-game " + (confirm === "clear-scores" ? "clear-confirm" : "")} onClick={() => { if (confirm === "clear-scores") {
        STATS(previous => clearResults(previous, clearScope === "all" ? "all" : visibleScoreCategory));
        CONFIRM(null);
    }
    else if (confirm === "hub")
                onHome();
            else if (confirm === "menu")
        showMenu();
    else
        reset(); }}>{confirm === "clear-scores" ? t("Obri\u0161i pobjede") : confirm === "hub" ? t("Na početni ekran","Back to dashboard") : confirm === "menu" ? t("U po\u010Detni meni") : t("Nova partija")}<ArrowRight size={15}/></button></div></div></div>}
 </div>;
}
