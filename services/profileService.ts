import { supabase } from '@/services/supabase';
import type { Profile } from '@/types/models';

export const getProfile = async (): Promise<Profile | null> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const profile: Profile = {
    id: data.id as string,
    workspaceId: data.workspace_id as string,
    fullName: data.name as string,
    email: null,
    createdAt: data.created_at as string,
    updatedAt: null,
  };

  return profile;
};

