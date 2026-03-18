import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';
import { getCurrentSession, signInWithEmail, signOut, signUpWithEmail } from '@/services/authService';

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  errorMessage: string | null;
};

type UseAuthReturn = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    errorMessage: null,
  });

  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await getCurrentSession();

        setState((current) => ({
          ...current,
          user: session?.user ?? null,
          session,
          isLoading: false,
        }));
      } catch (error) {
        setState((current) => ({
          ...current,
          isLoading: false,
          errorMessage: error instanceof Error ? error.message : 'Erro ao inicializar autenticação.',
        }));
      }
    };

    void initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((current) => ({
        ...current,
        user: session?.user ?? null,
        session: session ?? null,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setState((current) => ({ ...current, isLoading: true, errorMessage: null }));

    try {
      const user = await signInWithEmail(email, password);

      setState((current) => ({
        ...current,
        user,
        session: current.session,
        isLoading: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Erro ao fazer login.',
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    setState((current) => ({ ...current, isLoading: true, errorMessage: null }));

    try {
      const user = await signUpWithEmail(email, password);

      setState((current) => ({
        ...current,
        user,
        session: current.session,
        isLoading: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Erro ao cadastrar usuário.',
      }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setState((current) => ({ ...current, isLoading: true, errorMessage: null }));

    try {
      await signOut();

      setState((current) => ({
        ...current,
        user: null,
        session: null,
        isLoading: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Erro ao sair da conta.',
      }));
    }
  };

  return {
    ...state,
    login,
    register,
    logout,
  };
};

