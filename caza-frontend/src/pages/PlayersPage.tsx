import React, { useEffect, useState, useCallback } from 'react';
import { Users, Gamepad2, Plus, Search, X, Trash2, Pencil, ArrowUpDown, ChevronUp, ChevronDown, SlidersHorizontal, FilterX } from 'lucide-react';
import Layout from '../components/layout/Layout';
import PlayerCard from '../components/players/PlayerCard';
import JugadorCard from '../components/players/JugadorCard';
import AddPlayerModal from '../components/players/AddPlayerModal';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { usePlayers } from '../hooks/usePlayers';
import { useJugadores } from '../hooks/useJugadores';
import { useAuth } from '../hooks/useAuth';
import { playersApi } from '../api/players';
import { jugadoresApi } from '../api/jugadores';
import type { AdvancedFilterParams } from '../api/jugadoresAdvanced';
import type { Player, Jugador } from '../types';
import toast from 'react-hot-toast';

type Section = 'FIFA' | 'EFOOTBALL';
type SortDir = 'asc' | 'desc';

interface SortOption {
  value: string;
  label: string;
}

const FIFA_SORT_OPTIONS: SortOption[] = [
  { value: 'nombre',      label: 'Nombre' },
  { value: 'goles',       label: 'Goles' },
  { value: 'asistencias', label: 'Asistencias' },
  { value: 'edad',        label: 'Edad' },
  { value: 'precio',      label: 'Precio' },
  { value: 'nacionalidad', label: 'Nacionalidad' },
];

const EFOOTBALL_SORT_OPTIONS: SortOption[] = [
  { value: 'nombre',      label: 'Nombre' },
  { value: 'goles',       label: 'Goles' },
  { value: 'asistencias', label: 'Asistencias' },
  { value: 'partidos',    label: 'Partidos' },
  { value: 'pg',          label: 'PG' },
  { value: 'pa',          label: 'PA' },
  { value: 'pga',         label: 'PGA' },
];

const PlayersPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const [activeSection, setActiveSection] = useState<Section>('FIFA');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingJugador, setEditingJugador] = useState<Jugador | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [fifaSortBy, setFifaSortBy] = useState('nombre');
  const [fifaSortDir, setFifaSortDir] = useState<SortDir>('asc');

  const [efSortBy, setEfSortBy] = useState('nombre');
  const [efSortDir, setEfSortDir] = useState<SortDir>('asc');

  const { players, paged: fifaPaged, isLoading: fifaLoading, fetchPlayers, searchPlayers } = usePlayers();
  const [fifaPage, setFifaPage] = useState(0);

  const { jugadores, paged: efootballPaged, isLoading: efootballLoading, fetchJugadores, searchJugadores, searchAdvanced } = useJugadores();
  const [efootballPage, setEfootballPage] = useState(0);

  const defaultFilters: AdvancedFilterParams = {};
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState<AdvancedFilterParams>(defaultFilters);
  const [filtersActive, setFiltersActive] = useState(false);
  const hasActiveFilters = filtersActive && Object.values(advFilters).some(v => v !== undefined && v !== '');

  const applyAdvancedSearch = useCallback((extraParams?: Partial<AdvancedFilterParams>) => {
    searchAdvanced({
      ...advFilters,
      nombre: searchTerm || undefined,
      page: 0,
      size: 12,
      sortBy: efSortBy,
      sortDir: efSortDir,
      ...extraParams,
    });
  }, [advFilters, searchTerm, efSortBy, efSortDir, searchAdvanced]);

  useEffect(() => {
    fetchPlayers(0, 12, fifaSortBy, fifaSortDir);
  }, [fetchPlayers]); // eslint-disable-line

  useEffect(() => {
    fetchJugadores(0, 12, efSortBy, efSortDir);
  }, [fetchJugadores]); // eslint-disable-line

  useEffect(() => {
    if (activeSection === 'FIFA') {
      setFifaPage(0);
      if (searchTerm.trim()) {
        searchPlayers({ nombre: searchTerm, page: 0, size: 12, sortBy: fifaSortBy, sortDir: fifaSortDir });
      } else {
        fetchPlayers(0, 12, fifaSortBy, fifaSortDir);
      }
    }
  }, [fifaSortBy, fifaSortDir]); // eslint-disable-line

  useEffect(() => {
    if (activeSection === 'EFOOTBALL') {
      setEfootballPage(0);
      if (filtersActive && hasActiveFilters) {
        searchAdvanced({ ...advFilters, nombre: searchTerm || undefined, page: 0, size: 12, sortBy: efSortBy, sortDir: efSortDir });
      } else if (searchTerm.trim()) {
        searchJugadores({ nombre: searchTerm, page: 0, size: 12, sortBy: efSortBy, sortDir: efSortDir });
      } else {
        fetchJugadores(0, 12, efSortBy, efSortDir);
      }
    }
  }, [efSortBy, efSortDir]); // eslint-disable-line

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSection === 'FIFA') {
        if (searchTerm.trim()) {
          searchPlayers({ nombre: searchTerm, page: 0, size: 12, sortBy: fifaSortBy, sortDir: fifaSortDir });
          setFifaPage(0);
        } else {
          fetchPlayers(0, 12, fifaSortBy, fifaSortDir);
          setFifaPage(0);
        }
      } else {
        if (filtersActive && hasActiveFilters) {
          searchAdvanced({ ...advFilters, nombre: searchTerm || undefined, page: 0, size: 12, sortBy: efSortBy, sortDir: efSortDir });
          setEfootballPage(0);
        } else if (searchTerm.trim()) {
          searchJugadores({ nombre: searchTerm, page: 0, size: 12, sortBy: efSortBy, sortDir: efSortDir });
          setEfootballPage(0);
        } else {
          fetchJugadores(0, 12, efSortBy, efSortDir);
          setEfootballPage(0);
        }
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, activeSection]); // eslint-disable-line

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    setSearchTerm('');
    setFifaPage(0);
    setEfootballPage(0);
  };

  const handleFifaSort = (field: string) => {
    if (fifaSortBy === field) {
      setFifaSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setFifaSortBy(field);
      setFifaSortDir('asc');
    }
  };

  const handleEfSort = (field: string) => {
    if (efSortBy === field) {
      setEfSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setEfSortBy(field);
      setEfSortDir('asc');
    }
  };

  const handleFifaPageChange = async (page: number) => {
    setFifaPage(page);
    if (searchTerm.trim()) {
      await searchPlayers({ nombre: searchTerm, page, size: 12, sortBy: fifaSortBy, sortDir: fifaSortDir });
    } else {
      await fetchPlayers(page, 12, fifaSortBy, fifaSortDir);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEfootballPageChange = async (page: number) => {
    setEfootballPage(page);
    if (filtersActive && hasActiveFilters) {
      await searchAdvanced({ ...advFilters, nombre: searchTerm || undefined, page, size: 12, sortBy: efSortBy, sortDir: efSortDir });
    } else if (searchTerm.trim()) {
      await searchJugadores({ nombre: searchTerm, page, size: 12, sortBy: efSortBy, sortDir: efSortDir });
    } else {
      await fetchJugadores(page, 12, efSortBy, efSortDir);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Modal handlers ───────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setEditingJugador(null);
    setModalOpen(true);
  };

  const handleEditFifa = (player: Player) => {
    setEditingPlayer(player);
    setEditingJugador(null);
    setModalOpen(true);
  };

  const handleEditJugador = (jugador: Jugador) => {
    setEditingJugador(jugador);
    setEditingPlayer(null);
    setModalOpen(true);
  };

  const handleSuccess = useCallback(() => {
    if (activeSection === 'FIFA') {
      fetchPlayers(fifaPage, 12, fifaSortBy, fifaSortDir);
    } else {
      fetchJugadores(efootballPage, 12, efSortBy, efSortDir);
    }
  }, [activeSection, fifaPage, efootballPage, fifaSortBy, fifaSortDir, efSortBy, efSortDir, fetchPlayers, fetchJugadores]);

  // ─── Eliminar ─────────────────────────────────────────────────────────────

  const handleDeleteFifa = async (id: number) => {
    if (!window.confirm('¿Eliminar este jugador FIFA?')) return;
    try {
      await playersApi.delete(id);
      toast.success('Jugador eliminado');
      fetchPlayers(fifaPage, 12, fifaSortBy, fifaSortDir);
    } catch {
      toast.error('Error al eliminar el jugador');
    }
  };

  const handleDeleteJugador = async (id: number) => {
    if (!window.confirm('¿Eliminar este jugador eFootball?')) return;
    try {
      await jugadoresApi.delete(id);
      toast.success('Jugador eliminado');
      fetchJugadores(efootballPage, 12, efSortBy, efSortDir);
    } catch {
      toast.error('Error al eliminar el jugador');
    }
  };

  // ─── Skeleton ─────────────────────────────────────────────────────────────

  const SkeletonCard = () => (
    <div className="glass-card p-5 animate-pulse">
      <div className="w-full h-44 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-5 rounded mb-2 w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-4 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  );

  // ─── Sort chip helper ─────────────────────────────────────────────────────

  const SortChip = ({
    option, activeSortBy, activeSortDir, onSort,
    accentColor,
  }: {
    option: SortOption;
    activeSortBy: string;
    activeSortDir: SortDir;
    onSort: (f: string) => void;
    accentColor: string;
  }) => {
    const isActive = activeSortBy === option.value;
    return (
      <button
        onClick={() => onSort(option.value)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
        style={
          isActive
            ? { background: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}40` }
            : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        {option.label}
        {isActive
          ? activeSortDir === 'asc'
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />
          : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </button>
    );
  };

  const isLoading = activeSection === 'FIFA' ? fifaLoading : efootballLoading;
  const activePaged = activeSection === 'FIFA' ? fifaPaged : efootballPaged;

  return (
    <Layout>
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Jugadores</h1>
          {activePaged && (
            <p className="text-gray-400 text-sm mt-1">
              {activePaged.totalElements} jugadores en {activeSection === 'FIFA' ? '⚽ FIFA' : '🎮 eFootball'}
            </p>
          )}
        </div>

        {/* Botón agregar — disponible para todos los usuarios */}
        <button
          id="btn-add-player"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 hover:scale-105 flex-shrink-0"
          style={{
            background: activeSection === 'FIFA'
              ? 'linear-gradient(135deg, #6C63FF, #FF6584)'
              : 'linear-gradient(135deg, #FF8C00, #FF4500)',
          }}
        >
          <Plus className="w-4 h-4" />
          Agregar Jugador
        </button>
      </div>

      {/* ─── Tabs de sección ──────────────────────────────────────────────── */}
      <div
        className="flex rounded-xl p-1 mb-6 gap-1"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          id="tab-fifa"
          onClick={() => handleSectionChange('FIFA')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200"
          style={
            activeSection === 'FIFA'
              ? { background: 'linear-gradient(135deg, #6C63FF22, #FF658422)', color: '#a78bfa', border: '1px solid rgba(108,99,255,0.3)' }
              : { color: '#9ca3af' }
          }
        >
          <Users className="w-4 h-4" />
          ⚽ FIFA
          {fifaPaged && (
            <span className="px-2 py-0.5 rounded-full text-xs"
              style={{ background: activeSection === 'FIFA' ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.08)', color: activeSection === 'FIFA' ? '#a78bfa' : '#6b7280' }}>
              {fifaPaged.totalElements}
            </span>
          )}
        </button>

        <button
          id="tab-efootball"
          onClick={() => handleSectionChange('EFOOTBALL')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200"
          style={
            activeSection === 'EFOOTBALL'
              ? { background: 'linear-gradient(135deg, #FF8C0022, #FF450022)', color: '#FB923C', border: '1px solid rgba(255,140,0,0.3)' }
              : { color: '#9ca3af' }
          }
        >
          <Gamepad2 className="w-4 h-4" />
          🎮 eFootball
          {efootballPaged && (
            <span className="px-2 py-0.5 rounded-full text-xs"
              style={{ background: activeSection === 'EFOOTBALL' ? 'rgba(255,140,0,0.25)' : 'rgba(255,255,255,0.08)', color: activeSection === 'EFOOTBALL' ? '#FB923C' : '#6b7280' }}>
              {efootballPaged.totalElements}
            </span>
          )}
        </button>
      </div>

      {/* ─── Buscador ─────────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="search-jugadores"
          type="text"
          placeholder={`Buscar en ${activeSection === 'FIFA' ? '⚽ FIFA' : '🎮 eFootball'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-10 py-3 rounded-xl text-white text-sm outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── Panel de ordenamiento ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1 mr-1">
          <ArrowUpDown className="w-3.5 h-3.5" /> Ordenar:
        </span>
        {activeSection === 'FIFA'
          ? FIFA_SORT_OPTIONS.map(opt => (
              <SortChip
                key={opt.value}
                option={opt}
                activeSortBy={fifaSortBy}
                activeSortDir={fifaSortDir}
                onSort={handleFifaSort}
                accentColor="#6C63FF"
              />
            ))
          : EFOOTBALL_SORT_OPTIONS.map(opt => (
              <SortChip
                key={opt.value}
                option={opt}
                activeSortBy={efSortBy}
                activeSortDir={efSortDir}
                onSort={handleEfSort}
                accentColor="#FF8C00"
              />
            ))
        }
      </div>

      {/* ─── Filtros avanzados (solo eFootball) ───────────────────────────── */}
      {activeSection === 'EFOOTBALL' && (
        <div className="mb-6">
          <button
            onClick={() => setShowAdvFilters(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{
              background: hasActiveFilters ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.05)',
              color: hasActiveFilters ? '#FF8C00' : '#9ca3af',
              border: hasActiveFilters ? '1px solid rgba(255,140,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros avanzados
            {hasActiveFilters && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#FF8C00', color: 'white' }}>ON</span>}
            {showAdvFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvFilters && (
            <div
              className="mt-3 p-5 rounded-xl space-y-4"
              style={{ background: 'rgba(255,140,0,0.05)', border: '1px solid rgba(255,140,0,0.15)' }}
            >
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Rangos de estadísticas</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Goles */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">⚽ Goles mín.</label>
                  <input type="number" min={0} placeholder="Ej: 50"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.minGoles ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, minGoles: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">⚽ Goles máx.</label>
                  <input type="number" min={0} placeholder="Ej: 200"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.maxGoles ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, maxGoles: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                {/* Asistencias */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">🎯 Asist. mín.</label>
                  <input type="number" min={0} placeholder="Ej: 30"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.minAsist ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, minAsist: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">🎯 Asist. máx.</label>
                  <input type="number" min={0} placeholder="Ej: 100"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.maxAsist ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, maxAsist: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                {/* Partidos */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">📋 Partidos mín.</label>
                  <input type="number" min={0} placeholder="Ej: 100"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.minPartidos ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, minPartidos: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">📋 Partidos máx.</label>
                  <input type="number" min={0} placeholder="Ej: 500"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.maxPartidos ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, maxPartidos: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                {/* GA mínimo */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">📊 GA mín. (G+A)</label>
                  <input type="number" min={0} placeholder="Ej: 100"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.minGa ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, minGa: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* PG mínimo */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">📈 PG mín. (Goles/Partido)</label>
                  <input type="number" step="0.01" min={0} placeholder="Ej: 0.5"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.minPg ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, minPg: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                {/* PA mínimo */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">📈 PA mín. (Asist./Partido)</label>
                  <input type="number" step="0.01" min={0} placeholder="Ej: 0.3"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.minPa ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, minPa: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                {/* PGA mínimo */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">📈 PGA mín. ((G+A)/Partido)</label>
                  <input type="number" step="0.01" min={0} placeholder="Ej: 0.7"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}
                    value={advFilters.minPga ?? ''}
                    onChange={e => setAdvFilters(f => ({ ...f, minPga: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    const hasAny = Object.values(advFilters).some(v => v !== undefined && v !== '');
                    if (!hasAny) {
                      toast('Ingresa al menos un filtro para aplicar', { icon: '⚠️' });
                      return;
                    }
                    setFiltersActive(true);
                    setEfootballPage(0);
                    searchAdvanced({ ...advFilters, nombre: searchTerm || undefined, page: 0, size: 12, sortBy: efSortBy, sortDir: efSortDir });
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #FF8C00, #FF4500)' }}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Aplicar filtros
                </button>
                <button
                  onClick={() => {
                    setAdvFilters(defaultFilters);
                    setFiltersActive(false);
                    setEfootballPage(0);
                    fetchJugadores(0, 12, efSortBy, efSortDir);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <FilterX className="w-4 h-4" />
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Grid de contenido ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : activeSection === 'FIFA' ? (
        /* ── Sección FIFA ── */
        players.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No se encontraron jugadores FIFA"
            description="Intenta con otro nombre o agrega el primero"
            action={{ label: 'Limpiar búsqueda', onClick: () => setSearchTerm('') }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {players.map(player => (
                <div key={player.id} className="relative group/card">
                  <PlayerCard player={player} />
                  {/* Controles en hover — botón stats para todos, eliminar solo admin */}
                  {user && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditFifa(player); }}
                        className="p-1.5 rounded-lg text-white transition-all"
                        style={{ background: 'rgba(108,99,255,0.85)' }}
                        title="Actualizar stats"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFifa(player.id); }}
                          className="p-1.5 rounded-lg text-white transition-all"
                          style={{ background: 'rgba(239,68,68,0.85)' }}
                          title="Eliminar jugador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {fifaPaged && (
              <Pagination
                currentPage={fifaPage}
                totalPages={fifaPaged.totalPages}
                onPageChange={handleFifaPageChange}
              />
            )}
          </>
        )
      ) : (
        /* ── Sección eFootball ── */
        jugadores.length === 0 ? (
          <EmptyState
            icon={<Gamepad2 className="w-8 h-8" />}
            title="No se encontraron jugadores eFootball"
            description="Intenta con otro nombre o agrega el primero"
            action={{ label: 'Limpiar búsqueda', onClick: () => setSearchTerm('') }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {jugadores.map(jugador => (
                <JugadorCard
                  key={jugador.id}
                  jugador={jugador}
                  onEdit={handleEditJugador}
                  onDelete={handleDeleteJugador}
                />
              ))}
            </div>
            {efootballPaged && (
              <Pagination
                currentPage={efootballPage}
                totalPages={efootballPaged.totalPages}
                onPageChange={handleEfootballPageChange}
              />
            )}
          </>
        )
      )}

      {/* ─── Modal ────────────────────────────────────────────────────────── */}
      <AddPlayerModal
        isOpen={modalOpen}
        section={activeSection}
        editingPlayer={editingPlayer}
        editingJugador={editingJugador}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </Layout>
  );
};

export default PlayersPage;
