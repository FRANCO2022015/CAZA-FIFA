import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
export default function PlayerStatsChart({goles,asistencias,partidos,label='Estadísticas actuales'}:
 {goles:number;asistencias:number;partidos:number;label?:string}) {
 const [active,setActive]=useState<string|null>(null);
 const id=useId();
 const stats=[{name:'Goles',value:goles,color:'#fbbf24'},{name:'Asistencias',value:asistencias,color:'#8b9dff'},{name:'Partidos',value:partidos,color:'#34d399'}];
 const max=Math.max(1,...stats.map(s=>s.value));
 return <section className="stats-chart" aria-labelledby={id}>
  <h2 id={id} className="text-sm text-gray-400 mb-4">{label}</h2>
  {stats.map(s=><button key={s.name} type="button" className={`stat-bar-row ${active===s.name?'is-active':''}`}
   style={{'--bar-color':s.color} as CSSProperties}
   onMouseEnter={()=>setActive(s.name)} onMouseLeave={()=>setActive(null)}
   onFocus={()=>setActive(s.name)} onBlur={()=>setActive(null)} onClick={()=>setActive(s.name)}
   aria-label={`${s.name}: ${s.value}`}>
    <span className="stat-bar-heading"><span>{s.name}</span><strong>{s.value.toLocaleString('es-PE')}</strong></span>
    <span className="stat-bar-track"><span className="stat-bar-fill" style={{width:`${s.value/max*100}%`}}/></span>
    <span className="stat-bar-tip" aria-hidden="true">{s.value} {s.name.toLowerCase()}</span>
  </button>)}
 </section>;
}
