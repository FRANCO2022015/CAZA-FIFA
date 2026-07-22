import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Trash2, Coins, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { purchasesApi } from '../api/purchases';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';

const CartPage: React.FC = () => {
  const { cart, isLoading, fetchCart, updateItem, removeItem, clearCart } = useCart();
  const { user, updateBalance } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      const purchase = await purchasesApi.checkout();
      updateBalance((user?.saldo ?? 0) - purchase.precioTotal);
      await fetchCart();
      toast.success(`¡Compra exitosa! Gastaste $${purchase.precioTotal.toLocaleString()}`);
      navigate('/purchases');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al procesar la compra');
    } finally {
      setCheckingOut(false);
    }
  };

  const total = cart?.total ?? 0;
  const balance = user?.saldo ?? 0;
  const insufficient = balance < total;

  if (isLoading) return <Layout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-black text-white mb-6">Mi Carrito</h1>

      {!cart || cart.items.length === 0 ? (
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
              <div key={item.id} className="glass-card p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                     style={{ background: 'rgba(108,99,255,0.1)' }}>
                  {item.player.imagenUrl
                    ? <img src={item.player.imagenUrl} alt={item.player.nombre} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-black gradient-text">{item.player.nombre.charAt(0)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{item.player.nombre}</h3>
                  <p className="text-sm text-gray-400">{item.player.posicion} · {item.player.nacionalidad}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: '#6C63FF' }}>
                    ${item.player.precio.toLocaleString()} c/u
                  </p>
                </div>
                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button onClick={() => updateItem(item.id, Math.max(1, item.cantidad - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-semibold text-white">{item.cantidad}</span>
                  <button onClick={() => updateItem(item.id, item.cantidad + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Subtotal */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-white">${item.subtotal.toLocaleString()}</div>
                  <button onClick={() => removeItem(item.id)}
                    className="mt-1 text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => clearCart()} className="text-sm text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2">
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

              <button onClick={handleCheckout} disabled={insufficient || checkingOut}
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
