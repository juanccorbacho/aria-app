import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Erro ao buscar usuário autenticado: ${error.message}`);
  }

  return data.user ?? null;
};

