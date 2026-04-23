import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getProfile as getProfileService } from "@/services/profileService";
import type { Profile } from "@/types/models";

let globalProfileCache: Profile | null = null;
let profileFetchPromise: Promise<Profile | null> | null = null;
let currentUserId: string | null = null;

export const useProfile = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(globalProfileCache);
  const [isLoading, setIsLoading] = useState(globalProfileCache === null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      globalProfileCache = null;
      currentUserId = null;
      setProfile(null);
      setIsLoading(false);
      setErrorMessage("Usuário não autenticado.");
      return;
    }

    if (currentUserId !== user.id) {
      globalProfileCache = null;
      currentUserId = user.id;
    }

    const fetchProfile = async () => {
      if (globalProfileCache) {
        setProfile(globalProfileCache);
        console.log('WORKSPACE ATIVO:', globalProfileCache.workspaceId);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      if (!profileFetchPromise) {
        profileFetchPromise = getProfileService();
      }

      try {
        const data = await profileFetchPromise;
        globalProfileCache = data;
        setProfile(data);
        if (data) {
          console.log('WORKSPACE ATIVO:', data.workspaceId);
        }
      } catch (error) {
        setProfile(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao carregar perfil."
        );
      } finally {
        profileFetchPromise = null;
        setIsLoading(false);
      }
    };

    void fetchProfile();
  }, [user, isAuthLoading]);

  return { 
    user, 
    profile, 
    workspaceId: profile?.workspaceId,
    profileId: profile?.id,
    isLoading: isAuthLoading || isLoading,
    errorMessage
  };
};
