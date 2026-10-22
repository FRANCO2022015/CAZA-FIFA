import {useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Inbox} from 'lucide-react';
import {playerChangesApi} from '../../api/playerChanges';
export default function RequestsLink(){
 const [count,setCount]=useState<number|null>(null);const {pathname}=useLocation();
 useEffect(()=>{let active=true;const load=()=>{playerChangesApi.pending().then(n=>{if(active)setCount(n);}).catch(()=>{if(active)setCount(null);});};load();window.addEventListener('focus',load);window.addEventListener('player-requests-changed',load);return()=>{active=false;window.removeEventListener('focus',load);window.removeEventListener('player-requests-changed',load);};},[pathname]);
 return <Link to="/requests" className={`requests-link ${pathname==='/requests'?'is-selected':''}`} title="Solicitudes de cambios"><Inbox size={17}/><span>Solicitudes</span>{count!==null&&count>0&&<span className="request-count">{count>99?'99+':count}</span>}</Link>;
}
