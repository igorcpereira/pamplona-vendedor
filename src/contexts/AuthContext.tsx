import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Unidade = Tables<'unidades'>;
type UsuarioUnidadeRole = Tables<'usuario_unidade_role'>;

interface SessionUnidade {
  unidade: Unidade;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  activeUnidade: SessionUnidade | null;
  vinculos: (UsuarioUnidadeRole & { unidades: Unidade })[];
  selectUnidade: (unidadeId: number) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// ─── Cache helpers ────────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

interface CachedUserData {
  profile: Profile | null;
  vinculos: (UsuarioUnidadeRole & { unidades: Unidade })[];
}

function readCache(userId: string): CachedUserData | null {
  try {
    const raw = localStorage.getItem(`userdata_${userId}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: CachedUserData; ts: number };
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(`userdata_${userId}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(userId: string, data: CachedUserData) {
  try {
    localStorage.setItem(`userdata_${userId}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function clearCache(userId: string) {
  localStorage.removeItem(`userdata_${userId}`);
}
// ─────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vinculos, setVinculos] = useState<(UsuarioUnidadeRole & { unidades: Unidade })[]>([]);
  const [activeUnidade, setActiveUnidade] = useState<SessionUnidade | null>(null);
  const [loading, setLoading] = useState(true);

  const registrarUltimoLogin = useCallback(() => {
    supabase.rpc('atualizar_ultimo_login').then();
  }, []);

  const applyUserData = useCallback((data: CachedUserData, userId: string) => {
    const { profile: p, vinculos: v } = data;
    setProfile(p);
    setVinculos(v);
    const savedId = localStorage.getItem(`active_unidade_${userId}`);
    const saved = savedId ? v.find((x) => x.unidade_id === Number(savedId)) : null;
    const chosen = saved ?? v[0];
    if (chosen) setActiveUnidade({ unidade: chosen.unidades, role: chosen.role });
  }, []);

  const fetchAndApply = useCallback(async (userId: string) => {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    try {
      const result = await Promise.race([
        Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('usuario_unidade_role').select('*, unidades(*)').eq('user_id', userId),
        ]),
        timeout,
      ]);
      if (!result) return;

      const [profileResult, vinculosResult] = result;
      const freshData: CachedUserData = {
        profile: profileResult.data as Profile | null,
        vinculos: ((vinculosResult.data ?? []) as (UsuarioUnidadeRole & { unidades: Unidade })[])
          .filter((v) => !!v.unidades),
      };
      applyUserData(freshData, userId);
      writeCache(userId, freshData);
    } catch {}
  }, [applyUserData]);

  const loadUserData = useCallback(async (userId: string) => {
    const cached = readCache(userId);

    if (cached) {
      // Aplica cache imediatamente — loading vai a false em <1ms
      applyUserData(cached, userId);
      // Atualiza em background sem bloquear
      fetchAndApply(userId);
      return;
    }

    // Sem cache: aguarda o banco (primeira vez apenas)
    await fetchAndApply(userId);
    // Se ainda sem profile após fetch, garante null
    setProfile((p) => p ?? null);
  }, [applyUserData, fetchAndApply]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      try {
        if (session?.user) {
          await loadUserData(session.user.id);
          registrarUltimoLogin();
        }
      } finally {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return;

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id);
          registrarUltimoLogin();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setVinculos([]);
          setActiveUnidade(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData, registrarUltimoLogin]);

  useEffect(() => {
    if (!user) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') registrarUltimoLogin();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, registrarUltimoLogin]);

  const selectUnidade = async (unidadeId: number) => {
    if (!user) return;
    const vinculo = vinculos.find((v) => v.unidade_id === unidadeId);
    if (!vinculo) return;
    localStorage.setItem(`active_unidade_${user.id}`, String(unidadeId));
    setActiveUnidade({ unidade: vinculo.unidades, role: vinculo.role });
    await supabase.from('profiles').update({ unidade_id: unidadeId }).eq('id', user.id);
    // Invalida cache para forçar reload com nova unidade ativa
    clearCache(user.id);
  };

  const signOut = async () => {
    if (user) clearCache(user.id);
    setUser(null);
    setSession(null);
    setProfile(null);
    setVinculos([]);
    setActiveUnidade(null);
    await supabase.auth.signOut();
    window.location.replace('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, activeUnidade, vinculos, selectUnidade, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
