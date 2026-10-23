import type { User } from '../types';

// Shape validation is not signature verification: only the server authorizes JWTs.
export function validateToken(value: unknown): string {
  if (typeof value !== 'string' || value.length > 8192 ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('Respuesta de sesión inválida');
  }
  return value;
}

export function validateUser(value: unknown): User {
  if (!value || typeof value !== 'object') throw new Error('Perfil inválido');
  const u = value as Record<string, unknown>;
  if (!Number.isSafeInteger(u.id) || Number(u.id) <= 0 ||
      typeof u.nombre !== 'string' || u.nombre.length > 200 ||
      typeof u.correo !== 'string' || u.correo.length > 254 ||
      (u.rol !== 'ADMIN' && u.rol !== 'USER') ||
      typeof u.saldo !== 'number' || !Number.isFinite(u.saldo) || u.saldo < 0 ||
      typeof u.fechaRegistro !== 'string' || typeof u.activo !== 'boolean') {
    throw new Error('Perfil inválido');
  }
  return { id: Number(u.id), nombre: u.nombre, correo: u.correo,
    rol: u.rol, saldo: u.saldo, fechaRegistro: u.fechaRegistro, activo: u.activo };
}
