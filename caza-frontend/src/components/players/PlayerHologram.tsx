import { useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
interface Props { name: string; image?: string; cutout?: string; game: 'FIFA' | 'EFOOTBALL' }
export default function PlayerHologram({name,image,cutout,game}: Props) {
 const [failed,setFailed]=useState<string[]>([]);
 const source=[cutout,image].find(url=>url && !failed.includes(url));
 const move=(e:PointerEvent<HTMLDivElement>)=>{
   if(e.pointerType!=='mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
   const box=e.currentTarget.getBoundingClientRect();
   e.currentTarget.style.setProperty('--tilt-x',`${-(e.clientY-box.top-box.height/2)/box.height*8}deg`);
   e.currentTarget.style.setProperty('--tilt-y',`${(e.clientX-box.left-box.width/2)/box.width*10}deg`);
 };
 return <div className={`holo-stage ${game==='FIFA'?'holo-fifa':'holo-football'}`}
   onPointerMove={move} onPointerLeave={e=>{e.currentTarget.style.setProperty('--tilt-x','0deg');e.currentTarget.style.setProperty('--tilt-y','0deg');}}>
   <span className="holo-caption">{game==='FIFA'?'FIFA':'eFootball'} / FICHA DEL JUGADOR</span>
   <div className="holo-aura" aria-hidden="true"/>
   <div className="holo-portrait">
    {source ? <img className={source===cutout?'holo-cutout':'holo-photo'} src={source} alt={name}
      onError={()=>setFailed(f=>[...f,source])}/> : <div className="holo-initial">{name.charAt(0)}</div>}
   </div>
   <div className="holo-scan" aria-hidden="true"/>
   <div className="holo-rings" aria-hidden="true"/>
   <div className="holo-particles" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} style={{'--i':i} as CSSProperties}/>)}</div>
 </div>;
}
