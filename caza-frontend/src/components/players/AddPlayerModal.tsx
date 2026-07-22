import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Loader2, Lock, Calendar, ChevronUp, TrendingUp } from 'lucide-react';
import type { Player, PlayerStats, Jugador } from '../../types';
import { playersApi } from '../../api/players';
import { jugadoresApi, type JugadorCreatePayload } from '../../api/jugadores';
import { useAuth } from '../../hooks/useAuth';
import ImageUploader from './ImageUploader';
import toast from 'react-hot-toast';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Section = 'FIFA' | 'EFOOTBALL';

interface AddPlayerModalProps {
  isOpen: boolean;
  section: Section;
  editingPlayer?: Player | null;
  editingJugador?: Jugador | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultFifaCreateForm = {
  nombre: '',
  nacionalidad: '',
  posicion: 'DELANTERO' as Player['posicion'],
  edad: 22,
  precio: 500000,
  imagenUrl: '',
  temporada: '2024-25',
  goles: 0,
  asistencias: 0,
  partidosJugados: 0,
};

const defaultNewSeason = {
  temporada: '',
  goles: 0,
  asistencias: 0,
  partidosJugados: 0,
};

const defaultEfootballForm = {
  nombre: '',
  partidos: 0,
  goles: 0,
  asistencias: 0,
  precio: 500,
  imagenUrl: '',
};

// ─── Helpers de estilos ───────────────────────────────────────────────────────

const inputClass = 'w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500/50';
const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
const labelClass = 'block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide';
const divider = <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />;

// ─── Componente principal ─────────────────────────────────────────────────────

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen, section, editingPlayer, editingJugador, onClose, onSuccess,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const isEditing = !!(editingPlayer || editingJugador);

  // ── Estado formularios ────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fifaCreateForm, setFifaCreateForm] = useState(defaultFifaCreateForm);
  const [efootballForm, setEfootballForm] = useState(defaultEfootballForm);

  // ── Estado imagen (FIFA y eFootball comparten uploader separados) ─────────
  const [fifaImagenUrl, setFifaImagenUrl] = useState('');
  const [efImagenUrl, setEfImagenUrl] = useState('');

  // ── Estado temporadas FIFA ────────────────────────────────────────────────
  const [seasons, setSeasons] = useState<PlayerStats[]>([]);
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [newSeason, setNewSeason] = useState(defaultNewSeason);

  // ─── Poblar datos al abrir en edición ────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    if (editingPlayer) {
      setSeasons(editingPlayer.stats ?? []);
      setShowAddSeason(false);
      setNewSeason(defaultNewSeason);
    }
    if (editingJugador) {
      setEfootballForm({
        nombre: editingJugador.nombre,
        partidos: editingJugador.partidos,
        goles: editingJugador.goles,
        asistencias: editingJugador.asistencias,
        precio: editingJugador.precio ?? 500,
        imagenUrl: editingJugador.imagenUrl ?? '',
      });
      setEfImagenUrl(editingJugador.imagenUrl ?? '');
    }
    if (!isOpen) {
      setFifaImagenUrl('');
      setEfImagenUrl('');
    }
  }, [isOpen, editingPlayer, editingJugador]);

  // ─── Reset al cerrar ─────────────────────────────────────────────────────

  const handleClose = () => {
    setFifaCreateForm(defaultFifaCreateForm);
    setEfootballForm(defaultEfootballForm);
    setFifaImagenUrl('');
    setEfImagenUrl('');
    setSeasons([]);
    setShowAddSeason(false);
    setNewSeason(defaultNewSeason);
    onClose();
  };

  // ─── FIFA: crear jugador nuevo ────────────────────────────────────────────

  const handleFifaCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newPlayer = await playersApi.create({
        nombre: fifaCreateForm.nombre,
        nacionalidad: fifaCreateForm.nacionalidad,
        posicion: fifaCreateForm.posicion,
        edad: Number(fifaCreateForm.edad),
        precio: Number(fifaCreateForm.precio),
        imagenUrl: fifaImagenUrl || undefined,
      });
      if (fifaCreateForm.temporada) {
        try {
          await playersApi.addStats(newPlayer.id, {
            temporada: fifaCreateForm.temporada,
            goles: fifaCreateForm.goles,
            asistencias: fifaCreateForm.asistencias,
            partidosJugados: fifaCreateForm.partidosJugados,
          });
        } catch { /* stats failure no bloquea */ }
      }
      toast.success('Jugador FIFA creado ✅');
      onSuccess();
      handleClose();
    } catch {
      toast.error('Error al crear el jugador');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── FIFA: agregar nueva temporada ───────────────────────────────────────

  const handleAddSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    if (!newSeason.temporada.trim()) {
      toast.error('Escribe el nombre de la temporada (ej: 2025-26)');
      return;
    }
    // Verificar duplicado
    if (seasons.some(s => s.temporada === newSeason.temporada.trim())) {
      toast.error(`La temporada "${newSeason.temporada}" ya existe para este jugador`);
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await playersApi.addStats(editingPlayer.id, {
        temporada: newSeason.temporada.trim(),
        goles: Number(newSeason.goles),
        asistencias: Number(newSeason.asistencias),
        partidosJugados: Number(newSeason.partidosJugados),
      });
      setSeasons(prev => [...prev, created]);
      setNewSeason(defaultNewSeason);
      setShowAddSeason(false);
      toast.success(`Temporada ${created.temporada} agregada ✅`);
      onSuccess();
    } catch {
      toast.error('Error al agregar la temporada');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── eFootball: crear o actualizar ───────────────────────────────────────

  const handleEfootballSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: JugadorCreatePayload = {
        nombre: isEditing && editingJugador && !isAdmin
          ? editingJugador.nombre
          : efootballForm.nombre,
        partidos: Number(efootballForm.partidos),
        goles: Number(efootballForm.goles),
        asistencias: Number(efootballForm.asistencias),
        precio: Number(efootballForm.precio) || 500,
        imagenUrl: efImagenUrl || undefined,
      };

      if (isEditing && editingJugador) {
        await jugadoresApi.update(editingJugador.id, payload);
        toast.success('Estadísticas actualizadas ✅ (GA, PG, PA, PGA recalculados)');
      } else {
        await jugadoresApi.create(payload);
        toast.success('Jugador eFootball agregado ✅');
      }
      onSuccess();
      handleClose();
    } catch {
      toast.error('Error al guardar el jugador');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ─── Acumulado de temporadas FIFA ─────────────────────────────────────────

  const accumulated = seasons.reduce(
    (acc, s) => ({
      goles: acc.goles + (s.goles ?? 0),
      asistencias: acc.asistencias + (s.asistencias ?? 0),
      partidos: acc.partidos + (s.partidosJugados ?? 0),
    }),
    { goles: 0, asistencias: 0, partidos: 0 }
  );

  // ─── Colores por sección ──────────────────────────────────────────────────

  const accentColor = section === 'FIFA' ? '#6C63FF' : '#FF8C00';
  const accentGradient = section === 'FIFA'
    ? 'linear-gradient(135deg, #6C63FF, #FF6584)'
    : 'linear-gradient(135deg, #FF8C00, #FF4500)';

  // ─── Cálculo en tiempo real eFootball ────────────────────────────────────

  const ef = efootballForm;
  // GA la conocemos (goles + asistencias). PG/PA/PGA los calcula PostgreSQL
  // con sus propias expresiones GENERATED ALWAYS — no las replicamos aquí.
  const previewGA = Number(ef.goles) + Number(ef.asistencias);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: '#12122A', border: `1px solid ${accentColor}30` }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: '#12122A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: accentGradient }}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {!isEditing
                  ? (section === 'FIFA' ? 'Agregar Jugador FIFA' : 'Agregar Jugador eFootball')
                  : (section === 'FIFA' ? 'Gestionar Temporadas' : 'Actualizar Estadísticas')}
              </h2>
              <p className="text-xs text-gray-400">
                Sección: <span style={{ color: accentColor }}>{section === 'FIFA' ? '⚽ FIFA' : '🎮 eFootball'}</span>
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-5">

          {/* ════════════════ FIFA — CREAR ════════════════ */}
          {section === 'FIFA' && !isEditing && (
            <form onSubmit={handleFifaCreate} className="space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Datos del Jugador</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}>Nombre completo *</label>
                  <input className={inputClass} style={inputStyle} placeholder="Ej: Lionel Messi"
                    value={fifaCreateForm.nombre} onChange={e => setFifaCreateForm(f => ({ ...f, nombre: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>Nacionalidad *</label>
                  <input className={inputClass} style={inputStyle} placeholder="Ej: Argentina"
                    value={fifaCreateForm.nacionalidad} onChange={e => setFifaCreateForm(f => ({ ...f, nacionalidad: e.target.value }))} required />
                </div>
                <div>
                  <label className={labelClass}>Posición *</label>
                  <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }}
                    value={fifaCreateForm.posicion} onChange={e => setFifaCreateForm(f => ({ ...f, posicion: e.target.value as Player['posicion'] }))}>
                    <option value="PORTERO">Portero</option>
                    <option value="DEFENSA">Defensa</option>
                    <option value="CENTROCAMPISTA">Centrocampista</option>
                    <option value="DELANTERO">Delantero</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Edad *</label>
                  <input type="number" min={16} max={45} className={inputClass} style={inputStyle}
                    value={fifaCreateForm.edad} onChange={e => setFifaCreateForm(f => ({ ...f, edad: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label className={labelClass}>Precio (USD) *</label>
                  <input type="number" min={0} className={inputClass} style={inputStyle} placeholder="Ej: 1500000"
                    value={fifaCreateForm.precio} onChange={e => setFifaCreateForm(f => ({ ...f, precio: Number(e.target.value) }))} required />
                </div>
                <div className="col-span-2">
                  <ImageUploader
                    currentUrl={fifaImagenUrl || undefined}
                    onUploaded={(url) => setFifaImagenUrl(url)}
                    onClear={() => setFifaImagenUrl('')}
                    accentColor="#6C63FF"
                  />
                </div>
              </div>
              {divider}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Primera Temporada (opcional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Temporada</label>
                  <input className={inputClass} style={inputStyle} placeholder="2024-25"
                    value={fifaCreateForm.temporada} onChange={e => setFifaCreateForm(f => ({ ...f, temporada: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Partidos</label>
                  <input type="number" min={0} className={inputClass} style={inputStyle}
                    value={fifaCreateForm.partidosJugados} onChange={e => setFifaCreateForm(f => ({ ...f, partidosJugados: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={labelClass}>Goles</label>
                  <input type="number" min={0} className={inputClass} style={inputStyle}
                    value={fifaCreateForm.goles} onChange={e => setFifaCreateForm(f => ({ ...f, goles: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={labelClass}>Asistencias</label>
                  <input type="number" min={0} className={inputClass} style={inputStyle}
                    value={fifaCreateForm.asistencias} onChange={e => setFifaCreateForm(f => ({ ...f, asistencias: Number(e.target.value) }))} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
                style={{ background: accentGradient }}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isSubmitting ? 'Creando...' : 'Crear Jugador FIFA'}
              </button>
            </form>
          )}

          {/* ════════════════ FIFA — EDITAR (gestión de temporadas) ════════════════ */}
          {section === 'FIFA' && isEditing && editingPlayer && (
            <div className="space-y-4">

              {/* Nombre del jugador (bloqueado) */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Jugador FIFA</p>
                  <p className="text-sm font-bold text-white">{editingPlayer.nombre}</p>
                </div>
              </div>

              {/* Lista de temporadas existentes */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Temporadas registradas
                </p>

                {seasons.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Sin temporadas aún — agrega la primera</p>
                ) : (
                  <div className="space-y-2">
                    {seasons.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.18)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs font-black px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(108,99,255,0.25)', color: '#a78bfa' }}
                          >
                            {s.temporada}
                          </span>
                          <div className="flex gap-3 text-sm">
                            <span className="text-yellow-400 font-bold" title="Goles">⚽ {s.goles}</span>
                            <span className="text-blue-400 font-bold" title="Asistencias">🎯 {s.asistencias}</span>
                            <span className="text-green-400 font-bold" title="Partidos jugados">📋 {s.partidosJugados}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totales acumulados */}
              {seasons.length > 0 && (
                <>
                  {divider}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" /> Total acumulado ({seasons.length} temporada{seasons.length > 1 ? 's' : ''})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Goles', value: accumulated.goles, color: '#facc15' },
                        { label: 'Asistencias', value: accumulated.asistencias, color: '#60a5fa' },
                        { label: 'Partidos', value: accumulated.partidos, color: '#4ade80' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex flex-col items-center py-3 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-2xl font-black" style={{ color }}>{value}</span>
                          <span className="text-[11px] text-gray-400 mt-0.5">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {divider}

              {/* Imagen del jugador */}
              <ImageUploader
                currentUrl={fifaImagenUrl || editingPlayer.imagenUrl || undefined}
                onUploaded={async (url) => {
                  setFifaImagenUrl(url);
                  try {
                    await playersApi.patchImagen(editingPlayer.id, url);
                    toast.success('Imagen actualizada ✅');
                    onSuccess();
                  } catch { toast.error('Error al guardar la imagen'); }
                }}
                onClear={async () => {
                  setFifaImagenUrl('');
                  try {
                    await playersApi.patchImagen(editingPlayer.id, null);
                    onSuccess();
                  } catch { /* silencioso */ }
                }}
                accentColor="#6C63FF"
              />

              {divider}

              {/* Botón agregar temporada / formulario */}
              {!showAddSeason ? (
                <button
                  onClick={() => setShowAddSeason(true)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: 'rgba(108,99,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,99,255,0.3)' }}
                >
                  <Plus className="w-4 h-4" />
                  Agregar Nueva Temporada
                </button>
              ) : (
                <form onSubmit={handleAddSeason} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nueva Temporada</p>
                    <button type="button" onClick={() => setShowAddSeason(false)} className="text-gray-500 hover:text-white transition-colors">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelClass}>Temporada *</label>
                      <input className={inputClass} style={inputStyle} placeholder="Ej: 2025-26"
                        value={newSeason.temporada} onChange={e => setNewSeason(s => ({ ...s, temporada: e.target.value }))} required />
                    </div>
                    <div>
                      <label className={labelClass}>Partidos</label>
                      <input type="number" min={0} className={inputClass} style={inputStyle}
                        value={newSeason.partidosJugados} onChange={e => setNewSeason(s => ({ ...s, partidosJugados: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Goles</label>
                      <input type="number" min={0} className={inputClass} style={inputStyle}
                        value={newSeason.goles} onChange={e => setNewSeason(s => ({ ...s, goles: Number(e.target.value) }))} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Asistencias</label>
                      <input type="number" min={0} className={inputClass} style={inputStyle}
                        value={newSeason.asistencias} onChange={e => setNewSeason(s => ({ ...s, asistencias: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
                    style={{ background: accentGradient }}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSubmitting ? 'Guardando...' : 'Guardar Temporada'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ════════════════ eFOOTBALL ════════════════ */}
          {section === 'EFOOTBALL' && (
            <form onSubmit={handleEfootballSubmit} className="space-y-4">

              {/* Nombre — solo en creación o si es admin */}
              {(!isEditing || isAdmin) ? (
                <>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Datos del Jugador</p>
                  <div>
                    <label className={labelClass}>Nombre completo *</label>
                    <input className={inputClass} style={inputStyle} placeholder="Ej: Vinicius Jr."
                      value={efootballForm.nombre}
                      onChange={e => setEfootballForm(f => ({ ...f, nombre: e.target.value }))}
                      required />
                  </div>
                  {divider}
                </>
              ) : (
                editingJugador && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Jugador eFootball</p>
                      <p className="text-sm font-bold text-white">{editingJugador.nombre}</p>
                    </div>
                  </div>
                )
              )}

              {/* Estadísticas editables */}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Estadísticas</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Partidos *</label>
                  <input type="number" min={0} className={inputClass} style={inputStyle}
                    value={efootballForm.partidos}
                    onChange={e => setEfootballForm(f => ({ ...f, partidos: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label className={labelClass}>Goles *</label>
                  <input type="number" min={0} className={inputClass} style={inputStyle}
                    value={efootballForm.goles}
                    onChange={e => setEfootballForm(f => ({ ...f, goles: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label className={labelClass}>Asistencias *</label>
                  <input type="number" min={0} className={inputClass} style={inputStyle}
                    value={efootballForm.asistencias}
                    onChange={e => setEfootballForm(f => ({ ...f, asistencias: Number(e.target.value) }))} required />
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className={labelClass}>Precio (máx. 500) *</label>
                <input
                  type="number" min={0} max={500} step={1}
                  className={inputClass} style={inputStyle}
                  value={(efootballForm as any).precio ?? 500}
                  onChange={e => setEfootballForm(f => ({ ...f, precio: Number(e.target.value) }))}
                  required
                />
                {Number((efootballForm as any).precio) > 500 && (
                  <p className="text-xs text-red-400 mt-1">El precio máximo es 500</p>
                )}
              </div>

              {/* Imagen del jugador */}
              <ImageUploader
                currentUrl={efImagenUrl || undefined}
                onUploaded={(url) => setEfImagenUrl(url)}
                onClear={() => setEfImagenUrl('')}
                accentColor="#FF8C00"
              />

              {/* Valores calculados automáticamente por PostgreSQL */}

              {divider}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Calculados automáticamente por la base de datos
              </p>
              <div className="grid grid-cols-4 gap-2">
                {/* GA: fórmula conocida → mostramos preview en tiempo real */}
                <div
                  className="flex flex-col items-center py-3 rounded-xl"
                  style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.2)' }}
                  title="Goles + Asistencias"
                >
                  <span className="text-base font-black text-white">{previewGA}</span>
                  <span className="text-[10px] font-semibold mt-0.5" style={{ color: '#FF8C00' }}>GA</span>
                  <span className="text-[9px] text-gray-600 mt-0.5 text-center px-1">G + A</span>
                </div>
                {/* PG, PA, PGA: expresiones GENERATED ALWAYS en Postgres, no las conocemos exactamente */}
                {['PG', 'PA', 'PGA'].map(label => (
                  <div
                    key={label}
                    className="flex flex-col items-center py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    title={`${label}: calculado por PostgreSQL al guardar`}
                  >
                    <span className="text-xs font-black text-gray-500">BD</span>
                    <span className="text-[10px] font-semibold mt-0.5" style={{ color: '#FF8C00' }}>{label}</span>
                    <span className="text-[9px] text-gray-600 mt-0.5 text-center px-1">auto-calc</span>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 mt-1"
                style={{ background: accentGradient }}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Estadísticas' : 'Agregar Jugador eFootball'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;
