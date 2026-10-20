import api from '../api/axiosConfig';
import LineupTransfer from '../components/LineupTransfer';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Users, Gamepad2, ChevronDown, Search, X, Check, Trophy, Star, Bookmark, Trash2, Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { allFifaPlayers, allEfootballPlayers } from '../api/catalogue';
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
  index?: number;
  onMove?: (from:number,to:number)=>void;
}

const PitchSlot: React.FC<SlotProps> = ({ slot, player, onClick, gameType, accentColor, index, onMove }) => (
  <button
    onClick={onClick}
    aria-label={`${slot.label}: ${player?.nombre??'Sin asignar'}`}
    draggable={!!player}
    onDragStart={e=>{e.dataTransfer.setData('text/plain',String(index));e.dataTransfer.effectAllowed='move'}}
    onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='move'}}
    onDrop={e=>{e.preventDefault();const from=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(from)&&index!==undefined)onMove?.(from,index)}}

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
      {slot.label} {player ? `· ${player.nombre}` : ''}
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


type Draft={name:string;gameType:GameType;teamMode:TeamMode;formationKey:string;lineup:Record<number,AnyPlayer>;legacyId?:string};
type CloudLineup={id:string;name:string;payload:string;version:number;updatedAt:string};
const emptyDraft=():Draft=>({name:'Mi alineación',gameType:'FIFA',teamMode:'POTENCIAL',formationKey:'4-3-3',lineup:{}});
const validDraft=(d:Draft)=> d && ['FIFA','EFOOTBALL'].includes(d.gameType) &&
 ['MI_EQUIPO','POTENCIAL'].includes(d.teamMode) && !!FORMATIONS[d.formationKey] && d.lineup && typeof d.lineup==='object' &&
 Object.entries(d.lineup).length<=23 && Object.entries(d.lineup).every(([i,p])=>
 Number.isInteger(Number(i))&&Number(i)>=0&&Number(i)<23&&p&&Number.isInteger(p.id)&&p.id>0&&typeof p.nombre==='string') &&
 new Set(Object.values(d.lineup).map(p=>p.id)).size===Object.values(d.lineup).length;
const TeamBuilderPage: React.FC=()=>{
 const {user}=useAuth();
 const [draft,setDraft]=useState<Draft>(emptyDraft);
 const [id,setId]=useState(()=>crypto.randomUUID());
 const [version,setVersion]=useState<number|null>(null);
 const [saved,setSaved]=useState<CloudLineup[]>([]);
 const [last,setLast]=useState('');
 const [dirty,setDirty]=useState(false),[saving,setSaving]=useState(false),[ready,setReady]=useState(false);
 const [error,setError]=useState(''),[conflict,setConflict]=useState(false);
 const [allFifa,setAllFifa]=useState<Player[]>([]),[allEf,setAllEf]=useState<Jugador[]>([]);
 const [owned,setOwned]=useState<Set<string>>(new Set());
 const [openSlot,setOpenSlot]=useState<number|null>(null),[moveFrom,setMoveFrom]=useState<number|null>(null);
 const [query,setQuery]=useState('');const inFlight=useRef(false);
 const snapshot=JSON.stringify(draft);
 const apply=(row:CloudLineup)=>{
  const d=JSON.parse(row.payload) as Draft;if(!validDraft(d))throw new Error('Alineación inválida');
  setDraft(d);setId(row.id as ReturnType<typeof crypto.randomUUID>);setVersion(row.version);
  setLast(JSON.stringify(d));setDirty(false);setConflict(false);setError('');setMoveFrom(null);
 };
 const load=async()=>{
  setError('');setReady(false);
  try{
   const [f,e,p,r]=await Promise.all([allFifaPlayers(),allEfootballPlayers(),purchasesApi.getPurchases(),api.get('/lineups')]);
   setAllFifa(f);setAllEf(e);
   setOwned(new Set(p.flatMap(x=>x.players.map(pl=>`${pl.gameType??'FIFA'}:${pl.id}`))));
   const rows=r.data.data as CloudLineup[];setSaved(rows);
   if(rows.length)apply(rows[0]);
   setReady(true);
  }catch{setError('No se pudieron cargar tus equipos. Reintenta antes de editar.');}
 };
 useEffect(()=>{load()},[user?.id]);
 // A single in-flight request. Edits made during a save are sent afterwards using the new version.
 useEffect(()=>{
  if(!ready||!dirty||saving||conflict||error||snapshot===last)return;
  const timer=setTimeout(async()=>{
   if(inFlight.current)return;
   if(!draft.name.trim()){setError('Escribe un nombre para guardar la alineación.');return;}
   inFlight.current=true;setSaving(true);
   try{
    const result=await api.put(`/lineups/${id}`,{name:draft.name,payload:snapshot,version});
    const row=result.data.data as CloudLineup;
    setVersion(row.version);setLast(snapshot);
    setSaved(list=>[row,...list.filter(r=>r.id!==row.id)]);
   }catch(e:any){
    if(e?.response?.status===409)setConflict(true);
    setError(e?.response?.data?.message||'No se pudo guardar. Tus cambios siguen en esta pantalla.');
   }finally{inFlight.current=false;setSaving(false);}
  },900);
  return()=>clearTimeout(timer);
 },[snapshot,ready,dirty,saving,conflict,error,last,id,version]);
 const pending=dirty&&snapshot!==last;
 useEffect(()=>{
  const before=(e:BeforeUnloadEvent)=>{if(pending||saving){e.preventDefault();e.returnValue='';}};
  const navigate=(e:MouseEvent)=>{const a=(e.target as HTMLElement).closest('a');if(a&&(pending||saving)&&!confirm('Hay cambios sin guardar. ¿Salir de esta página?')){e.preventDefault();e.stopPropagation();}};
  window.addEventListener('beforeunload',before);document.addEventListener('click',navigate,true);
  return()=>{window.removeEventListener('beforeunload',before);document.removeEventListener('click',navigate,true)};
 },[pending,saving]);
 const change=(next:Draft)=>{if(inFlight.current&&next.gameType!==draft.gameType)return;setDraft(next);setDirty(true);if(!conflict)setError('')};
 const canLeave=()=>!inFlight.current&&(!pending||confirm('Tienes cambios sin guardar. ¿Continuar y descartarlos?'));
 const newTeam=()=>{if(!canLeave())return;setDraft(emptyDraft());setId(crypto.randomUUID());setVersion(null);setLast('');setDirty(false);setConflict(false);setError('')};
 const move=(from:number,to:number)=>{
  if(from<0||from>22||to<0||to>22||!draft.lineup[from]||from===to)return;
  const next={...draft.lineup};const other=next[to];next[to]=next[from];
  if(other)next[from]=other;else delete next[from];
  change({...draft,lineup:next});setMoveFrom(null);
 };
 const selectSlot=(i:number)=>{if(moveFrom!==null){move(moveFrom,i);return;}setOpenSlot(i)};
 const assign=(p:AnyPlayer|null)=>{
  if(openSlot===null)return;
  const lineup={...draft.lineup};
  if(p)lineup[openSlot]=p;else delete lineup[openSlot];
  change({...draft,lineup});setOpenSlot(null);
 };
 const importLegacy=async()=>{
  if(saving||!ready||pending){toast.error('Espera a que se guarde tu equipo actual.');return;}
  setSaving(true);inFlight.current=true;
  try{
   const old=JSON.parse(localStorage.getItem(`caza_saved_lineups_${user?.id}`)||'[]');
   let count=0;
   for(const item of old){
    if(saved.some(r=>JSON.parse(r.payload).legacyId===String(item.id)))continue;
    const d={...item,legacyId:String(item.id)} as Draft;
    if(!validDraft(d))throw new Error('Hay una alineación local inválida. Los originales no se modificaron.');
    const response=await api.put(`/lineups/${crypto.randomUUID()}`,{name:d.name,payload:JSON.stringify(d),version:null});
    setSaved(list=>[response.data.data,...list]);count++;
   }
   toast.success(`${count} equipos importados. Los originales locales se conservaron.`);
  }catch(e:any){toast.error(e.message||'No se pudo completar la importación.');}
  finally{inFlight.current=false;setSaving(false);}
 };
 const download=()=>{
  const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='CAZA-alineacion.json';a.click();URL.revokeObjectURL(url);
 };
 const pool:AnyPlayer[]=(draft.gameType==='FIFA'?allFifa:allEf).filter(p=>draft.teamMode==='POTENCIAL'||owned.has(`${draft.gameType}:${p.id}`));
 const formation=FORMATIONS[draft.formationKey];
 const color=draft.gameType==='FIFA'?'#a78bfa':'#fb923c';
 const used=new Set(Object.values(draft.lineup).map(p=>p.id));
 const available=pool.filter(p=>!used.has(p.id)||p.id===draft.lineup[openSlot??-1]?.id);
 const status=saving?'Guardando…':error?'No se pudo guardar':pending?'Cambios pendientes…':last?'Guardado en la nube':'Elige jugadores para comenzar';
 if(!ready)return <Layout><p role="status">{error||'Cargando tus equipos…'}</p>{error&&<button onClick={load} className="btn-primary mt-4">Reintentar</button>}</Layout>;
 return <Layout>
  <div className="flex flex-wrap justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-widest text-purple-300 mb-2">CAZA / TÁCTICA</p><h1 className="text-3xl font-black">Tu equipo, tu estilo</h1><p role="status" className="text-sm mt-2 text-gray-400">{status}</p></div>
   <div className="flex flex-wrap gap-3"><button className="btn-primary" disabled={saving} onClick={newTeam}>Nueva alineación</button>
    <button className="text-purple-300" disabled={saving||pending} onClick={importLegacy}>Importar equipos de este navegador</button><button onClick={download}>Exportar equipo</button>
    <label className="cursor-pointer text-purple-300">Importar archivo<input type="file" accept=".json" className="sr-only" onChange={async e=>{
     const file=e.target.files?.[0];e.target.value='';if(!file||!canLeave())return;
     try{if(file.size>100000)throw new Error();const d=JSON.parse(await file.text());if(!validDraft(d))throw new Error();setDraft(d);setId(crypto.randomUUID());setVersion(null);setLast('');setDirty(true);setConflict(false);setError('');}catch{toast.error('Archivo de alineación inválido.')}
    }}/></label></div>
  </div>
  {error&&<div role="alert" className="glass-card p-4 border border-red-400 mb-5"><p>{error}</p><div className="flex gap-4 mt-3">
   {!conflict&&<button onClick={()=>setError('')}>Reintentar guardado</button>}
   <button disabled={saving} onClick={()=>{setId(crypto.randomUUID());setVersion(null);setLast('');setConflict(false);setError('');setDirty(true)}}>Guardar como copia nueva</button>
   <button onClick={()=>{if(canLeave())load()}}>Recargar desde la nube</button></div></div>}
  <div className="grid lg:grid-cols-[300px_1fr] gap-6">
   <aside className="space-y-5">
    <div className="glass-card p-5 space-y-4">
     <label className="text-sm block">Nombre del equipo<input className="input-dark mt-2" maxLength={100} value={draft.name} onChange={e=>change({...draft,name:e.target.value})}/></label>
     <label className="text-sm block">Juego<select className="input-dark mt-2" disabled={saving} value={draft.gameType} onChange={e=>{
      if(Object.keys(draft.lineup).length&&!confirm('Cambiar de juego vaciará esta alineación. ¿Continuar?'))return;
      change({...draft,gameType:e.target.value as GameType,lineup:{}});setMoveFrom(null);
     }}><option>FIFA</option><option>EFOOTBALL</option></select></label>
     <label className="text-sm block">Jugadores disponibles<select className="input-dark mt-2" value={draft.teamMode} onChange={e=>{
      const mode=e.target.value as TeamMode;
      if(mode==='MI_EQUIPO'&&Object.values(draft.lineup).some(p=>!owned.has(`${draft.gameType}:${p.id}`))){toast.error('Retira primero los jugadores que aún no has comprado.');return;}
      change({...draft,teamMode:mode});
     }}><option value="POTENCIAL">Equipo potencial</option><option value="MI_EQUIPO">Mis jugadores comprados</option></select></label>
     <label className="text-sm block">Formación<select className="input-dark mt-2" value={draft.formationKey} onChange={e=>change({...draft,formationKey:e.target.value})}>{Object.keys(FORMATIONS).map(f=><option key={f}>{f}</option>)}</select></label>
     <p className="text-xs text-gray-400">Cambiar formación conserva los once jugadores. Revisa sus posiciones.</p>
    </div>
    <div className="glass-card p-4"><h2 className="font-bold mb-3">Alineaciones guardadas</h2>{saved.map(row=><div key={row.id} className="flex gap-2 py-2 border-b border-white/5">
     <button className="text-left flex-1 text-sm" disabled={saving} onClick={()=>{if(canLeave())apply(row)}}>{row.name}</button>
     <button aria-label={`Eliminar ${row.name}`} disabled={saving} onClick={async()=>{
      if(!canLeave()||!confirm(`¿Eliminar la alineación "${row.name}"?`))return;
      setSaving(true);inFlight.current=true;
      try{await api.delete(`/lineups/${row.id}`,{params:{version:row.version}});setSaved(list=>list.filter(r=>r.id!==row.id));if(id===row.id){setId(crypto.randomUUID());setVersion(null);setLast('');setDirty(false);setDraft(emptyDraft());}}
      catch{toast.error('No se eliminó. Puede haber cambiado en otro dispositivo; recarga.');}finally{inFlight.current=false;setSaving(false)}
     }}><Trash2 size={14}/></button>
    </div>)}</div>
    <div className="glass-card p-4"><h2 className="font-bold">Jugadores</h2><p className="text-xs text-gray-400 my-2">Toca una posición para elegir. Arrastra un jugador del campo o de suplentes para intercambiarlo.</p>
     <input className="input-dark mb-3" placeholder="Buscar en tu catálogo" aria-label="Buscar en tu catálogo" value={query} onChange={e=>setQuery(e.target.value)}/>
     <div className="max-h-64 overflow-auto">{pool.filter(p=>p.nombre.toLowerCase().includes(query.toLowerCase())&&!used.has(p.id)).slice(0,50).map(p=><button key={p.id} className="block text-left text-sm py-2 w-full hover:text-purple-300" onClick={()=>{
      const free=Array.from({length:23},(_,i)=>i).find(i=>!draft.lineup[i]);if(free===undefined){toast.error('Equipo completo');return;}change({...draft,lineup:{...draft.lineup,[free]:p}});
     }}>+ {p.nombre}</button>)}</div>
    </div>
   </aside>
   <section><div className="flex justify-between items-center mb-3"><h2 className="font-bold">{draft.name} · {draft.formationKey}</h2><span className="text-gray-400 text-sm">{Object.keys(draft.lineup).filter(i=>Number(i)<11).length}/11</span></div>
    <div className="pitch-modern relative rounded-3xl overflow-hidden" style={{aspectRatio:'2/3',maxHeight:850}}>
     <svg viewBox="0 0 100 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-30" aria-hidden="true"><rect x="5" y="5" width="90" height="140" fill="none" stroke="white"/><path d="M5 75 H95 M25 5 V25 H75 V5 M25 145 V125 H75 V145" fill="none" stroke="white"/><circle cx="50" cy="75" r="12" fill="none" stroke="white"/></svg>
     {formation.slots.map((slot,i)=><PitchSlot key={i} index={i} slot={slot} player={draft.lineup[i]??null} gameType={draft.gameType} accentColor={color} onMove={move} onClick={()=>selectSlot(i)}/>)}
    </div>
    <div className="glass-card p-4 mt-5"><h2 className="font-bold mb-3">Suplentes</h2><div className="grid grid-cols-3 sm:grid-cols-4 gap-3">{Array.from({length:12},(_,n)=>n+11).map(i=><button key={i}
     draggable={!!draft.lineup[i]} onDragStart={e=>e.dataTransfer.setData('text/plain',String(i))} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();move(Number(e.dataTransfer.getData('text/plain')),i)}}
     onClick={()=>selectSlot(i)} className="rounded-xl bg-white/5 p-3 text-xs hover:bg-white/10">S{i-10}<br/><span className="font-bold">{draft.lineup[i]?.nombre??'+ Elegir'}</span></button>)}</div></div>
    <div className="glass-card p-4 mt-5"><h2 className="font-bold mb-3">Mover por toque o teclado</h2><p className="text-sm text-gray-400 mb-3">{moveFrom!==null?'Ahora toca la posición de destino o un suplente.':'Elige un jugador para moverlo; también puedes retirarlo.'}</p>
     <div className="space-y-2">{Object.entries(draft.lineup).map(([i,p])=><div key={i} className="flex items-center gap-3 text-sm"><span className="flex-1">{Number(i)<11?formation.slots[Number(i)].label:`S${Number(i)-10}`} · {p.nombre}</span><button className="text-purple-300" onClick={()=>setMoveFrom(Number(i))}>Mover</button><button className="text-red-300" onClick={()=>{const lineup={...draft.lineup};delete lineup[Number(i)];change({...draft,lineup})}}>Retirar</button></div>)}</div>
     {moveFrom!==null&&<button className="mt-3" onClick={()=>setMoveFrom(null)}>Cancelar movimiento</button>}
    </div>
   </section>
  </div>
  {openSlot!==null&&<PlayerSelectorModal players={available} selected={draft.lineup[openSlot]??null} onSelect={assign} onClose={()=>setOpenSlot(null)} slotLabel={openSlot<11?formation.slots[openSlot].label:`Suplente ${openSlot-10}`} accentColor={color} gameType={draft.gameType}/>}
 </Layout>;
};
export default TeamBuilderPage;
