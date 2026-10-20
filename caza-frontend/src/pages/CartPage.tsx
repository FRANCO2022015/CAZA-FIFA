import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Trash2, Coins, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';
import { purchasesApi } from '../api/purchases';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';

const CartPage: React.FC = () => {
  const { cart, isLoading, error, fetchCart, updateItem, removeItem, clearCart } = useCart();
  const { user, updateBalance } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [mutating,setMutating]=useState(false);
  const lock=useRef(false);
  const pendingKey=`caza_pending_purchase_${user?.id}`;
  const [pending,setPending]=useState(()=>localStorage.getItem(pendingKey)||'');
  const [receipt,setReceipt]=useState<{id:number;precioTotal:number}|null>(null);
  const [message,setMessage]=useState('');
  const mutate=async(action:()=>Promise<void>)=>{
    if(lock.current||pending)return;lock.current=true;setMutating(true);
    try{await action();}catch{toast.error('No se pudo actualizar el carrito.');}
    finally{lock.current=false;setMutating(false);}
  };
  const complete=async(purchase:{id:number;precioTotal:number})=>{
    localStorage.removeItem(pendingKey);setPending('');setReceipt(purchase);setMessage('');
    try{updateBalance((await authApi.getMe()).saldo);}catch{}
    await fetchCart();
  };
  const checkPending=async()=>{
    if(lock.current||!pending)return;
    lock.current=true;setCheckingOut(true);
    try{await complete(await purchasesApi.getByRequest(pending));}
    catch(e:any){setMessage(e?.response?.status===404?'Todavía no hay una compra confirmada con este identificador. Puedes reintentar de forma segura.':'No se pudo consultar el resultado. Conservamos el identificador para comprobarlo después.');}
    finally{lock.current=false;setCheckingOut(false);}
  };


  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleCheckout = async () => {
    if(lock.current)return;
    lock.current=true;setCheckingOut(true);setMessage('');
    // Persist BEFORE sending. The same request ID survives refresh and network loss.
    const key=pending||crypto.randomUUID();
    try {
      localStorage.setItem(pendingKey,key);setPending(key);
      await complete(await purchasesApi.checkout(key));
    } catch (err:any) {
      const status=err?.response?.status;
      if(status>=400&&status<500&&status!==401&&status!==403&&status!==408&&status!==429) {
        localStorage.removeItem(pendingKey);setPending('');
        setMessage(err?.response?.data?.message||'La compra no fue aceptada.');
      } else {
        try{await complete(await purchasesApi.getByRequest(key));}
        catch{setMessage('La conexión se interrumpió. El resultado está pendiente de confirmar. Consulta el estado o reintenta con el mismo identificador.');}
      }
    } finally {lock.current=false;setCheckingOut(false);}
  };

  const total = cart?.total ?? 0;
  const balance = user?.saldo ?? 0;
  const insufficient = balance < total;
  const unavailable=cart?.items.some(item=>!item.player.activo)??false;

  if (isLoading) return <Layout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-black text-white mb-6">Mi Carrito</h1>

      {receipt&&<div role="status" className="glass-card p-5 mb-5 border border-green-400/30"><h2 className="font-bold text-green-300">Compra #{receipt.id} confirmada</h2><p>Total: ${receipt.precioTotal.toLocaleString()}</p><Link to="/purchases" className="text-purple-300">Ver detalle en el historial</Link></div>}
      {pending&&<div className="glass-card p-5 mb-5"><h2 className="font-bold">Comprobar compra pendiente</h2><p className="text-xs break-all text-gray-400 my-2">Solicitud: {pending}</p><div className="flex gap-5"><button disabled={checkingOut} onClick={checkPending}>Consultar resultado</button><button disabled={checkingOut} onClick={handleCheckout}>Reintentar la misma compra</button></div></div>}
      {message&&<p role="alert" className="p-4 mb-4 bg-amber-500/10 rounded-xl">{message}</p>}
      {mutating&&<p role="status">Actualizando carrito…</p>}
      {error ? <div role="alert" className="glass-card p-5"><p>{error}</p><button className="btn-primary mt-3" onClick={fetchCart}>Reintentar</button></div> : !cart || cart.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8" />}
          title="Tu carrito está vacío"
          description="Explora el mercado y añade jugadores a tu carrito"
          action={{ label: 'Ver jugadores', onClick: () => navigate('/players') }}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(item => (
              <div key={item.id} className="glass-card p-5 flex flex-wrap items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                     style={{ background: 'rgba(108,99,255,0.1)' }}>
                  {item.player.imagenUrl
                    ? <img src={item.player.imagenUrl} alt={item.player.nombre} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-black gradient-text">{item.player.nombre.charAt(0)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{item.player.nombre}</h3>{!item.player.activo&&<p className="text-amber-300 text-xs">Archivado: retíralo para comprar el resto.</p>}
                  <p className="text-sm text-gray-400">{item.player.posicion} · {item.player.nacionalidad}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: '#6C63FF' }}>
                    ${item.player.precio.toLocaleString()} c/u
                  </p>
                </div>
                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button aria-label="Reducir cantidad" disabled={mutating||checkingOut||!!pending||item.cantidad<=1} onClick={() => mutate(()=>updateItem(item.id, Math.max(1, item.cantidad - 1)))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-semibold text-white">{item.cantidad}</span>
                  <button aria-label="Aumentar cantidad" disabled={mutating||checkingOut||!!pending||item.cantidad>=100} onClick={() => mutate(()=>updateItem(item.id, item.cantidad + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Subtotal */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">Subtotal · {item.cantidad} unidades</div><div className="font-bold text-white">${item.subtotal.toLocaleString()}</div>
                  <button aria-label={`Retirar ${item.player.nombre}`} disabled={mutating||checkingOut||!!pending} onClick={() => mutate(()=>removeItem(item.id))}
                    className="mt-1 text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button disabled={mutating||checkingOut||!!pending} onClick={() => mutate(()=>clearCart())} className="text-sm text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Vaciar carrito
            </button>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">Resumen del pedido</h2>
              <div className="space-y-2 mb-4 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{cart.itemCount} jugadores</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-white text-lg mb-6">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>

              {/* Balance display */}
              <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(67,233,123,0.08)', border: '1px solid rgba(67,233,123,0.2)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-300"><Coins className="w-4 h-4 text-green-400" />Tu saldo</span>
                  <span className="font-bold text-green-400">${balance.toLocaleString()}</span>
                </div>
              </div>

              {insufficient && (
                <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
                     style={{ background: 'rgba(255,101,132,0.1)', border: '1px solid rgba(255,101,132,0.2)' }}>
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">Saldo insuficiente. Te faltan ${(total - balance).toLocaleString()}</p>
                </div>
              )}

              <button onClick={handleCheckout} disabled={insufficient || checkingOut || mutating || !!pending || unavailable}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-40">
                {checkingOut
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Procesando...
                    </span>
                  : '✅ Confirmar compra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CartPage;
