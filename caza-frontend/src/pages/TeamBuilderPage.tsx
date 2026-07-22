import React, { useEffect, useState, useCallback } from 'react';
import { Users, Gamepad2, ChevronDown, Search, X, Check, Trophy, Star, Bookmark, Trash2, Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { playersApi } from '../api/players';
import { jugadoresApi } from '../api/jugadores';
import { purchasesApi } from '../api/purchases';
import { useAuth } from '../hooks/useAuth';
import type { Player, Jugador } from '../types';
import toast from 'react-hot-toast';

interface SavedLineup {
  id: string;
  name: string;
  gameType: GameType;
  teamMode: TeamMode;
  formationKey: string;
  date: string;
  // Guardamos los pares index -> player object
  lineup: Record<number, AnyPlayer>;
}

// ─── Formaciones y posiciones ────────────────────────────────────────────────

type GameType = 'FIFA' | 'EFOOTBALL';
type TeamMode = 'MI_EQUIPO' | 'POTENCIAL';

interface FormationSlot {
  label: string;  // p.ej. "POR", "DC", "MCI"
  x: number;      // % horizontal (0 = izq, 100 = der)
  y: number;      // % vertical (0 = arriba, 100 = abajo)
}

interface Formation {
  name: string;
  slots: FormationSlot[];
}

const FORMATIONS: Record<string, Formation> = {
  '4-3-3': {
    name: '4-3-3',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 15, y: 75 }, { label: 'DC',  x: 35, y: 75 }, { label: 'DC',  x: 65, y: 75 }, { label: 'RT',  x: 85, y: 75 },
      { label: 'MCO', x: 25, y: 55 }, { label: 'MCD', x: 50, y: 52 }, { label: 'MCO', x: 75, y: 55 },
      { label: 'EXI', x: 18, y: 28 }, { label: 'DEL', x: 50, y: 22 }, { label: 'EXD', x: 82, y: 28 },
    ],
  },
  '4-4-2': {
    name: '4-4-2',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 12, y: 75 }, { label: 'DC',  x: 37, y: 75 }, { label: 'DC',  x: 63, y: 75 }, { label: 'RT',  x: 88, y: 75 },
      { label: 'EXI', x: 12, y: 52 }, { label: 'MCI', x: 37, y: 52 }, { label: 'MCD', x: 63, y: 52 }, { label: 'EXD', x: 88, y: 52 },
      { label: 'DEL', x: 33, y: 22 }, { label: 'DEL', x: 67, y: 22 },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 12, y: 76 }, { label: 'DC',  x: 37, y: 76 }, { label: 'DC',  x: 63, y: 76 }, { label: 'RT',  x: 88, y: 76 },
      { label: 'MCD', x: 35, y: 60 }, { label: 'MCD', x: 65, y: 60 },
      { label: 'EXI', x: 15, y: 40 }, { label: 'MCO', x: 50, y: 37 }, { label: 'EXD', x: 85, y: 40 },
      { label: 'DEL', x: 50, y: 18 },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'DC',  x: 25, y: 76 }, { label: 'DC',  x: 50, y: 76 }, { label: 'DC',  x: 75, y: 76 },
      { label: 'LT',  x: 10, y: 55 }, { label: 'MCI', x: 30, y: 55 }, { label: 'MCD', x: 50, y: 52 }, { label: 'MCD', x: 70, y: 55 }, { label: 'RT',  x: 90, y: 55 },
      { label: 'DEL', x: 33, y: 22 }, { label: 'DEL', x: 67, y: 22 },
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 8,  y: 73 }, { label: 'DC',  x: 28, y: 73 }, { label: 'LIB', x: 50, y: 73 }, { label: 'DC',  x: 72, y: 73 }, { label: 'RT',  x: 92, y: 73 },
      { label: 'MCI', x: 25, y: 50 }, { label: 'MCD', x: 50, y: 50 }, { label: 'MCI', x: 75, y: 50 },
      { label: 'DEL', x: 33, y: 22 }, { label: 'DEL', x: 67, y: 22 },
    ],
  },
  '3-4-3': {
    name: '3-4-3',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'DC',  x: 25, y: 76 }, { label: 'DC',  x: 50, y: 76 }, { label: 'DC',  x: 75, y: 76 },
      { label: 'LT',  x: 12, y: 55 }, { label: 'MC',  x: 37, y: 55 }, { label: 'MC',  x: 63, y: 55 }, { label: 'RT',  x: 88, y: 55 },
      { label: 'EXI', x: 18, y: 28 }, { label: 'DEL', x: 50, y: 22 }, { label: 'EXD', x: 82, y: 28 },
    ],
  },
  '5-4-1': {
    name: '5-4-1',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 8,  y: 74 }, { label: 'DC',  x: 28, y: 74 }, { label: 'DC',  x: 50, y: 74 }, { label: 'DC',  x: 72, y: 74 }, { label: 'RT',  x: 92, y: 74 },
      { label: 'EXI', x: 12, y: 48 }, { label: 'MC',  x: 37, y: 50 }, { label: 'MC',  x: 63, y: 50 }, { label: 'EXD', x: 88, y: 48 },
      { label: 'DEL', x: 50, y: 20 },
    ],
  },
  '4-3-2-1': {
    name: '4-3-2-1',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 12, y: 76 }, { label: 'DC',  x: 37, y: 76 }, { label: 'DC',  x: 63, y: 76 }, { label: 'RT',  x: 88, y: 76 },
      { label: 'MCI', x: 22, y: 56 }, { label: 'MCD', x: 50, y: 58 }, { label: 'MCD', x: 78, y: 56 },
      { label: 'MCO', x: 33, y: 36 }, { label: 'MCO', x: 67, y: 36 },
      { label: 'DEL', x: 50, y: 18 },
    ],
  },
  '5-2-3': {
    name: '5-2-3',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 8,  y: 73 }, { label: 'DC',  x: 28, y: 73 }, { label: 'DC',  x: 50, y: 73 }, { label: 'DC',  x: 72, y: 73 }, { label: 'RT',  x: 92, y: 73 },
      { label: 'MC',  x: 35, y: 52 }, { label: 'MC',  x: 65, y: 52 },
      { label: 'EXI', x: 18, y: 28 }, { label: 'DEL', x: 50, y: 22 }, { label: 'EXD', x: 82, y: 28 },
    ],
  },
  '4-1-4-1': {
    name: '4-1-4-1',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 12, y: 76 }, { label: 'DC',  x: 37, y: 76 }, { label: 'DC',  x: 63, y: 76 }, { label: 'RT',  x: 88, y: 76 },
      { label: 'MCD', x: 50, y: 62 },
      { label: 'EXI', x: 12, y: 44 }, { label: 'MC',  x: 37, y: 44 }, { label: 'MC',  x: 63, y: 44 }, { label: 'EXD', x: 88, y: 44 },
      { label: 'DEL', x: 50, y: 20 },
    ],
  },
  '4-2-4': {
    name: '4-2-4',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 12, y: 76 }, { label: 'DC',  x: 37, y: 76 }, { label: 'DC',  x: 63, y: 76 }, { label: 'RT',  x: 88, y: 76 },
      { label: 'MC',  x: 35, y: 54 }, { label: 'MC',  x: 65, y: 54 },
      { label: 'EXI', x: 12, y: 26 }, { label: 'DEL', x: 37, y: 22 }, { label: 'DEL', x: 63, y: 22 }, { label: 'EXD', x: 88, y: 26 },
    ],
  },
  '4-5-1': {
    name: '4-5-1',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'LT',  x: 12, y: 76 }, { label: 'DC',  x: 37, y: 76 }, { label: 'DC',  x: 63, y: 76 }, { label: 'RT',  x: 88, y: 76 },
      { label: 'EXI', x: 10, y: 48 }, { label: 'MCI', x: 30, y: 50 }, { label: 'MCD', x: 50, y: 52 }, { label: 'MCD', x: 70, y: 50 }, { label: 'EXD', x: 90, y: 48 },
      { label: 'DEL', x: 50, y: 20 },
    ],
  },
  '3-4-1-2': {
    name: '3-4-1-2',
    slots: [
      { label: 'POR', x: 50, y: 92 },
      { label: 'DC',  x: 25, y: 76 }, { label: 'DC',  x: 50, y: 76 }, { label: 'DC',  x: 75, y: 76 },
      { label: 'LT',  x: 10, y: 54 }, { label: 'MC',  x: 35, y: 55 }, { label: 'MC',  x: 65, y: 55 }, { label: 'RT',  x: 90, y: 54 },
      { label: 'MCO', x: 50, y: 38 },
      { label: 'DEL', x: 33, y: 22 }, { label: 'DEL', x: 67, y: 22 },
    ],
  },
};

// ─── Tipos internos ──────────────────────────────────────────────────────────

type AnyPlayer = Player | Jugador;

function isPlayer(p: AnyPlayer): p is Player {
  return 'posicion' in p;
}

function getPlayerName(p: AnyPlayer) { return p.nombre; }
function getPlayerImg(p: AnyPlayer) { return p.imagenUrl; }
function getPlayerLabel(p: AnyPlayer, gameType: GameType) {
  if (gameType === 'FIFA' && isPlayer(p)) return p.posicion ?? '';
  if (gameType === 'EFOOTBALL' && !isPlayer(p)) return `${(p as Jugador).goles ?? 0}G`;
  return '';
}

// ─── Componente: slot en el campo ────────────────────────────────────────────

interface SlotProps {
  slot: FormationSlot;
  player: AnyPlayer | null;
  onClick: () => void;
  gameType: GameType;
  accentColor: string;
}

const PitchSlot: React.FC<SlotProps> = ({ slot, player, onClick, gameType, accentColor }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute',
      left: `${slot.x}%`,
      top: `${slot.y}%`,
      transform: 'translate(-50%, -50%)',
      width: '72px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      zIndex: 2,
    }}
  >
    {/* Avatar */}
    <div style={{
      width: '52px', height: '52px', borderRadius: '50%',
      background: player
        ? 'rgba(0,0,0,0.6)'
        : `${accentColor}22`,
      border: `2.5px solid ${player ? accentColor : 'rgba(255,255,255,0.25)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      boxShadow: player ? `0 0 14px ${accentColor}55` : 'none',
      transition: 'all 0.2s',
    }}>
      {player ? (
        player.imagenUrl
          ? <img src={player.imagenUrl} alt={player.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{player.nombre.charAt(0)}</span>
      ) : (
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>+</span>
      )}
    </div>

    {/* Nombre / label */}
    <div style={{
      background: player ? `${accentColor}dd` : 'rgba(0,0,0,0.65)',
      borderRadius: '6px', padding: '2px 6px',
      fontSize: '0.6rem', fontWeight: 800,
      color: player ? '#fff' : 'rgba(255,255,255,0.5)',
      maxWidth: '70px', textAlign: 'center',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {player ? player.nombre.split(' ')[0] : slot.label}
    </div>
  </button>
);

// ─── Modal selector de jugador ────────────────────────────────────────────────

interface SelectorProps {
  players: AnyPlayer[];
  selected: AnyPlayer | null;
  onSelect: (p: AnyPlayer | null) => void;
  onClose: () => void;
  slotLabel: string;
  accentColor: string;
  gameType: GameType;
}

const PlayerSelectorModal: React.FC<SelectorProps> = ({ players, selected, onSelect, onClose, slotLabel, accentColor, gameType }) => {
  const [query, setQuery] = useState('');
  const filtered = players.filter(p =>
    p.nombre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: '480px', maxHeight: '80vh',
        background: '#12122A', borderRadius: '20px',
        border: `1px solid ${accentColor}30`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
              Seleccionar jugador — <span style={{ color: accentColor }}>{slotLabel}</span>
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '2px 0 0' }}>{players.length} jugadores disponibles</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0.8rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#6b7280' }} />
            <input
              autoFocus
              type="text"
              placeholder="Buscar jugador..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.55rem 0.8rem 0.55rem 2.2rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Opción "Quitar jugador" */}
        {selected && (
          <button
            onClick={() => { onSelect(null); onClose(); }}
            style={{
              margin: '0.6rem 1.2rem 0', padding: '0.55rem 1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', color: '#f87171', fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <X style={{ width: '14px', height: '14px' }} /> Quitar jugador
          </button>
        )}

        {/* Lista */}
        <div style={{ overflowY: 'auto', padding: '0.6rem 1.2rem 1rem', flex: 1 }}>
          {filtered.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
              No se encontraron jugadores
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.map(p => {
                const isSelected = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { onSelect(p); onClose(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '0.65rem 1rem', borderRadius: '12px', textAlign: 'left',
                      background: isSelected ? `${accentColor}18` : 'rgba(255,255,255,0.04)',
                      border: isSelected ? `1px solid ${accentColor}40` : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? `${accentColor}30` : 'rgba(255,255,255,0.1)',
                    }}>
                      {p.imagenUrl
                        ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontWeight: 900, color: '#fff', fontSize: '1rem' }}>{p.nombre.charAt(0)}</span>}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nombre}
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '0.72rem', margin: '2px 0 0' }}>
                        {gameType === 'FIFA' && isPlayer(p) ? `${p.posicion ?? ''} · ${p.nacionalidad ?? ''}` : ''}
                        {gameType === 'EFOOTBALL' && !isPlayer(p) ? `${(p as Jugador).goles ?? 0}G · ${(p as Jugador).asistencias ?? 0}A · ${(p as Jugador).partidos ?? 0}P` : ''}
                      </p>
                    </div>
                    {isSelected && <Check style={{ width: '16px', height: '16px', color: accentColor, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

const TeamBuilderPage: React.FC = () => {
  const { user } = useAuth();

  // Sección del juego
  const [gameType, setGameType] = useState<GameType>('FIFA');
  // Modo: Mi equipo (comprados) o potencial (todos)
  const [teamMode, setTeamMode] = useState<TeamMode>('MI_EQUIPO');
  // Formación seleccionada
  const [formationKey, setFormationKey] = useState('4-3-3');

  // Slots ocupados: índice → jugador
  const [lineup, setLineup] = useState<Record<number, AnyPlayer | null>>({});

  // Modal: qué slot está abierto
  const [openSlot, setOpenSlot] = useState<number | null>(null);

  // Listas de jugadores disponibles
  const [allFifa, setAllFifa] = useState<Player[]>([]);
  const [allEfootball, setAllEfootball] = useState<Jugador[]>([]);
  const [myFifa, setMyFifa] = useState<Player[]>([]);
  const [myEfootball, setMyEfootball] = useState<Jugador[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Todos los jugadores
        const [fifaPage, efPage] = await Promise.all([
          playersApi.getAll(0, 2000, 'nombre', 'asc'),
          jugadoresApi.getAll(0, 2000, 'nombre', 'asc'),
        ]);
        setAllFifa(fifaPage.content);
        setAllEfootball(efPage.content);

        // Jugadores comprados
        const purchases = await purchasesApi.getPurchases();
        const boughtIds = new Set(purchases.flatMap(p => p.players.map(pl => pl.id)));
        setMyFifa(fifaPage.content.filter(p => boughtIds.has(p.id)));

        // eFootball comprados — por ahora todos (no hay compra separada de eFootball)
        // Mostramos todos los de eFootball como "propios" si fueron comprados alguna vez
        setMyEfootball(efPage.content);
      } catch {
        // silencioso
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Modal para guardar en favoritos
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lineupName, setLineupName] = useState('');

  // Alineaciones guardadas en localStorage
  const storageKey = `caza_saved_lineups_${user?.id || 'guest'}`;
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Guardar en localStorage cuando cambien las alineaciones guardadas
  const persistSavedLineups = (newList: SavedLineup[]) => {
    setSavedLineups(newList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const handleSaveLineup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineupName.trim()) {
      toast.error('Ingresa un nombre para tu equipo');
      return;
    }

    const filledLineup: Record<number, AnyPlayer> = {};
    Object.entries(lineup).forEach(([idx, player]) => {
      if (player) filledLineup[Number(idx)] = player;
    });

    if (Object.keys(filledLineup).length === 0) {
      toast.error('Asigna al menos un jugador antes de guardar');
      return;
    }

    const newSaved: SavedLineup = {
      id: Date.now().toString(),
      name: lineupName.trim(),
      gameType,
      teamMode,
      formationKey,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      lineup: filledLineup,
    };

    persistSavedLineups([newSaved, ...savedLineups]);
    setLineupName('');
    setShowSaveModal(false);
    toast.success(`⭐ ¡Alineación "${newSaved.name}" guardada en favoritos!`);
  };

  const handleLoadSavedLineup = (saved: SavedLineup) => {
    setGameType(saved.gameType);
    setTeamMode(saved.teamMode);
    setFormationKey(saved.formationKey);
    setLineup(saved.lineup);
    toast.success(`🎮 Alineación "${saved.name}" cargada`);
  };

  const handleDeleteSavedLineup = (id: string, name: string) => {
    const filtered = savedLineups.filter(s => s.id !== id);
    persistSavedLineups(filtered);
    toast.success(`Alineación "${name}" eliminada`);
  };

  // Al cambiar juego o modo, limpiar alineación
  const handleChangeGame = (gt: GameType) => {
    setGameType(gt);
    setLineup({});
  };
  const handleChangeMode = (m: TeamMode) => {
    setTeamMode(m);
    setLineup({});
  };
  const handleChangeFormation = (f: string) => {
    setFormationKey(f);
    setLineup({});
  };

  const formation = FORMATIONS[formationKey];
  const accentColor = gameType === 'FIFA' ? '#6C63FF' : '#FF8C00';

  // Pool de jugadores según modo y juego
  const playerPool: AnyPlayer[] = (() => {
    if (gameType === 'FIFA')
      return teamMode === 'MI_EQUIPO' ? myFifa : allFifa;
    return teamMode === 'MI_EQUIPO' ? myEfootball : allEfootball;
  })();

  // Jugadores ya en la alineación
  const usedIds = new Set(
    Object.values(lineup).filter(Boolean).map(p => p!.id)
  );
  // Disponibles = pool sin los ya usados (salvo el que está en el slot abierto)
  const available = playerPool.filter(p =>
    !usedIds.has(p.id) || (openSlot !== null && lineup[openSlot]?.id === p.id)
  );

  const countFilled = formation.slots.filter((_, i) => lineup[i]).length;

  if (isLoading) return (
    <Layout>
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </Layout>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Armar Equipo ⚽</h1>
          <p className="text-gray-400 text-sm mt-1">Diseña tu alineación ideal táctica y guárdala en tus favoritos</p>
        </div>

        {/* Botón Guardar en Favoritos */}
        <button
          onClick={() => {
            if (countFilled === 0) {
              toast.error('Agrega al menos un jugador a la alineación antes de guardar');
              return;
            }
            setShowSaveModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 hover:scale-105 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #facc15)',
            color: '#000',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25)',
          }}
        >
          <Star className="w-4 h-4 fill-black" />
          Guardar en Favoritos
        </button>
      </div>

      {/* Mis Equipos Guardados en Favoritos */}
      {savedLineups.length > 0 && (
        <div className="glass-card p-5 mb-6" style={{ border: '1px solid rgba(245, 158, 11, 0.25)', background: 'rgba(245, 158, 11, 0.03)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wide">
              <Bookmark className="w-4 h-4" /> Mis Equipos Guardados ({savedLineups.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedLineups.map((saved) => {
              const count = Object.values(saved.lineup).filter(Boolean).length;
              return (
                <div
                  key={saved.id}
                  className="p-3.5 rounded-xl flex items-center justify-between gap-3 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm truncate">{saved.name}</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black" style={{ background: saved.gameType === 'FIFA' ? 'rgba(108,99,255,0.2)' : 'rgba(255,140,0,0.2)', color: saved.gameType === 'FIFA' ? '#a78bfa' : '#FB923C' }}>
                        {saved.gameType}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {saved.formationKey} · {count}/11 Jugadores · <span className="text-gray-500">{saved.date}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleLoadSavedLineup(saved)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-black transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #43E97B, #38BDF8)' }}
                    >
                      Cargar
                    </button>
                    <button
                      onClick={() => handleDeleteSavedLineup(saved.id, saved.name)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs: Mi equipo / Potencial */}
      <div
        className="flex rounded-xl p-1 mb-5 gap-1 w-fit"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {(['MI_EQUIPO', 'POTENCIAL'] as TeamMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => handleChangeMode(mode)}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={
              teamMode === mode
                ? { background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}40` }
                : { color: '#9ca3af' }
            }
          >
            {mode === 'MI_EQUIPO' ? '🏆 Mi Equipo' : '✨ Equipo Potencial'}
          </button>
        ))}
      </div>

      {/* Tabs: FIFA / eFootball */}
      <div
        className="flex rounded-xl p-1 mb-6 gap-1 w-fit"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => handleChangeGame('FIFA')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
          style={gameType === 'FIFA'
            ? { background: 'rgba(108,99,255,0.2)', color: '#a78bfa', border: '1px solid rgba(108,99,255,0.4)' }
            : { color: '#9ca3af' }}
        >
          <Users className="w-4 h-4" /> ⚽ FIFA
        </button>
        <button
          onClick={() => handleChangeGame('EFOOTBALL')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
          style={gameType === 'EFOOTBALL'
            ? { background: 'rgba(255,140,0,0.2)', color: '#FB923C', border: '1px solid rgba(255,140,0,0.4)' }
            : { color: '#9ca3af' }}
        >
          <Gamepad2 className="w-4 h-4" /> 🎮 eFootball
        </button>
      </div>

      {teamMode === 'MI_EQUIPO' && playerPool.length === 0 && (
        <div className="glass-card p-8 text-center mb-6" style={{ border: `1px solid ${accentColor}20` }}>
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-white font-bold text-lg">No tienes jugadores de {gameType === 'FIFA' ? '⚽ FIFA' : '🎮 eFootball'} comprados aún</p>
          <p className="text-gray-400 text-sm mt-1">Cambia a "Equipo Potencial" para probar con todos o compra jugadores en el Mercado</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="space-y-4">
          {/* Formación */}
          <div className="glass-card p-5" style={{ border: `1px solid ${accentColor}20` }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span style={{ color: accentColor }}>⬛</span> Formación ({Object.keys(FORMATIONS).length} disponibles)
            </p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {Object.keys(FORMATIONS).map(f => (
                <button
                  key={f}
                  onClick={() => handleChangeFormation(f)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={
                    formationKey === f
                      ? { background: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}50` }
                      : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Progreso */}
          <div className="glass-card p-5" style={{ border: `1px solid ${accentColor}20` }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">📊 Progreso</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(countFilled / 11) * 100}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)` }}
                />
              </div>
              <span className="text-white font-black text-sm">{countFilled}/11</span>
            </div>
            <p className="text-gray-500 text-xs">{11 - countFilled} posiciones libres</p>
          </div>

          {/* Alineación (lista) */}
          <div className="glass-card p-5" style={{ border: `1px solid ${accentColor}20` }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">🗒️ Alineación</p>
            <div className="space-y-2">
              {formation.slots.map((slot, i) => {
                const p = lineup[i];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: p ? `${accentColor}10` : 'rgba(255,255,255,0.03)',
                      border: p ? `1px solid ${accentColor}25` : '1px solid rgba(255,255,255,0.05)',
                    }}
                    onClick={() => setOpenSlot(i)}
                  >
                    <span className="text-xs font-black w-8 text-center flex-shrink-0" style={{ color: accentColor }}>{slot.label}</span>
                    {p ? (
                      <>
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0" style={{ background: `${accentColor}30` }}>
                          {p.imagenUrl
                            ? <img src={p.imagenUrl} className="w-full h-full object-cover" alt="" />
                            : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-white">{p.nombre.charAt(0)}</span>}
                        </div>
                        <span className="text-white text-xs font-bold flex-1 truncate">{p.nombre}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setLineup(l => ({ ...l, [i]: null })); }}
                          className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs flex-1">Sin asignar</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reset */}
            {countFilled > 0 && (
              <button
                onClick={() => setLineup({})}
                className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}
              >
                Limpiar alineación
              </button>
            )}
          </div>
        </div>

        {/* Right: Campo de fútbol */}
        <div className="lg:col-span-2">
          <div
            className="relative w-full rounded-2xl overflow-hidden"
            style={{
              aspectRatio: '2/3',
              background: 'linear-gradient(180deg, #1a5c1a 0%, #1e6e1e 50%, #1a5c1a 100%)',
              border: `2px solid ${accentColor}30`,
              boxShadow: `0 0 40px ${accentColor}15`,
            }}
          >
            {/* Líneas del campo */}
            <svg
              viewBox="0 0 100 150"
              preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}
            >
              {/* Borde exterior */}
              <rect x="5" y="5" width="90" height="140" fill="none" stroke="white" strokeWidth="0.8" />
              {/* Línea del medio */}
              <line x1="5" y1="75" x2="95" y2="75" stroke="white" strokeWidth="0.6" />
              {/* Círculo central */}
              <circle cx="50" cy="75" r="12" fill="none" stroke="white" strokeWidth="0.6" />
              <circle cx="50" cy="75" r="1" fill="white" />
              {/* Área grande abajo */}
              <rect x="22" y="112" width="56" height="28" fill="none" stroke="white" strokeWidth="0.6" />
              {/* Área pequeña abajo */}
              <rect x="35" y="126" width="30" height="14" fill="none" stroke="white" strokeWidth="0.6" />
              {/* Portería abajo */}
              <rect x="42" y="140" width="16" height="5" fill="none" stroke="white" strokeWidth="0.6" />
              {/* Área grande arriba */}
              <rect x="22" y="10" width="56" height="28" fill="none" stroke="white" strokeWidth="0.6" />
              {/* Área pequeña arriba */}
              <rect x="35" y="10" width="30" height="14" fill="none" stroke="white" strokeWidth="0.6" />
              {/* Portería arriba */}
              <rect x="42" y="5" width="16" height="5" fill="none" stroke="white" strokeWidth="0.6" />
              {/* Punto penal abajo */}
              <circle cx="50" cy="124" r="0.8" fill="white" />
              {/* Punto penal arriba */}
              <circle cx="50" cy="26" r="0.8" fill="white" />
            </svg>

            {/* Nombre de la formación */}
            <div style={{
              position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)', borderRadius: '20px', padding: '4px 14px',
              color: '#fff', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em',
              backdropFilter: 'blur(4px)', zIndex: 3,
            }}>
              {formation.name}
            </div>

            {/* Slots de jugadores */}
            {formation.slots.map((slot, i) => (
              <PitchSlot
                key={i}
                slot={slot}
                player={lineup[i] ?? null}
                onClick={() => setOpenSlot(i)}
                gameType={gameType}
                accentColor={accentColor}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal selector */}
      {openSlot !== null && (
        <PlayerSelectorModal
          players={available}
          selected={lineup[openSlot] ?? null}
          onSelect={p => setLineup(l => ({ ...l, [openSlot]: p }))}
          onClose={() => setOpenSlot(null)}
          slotLabel={formation.slots[openSlot].label}
          accentColor={accentColor}
          gameType={gameType}
        />
      )}

      {/* Modal Guardar en Favoritos */}
      {showSaveModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 110,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
        >
          <div style={{
            width: '100%', maxWidth: '400px',
            background: '#12122A', borderRadius: '20px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '1.8rem',
            boxShadow: '0 0 50px rgba(245, 158, 11, 0.15)',
          }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-400 font-black text-lg">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>Guardar en Favoritos</span>
              </div>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLineup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Nombre de la Alineación / Equipo
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Mi XI Titular FIFA"
                  value={lineupName}
                  onChange={e => setLineupName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
                />
              </div>

              <div className="text-xs text-gray-400 space-y-1 bg-white/5 p-3 rounded-xl">
                <p><strong>Formación:</strong> {formationKey}</p>
                <p><strong>Modalidad:</strong> {teamMode === 'MI_EQUIPO' ? 'Mi Equipo' : 'Equipo Potencial'} ({gameType})</p>
                <p><strong>Jugadores:</strong> {countFilled}/11 asignados</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-black text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #facc15)' }}
                >
                  <Save className="w-4 h-4" /> Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-gray-300 text-sm bg-white/5 hover:bg-white/10"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeamBuilderPage;
