import {useEffect,useState} from 'react';
import {Navigate,Link} from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {useAuth} from '../hooks/useAuth';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
type Row={id:number;occurred_at:string;actor_id:number|null;actor_name:string;entity_name:string;entity_type:string;entity_id:string;game:string|null;action:string;field_name:string;old_value:string|null;new_value:string|null};
const fieldLabel=(field:string)=>({requesterName:'Solicitante',requesterId:'ID del solicitante',reviewerName:'Administrador que resuelve',reviewerId:'ID del administrador',status:'Estado',reason:'Motivo',reviewNote:'Respuesta del administrador',beforeValues:'Valores al solicitar',proposedValues:'Propuesta',payload:'Alineación',name:'Nombre',imagenUrl:'Foto original',hologramUrl:'Recorte del holograma',itemsSnapshot:'Detalle de compra',partidosJugados:'Partidos',precioTotal:'Total de compra',montoSolicitado:'Saldo solicitado'} as Record<string,string>)[field]??field;
const valueLabel=(field:string,value:string|null)=>{
 if(value===null)return '(vacío)';
 if(field==='activo')return value==='true'?'Activo':'Archivado';
 if(field==='payload'){
  try{
   const d=JSON.parse(value);
   return `${d.name} · ${d.gameType} · ${d.formationKey} · ${d.teamMode==='MI_EQUIPO'?'Mis jugadores':'Equipo potencial'}\n`+
    Object.entries(d.lineup??{}).sort(([a],[b])=>Number(a)-Number(b)).map(([slot,p]:[string,any])=>
     `${Number(slot)<11?`Titular ${Number(slot)+1}`:`Suplente ${Number(slot)-10}`}: ${p.nombre} (#${p.id})`).join('\n');
  }catch{return value;}
 }
 if(field==='beforeValues'||field==='proposedValues'){try{return Object.entries(JSON.parse(value)).map(([k,v])=>`${fieldLabel(k)}: ${v||'(vacío)'}`).join('\n');}catch{return value;}}
 if(field==='itemsSnapshot'){
  try{return JSON.parse(value).map((p:any)=>`${p.nombre} · ${p.gameType} · ${p.cantidad??1} x $${p.precio}`).join('\n');}catch{return value;}
 }
 return value;
};
const date=(v:string)=>new Date(v).toLocaleString('es-PE',{timeZone:'America/Lima'});
export default function AuditPage(){
 const {user}=useAuth();
 const [filters,setFilters]=useState({from:'',to:'',actor:'',game:'',action:'',player:''});
 const [applied,setApplied]=useState(filters);
 const [page,setPage]=useState(0),[total,setTotal]=useState(0);
 const [rows,setRows]=useState<Row[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [exporting,setExporting]=useState(false);
 const params=Object.fromEntries(Object.entries(applied).filter(([,v])=>v!==''));
 useEffect(()=>{
  if(user?.rol!=='ADMIN') return;
  let active=true; setBusy(true);setError('');
  api.get('/admin/audit',{params:{...params,page,size:50}}).then(r=>{if(active){setRows(r.data.data.content);setTotal(r.data.data.totalElements);}})
   .catch(()=>{if(active)setError('No se pudo cargar el historial. Vuelve a aplicar los filtros.');}).finally(()=>{if(active)setBusy(false);});
  return ()=>{active=false};
 },[applied,page,user?.rol]);
 const download=async()=>{
  if(exporting)return;setExporting(true);
  try{
   const {jsPDF}=await import('jspdf');const pdf=new jsPDF();let y=20;let count=0;
   pdf.setFontSize(18);pdf.text('CAZA | Historial de cambios',14,y);y+=9;
   pdf.setFontSize(9);
   const line=(text:string)=>{
    for(const part of pdf.splitTextToSize(text,180)){
     if(y>277){pdf.addPage();y=18;}
     pdf.text(part,14,y);y+=5;
    }
   };
   line(`Generado: ${date(new Date().toISOString())} (Perú)`);
   line(`Filtros: ${Object.entries(params).map(([k,v])=>`${k}: ${v}`).join(' / ')||'Todos'}`);
   let until:number|undefined;let p=0;let expected=0;
   do{
    const res=await api.get('/admin/audit',{params:{...params,page:p,size:200,until}});
    const data=res.data.data;until=data.until;expected=data.totalElements;
    if(p===0)line(`Total de cambios de campos: ${expected}`);
    for(const r of data.content as Row[]){
     y+=4;line(`#${r.id} | ${date(r.occurred_at)} | ${r.actor_name} (ID ${r.actor_id??'sistema'})`);
     line(`${r.action} | ${r.game??r.entity_type} | ${r.entity_name} [${r.entity_id}]`);
     line(`Campo: ${fieldLabel(r.field_name)}`);
     line(`Antes: ${valueLabel(r.field_name,r.old_value)}`);line(`Después: ${valueLabel(r.field_name,r.new_value)}`);count++;
    }
    if(!data.content.length && count<expected)throw new Error('Exportación incompleta');
    p++;
   }while(count<expected);
   const pages=pdf.getNumberOfPages();
   for(let n=1;n<=pages;n++){pdf.setPage(n);pdf.setFontSize(8);pdf.text(`CAZA • ${n} / ${pages}`,14,290);}
   pdf.save(`CAZA-cambios-${new Date().toISOString().slice(0,10)}.pdf`);
  }catch{toast.error('No se pudo completar el PDF. No se descargó un reporte parcial.');}
  finally{setExporting(false);}
 };
 if(user?.rol!=='ADMIN')return <Navigate to="/dashboard" replace/>;
 return <Layout><Link to="/admin" className="text-purple-300">← Administración</Link>
  <div className="flex flex-wrap justify-between gap-4 my-6"><div><h1 className="text-3xl font-black">Historial de cambios</h1><p className="text-gray-400 mt-2">Operaciones guardadas desde la activación de la auditoría. Hora de Perú.</p></div>
   <button className="btn-primary" onClick={download} disabled={exporting}>{exporting?'Generando PDF…':'Descargar PDF con estos filtros'}</button></div>
  <form className="glass-card p-4 grid sm:grid-cols-3 gap-4 mb-6" onSubmit={e=>{e.preventDefault();setPage(0);setApplied({...filters});}}>
   {(['from','to','actor','player'] as const).map(k=><label key={k} className="text-sm text-gray-300">{({from:'Desde',to:'Hasta',actor:'ID de usuario',player:'Jugador o elemento'})[k]}
    <input className="input-dark mt-1" type={k==='from'||k==='to'?'date':k==='actor'?'number':'text'} min={k==='actor'?1:undefined} value={filters[k]} onChange={e=>setFilters({...filters,[k]:e.target.value})}/></label>)}
   <label className="text-sm">Juego<select className="input-dark mt-1" value={filters.game} onChange={e=>setFilters({...filters,game:e.target.value})}><option value="">Todos</option><option>FIFA</option><option>EFOOTBALL</option></select></label>
   <label className="text-sm">Acción<select className="input-dark mt-1" value={filters.action} onChange={e=>setFilters({...filters,action:e.target.value})}><option value="">Todas</option>{['CREAR','ACTUALIZAR','ARCHIVAR','RESTAURAR','ELIMINAR'].map(a=><option key={a}>{a}</option>)}</select></label>
   <button className="btn-primary">Aplicar filtros</button>
  </form>
  {error?<p role="alert">{error}</p>:busy?<p role="status">Cargando historial…</p>:<><p className="text-gray-400 mb-3">{total} cambios de campos</p>
   <div className="space-y-3">{rows.map(r=><article key={r.id} className="glass-card p-4">
    <p className="text-xs text-gray-400">{date(r.occurred_at)} · {r.actor_name} · ID {r.actor_id??'sistema'}</p>
    <h2 className="font-bold my-2">{r.entity_name} <span className="text-purple-300 text-xs">{r.game} / {r.action}</span></h2>
    <p className="text-sm mb-2">{fieldLabel(r.field_name)}</p><div className="grid sm:grid-cols-2 gap-3 text-sm">
     <div className="rounded-lg bg-red-400/10 p-3 break-all"><strong>Antes</strong><pre className="whitespace-pre-wrap max-h-40 overflow-auto">{valueLabel(r.field_name,r.old_value)}</pre></div>
     <div className="rounded-lg bg-green-400/10 p-3 break-all"><strong>Después</strong><pre className="whitespace-pre-wrap max-h-40 overflow-auto">{valueLabel(r.field_name,r.new_value)}</pre></div>
    </div></article>)}</div>{!rows.length&&<p>No hay cambios para estos filtros.</p>}
   <div className="flex gap-4 my-5"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page+1}</span><button disabled={(page+1)*50>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div></>}
 </Layout>;
}
