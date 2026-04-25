import { useState, useEffect } from 'react';
import type { Profile } from '../types';

const STORAGE_KEY_PROFILES = 'profiles_v1';
const STORAGE_KEY_ACTIVE_PROFILE = 'active_profile_v1';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, activeProfileId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_PROFILE);
    }
  }, [activeProfileId]);

  // Ensure there's always an active profile if profiles exist
  useEffect(() => {
    if (profiles.length > 0 && (!activeProfileId || !profiles.find(p => p.id === activeProfileId))) {
      setActiveProfileId(profiles[0].id);
    }
  }, [profiles, activeProfileId]);

  const addProfile = (profile: Omit<Profile, 'id'>) => {
    const newProfile: Profile = {
      ...profile,
      id: crypto.randomUUID(),
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    return newProfile.id;
  };

  const updateProfile = (id: string, updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfileId === id) {
      setActiveProfileId(profiles.find(p => p.id !== id)?.id || null);
    }
  };

  return {
    profiles,
    activeProfileId,
    activeProfile: profiles.find(p => p.id === activeProfileId) || null,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile
  };
}
