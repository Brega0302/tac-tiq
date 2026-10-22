import React,{createContext,useCallback,useContext,useRef,useState}from'react';
import{advanceStarter,readStarters,type GameKind,type Starter,type StarterHistory}from'./rounds.ts';
const Context=createContext<{nextStarters:StarterHistory;claimStarter:(game:GameKind)=>Starter}|null>(null);
export function RoundProvider({children}:{children:React.ReactNode}){
 const[nextStarters,setNext]=useState(()=>{try{return readStarters(localStorage.getItem('taktixo.ai-starters.v1'))}catch{return readStarters(null)}});const current=useRef(nextStarters);
 const claimStarter=useCallback((game:GameKind)=>{const{starter,next}=advanceStarter(current.current,game);current.current=next;setNext(next);try{localStorage.setItem('taktixo.ai-starters.v1',JSON.stringify(next))}catch{}return starter},[]);
 return <Context.Provider value={{nextStarters,claimStarter}}>{children}</Context.Provider>;
}
export function useRounds(){const value=useContext(Context);if(!value)throw new Error('RoundProvider is required');return value}
