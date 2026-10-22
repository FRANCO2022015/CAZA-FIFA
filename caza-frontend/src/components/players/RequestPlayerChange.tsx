import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Send,ChevronDown} from 'lucide-react';
import type {Player,Jugador} from '../../types';
import {playerChangesApi,changeLabels} from '../../api/playerChanges';
import {useAuth} from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RequestPlayerChange({player,game}:{player:Player|Jugador;game:'FIFA'|'EFOOTBALL'}) {
 const {user}=useAuth();const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
 const [values,setValues]=useState<Record<string,string>>({}),[reason,setReason]=useState(''),[error,setError]=useState('');
 const seasons=game==='FIFA'?(player as Player).stats??[]:[];
 const [statsId,setStatsId]=useState(seasons[0]?.id);
 if(!user||user.rol==='ADMIN')return null;
 const fields=game==='FIFA'?['nombre','nacionalidad','posicion','edad','precio','imagenUrl','hologramUrl',...(statsId?['goles','asistencias','partidosJugados']:[])]:['nombre','goles','asistencias','partidos','precio','imagenUrl','hologramUrl'];
 const source=(field:string)=>game==='FIFA'&&['goles','asistencias','partidosJugados'].includes(field)?seasons.find(s=>s.id===statsId):player;
 const current=(field:string)=>String((source(field) as unknown as Record<string,unknown>)?.[field]??'');
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();if(busy)return;
  const changes=Object.fromEntries(Object.entries(values).filter(([k,v])=>v.trim()!==current(k)));
  if(!Object.keys(changes).length){setError('Modifica al menos un campo para enviar tu propuesta.');return;}
  setBusy(true);setError('');
  try{await playerChangesApi.create({game,playerId:player.id,statsId,changes,reason});setSent(true);setOpen(false);setValues({});setReason('');toast.success('Solicitud enviada al administrador');window.dispatchEvent(new Event('player-requests-changed'));}
  catch(e:any){setError(e.response?.data?.message??'No se pudo enviar la solicitud. Inténtalo nuevamente.');}
  finally{setBusy(false);}
 };
 return <section className="request-panel mt-6">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><p className="eyebrow">DATOS EN EQUIPO</p><h2 className="font-semibold text-lg mt-1">¿Hay algo que corregir?</h2><p className="text-sm text-gray-400 mt-1">Propón una actualización. El administrador revisará los cambios.</p></div>
   <button className="btn-secondary" onClick={()=>setOpen(!open)} aria-expanded={open}><Send size={16}/> Solicitar cambio <ChevronDown size={16}/></button>
  </div>
  {sent&&<p role="status" className="text-emerald-300 text-sm mt-4">Solicitud pendiente. <Link className="underline" to="/requests">Ver mis solicitudes</Link></p>}
  {open&&<form onSubmit={submit} className="mt-6 space-y-5">
   {seasons.length>0&&<label className="block text-sm">Temporada a corregir<select className="input-dark mt-2" value={statsId} disabled={busy} onChange={e=>{setStatsId(Number(e.target.value));setValues({});}}>{seasons.map(s=><option value={s.id} key={s.id}>{s.temporada}</option>)}</select></label>}
   {game==='FIFA'&&!seasons.length&&<p className="text-sm text-gray-400">Este jugador aún no tiene temporadas. El administrador puede crearlas.</p>}
   <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-4">
    {fields.map(field=><label className="block text-sm min-w-0" key={field}>{changeLabels[field]}
     {field==='posicion'?<select className="input-dark mt-2" value={values[field]??current(field)} onChange={e=>setValues({...values,[field]:e.target.value})}>{['PORTERO','DEFENSA','CENTROCAMPISTA','DELANTERO'].map(p=><option key={p}>{p}</option>)}</select>:
      <input className="input-dark mt-2" type={['edad','precio','goles','asistencias','partidos','partidosJugados'].includes(field)?'number':field.endsWith('Url')?'url':'text'}
       min={field==='edad'?16:0} max={field==='edad'?45:field==='precio'?500:100000} step={field==='precio'?'0.01':1} maxLength={field.endsWith('Url')?500:field==='nacionalidad'?100:game==='FIFA'?150:200}
       required={!field.endsWith('Url')} value={values[field]??current(field)} onChange={e=>setValues({...values,[field]:e.target.value})}/>}
     <span className="block text-xs text-gray-500 mt-1 truncate">Actual: {current(field)||'Sin imagen'}</span>
    </label>)}
   </fieldset>
   <label className="block text-sm">Motivo de la corrección<textarea className="input-dark mt-2" rows={3} minLength={5} maxLength={1000} required disabled={busy} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explica de dónde provienen los nuevos datos…"/></label>
   {error&&<p role="alert" className="text-rose-300">{error}</p>}
   <div className="flex flex-wrap gap-3"><button className="btn-primary" disabled={busy}>{busy?'Enviando…':'Enviar propuesta'}</button><button className="btn-secondary" type="button" disabled={busy} onClick={()=>setOpen(false)}>Cerrar</button></div>
  </form>}
 </section>;
}
