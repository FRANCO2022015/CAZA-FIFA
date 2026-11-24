import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/axiosConfig';
import { buildTimeline, firstOvertake, type Snapshot, type Metric } from '../utils/comparison';

type Option = {id:number; nombre:string};
const labels:Record<Metric,string>={goles:'Goles',asistencias:'Asistencias',partidos:'Partidos'};
const date=(time:number)=>new Date(time).toLocaleString('es-PE');
export default function ComparisonPage(){
 const [game,setGame]=useState('EFOOTBALL');
 const [options,setOptions]=useState<Option[]>([]);
 const [first,setFirst]=useState(''),[second,setSecond]=useState('');
 const [metric,setMetric]=useState<Metric>('goles');
 const [history,setHistory]=useState<Snapshot[]>([]);
 const [error,setError]=useState(''),[loading,setLoading]=useState(false);
 const [revision,setRevision]=useState(0);
 const [hover,setHover]=useState<number|null>(null);
 useEffect(()=>{let active=true;setOptions([]);setFirst('');setSecond('');setHistory([]);setError('');
  api.get('/history/players',{params:{game}}).then(r=>{if(active)setOptions(r.data.data);}).catch(()=>{if(active)setError('No se pudo cargar el historial. Vuelve a intentarlo.');});
  return()=>{active=false;};
 },[game]);
 useEffect(()=>{let active=true;setHistory([]);setHover(null);setLoading(false);if(!first||!second||first===second)return;
  setLoading(true);setError('');
  api.get('/history',{params:{game,first,second}}).then(r=>{if(active)setHistory(r.data.data);}).catch(()=>{if(active)setError('No se pudo cargar la comparación.');}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[game,first,second,revision]);
 const points=useMemo(()=>buildTimeline(history,Number(first),Number(second),metric),[history,first,second,metric]);
 const crossing=firstOvertake(points);
 const names=[options.find(p=>p.id===Number(first))?.nombre??'Jugador A',options.find(p=>p.id===Number(second))?.nombre??'Jugador B'];
 const max=Math.max(1,...points.flatMap(p=>[p.a??0,p.b??0]));
 const start=points[0]?.time??0,end=points[points.length-1]?.time??start;
 const x=(t:number)=>60+(t-start)/Math.max(1,end-start)*880;
 const y=(n:number)=>320-n/max*260;
 function path(key:'a'|'b'){
  let d='',previous:number|null=null;
  for(const point of points){const v=point[key];if(v===null)continue;
   d+=previous===null?`M ${x(point.time)} ${y(v)}`:` H ${x(point.time)} V ${y(v)}`;previous=v;
  } return d;
 }
 const selected=hover===null?null:points[hover];
 return <Layout><div className="space-y-6">
  <header><p className="text-purple-300 text-sm uppercase tracking-widest">Football Lab / Evolución</p><h1 className="text-3xl font-bold mt-2">Comparar jugadores</h1><p className="text-gray-400 mt-2">Cada punto representa una actualización registrada. FIFA suma todas las temporadas.</p></header>
  <section className="rounded-2xl border border-white/10 bg-white/5 p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
   <label>Juego<select className="input-dark mt-2" value={game} onChange={e=>setGame(e.target.value)}><option value="EFOOTBALL">eFootball</option><option value="FIFA">FIFA</option></select></label>
   {[first,second].map((value,i)=><label key={i}>Jugador {i===0?'A':'B'}<select aria-label={i===0?"Jugador A":"Jugador B"} className="input-dark mt-2" value={value} onChange={e=>(i===0?setFirst:setSecond)(e.target.value)}><option value="">Selecciona un jugador</option>{[...options].sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(p=><option key={p.id} value={p.id} disabled={String(p.id)===(i===0?second:first)}>{p.nombre} · #{p.id}</option>)}</select></label>)}
   <label>Estadística<select className="input-dark mt-2" value={metric} onChange={e=>{setMetric(e.target.value as Metric);setHover(null);}}>{Object.entries(labels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
  </section>
  {error&&<p role="alert" className="text-red-300">{error}</p>}
  {loading&&<p role="status">Cargando evolución…</p>}
  {!first||!second?<p className="text-gray-400">Elige dos jugadores para ver su evolución.</p>:!loading&&points.length===0?<p>No hay registros para esta selección.</p>:null}
  {points.length>0&&<section className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-6">
   <div className="flex gap-6 flex-wrap"><span className="text-violet-300">● A · {names[0]}</span><span className="text-emerald-300">● B · {names[1]}</span><strong>{labels[metric]}</strong><button type="button" disabled={loading} onClick={()=>setRevision(v=>v+1)} className="ml-auto text-sm text-purple-300">Actualizar datos</button></div>
   <svg viewBox="0 0 1000 380" className="w-full min-h-52" role="img" aria-label={`Evolución de ${labels[metric]} de ${names.join(' y ')}`}>
    {[0,1,2,3,4].map(n=><g key={n}><line x1="60" x2="940" y1={y(max*n/4)} y2={y(max*n/4)} stroke="#ffffff15"/><text x="50" y={y(max*n/4)+5} textAnchor="end" fill="#94a3b8" fontSize="13">{Math.round(max*n/4)}</text></g>)}
    <path d={path('a')} stroke="#a78bfa" fill="none" strokeWidth="3"/><path d={path('b')} stroke="#34d399" fill="none" strokeWidth="3"/>
    {points.map((point,i)=><g key={point.time}>{(['a','b'] as const).map((k,j)=>point[k]!==null&&<circle key={k} cx={x(point.time)} cy={y(point[k]!)} r={hover===i?7:4} fill={j===0?'#a78bfa':'#34d399'} tabIndex={0} aria-label={`${names[j]}: ${point[k]}, ${date(point.time)}`} onFocus={()=>setHover(i)} onMouseEnter={()=>setHover(i)} onClick={()=>setHover(i)}><title>{date(point.time)} · {names[j]}: {point[k]}</title></circle>)}</g>)}
    <text x="60" y="355" fill="#94a3b8" fontSize="13">{new Date(start).toLocaleDateString('es-PE')}</text><text x="940" y="355" textAnchor="end" fill="#94a3b8" fontSize="13">{new Date(end).toLocaleDateString('es-PE')}</text>
   </svg>
   <div aria-live="polite" className="text-sm text-gray-300 min-h-8">{selected?`${date(selected.time)} — A: ${selected.a??'sin registro'} · B: ${selected.b??'sin registro'}`:'Pasa el cursor, toca un punto o selecciónalo con Tab para ver fecha y valores.'}</div>
   <p className="mt-4 text-emerald-300">{crossing?`${names[1]} superó a ${names[0]} el ${date(crossing.time)}; transcurrieron ${(crossing.elapsed/86400000).toFixed(2)} días desde el primer registro compartido.`:'No hay un adelantamiento de B sobre A registrado (pasar de igual o inferior a superior).'}</p>
   <p className="text-gray-400 text-sm mt-3">El historial comienza cuando se activa esta función. Los tramos horizontales mantienen el último dato conocido; no representan goles añadidos automáticamente ni actividad entre actualizaciones.</p>
   <details className="mt-4"><summary className="cursor-pointer">Ver datos y fechas exactas</summary><div className="max-h-80 overflow-auto"><table className="w-full text-sm text-left"><thead><tr><th>Actualización</th><th>{names[0]}</th><th>{names[1]}</th></tr></thead><tbody>{points.map(p=><tr key={p.time} className="border-t border-white/10"><td className="py-2">{date(p.time)}</td><td>{p.a??'—'}</td><td>{p.b??'—'}</td></tr>)}</tbody></table></div></details>
  </section>}
 </div></Layout>;
}
