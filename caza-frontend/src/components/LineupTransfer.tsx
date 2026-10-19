import React, { useRef } from 'react';
import toast from 'react-hot-toast';
interface Props { userId: number; storageKey: string; formations: string[] }
export default function LineupTransfer({userId, storageKey, formations}: Props) {
 const input = useRef<HTMLInputElement>(null);
 function download() {
   const lineups = JSON.parse(localStorage.getItem(storageKey) || '[]');
   const url = URL.createObjectURL(new Blob([JSON.stringify({version:1,userId,lineups},null,2)],{type:'application/json'}));
   const a=document.createElement('a'); a.href=url; a.download=`caza-alineaciones-${userId}.json`; a.click(); URL.revokeObjectURL(url);
 }
 async function restore(file?: File) {
   if(!file) return;
   try {
     if(file.size>5*1024*1024) throw new Error('Archivo demasiado grande');
     const data=JSON.parse(await file.text());
     if(data.version!==1 || data.userId!==userId || !Array.isArray(data.lineups)) throw new Error('El archivo debe pertenecer a esta cuenta');
     for(const l of data.lineups) {
       if(typeof l.id!=='string' || typeof l.name!=='string' || !formations.includes(l.formationKey) || !['FIFA','EFOOTBALL'].includes(l.gameType) || !['MI_EQUIPO','POTENCIAL'].includes(l.teamMode) || !l.lineup || typeof l.lineup!=='object') throw new Error('Alineación inválida');
       for(const [slot,p] of Object.entries(l.lineup) as [string, any][]) {
         if(!/^([0-9]|10)$/.test(slot) || !p || !Number.isSafeInteger(p.id) || typeof p.nombre!=='string') throw new Error('Jugador inválido');
         if(p.imagenUrl && !/^(https?:\/\/|\/)/.test(p.imagenUrl)) delete p.imagenUrl;
       }
     }
     const current=JSON.parse(localStorage.getItem(storageKey)||'[]');
     const seen=new Set(current.map((l: any)=>l.id));
     localStorage.setItem(storageKey,JSON.stringify([...current,...data.lineups.filter((l: any)=>!seen.has(l.id))]));
     window.location.reload();
   } catch(e) { toast.error(e instanceof Error ? e.message : 'No se pudo importar'); }
 }
 return <div className="flex gap-2 mb-4 flex-wrap">
   <button className="btn-secondary" onClick={download}>Exportar mis alineaciones</button>
   <button className="btn-secondary" onClick={()=>input.current?.click()}>Importar alineaciones</button>
   <input ref={input} type="file" accept="application/json" hidden onChange={e=>restore(e.target.files?.[0])}/>
 </div>;
}
