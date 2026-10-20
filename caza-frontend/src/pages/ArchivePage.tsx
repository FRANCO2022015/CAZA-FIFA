import {useEffect,useState} from 'react';
import {Link,Navigate} from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {useAuth} from '../hooks/useAuth';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
export default function ArchivePage(){
 const {user}=useAuth();const [rows,setRows]=useState<{id:number;nombre:string;game:string}[]>([]);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);setError('');api.get('/admin/archive').then(r=>setRows(r.data.data)).catch(()=>setError('No se pudo cargar el archivo.')).finally(()=>setLoading(false));};
 useEffect(()=>{if(user?.rol==='ADMIN')load()},[user?.rol]);
 if(user?.rol!=='ADMIN')return <Navigate to="/dashboard" replace/>;
 return <Layout><Link to="/admin" className="text-purple-300">← Administración</Link><h1 className="text-3xl font-black my-6">Jugadores archivados</h1>
 <p className="text-gray-400 mb-6">El historial de compras se conserva. Restaurar vuelve a mostrar al jugador en el catálogo.</p>
 {loading?<p>Cargando…</p>:error?<button onClick={load}>{error} Reintentar</button>:rows.length===0?<p>No hay jugadores archivados.</p>:rows.map(r=><div key={`${r.game}-${r.id}`} className="glass-card p-4 mb-3 flex justify-between gap-4">
  <span>{r.nombre} <small className="text-gray-400">{r.game}</small></span>
  <button className="text-green-300" disabled={busy} onClick={async()=>{setBusy(true);try{await api.post(`/admin/archive/${r.game}/${r.id}/restore`);toast.success('Jugador restaurado');load();}catch{toast.error('No se pudo restaurar');}finally{setBusy(false)}}}>Restaurar</button>
 </div>)}</Layout>;
}
