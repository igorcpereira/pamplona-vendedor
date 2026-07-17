import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Monitoramento de uso: registra em logs_acesso os eventos
 *   open      — primeira carga do app (abrir app/PWA)
 *   reload    — refresh explícito (F5/reabrir)
 *   navegacao — troca de rota dentro do SPA
 * Fire-and-forget: falha de log nunca afeta a navegação.
 */
export function useLogAcesso() {
  const location = useLocation();
  const { user, activeUnidade } = useAuth();
  const inicialRegistrado = useRef(false);
  const ultimaRota = useRef<string | null>(null);
  const unidadeRef = useRef<number | null>(null);
  unidadeRef.current = activeUnidade?.unidade?.id ?? null;

  useEffect(() => {
    if (!user?.id) return;

    let evento: 'open' | 'reload' | 'navegacao';
    if (!inicialRegistrado.current) {
      inicialRegistrado.current = true;
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      evento = nav?.type === 'reload' ? 'reload' : 'open';
    } else {
      if (ultimaRota.current === location.pathname) return;
      evento = 'navegacao';
    }
    ultimaRota.current = location.pathname;

    void supabase
      .from('logs_acesso')
      .insert({
        user_id: user.id,
        app: 'vendedor',
        rota: location.pathname,
        evento,
        unidade_id: unidadeRef.current,
        user_agent: navigator.userAgent.slice(0, 300),
      })
      .then(({ error }) => {
        if (error) console.debug('logs_acesso: falha silenciosa —', error.message);
      });
  }, [user?.id, location.pathname]);
}
