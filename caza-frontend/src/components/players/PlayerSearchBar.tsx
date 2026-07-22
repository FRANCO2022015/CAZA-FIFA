import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { PlayerSearchParams } from '../../types';

interface PlayerSearchBarProps {
  onSearch: (params: PlayerSearchParams) => void;
  onClear: () => void;
}

const positions = ['', 'PORTERO', 'DEFENSA', 'CENTROCAMPISTA', 'DELANTERO'];

const PlayerSearchBar: React.FC<PlayerSearchBarProps> = ({ onSearch, onClear }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [params, setParams] = useState<PlayerSearchParams>({
    nombre: '',
    posicion: '',
    nacionalidad: '',
    minPrecio: undefined,
    maxPrecio: undefined,
  });

  const hasActiveFilters = Object.values(params).some((v) => v !== '' && v !== undefined);

  const handleChange = (key: keyof PlayerSearchParams, value: string | number | undefined) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanParams: PlayerSearchParams = {};
    if (params.nombre) cleanParams.nombre = params.nombre;
    if (params.posicion) cleanParams.posicion = params.posicion;
    if (params.nacionalidad) cleanParams.nacionalidad = params.nacionalidad;
    if (params.minPrecio) cleanParams.minPrecio = params.minPrecio;
    if (params.maxPrecio) cleanParams.maxPrecio = params.maxPrecio;
    onSearch({ ...cleanParams, page: 0, size: 12 });
  };

  const handleClear = () => {
    setParams({ nombre: '', posicion: '', nacionalidad: '', minPrecio: undefined, maxPrecio: undefined });
    onClear();
  };

  return (
    <div className="glass-card p-4 mb-6">
      <form onSubmit={handleSubmit}>
        {/* Main search row */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar jugadores..."
              value={params.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="input-dark pl-10"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              showFilters || hasActiveFilters ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            style={
              showFilters || hasActiveFilters
                ? { background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full" style={{ background: '#6C63FF' }} />
            )}
          </button>
          <button type="submit" className="btn-primary px-5 py-3 text-sm">Buscar</button>
          {hasActiveFilters && (
            <button type="button" onClick={handleClear} className="p-3 rounded-xl text-gray-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t animate-fadeIn"
               style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <select
              value={params.posicion}
              onChange={(e) => handleChange('posicion', e.target.value)}
              className="input-dark"
            >
              <option value="">Todas las posiciones</option>
              {positions.slice(1).map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nacionalidad"
              value={params.nacionalidad}
              onChange={(e) => handleChange('nacionalidad', e.target.value)}
              className="input-dark"
            />
            <input
              type="number"
              placeholder="Precio mínimo"
              value={params.minPrecio ?? ''}
              onChange={(e) => handleChange('minPrecio', e.target.value ? Number(e.target.value) : undefined)}
              className="input-dark"
            />
            <input
              type="number"
              placeholder="Precio máximo"
              value={params.maxPrecio ?? ''}
              onChange={(e) => handleChange('maxPrecio', e.target.value ? Number(e.target.value) : undefined)}
              className="input-dark"
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default PlayerSearchBar;
