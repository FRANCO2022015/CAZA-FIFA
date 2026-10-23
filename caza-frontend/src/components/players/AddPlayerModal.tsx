import { EFOOTBALL_POSITIONS, type EfootballPosition } from '../../utils/efootballPositions';
import {useEffect,useRef,useState} from 'react';
import {X,Plus,Save} from 'lucide-react';
import type {Player,Jugador,PlayerStats} from '../../types';
import {playersApi} from '../../api/players';
import {jugadoresApi} from '../../api/jugadores';
import api from '../../api/axiosConfig';
import {useAuth} from '../../hooks/useAuth';
import ImageUploader from './ImageUploader';
import toast from 'react-hot-toast';
interface Props {isOpen:boolean;section:'FIFA'|'EFOOTBALL';editingPlayer?:Player|null;editingJugador?:Jugador|null;onClose:()=>void;onSuccess:()=>void}
type Season=Omit<PlayerStats,'id'|'playerId'>&{id?:number};
const blankSeason=():Season=>({temporada:'',goles:0,asistencias:0,partidosJugados:0});
const initial=()=>({nombre:'',nacionalidad:'',posicion:'DELANTERO' as Player['posicion'],edad:22,precio:500,partidos:0,goles:0,asistencias:0,imagenUrl:'',hologramUrl:''});
export default function AddPlayerModal({isOpen,section,editingPlayer,editingJugador,onClose,onSuccess}:Props){
 const {user}=useAuth();const [form,setForm]=useState(initial);
 const [efPosition,setEfPosition]=useState<EfootballPosition | ''>('');
 const [seasons,setSeasons]=useState<Season[]>([]);
 const [busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
 const [errors,setErrors]=useState<Record<string,string>>({});
 const dialog=useRef<HTMLDivElement>(null);const saving=useRef(false);
 const [uploadCount,setUploadCount]=useState(0);
 const uploading=uploadCount>0;
 const setUploading=(value:boolean)=>setUploadCount(n=>Math.max(0,n+(value?1:-1)));
 const editing=!!(editingPlayer||editingJugador);
 useEffect(()=>{
  if(!isOpen)return;
  const p=editingPlayer??editingJugador;
  setEfPosition(editingJugador?.posicion??'');
  setForm({...initial(),...p,posicion:editingPlayer?.posicion??'DELANTERO',imagenUrl:p?.imagenUrl??'',hologramUrl:p?.hologramUrl??''});
  setSeasons(editingPlayer?.stats?.map(s=>({...s}))??[]);
  setDirty(false);setErrors({});
  const previous=document.activeElement as HTMLElement|null;
  requestAnimationFrame(()=>dialog.current?.querySelector<HTMLElement>('input,button')?.focus());
  return ()=>previous?.focus();
 },[isOpen,editingPlayer?.id,editingJugador?.id]);
 const close=()=>{if(saving.current||uploading)return;if(dirty&&!confirm('Tienes cambios sin guardar. ¿Descartarlos?'))return;onClose()};
 useEffect(()=>{
  if(!isOpen)return;
  const unload=(e:BeforeUnloadEvent)=>{if(dirty||busy||uploading){e.preventDefault();e.returnValue='';}};
  const keys=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();close();}
   if(e.key==='Tab'){
    const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,[tabindex="0"]');
    if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  };
  window.addEventListener('beforeunload',unload);document.addEventListener('keydown',keys);
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('keydown',keys)};
 },[isOpen,dirty,busy,uploading]);
 const change=(key:keyof ReturnType<typeof initial>,value:string|number)=>{
  setForm(f=>({...f,[key]:value}));setDirty(true);setErrors(e=>({...e,[key]:''}));
 };
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();if(saving.current||uploading)return;
  const invalid:Record<string,string>={};
  if(!form.nombre.trim())invalid.nombre='Escribe el nombre.';
  if(form.precio<0||form.precio>500)invalid.precio='El precio debe estar entre 0 y 500.';
  if(section==='FIFA'&&!form.nacionalidad.trim())invalid.nacionalidad='Escribe la nacionalidad.';
  if(seasons.some(s=>!s.temporada.trim()))invalid.seasons='Completa el nombre de cada temporada.';
  if(new Set(seasons.map(s=>s.temporada.trim().toLowerCase())).size!==seasons.length)invalid.seasons='No repitas temporadas.';
  if(Object.keys(invalid).length){setErrors(invalid);return;}
  saving.current=true;setBusy(true);setErrors({});
  try{
   if(section==='FIFA'){
    if(editingPlayer) await api.put(`/admin/players/${editingPlayer.id}`,{player:form,seasons:seasons.map(s=>({id:s.id,values:s}))});
    else {
     // Creation and initial season are one backend transaction.
     await playersApi.create({...form,initialStats:seasons[0]});
    }
   }else{
    const payload={...form,posicion:efPosition};
    if(editingJugador)await jugadoresApi.update(editingJugador.id,payload);else await jugadoresApi.create(payload);
   }
   setDirty(false);toast.success('Jugador y estadísticas guardados');onSuccess();onClose();
  }catch(err:any){
   setErrors({...err?.response?.data?.fieldErrors,_form:err?.response?.data?.message||'No se pudo guardar. Tus cambios siguen aquí; vuelve a intentarlo.'});
  }finally{saving.current=false;setBusy(false);}
 };
 if(!isOpen)return null;
 const field=(key:keyof ReturnType<typeof initial>,label:string,type='text',min?:number,max?:number)=><label className="block text-sm text-gray-300" key={key}>{label}
  <input name={key} className="input-dark mt-1" type={type} value={form[key]} min={min} max={max} required
   step={key==='precio'?'0.01':type==='number'?1:undefined} maxLength={type==='text'?150:undefined}
   aria-invalid={!!errors[key]} aria-describedby={errors[key]?`error-${key}`:undefined}
   onChange={e=>change(key,type==='number'?Number(e.target.value):e.target.value)}/>
  {errors[key]&&<span id={`error-${key}`} className="text-red-300 text-xs">{errors[key]}</span>}</label>;
 return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80">
  <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="player-editor-title" className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#12122A]">
   <header className="sticky top-0 z-10 bg-[#12122A] p-5 border-b border-white/10 flex justify-between">
    <div><h2 id="player-editor-title" className="text-xl font-bold">{editing?'Editar jugador':'Nuevo jugador'} · {section}</h2><p className="text-xs text-gray-400 mt-1">{dirty?'Cambios pendientes de guardar':'Información del jugador'}</p></div>
    <button type="button" onClick={close} disabled={busy} aria-label="Cerrar editor"><X/></button>
   </header>
   {user?.rol!=='ADMIN'?<p className="p-6">Solo el administrador puede editar jugadores.</p>:<form onSubmit={submit} className="p-5 space-y-6">
    <fieldset disabled={busy} className="space-y-6">
     <section><h3 className="font-bold mb-3">Información general</h3><div className="grid sm:grid-cols-2 gap-4">
      {field('nombre','Nombre')}{field('precio','Precio','number',0,500)}
      {section==='EFOOTBALL'&&<label className="text-sm">Posición
       <select className="input-dark mt-1" value={efPosition} aria-invalid={!!errors.posicion}
        onChange={e=>{setEfPosition(e.target.value as EfootballPosition | '');setDirty(true);setErrors(v=>({...v,posicion:''}));}}>
        <option value="">Sin posición</option>
        {EFOOTBALL_POSITIONS.map(position=><option key={position} value={position}>{position}</option>)}
       </select>{errors.posicion&&<span className="text-red-300 text-xs">{errors.posicion}</span>}
      </label>}
      {section==='FIFA'&&<>{field('nacionalidad','Nacionalidad')}{field('edad','Edad','number',16,45)}
       <label className="text-sm">Posición<select className="input-dark mt-1" value={form.posicion} onChange={e=>change('posicion',e.target.value)}>
        {['PORTERO','DEFENSA','CENTROCAMPISTA','DELANTERO'].map(p=><option key={p}>{p}</option>)}</select></label></>}
     </div></section>
     <section><h3 className="font-bold mb-3">Estadísticas</h3>
      {section==='EFOOTBALL'?<div className="grid grid-cols-3 gap-3">{field('goles','Goles','number',0)}{field('asistencias','Asistencias','number',0)}{field('partidos','Partidos','number',0)}</div>:<>
       {seasons.map((s,i)=><div key={s.id??`new-${i}`} className="rounded-xl bg-white/5 p-3 mb-3 grid grid-cols-2 gap-3">
        {(['temporada','goles','asistencias','partidosJugados'] as const).map(k=><label key={k} className="text-sm">{({temporada:'Temporada',goles:'Goles',asistencias:'Asistencias',partidosJugados:'Partidos'})[k]}
         <input className="input-dark mt-1" type={k==='temporada'?'text':'number'} min={0} maxLength={k==='temporada'?20:undefined} required value={s[k]}
          onChange={e=>{setDirty(true);setSeasons(list=>list.map((item,n)=>n===i?{...item,[k]:k==='temporada'?e.target.value:Number(e.target.value)}:item))}}/></label>)}
         {!s.id&&<button type="button" onClick={()=>{setSeasons(list=>list.filter((_,n)=>n!==i));setDirty(true)}}>Quitar temporada nueva</button>}
       </div>)}
       {(editing||seasons.length===0)&&<button type="button" className="text-purple-300 flex gap-2 items-center" onClick={()=>{setSeasons(s=>[...s,blankSeason()]);setDirty(true)}}><Plus size={16}/>Agregar temporada</button>}
       {errors.seasons&&<p className="text-red-300">{errors.seasons}</p>}
      </>}
     </section>
     <section><h3 className="font-bold mb-3">Foto original</h3><ImageUploader onBusyChange={setUploading} currentUrl={form.imagenUrl||undefined} onUploaded={url=>change('imagenUrl',url)} onClear={()=>change('imagenUrl','')}/></section>
     <section><h3 className="font-bold mb-2">Recorte para holograma (opcional)</h3><p className="text-xs text-gray-400 mb-3">Sube una imagen PNG o WebP con fondo transparente. La foto original se conserva.</p>
      <ImageUploader onBusyChange={setUploading} currentUrl={form.hologramUrl||undefined} onUploaded={url=>change('hologramUrl',url)} onClear={()=>change('hologramUrl','')}/>
      {errors.hologramUrl&&<p className="text-red-300 text-xs">{errors.hologramUrl}</p>}
     </section>
    </fieldset>
    {errors._form&&<p role="alert" className="rounded-xl bg-red-500/10 p-3 text-red-300">{errors._form}</p>}
    <button type="submit" disabled={busy||uploading} className="btn-primary w-full flex justify-center gap-2"><Save size={18}/>{busy?'Guardando…':'Guardar todos los cambios'}</button>
   </form>}
  </div>
 </div>;
}
