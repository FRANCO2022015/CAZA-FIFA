import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Las contraseñas no coinciden');
    if (form.password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    try {
      setIsLoading(true);
      await register({ nombre: form.nombre, correo: form.correo, password: form.password });
      toast.success('¡Cuenta creada! Recibes $10,000 de saldo inicial 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A3E 50%, #0D0D1A 100%)' }}>
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-10 animate-pulse"
             style={{ background: 'radial-gradient(circle, #FF6584, transparent)' }} />
        <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full opacity-10 animate-pulse"
             style={{ background: 'radial-gradient(circle, #6C63FF, transparent)', animationDelay: '1s' }} />
        <div className="relative z-10 text-center px-12">
          <div className="text-7xl mb-6">🏆</div>
          <h2 className="text-4xl font-black text-white mb-4">Únete a <span className="gradient-text">CAZA</span></h2>
          <p className="text-lg text-gray-300 mb-8">Recibe $10,000 de saldo ficticio para comprar tus jugadores favoritos</p>
          <div className="space-y-3">
            {['✅ Mercado de jugadores profesional', '✅ Chat IA con Gemini', '✅ Foro comunitario', '✅ Gestión de reuniones'].map(item => (
              <p key={item} className="text-gray-300 text-sm">{item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: '#0D0D1A' }}>
        <div className="w-full max-w-md animate-slideUp">
          <div className="lg:hidden text-center mb-8">
            <span className="text-4xl">⚽</span>
            <h1 className="text-3xl font-black gradient-text mt-2">CAZA</h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Crear cuenta</h2>
          <p className="text-gray-400 mb-8">Empieza con $10,000 de saldo gratis</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input name="nombre" type="text" value={form.nombre} onChange={handleChange}
                  placeholder="Tu nombre" className="input-dark pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input name="correo" type="email" value={form.correo} onChange={handleChange}
                  placeholder="tu@correo.com" className="input-dark pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} placeholder="Mínimo 6 caracteres" className="input-dark pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input name="confirm" type="password" value={form.confirm} onChange={handleChange}
                  placeholder="Repite la contraseña" className="input-dark pl-10" required />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base mt-2">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : 'Crear cuenta gratis'}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-6 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#6C63FF' }}>Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
