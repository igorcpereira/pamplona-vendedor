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
  /** Unidade ativa na sessão */
  activeUnidade: SessionUnidade | null;
  /** Todos os vínculos do usuário */
  vinculos: (UsuarioUnidadeRole & { unidades: Unidade })[];
  /** Trocar unidade ativa (atualiza profiles.unidade_id para RLS) */
  selectUnidade: (unidadeId: number) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vinculos, setVinculos] = useState<(UsuarioUnidadeRole & { unidades: Unidade })[]>([]);
  const [activeUnidade, setActiveUnidade] = useState<SessionUnidade | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    const [profileResult, vinculosResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('usuario_unidade_role').select('*, unidades(*)').eq('user_id', userId),
    ]);

    const profileData = profileResult.data as Profile | null;
    const vinculosData = ((vinculosResult.data ?? []) as (UsuarioUnidadeRole & { unidades: Unidade })[])
      .filter((v) => !!v.unidades);

    setProfile(profileData);
    setVinculos(vinculosData);

    const savedId = localStorage.getItem(`active_unidade_${userId}`);
    const savedVinculo = savedId
      ? vinculosData.find((v) => v.unidade_id === Number(savedId))
      : null;
    const chosen = savedVinculo ?? vinculosData[0];

    if (chosen) {
      setActiveUnidade({ unidade: chosen.unidades, role: chosen.role });
    }
  }, []);

  useEffect(() => {
    // Configurar listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setVinculos([]);
          setActiveUnidade(null);
        }
        setLoading(false);
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const selectUnidade = async (unidadeId: number) => {
    if (!user) return;
    const vinculo = vinculos.find((v) => v.unidade_id === unidadeId);
    if (!vinculo) return;
    localStorage.setItem(`active_unidade_${user.id}`, String(unidadeId));
    setActiveUnidade({ unidade: vinculo.unidades, role: vinculo.role });
    // Atualiza profiles.unidade_id para que o RLS (get_user_unidade) funcione
    await supabase.from('profiles').update({ unidade_id: unidadeId }).eq('id', user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, activeUnidade, vinculos, selectUnidade, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
