import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import fifaImg from '../assets/fifa.png';
import efootballImg from '../assets/efootball.png';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

// ─── Battle Background Component ─────────────────────────────────────────────
const BattleBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const particleIdRef = useRef(0);
  const mouseRef     = useRef({ x: 0.5, y: 0.5 });
  const diagonalOffsetRef = useRef(0);
  const lastTimeRef  = useRef(0);

  const fifaBrRef = useRef(1);  const fifaSatRef  = useRef(1);  const fifaScRef = useRef(1);
  const efBrRef   = useRef(1);  const efSatRef    = useRef(1);  const efScRef   = useRef(1);

  // Preload images
  const fifaEl = useRef<HTMLImageElement | null>(null);
  const efEl   = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const f = new Image(); f.src = fifaImg;      fifaEl.current = f;
    const e = new Image(); e.src = efootballImg; efEl.current   = e;
  }, []);

  const spawnParticle = useCallback((x: number, y: number, color: string, spread = 1) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.3 + Math.random() * 1.2) * spread;
    particlesRef.current.push({
      id: particleIdRef.current++, x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      size: 1.5 + Math.random() * 3,
      opacity: 0.8 + Math.random() * 0.2,
      color, life: 0, maxLife: 60 + Math.random() * 80,
    });
    if (particlesRef.current.length > 300) particlesRef.current.splice(0, 50);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = container.clientWidth; canvas.height = container.clientHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onMouseMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };
    container.addEventListener('mousemove', onMouseMove);

    // Diagonal: top-right → bottom-left
    // At y=0 → x = W+off ; at y=H → x = 0+off
    const diagX = (y: number, W: number, H: number, off: number) => W * (1 - y / H) + off;
    const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;
      const W = canvas.width, H = canvas.height;
      if (!W || !H) return;

      const mx = mouseRef.current.x, my = mouseRef.current.y;
      const off = diagonalOffsetRef.current;

      // Which side is cursor on?
      const diagNorm = diagX(my * H, W, H, off) / W;
      const onFifa   = mx < diagNorm;

      // Shift diagonal toward opponent
      const targetOff = onFifa ? 65 : -65;
      diagonalOffsetRef.current = lerp(off, targetOff, dt * 0.003);

      const sp = dt * 0.004;
      if (onFifa) {
        fifaBrRef.current  = lerp(fifaBrRef.current,  1.35, sp);
        fifaSatRef.current = lerp(fifaSatRef.current, 1.4,  sp);
        fifaScRef.current  = lerp(fifaScRef.current,  1.06, sp);
        efBrRef.current    = lerp(efBrRef.current,    0.5,  sp);
        efSatRef.current   = lerp(efSatRef.current,   0.4,  sp);
        efScRef.current    = lerp(efScRef.current,    1.0,  sp);
      } else {
        efBrRef.current    = lerp(efBrRef.current,    1.35, sp);
        efSatRef.current   = lerp(efSatRef.current,   1.4,  sp);
        efScRef.current    = lerp(efScRef.current,    1.06, sp);
        fifaBrRef.current  = lerp(fifaBrRef.current,  0.5,  sp);
        fifaSatRef.current = lerp(fifaSatRef.current, 0.4,  sp);
        fifaScRef.current  = lerp(fifaScRef.current,  1.0,  sp);
      }

      ctx.clearRect(0, 0, W, H);
      const o = diagonalOffsetRef.current;

      // ── FIFA: clip LEFT of diagonal ──────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(diagX(0, W, H, o), 0);
      for (let y = 0; y <= H; y += 2) ctx.lineTo(diagX(y, W, H, o), y);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.clip();
      const fs = fifaScRef.current;
      ctx.translate(W * 0.25, H * 0.5);
      ctx.scale(fs, fs);
      ctx.translate(-W * 0.25, -H * 0.5);
      ctx.filter = `brightness(${fifaBrRef.current}) saturate(${fifaSatRef.current}) contrast(1.1)`;
      if (fifaEl.current?.complete && fifaEl.current.naturalWidth > 0)
        ctx.drawImage(fifaEl.current, 0, 0, W, H);
      ctx.filter = 'none';
      ctx.restore();

      // ── eFootball: clip RIGHT of diagonal ───────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(diagX(0, W, H, o), 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, H);
      ctx.lineTo(diagX(H, W, H, o), H);
      for (let y = H; y >= 0; y -= 2) ctx.lineTo(diagX(y, W, H, o), y);
      ctx.closePath();
      ctx.clip();
      const es = efScRef.current;
      ctx.translate(W * 0.75, H * 0.5);
      ctx.scale(es, es);
      ctx.translate(-W * 0.75, -H * 0.5);
      ctx.filter = `brightness(${efBrRef.current}) saturate(${efSatRef.current}) contrast(1.1)`;
      if (efEl.current?.complete && efEl.current.naturalWidth > 0)
        ctx.drawImage(efEl.current, 0, 0, W, H);
      ctx.filter = 'none';
      ctx.restore();

      // ── Glow line ────────────────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(diagX(0, W, H, o), 0);
      for (let y = 1; y <= H; y += 2) ctx.lineTo(diagX(y, W, H, o), y);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 44; ctx.stroke();
      ctx.strokeStyle = 'rgba(180,100,255,0.35)'; ctx.lineWidth = 16; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;  ctx.stroke();
      ctx.restore();

      // ── Diagonal particles ────────────────────────────────────────────────
      if (Math.random() < 0.35) {
        const py = Math.random() * H;
        spawnParticle(diagX(py, W, H, o), py, Math.random() < 0.5 ? '#c4b5fd' : '#fff', 0.5);
      }
      if (onFifa  && Math.random() < 0.12) spawnParticle(mx*W+(Math.random()-.5)*80, my*H+(Math.random()-.5)*80, '#4ade80', 1.1);
      if (!onFifa && Math.random() < 0.12) spawnParticle(mx*W+(Math.random()-.5)*80, my*H+(Math.random()-.5)*80, '#38bdf8', 1.1);

      // ── Particles draw ────────────────────────────────────────────────────
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.vy -= 0.02; p.life++;
        const t = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = p.opacity * (1 - t);
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animFrameRef.current); ro.disconnect(); container.removeEventListener('mousemove', onMouseMove); };
  }, [spawnParticle]);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'crosshair' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {/* FC 26 label */}
      <div style={{
        position: 'absolute', top: '50%', left: '22%',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10, textAlign: 'center',
      }}>
        <div style={{
          fontSize: '1rem', fontWeight: 800, letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 0 24px rgba(74,222,128,0.9), 0 2px 6px rgba(0,0,0,0.9)',
          textTransform: 'uppercase',
        }}>FC 26</div>
      </div>
      {/* eFootball label */}
      <div style={{
        position: 'absolute', top: '50%', left: '68%',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10, textAlign: 'center',
      }}>
        <div style={{
          fontSize: '1rem', fontWeight: 800, letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 0 24px rgba(56,189,248,0.9), 0 2px 6px rgba(0,0,0,0.9)',
          textTransform: 'uppercase',
        }}>eFOOTBALL 26</div>
      </div>
    </div>
  );
};

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [correo,      setCorreo]      = useState('');
  const [password,    setPassword]    = useState('');
  const [showPassword,setShowPassword]= useState(false);
  const [isLoading,   setIsLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !password) return toast.error('Completa todos los campos');
    try {
      setIsLoading(true);
      await login({ correo, password });
      toast.success('¡Bienvenido de vuelta!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', position: 'relative' }}>

      {/* ── LEFT 3/4 — Battle ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', flex: '0 0 75%', overflow: 'hidden', background: '#0a0a14' }}>
        <BattleBackground />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(to top, rgba(10,10,20,0.55), transparent)',
          pointerEvents: 'none', zIndex: 5,
        }} />
      </div>

      {/* ── RIGHT 1/4 — Form ──────────────────────────────────────────── */}
      <div style={{
        flex: '0 0 25%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'linear-gradient(160deg, #0D0D1A 0%, #111130 60%, #0a0a1e 100%)',
        borderLeft: '1px solid rgba(167,139,250,0.15)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '200px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.15), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ width: '100%', maxWidth: '340px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>⚽</div>
            <div style={{
              fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.1em',
              background: 'linear-gradient(135deg, #a78bfa, #6C63FF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>CAZA</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginTop: '0.2rem' }}>
              FOOTBALL MARKETPLACE
            </div>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>Iniciar sesión</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginBottom: '1.6rem' }}>
            Bienvenido de vuelta, entra al mercado
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.35)' }} />
                <input type="email" value={correo} onChange={e => setCorreo(e.target.value)}
                  placeholder="tu@correo.com" required className="input-dark"
                  style={{ paddingLeft: '34px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.35)' }} />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="input-dark"
                  style={{ paddingLeft: '34px', paddingRight: '36px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex' }}>
                  {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.4rem', borderRadius: '10px' }}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Entrando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{
            textAlign: 'center', color: 'rgba(255,255,255,0.4)',
            marginTop: '1.4rem', fontSize: '0.78rem',
          }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{
              fontWeight: 600, color: '#a78bfa',
              textDecoration: 'none',
            }}>
              Regístrate gratis
            </Link>
          </p>

          {/* Admin login separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1.2rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>ó</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <Link to="/admin/login" style={{ textDecoration: 'none', display: 'block', marginTop: '0.9rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.65rem 1rem', borderRadius: '10px',
              background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)',
              color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600,
              transition: 'background 0.2s, border-color 0.2s',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: '1rem' }}>🛡️</span>
              Iniciar sesión como Administrador
            </div>
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;
