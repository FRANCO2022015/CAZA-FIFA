import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingCart, MessageSquare, Video,
  LogOut, Menu, X, Coins, ChevronDown, Swords,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/players',      label: 'Jugadores',    icon: Users },
  { to: '/team-builder', label: 'Armar Equipo', icon: Swords },
  { to: '/forum',        label: 'Foro',         icon: MessageSquare },
  { to: '/meetings',     label: 'Reuniones',    icon: Video },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cartCount = cart?.itemCount ?? 0;

  return (
    <nav className="navbar-glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">⚽</span>
            <span className="text-2xl font-black gradient-text tracking-tight">CAZA</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={active ? { background: 'rgba(108,99,255,0.15)', color: '#a78bfa' } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: '#FF6584' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Balance */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(67,233,123,0.1)', border: '1px solid rgba(67,233,123,0.2)' }}>
              <Coins className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                ${(user?.saldo ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}
              </span>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/5"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}>
                  {user?.nombre?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <span className="text-sm font-medium text-gray-300">{user?.nombre}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-xl" style={{ background: '#12122A', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-medium text-white">{user?.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.correo}</p>
                  </div>
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t animate-fadeIn" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(13,13,26,0.98)' }}>
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <ShoppingCart className="w-5 h-5" />
              Carrito {cartCount > 0 && <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#FF6584' }}>{cartCount}</span>}
            </Link>
            <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <div className="px-3 py-2 flex items-center gap-3">
              <Coins className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                ${(user?.saldo ?? 0).toLocaleString()}
              </span>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
