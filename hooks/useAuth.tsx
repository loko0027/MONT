import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// 1. Interface do perfil
interface UserProfile {
  id: string;
  nome: string;
  telefone: string;
  tipo_usuario: 'cliente' | 'motoboy' | 'admin';
  avaliacao?: number;
  cnh_verificada?: boolean;
  documento_moto_verificado?: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userType: 'cliente' | 'motoboy' | 'admin' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

// 2. Criação do contexto
const AuthContext = createContext<AuthContextType>(null!);

// 3. Provider com lógica de autenticação
function useProvideAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setUserProfile(null);
            setLoading(false);
          }
        }
      );

      return () => subscription.unsubscribe();
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) await loadUserProfile(data.user.id);
    } finally {
      // loadUserProfile já define loading como false
    }
  };

  const signUp = async (email: string, password: string, profile: Partial<UserProfile>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Erro ao criar usuário no Auth');

      const { error: profileError } = await supabase.from('usuarios').insert({
        id: data.user.id,
        nome: profile.nome!,
        telefone: profile.telefone!,
        tipo_usuario: profile.tipo_usuario!,
        ...(profile.tipo_usuario === 'motoboy' && {
          avaliacao: 5.0,
          cnh_verificada: false,
          documento_moto_verificado: false,
        }),
      });

      if (profileError) throw profileError;

      await loadUserProfile(data.user.id);
    } finally {
      // loadUserProfile já define loading como false
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
    } finally {
      // onAuthStateChange define loading como false
    }
  };

  return {
    user,
    userProfile,
    userType: userProfile?.tipo_usuario || null,
    loading,
    signIn,
    signUp,
    signOut,
  };
}

// 4. Componente Provedor
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// 5. Hook de consumo
export function useAuth() {
  return useContext(AuthContext);
}
