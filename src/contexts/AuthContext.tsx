import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile, Unidade, UsuarioUnidadeRole, AppRole } from "@/types/database";

interface SessionUnidade {
  unidade: Unidade;
  role: AppRole;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** Unidade ativa na sessão atual */
  activeUnidade: SessionUnidade | null;
  /** Todos os vínculos do usuário */
  vinculos: UsuarioUnidadeRole[];
  /** Trocar unidade ativa */
  selectUnidade: (unidadeId: number) => Promise<void>;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vinculos, setVinculos] = useState<UsuarioUnidadeRole[]>([]);
  const [activeUnidade, setActiveUnidade] = useState<SessionUnidade | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    const [profileResult, vinculosResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("usuario_unidade_role")
        .select("*, unidades(*)")
        .eq("user_id", userId),
    ]);

    const profileData = profileResult.data as Profile | null;
    const vinculosData = (vinculosResult.data ?? []) as (UsuarioUnidadeRole & {
      unidades: Unidade;
    })[];

    setProfile(profileData);
    setVinculos(vinculosData);

    // Restore saved active unidade or pick first
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserData(session.user.id);
        } else {
          setProfile(null);
          setVinculos([]);
          setActiveUnidade(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  async function selectUnidade(unidadeId: number) {
    if (!user) return;
    const vinculo = (vinculos as (UsuarioUnidadeRole & { unidades: Unidade })[]).find(
      (v) => v.unidade_id === unidadeId
    );
    if (!vinculo) return;
    localStorage.setItem(`active_unidade_${user.id}`, String(unidadeId));
    setActiveUnidade({ unidade: vinculo.unidades, role: vinculo.role });
    await supabase.from("profiles").update({ unidade_id: unidadeId }).eq("id", user.id);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        activeUnidade,
        vinculos,
        selectUnidade,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
