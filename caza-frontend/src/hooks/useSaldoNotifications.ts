import { authApi } from '../api/auth';
import { useEffect, useRef } from 'react';
import { saldoRequestsApi, type SaldoRequestItem } from '../api/saldoRequests';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

const POLL_INTERVAL_MS = 20_000; // chequea cada 20 segundos
const STORAGE_KEY = 'caza_saldo_notif_seen';

/**
 * Hook que hace polling de las solicitudes de saldo del usuario autenticado.
 * Cuando detecta que una solicitud pasó de PENDIENTE a APROBADA, muestra un
 * toast y actualiza el saldo en el contexto de autenticación.
 */
export function useSaldoNotifications() {
  const { user, updateBalance } = useAuth();
  // Mapa de { id → estado } que ya conocemos
  const knownStates = useRef<Record<number, string>>({});

  useEffect(() => {
    if (!user) return;

    // Restaurar el mapa guardado en sessionStorage para esta sesión
    try {
      const stored = sessionStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) knownStates.current = JSON.parse(stored);
    } catch { /* ignore */ }

    let polling = false;
    const poll = async () => {
      if (polling || document.hidden) return;
      polling = true;
      try {
        const solicitudes: SaldoRequestItem[] = await saldoRequestsApi.getMine();

        for (const sol of solicitudes) {
          const prev = knownStates.current[sol.id];
          const curr = sol.estado;

          // Primera vez que vemos esta solicitud → solo guardar estado
          if (prev === undefined) {
            knownStates.current[sol.id] = curr;
            continue;
          }

          // Pasó de PENDIENTE a APROBADA
          if (prev === 'PENDIENTE' && curr === 'APROBADA') {
            const monto = Number(sol.montoSolicitado).toLocaleString('es-ES');
            toast.success(
              `💰 ¡Tu solicitud de saldo de $${monto} ha sido aprobada!`,
              { duration: 6000, id: `saldo-aprobada-${sol.id}` }
            );
            knownStates.current[sol.id] = curr;
            // Actualizar el saldo mostrado en la UI (no recarga la página)
            if (updateBalance && user?.saldo != null) {
              updateBalance((await authApi.getMe()).saldo);
            }
          }

          // Pasó de PENDIENTE a RECHAZADA
          if (prev === 'PENDIENTE' && curr === 'RECHAZADA') {
            toast.error(
              `❌ Tu solicitud de $${Number(sol.montoSolicitado).toLocaleString('es-ES')} fue rechazada`,
              { duration: 5000, id: `saldo-rechazada-${sol.id}` }
            );
            knownStates.current[sol.id] = curr;
          }
        }

        // Persistir en sessionStorage
        sessionStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(knownStates.current));
      } catch {
        // Retry on the next interval.
      } finally { polling = false; }
    };

    // Ejecutar inmediatamente para cargar estados iniciales
    poll();

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user?.id]); // re-registra solo si cambia el usuario
}
