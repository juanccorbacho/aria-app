import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Variável de ambiente EXPO_PUBLIC_SUPABASE_URL não encontrada.');
}

if (!supabaseAnonKey) {
  throw new Error('Variável de ambiente EXPO_PUBLIC_SUPABASE_ANON_KEY não encontrada.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

