import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

const AdminLoginPage: React.FC = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Llamar directamente a la API — obtenemos la respuesta completa con el rol
      const response = await authApi.login({ correo, password });

      // Verificar el rol ANTES de persistir la sesión
      if (response.rol !== 'ADMIN') {
        toast.error('⛔ No tienes permisos de administrador');
        setIsLoading(false);
        return;
      }

      // Persistir la sesión manualmente en localStorage
      const userData = {
        id: response.userId,
        nombre: response.nombre,
        correo: response.correo,
        rol: response.rol,
        saldo: response.saldo,
        fechaRegistro: new Date().toISOString(),
        activo: true,
      };
      localStorage.setItem('caza_token', response.accessToken);
      localStorage.setItem('caza_user', JSON.stringify(userData));

      toast.success(`¡Bienvenido, Admin ${response.nombre}! ⭐`);

      // Redirigir con recarga completa — el AuthContext leerá el token del localStorage
      setTimeout(() => {
        window.location.href = '/admin';
      }, 600);

    } catch {
      toast.error('Credenciales incorrectas o error del servidor');
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(234,179,8,0.06)',
    border: '1px solid rgba(234,179,8,0.2)',
    borderRadius: '12px',
    padding: '0.7rem 0.9rem',
    color: '#fff',
    fontSize: '0.88rem',
    outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c24 0%, #1a1040 50%, #0a0a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      {/* Blobs decorativos */}
      <div style={{
        position: 'fixed', top: '-10%', left: '-5%',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'rgba(20,15,40,0.92)',
        border: '1px solid rgba(234,179,8,0.25)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 0 60px rgba(234,179,8,0.08)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Volver */}
        <Link to="/login" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'rgba(255,255,255,0.35)', fontSize: '0.76rem', textDecoration: 'none',
          marginBottom: '1.8rem',
        }}>
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          Volver al inicio de sesión
        </Link>

        {/* Icono + título */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))',
            border: '1px solid rgba(234,179,8,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <ShieldCheck style={{ width: '32px', height: '32px', color: '#facc15' }} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#facc15', letterSpacing: '0.02em', margin: 0 }}>
            Acceso Administrador
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
            Área restringida — solo para administradores
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(234,179,8,0.7)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(234,179,8,0.4)' }} />
              <input
                type="email" required
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="admin@caza.com"
                style={{ ...inputStyle, paddingLeft: '34px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(234,179,8,0.7)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(234,179,8,0.4)' }} />
              <input
                type={showPassword ? 'text' : 'password'} required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingLeft: '34px', paddingRight: '36px' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(234,179,8,0.4)', padding: 0, display: 'flex' }}>
                {showPassword ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} style={{
            width: '100%', padding: '0.78rem',
            borderRadius: '12px', border: 'none',
            background: isLoading
              ? 'rgba(234,179,8,0.3)'
              : 'linear-gradient(135deg, #f59e0b, #facc15)',
            color: '#000', fontWeight: 800, fontSize: '0.9rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: '0.4rem',
          }}>
            {isLoading ? (
              <>
                <span style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Verificando...
              </>
            ) : (
              <><ShieldCheck style={{ width: '16px', height: '16px' }} /> Ingresar como Administrador</>
            )}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminLoginPage;
