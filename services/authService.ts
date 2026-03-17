import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Erro ao buscar usuário autenticado: ${error.message}`);
  }

  return data.user ?? null;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Erro ao buscar sessão atual: ${error.message}`);
  }

  return data.session ?? null;
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(`Erro ao fazer login: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Usuário não encontrado após login.');
  }

  return data.user;
};

export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw new Error(`Erro ao cadastrar usuário: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Usuário não retornado após cadastro.');
  }

  return data.user;
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Erro ao sair da conta: ${error.message}`);
  }
};

