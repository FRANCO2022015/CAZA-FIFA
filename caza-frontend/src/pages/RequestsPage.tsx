import {useCallback,useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Inbox,Check,ArrowRight,X,RefreshCw} from 'lucide-react';
import Layout from '../components/layout/Layout';
import {useAuth} from '../hooks/useAuth';
import {playerChangesApi,changeLabels,type ChangeRequest} from '../api/playerChanges';
import Pagination from '../components/common/Pagination';
import toast from 'react-hot-toast';

const statusLabel={PENDIENTE:'Pendiente',APROBADA:'Aprobada',RECHAZADA:'Rechazada'};
const date=(v:string)=>new Date(v).toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'medium',timeStyle:'short'});
export default function RequestsPage(){
 const {user}=useAuth();const admin=user?.rol==='ADMIN';
 const [status,setStatus]=useState('PENDIENTE'),[page,setPage]=useState(0),[rows,setRows]=useState<ChangeRequest[]>([]),[total,setTotal]=useState(0),[pages,setPages]=useState(0);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState<number|null>(null),[notes,setNotes]=useState<Record<number,string>>({});
 const sequence=useRef(0);const resolving=useRef(false);
 const load=useCallback(async()=>{const seq=++sequence.current;setLoading(true);setError('');try{const data=await playerChangesApi.list(status,page);if(seq!==sequence.current)return;setRows(data.content);setTotal(data.totalElements);setPages(data.totalPages);if(page>0&&page>=data.totalPages)setPage(Math.max(0,data.totalPages-1));}catch{if(seq===sequence.current)setError('No se pudieron cargar las solicitudes.');}finally{if(seq===sequence.current)setLoading(false);}},[status,page]);
 useEffect(()=>{void load();return()=>{sequence.current++;};},[load]);
 const resolve=async(r:ChangeRequest,approve:boolean)=>{
  if(resolving.current)return;
  if(!window.confirm(approve?`¿Aplicar los cambios solicitados para ${r.playerName}?`:'¿Rechazar esta solicitud sin modificar al jugador?'))return;
  resolving.current=true;setBusy(r.id);
  try{await playerChangesApi.resolve(r.id,approve,notes[r.id]??'');toast.success(approve?'Cambios aprobados y guardados':'Solicitud rechazada');window.dispatchEvent(new Event('player-requests-changed'));await load();}
  catch(e:any){setError(e.response?.data?.message??'No se pudo resolver la solicitud. Recarga para comprobar su estado.');}
  finally{resolving.current=false;setBusy(null);}
 };
 return <Layout>
  <header className="section-hero"><div><p className="eyebrow">{admin?'CENTRO DE REVISIÓN':'TU PARTICIPACIÓN'}</p><h1>{admin?'Solicitudes de cambios':'Mis solicitudes'}</h1><p>Datos más precisos, decisiones con historial. {admin?'Revisa cada propuesta antes de aplicarla.':'Aquí puedes seguir la respuesta del administrador.'}</p></div><div className="hero-mark"><Inbox size={36}/></div></header>
  <div className="catalogue-toolbar"><div className="flex flex-wrap gap-2">{[['PENDIENTE','Pendientes'],['APROBADA','Aprobadas'],['RECHAZADA','Rechazadas'],['','Todas']].map(([value,label])=><button key={value} className={`filter-tab ${status===value?'is-selected':''}`} aria-pressed={status===value} onClick={()=>{setStatus(value);setPage(0);}}>{label}</button>)}</div><button className="btn-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/> Actualizar</button></div>
  {error&&<div role="alert" className="request-error mb-4">{error}</div>}
  {loading?<div role="status" className="glass-card p-8">Cargando solicitudes…</div>:<>
   <p className="text-sm text-gray-400 mb-5">{total} {total===1?'solicitud':'solicitudes'} · Hora de Perú</p>
   {!rows.length&&<div className="empty-inbox"><Inbox size={40}/><h2>No hay solicitudes en esta vista</h2><p>Puedes proponer correcciones desde la ficha de un jugador.</p><Link className="btn-secondary mt-4" to="/players">Explorar jugadores</Link></div>}
   <div className="space-y-5">{rows.map(r=>{const before=JSON.parse(r.beforeValues) as Record<string,string>,after=JSON.parse(r.proposedValues) as Record<string,string>;return <article key={r.id} className="review-card">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">{r.game} · SOLICITUD #{r.id}{r.statsId?` · TEMPORADA ID ${r.statsId}`:''}</p><h2 className="text-xl font-bold mt-2"><Link to={r.game==='FIFA'?`/players/${r.playerId}`:`/efootball/${r.playerId}`}>{r.playerName} ↗</Link></h2><p className="text-xs text-gray-400 mt-2">Por {r.requesterName} · {date(r.createdAt)}</p></div><span className={`status-pill status-${r.status.toLowerCase()}`}>{statusLabel[r.status]}</span></div>
    <p className="review-reason">{r.reason}</p>
    <div className="space-y-2">{Object.keys(after).map(field=><div className="change-row" key={field}><strong>{changeLabels[field]??field}</strong><div><span className="change-caption">Al solicitar</span><span className="break-all">{before[field]||'Sin valor'}</span></div><ArrowRight size={16} className="change-arrow"/><div><span className="change-caption">Propuesto</span><span className="text-emerald-300 break-all">{after[field]||'Sin valor'}</span></div></div>)}</div>
    {r.reviewerName&&<p className="text-sm text-gray-300 mt-5">{statusLabel[r.status]} por {r.reviewerName}{r.reviewedAt?` · ${date(r.reviewedAt)}`:''}{r.reviewNote&&<span className="block mt-2 text-gray-400">{r.reviewNote}</span>}</p>}
    {admin&&r.status==='PENDIENTE'&&<div className="mt-5 border-t border-white/10 pt-5"><label className="text-sm">Respuesta para el usuario (opcional)<textarea className="input-dark mt-2" rows={2} maxLength={1000} value={notes[r.id]??''} disabled={busy!==null} onChange={e=>setNotes({...notes,[r.id]:e.target.value})}/></label><p className="text-xs text-gray-400 my-3">Al aprobar, se comprueba que los campos no hayan cambiado desde la solicitud.</p><div className="flex flex-wrap gap-3"><button className="btn-primary" disabled={busy!==null} onClick={()=>void resolve(r,true)}><Check size={16}/>{busy===r.id?'Procesando…':'Aprobar cambios'}</button><button className="btn-secondary" disabled={busy!==null} onClick={()=>void resolve(r,false)}><X size={16}/> Rechazar</button></div></div>}
   </article>})}</div><Pagination currentPage={page} totalPages={pages} onPageChange={setPage}/>
  </>}
 </Layout>;
}
