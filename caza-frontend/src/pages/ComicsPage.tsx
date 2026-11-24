import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Folder, Image as ImageIcon, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';

type FolderItem={id:number;parent_id:number|null;kind:'SECTION'|'SAGA'|'CHAPTER';name:string;sort_order:number};
type Page={id:number;chapter_id:number;name:string;sort_order:number};
type Tree={folders:FolderItem[];pages:Page[]};
const sort=<T extends {sort_order:number;id:number}>(items:T[])=>[...items].sort((a,b)=>a.sort_order-b.sort_order||a.id-b.id);
export default function ComicsPage(){
 const {user}=useAuth();
 const [tree,setTree]=useState<Tree>({folders:[],pages:[]}),[parent,setParent]=useState<number|null>(null);
 const [name,setName]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState('');
 const [reader,setReader]=useState<number|null>(null),[url,setUrl]=useState(''),[imageError,setImageError]=useState(false),[retry,setRetry]=useState(0),[zoom,setZoom]=useState(1);
 const [editing,setEditing]=useState<number|null>(null),[editName,setEditName]=useState(''),[editOrder,setEditOrder]=useState(0);
 const [loading,setLoading]=useState(true);
 const readerRef=useRef<HTMLDialogElement>(null),scroller=useRef<HTMLDivElement>(null),fileInput=useRef<HTMLInputElement>(null);
 const refresh=useCallback(async()=>{const r=await api.get('/comics');setTree(r.data.data);},[]);
 useEffect(()=>{if(user?.rol!=='ADMIN')return;let active=true;api.get('/comics').then(r=>{if(active)setTree(r.data.data);}).catch(()=>{if(active)setError('No se pudo abrir la biblioteca.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[user?.rol]);
 const current=tree.folders.find(f=>f.id===parent);
 const children=sort(tree.folders.filter(f=>f.parent_id===parent));
 const chapterPages=sort(tree.pages.filter(p=>p.chapter_id===parent));
 const orderedPages:Page[]=[];
 // A single reading order crosses chapters, sagas and sections without folder navigation.
 for(const section of sort(tree.folders.filter(f=>f.kind==='SECTION')))
  for(const saga of sort(tree.folders.filter(f=>f.parent_id===section.id)))
   for(const chapter of sort(tree.folders.filter(f=>f.parent_id===saga.id)))
    orderedPages.push(...sort(tree.pages.filter(p=>p.chapter_id===chapter.id)));
 const index=orderedPages.findIndex(p=>p.id===reader),page=orderedPages[index];
 const readingChapter=tree.folders.find(f=>f.id===page?.chapter_id);
 const readingSaga=tree.folders.find(f=>f.id===readingChapter?.parent_id);
 const ids=orderedPages.map(p=>p.id);
 const move=(delta:number)=>{const next=ids[index+delta];if(next!==undefined)setReader(next);};
 useEffect(()=>{setUrl('');setImageError(false);setZoom(1);scroller.current?.scrollTo(0,0);if(reader===null)return;
  let active=true;api.get(`/comics/pages/${reader}/url`).then(r=>{if(active)setUrl(r.data.data.url);}).catch(()=>{if(active)setImageError(true);});return()=>{active=false;};
 },[reader,retry]);
 useEffect(()=>{if(reader!==null){readerRef.current?.showModal();}else{readerRef.current?.close();}},[reader]);
 useEffect(()=>{if(reader===null)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[reader]);
 if(user?.rol!=='ADMIN')return <Navigate to="/dashboard" replace/>;
 async function create(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');
  try{await api.post('/comics/folders',{name,kind:parent===null?'SECTION':current?.kind==='SECTION'?'SAGA':'CHAPTER',parentId:parent,order:children.length?Math.max(...children.map(f=>f.sort_order))+1:0});setName('');await refresh();}
  catch{setError('No se pudo crear la carpeta. Revisa el nombre y vuelve a intentarlo.');}finally{setBusy(false);}
 }
 async function saveFolder(e:React.FormEvent){e.preventDefault();setBusy(true);try{await api.patch(`/comics/folders/${editing}`,{name:editName,order:editOrder});await refresh();setEditing(null);}catch{setError('No se pudo guardar la carpeta.');}finally{setBusy(false);}}
 async function upload(files:FileList|null){if(!files?.length||parent===null||busy)return;const destination=parent;
  const batch=Array.from(files).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  if(batch.some(f=>!f.name.toLowerCase().endsWith('.png')||f.size>7*1024*1024)){setError('Todos los archivos deben ser PNG de hasta 7 MB cada uno.');return;}
  setBusy(true);setError('');let completed=0;
  try{for(const file of batch){setProgress(`Subiendo ${completed+1}/${batch.length}: ${file.name}`);const form=new FormData();form.append('file',file);await api.post(`/comics/chapters/${destination}/pages`,form,{headers:{'Content-Type':'multipart/form-data'}});completed++;}toast.success(`${completed} páginas guardadas`);}
  catch{setError(`Se guardaron ${completed} de ${batch.length} páginas. Revisa la lista y vuelve a subir solo las que faltan.`);}
  finally{try{await refresh();}catch{setError('No se pudo actualizar la lista; recarga antes de repetir una subida.');}setBusy(false);setProgress('');if(fileInput.current)fileInput.current.value='';}
 }
 async function reorder(p:Page,delta:number){const at=chapterPages.findIndex(v=>v.id===p.id),other=chapterPages[at+delta];if(!other)return;setBusy(true);
  const reordered=[...chapterPages];[reordered[at],reordered[at+delta]]=[reordered[at+delta],reordered[at]];
  try{await api.put(`/comics/chapters/${parent}/order`,{ids:reordered.map(v=>v.id)});await refresh();}catch{setError('No se pudo cambiar el orden. Recarga y vuelve a intentarlo.');}finally{setBusy(false);}
 }
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await readerRef.current?.requestFullscreen();}catch{toast.error('Tu navegador no permite pantalla completa; puedes usar el lector ampliado.');}}
 return <Layout><div className="space-y-6">
  <header><p className="text-purple-300 uppercase tracking-widest text-sm">Biblioteca privada / Administrador</p><h1 className="text-3xl font-bold mt-2">Mi historieta</h1><p className="text-gray-400 mt-2">Organiza tus secciones, sagas y capítulos. Lee todas las páginas sin salir del visor.</p></header>
  <nav aria-label="Carpetas" className="flex gap-3 flex-wrap"><button type="button" disabled={busy} className="btn-secondary" onClick={()=>setParent(null)}>Mi historieta</button>{current&&<><button type="button" disabled={busy} className="btn-secondary" onClick={()=>setParent(current.parent_id)}>← Subir un nivel</button><span className="self-center text-purple-300">{current.name}</span></>}</nav>
  {loading&&<p role="status">Cargando biblioteca…</p>}{error&&<p role="alert" className="text-red-300">{error}</p>}{progress&&<p role="status" className="text-purple-300">{progress}</p>}
  {current?.kind!=='CHAPTER'&&<form onSubmit={e=>void create(e)} className="flex gap-3 flex-wrap"><label className="flex-1 min-w-48">{parent===null?'Nueva sección':current?.kind==='SECTION'?'Nueva saga':'Nuevo capítulo'}<input className="input-dark mt-2" required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre"/></label><button type="submit" disabled={busy||!name.trim()} className="btn-primary self-end">Crear {parent===null?'sección':current?.kind==='SECTION'?'saga':'capítulo'}</button></form>}
  {editing!==null&&<form onSubmit={e=>void saveFolder(e)} className="p-4 border border-purple-400/40 rounded-xl flex flex-wrap gap-3"><label>Nombre<input className="input-dark" required maxLength={120} value={editName} onChange={e=>setEditName(e.target.value)}/></label><label>Orden<input className="input-dark" type="number" min="0" max="2147483647" required value={editOrder} onChange={e=>setEditOrder(Number(e.target.value))}/></label><button type="submit" disabled={busy} className="btn-primary">Guardar</button><button type="button" disabled={busy} onClick={()=>setEditing(null)} className="btn-secondary">Cancelar</button></form>}
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children.map(f=><article key={f.id} className="rounded-2xl border border-white/10 bg-white/5 p-5"><button type="button" disabled={busy} className="text-left w-full" onClick={()=>{setParent(f.id);setEditing(null);setName('');setError('');}}><Folder className="text-purple-400 mb-3"/><h2 className="font-bold text-lg break-words">{f.name}</h2><p className="text-gray-400 text-sm">{f.kind==='SECTION'?'Sección':f.kind==='SAGA'?'Saga':'Capítulo'} · Orden {f.sort_order}</p></button><button type="button" disabled={busy} className="text-purple-300 text-sm mt-4" onClick={()=>{setEditing(f.id);setEditName(f.name);setEditOrder(f.sort_order);}}>Editar nombre y orden</button></article>)}</div>
  {current?.kind==='CHAPTER'&&<><section className="border border-dashed border-purple-400/50 rounded-2xl p-6"><label className="block font-semibold">Añadir páginas PNG<input ref={fileInput} type="file" accept="image/png,.png" multiple disabled={busy} className="block mt-3 max-w-full" onChange={e=>void upload(e.target.files)}/></label><p className="text-gray-400 text-sm mt-3">Hasta 7 MB por página. Se suben en orden natural de nombre: 1.png, 2.png, 10.png. Puedes cambiar el orden después.</p></section>
   {chapterPages.length>0&&<button type="button" className="btn-primary" onClick={()=>setReader(chapterPages[0].id)}>Leer capítulo</button>}
   <ol className="space-y-2">{chapterPages.map((p,i)=><li key={p.id} className="flex gap-3 items-center rounded-xl bg-white/5 p-3"><ImageIcon className="shrink-0 text-purple-300"/><button type="button" className="text-left flex-1 min-w-0 break-words" onClick={()=>setReader(p.id)}>{i+1}. {p.name}</button><button type="button" aria-label={`Subir ${p.name}`} disabled={busy||i===0} onClick={()=>void reorder(p,-1)} className="btn-secondary">↑</button><button type="button" aria-label={`Bajar ${p.name}`} disabled={busy||i===chapterPages.length-1} onClick={()=>void reorder(p,1)} className="btn-secondary">↓</button></li>)}</ol>
   {!chapterPages.length&&<p className="text-gray-400">Este capítulo todavía no tiene páginas.</p>}</>}
  {!loading&&!children.length&&current?.kind!=='CHAPTER'&&<p className="text-gray-400">Crea la primera carpeta para empezar.</p>}
 </div>
 <dialog ref={readerRef} onCancel={()=>setReader(null)} aria-label="Lector de historieta" className="fixed inset-0 m-0 w-screen h-[100dvh] max-w-none max-h-none bg-slate-950 text-white p-0 backdrop:bg-black"
 onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}}}>
  {page&&<div className="h-full flex flex-col"><header className="flex flex-wrap gap-2 items-center p-3 bg-slate-900"><div className="flex-1 min-w-40 text-sm"><strong>{readingSaga?.name} / {readingChapter?.name}</strong><p className="text-gray-400">{page.name} · Página {index+1} de {orderedPages.length}</p></div><button type="button" aria-label="Alejar" className="btn-secondary" onClick={()=>setZoom(z=>Math.max(.5,z-.25))}><ZoomOut size={18}/></button><button type="button" className="btn-secondary" onClick={()=>setZoom(1)}>{Math.round(zoom*100)}%</button><button type="button" aria-label="Acercar" className="btn-secondary" onClick={()=>setZoom(z=>Math.min(4,z+.25))}><ZoomIn size={18}/></button><button type="button" aria-label="Pantalla completa" className="btn-secondary" onClick={()=>void fullscreen()}><Maximize size={18}/></button><button type="button" aria-label="Cerrar lector" className="btn-secondary" onClick={()=>{setReader(null);if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});}}><X size={18}/></button></header>
   <div ref={scroller} className="flex-1 overflow-auto min-h-0" style={{touchAction:'pan-x pan-y pinch-zoom'}}>
    {imageError?<div role="alert" className="p-8">No se pudo cargar esta página. <button type="button" className="btn-primary" onClick={()=>setRetry(v=>v+1)}>Reintentar</button></div>:!url?<p role="status" className="p-8">Cargando página…</p>:<div className="mx-auto flex justify-center" style={{width:`${zoom*100}%`,height:`${zoom*100}%`,minHeight:'100%'}}><img src={url} alt={`${readingChapter?.name}: ${page.name}`} referrerPolicy="no-referrer" onError={()=>setImageError(true)} className="w-full h-full object-contain"/></div>}
   </div><footer className="flex items-center justify-between p-3 gap-3 bg-slate-900"><button type="button" disabled={index<=0} className="btn-secondary" onClick={()=>move(-1)}><ChevronLeft/>Anterior</button><span className="text-gray-400 text-xs text-center">← → para pasar páginas. El siguiente capítulo continúa automáticamente.</span><button type="button" disabled={index===orderedPages.length-1} className="btn-primary" onClick={()=>move(1)}>Siguiente<ChevronRight/></button></footer>
  </div>}
 </dialog></Layout>;
}
