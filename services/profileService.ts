import { supabase } from '@/services/supabase';
import type { Profile } from '@/types/models';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const profile: Profile = {
    id: data.id as string,
    userId: data.id as string,
    fullName: data.name as string,
    email: null,
    createdAt: data.created_at as string,
    updatedAt: null,
  };

  return profile;
};

