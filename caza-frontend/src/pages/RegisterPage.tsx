import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Eye,EyeOff,Lock,Mail,User,ArrowUpRight,ShieldCheck,Users,BarChart3} from 'lucide-react';
import {useAuth} from '../hooks/useAuth';
import toast from 'react-hot-toast';
export default function RegisterPage(){
 const {register}=useAuth();const navigate=useNavigate();
 const [form,setForm]=useState({nombre:'',correo:'',password:'',confirm:''});
 const [show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const mismatch=!!form.confirm&&form.confirm!==form.password;
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(busy)return;if(mismatch){setError('Las contraseñas no coinciden.');return;}setBusy(true);setError('');
  try{await register({nombre:form.nombre.trim(),correo:form.correo.trim(),password:form.password});toast.success('Cuenta creada. Ya puedes explorar CAZA.');navigate('/dashboard');}
  catch(e:any){setError(e.response?.data?.message??'No se pudo crear la cuenta. Inténtalo nuevamente.');}finally{setBusy(false);}
 };
 return <main className="auth-shell">
  <section className="auth-story"><Link to="/login" className="auth-brand">⚽ CAZA<span>FOOTBALL LAB</span></Link><div className="auth-story-content"><p className="eyebrow">TU CLUB. TUS DECISIONES.</p><h1>El próximo gran<br/>equipo empieza<br/><span className="gradient-text">contigo.</span></h1><p>Explora FIFA y eFootball, descubre tus jugadores y construye una alineación con tu propio estilo.</p><div className="auth-features">{[[Users,'Mercado de jugadores'],[BarChart3,'Estadísticas y alineaciones'],[ShieldCheck,'Comunidad y cambios revisados']].map(([Icon,text])=>{const I=Icon as typeof Users;return <div key={String(text)}><I size={19}/><span>{String(text)}</span></div>})}</div></div><p className="auth-footnote">Un proyecto nacido de cuatro años de fútbol virtual.</p></section>
  <section className="auth-form-panel"><div className="w-full max-w-md"><Link className="text-sm text-gray-400 hover:text-white" to="/login">← Volver al inicio</Link><p className="eyebrow mt-10">BIENVENIDO A TU CLUB</p><h2 className="text-3xl font-bold mt-3">Crear cuenta</h2><p className="text-gray-400 mt-3 mb-8">Empieza con $10,000 de saldo ficticio.</p>
   <form onSubmit={submit} className="space-y-5"><fieldset disabled={busy} className="space-y-5">{([
    ['nombre','Nombre completo',User,'Tu nombre','text','name'],['correo','Correo electrónico',Mail,'tu@correo.com','email','email'],['password','Contraseña',Lock,'Mínimo 6 caracteres',show?'text':'password','new-password'],['confirm','Confirmar contraseña',Lock,'Repite tu contraseña',show?'text':'password','new-password']
   ] as const).map(([key,label,Icon,placeholder,type,auto])=><div key={key}><label htmlFor={`register-${key}`} className="block text-sm font-medium text-gray-300 mb-2">{label}</label><div className="field-with-icon"><Icon aria-hidden="true" size={19}/><input id={`register-${key}`} name={key} type={type} autoComplete={auto} required minLength={key==='password'||key==='confirm'?6:undefined} maxLength={key==='nombre'?100:undefined} placeholder={placeholder} className={`input-dark ${key==='password'?'with-action':''}`} value={form[key]} aria-invalid={key==='confirm'&&mismatch} aria-describedby={key==='confirm'&&mismatch?'confirm-error':undefined} onChange={e=>setForm({...form,[key]:e.target.value})}/>{key==='password'&&<button type="button" className="field-action" aria-label={show?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShow(!show)}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button>}</div>{key==='confirm'&&mismatch&&<p id="confirm-error" className="text-rose-300 text-xs mt-2">Las contraseñas no coinciden.</p>}</div>)}</fieldset>
    {error&&<p className="request-error" role="alert">{error}</p>}<button type="submit" className="btn-primary w-full py-3.5" disabled={busy}>{busy?'Creando cuenta…':'Crear mi cuenta'}<ArrowUpRight size={18}/></button>
   </form><p className="text-sm text-gray-400 mt-7 text-center">¿Ya eres parte de CAZA? <Link className="text-purple-300 font-semibold" to="/login">Inicia sesión</Link></p>
  </div></section>
 </main>;
}
