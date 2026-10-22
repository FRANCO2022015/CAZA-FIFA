import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight,Swords,Inbox,ShoppingBag} from 'lucide-react';
import api from '../api/axiosConfig';
import {purchasesApi} from '../api/purchases';
import {playerChangesApi} from '../api/playerChanges';
import {useAuth} from '../hooks/useAuth';
export default function WorkspaceOverview(){
 const {user}=useAuth();const [team,setTeam]=useState<string|null>(null),[count,setCount]=useState<number|null>(null),[purchase,setPurchase]=useState<string|null>(null);
 useEffect(()=>{let active=true;api.get('/lineups').then(r=>{if(active)setTeam(r.data.data[0]?.name??'Tu próxima alineación empieza aquí');}).catch(()=>{});playerChangesApi.pending().then(n=>{if(active)setCount(n);}).catch(()=>{});purchasesApi.getPurchases().then(p=>{if(active)setPurchase(p.length?`${p[0].players.length} jugadores en la compra #${p[0].id}`:'Explora el mercado y realiza tu primer fichaje');}).catch(()=>{});return()=>{active=false};},[user?.id]);
 return <section className="workspace-grid" aria-label="Tu actividad"><Link to="/team-builder" className="workspace-card workspace-team"><Swords size={24}/><div><p className="eyebrow">PIZARRA TÁCTICA</p><h2>{team??'Tus equipos guardados'}</h2><p>Continúa diseñando tu once y tus suplentes.</p></div><ArrowUpRight size={20}/></Link><Link to="/requests" className="workspace-card"><Inbox size={23}/><div><p className="eyebrow">{user?.rol==='ADMIN'?'POR REVISAR':'MIS PROPUESTAS'}</p><h2>{count===null?'Solicitudes de cambios':`${count} pendientes`}</h2><p>{user?.rol==='ADMIN'?'Revisa y responde a la comunidad.':'Sigue el estado de tus correcciones.'}</p></div><ArrowUpRight size={20}/></Link><Link to="/purchases" className="workspace-card"><ShoppingBag size={23}/><div><p className="eyebrow">MERCADO</p><h2>Últimos fichajes</h2><p>{purchase??'Consulta tu historial de compras.'}</p></div><ArrowUpRight size={20}/></Link></section>;
}
