export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: 'ADMIN' | 'USER';
  saldo: number;
  fechaRegistro: string;
  activo: boolean;
}

export interface PlayerStats {
  id: number;
  temporada: string;
  goles: number;
  asistencias: number;
  partidosJugados: number;
  playerId: number;
}

export interface Player {
  id: number;
  nombre: string;
  nacionalidad: string;
  posicion: 'PORTERO' | 'DEFENSA' | 'CENTROCAMPISTA' | 'DELANTERO';
  edad: number;
  precio: number;
  imagenUrl?: string;
  activo: boolean;
  stats?: PlayerStats[];
}

export interface CartItem {
  id: number;
  cantidad: number;
  fechaAgregado: string;
  player: Player;
  subtotal: number;
}

export interface CartSummary {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface Purchase {
  id: number;
  fechaCompra: string;
  precioTotal: number;
  players: Player[];
  userName: string;
}

export interface Comment {
  id: number;
  contenido: string;
  rating: number;
  fecha: string;
  activo: boolean;
  userName: string;
  userId: number;
  playerId: number;
}

export interface ForumThread {
  id: number;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  activo: boolean;
  userName: string;
  userId: number;
  postCount: number;
}

export interface ForumPost {
  id: number;
  contenido: string;
  fechaPublicacion: string;
  activo: boolean;
  userName: string;
  userId: number;
  threadId: number;
}

export interface Meeting {
  id: number;
  url: string;
  fechaInicio: string;
  fechaFin: string;
  tema: string;
  activo: boolean;
  userName: string;
  userId: number;
}


export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  nombre: string;
  correo: string;
  rol: 'ADMIN' | 'USER';
  saldo: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  correo: string;
  password: string;
}

export interface PlayerSearchParams {
  nombre?: string;
  posicion?: string;
  nacionalidad?: string;
  minPrecio?: number;
  maxPrecio?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ─── eFootball ────────────────────────────────────────────────────────────────

export interface Jugador {
  id: number;
  nombre: string;
  partidos: number;
  goles: number;
  asistencias: number;
  precio: number;
  imagenUrl?: string;
  ga?: number;
  pg?: number;
  pa?: number;
  pga?: number;
}

export interface JugadorSearchParams {
  nombre?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ChatMessage {
  id: number;
  pregunta: string;
  respuestaIA: string;
  fecha: string;
  userId?: number;
}

export interface Song {
  id: number;
  titulo: string;
  artista: string;
  album?: string;
  genero?: string;
  anio?: number;
  duracion?: string;
  activo: boolean;
}
