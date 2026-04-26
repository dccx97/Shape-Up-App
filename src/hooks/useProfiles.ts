import { useState, useEffect } from 'react';
import type { Profile } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const STORAGE_KEY_ACTIVE_PROFILE = 'active_profile_v1';

export function useProfiles(userId?: string) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
  });

  useEffect(() => {
    if (!userId) {
      setProfiles([]);
      return;
    }

    setIsLoadingProfiles(true);
    const profilesRef = collection(db, `users/${userId}/profiles`);
    
    // One-time Migration
    const localProfiles = localStorage.getItem('profiles_v1');
    if (localProfiles) {
      try {
        const parsed: Profile[] = JSON.parse(localProfiles);
        if (parsed.length > 0) {
          const batch = writeBatch(db);
          parsed.forEach(p => {
            batch.set(doc(profilesRef, p.id), p);
          });
          batch.commit().then(() => {
            localStorage.removeItem('profiles_v1');
            console.log('Migrated profiles to Firebase');
          });
        } else {
          localStorage.removeItem('profiles_v1');
        }
      } catch (e) { console.error(e); }
    }

    const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
      const data: Profile[] = [];
      snapshot.forEach(d => data.push(d.data() as Profile));
      setProfiles(data);
      setIsLoadingProfiles(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, activeProfileId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_PROFILE);
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (profiles.length > 0 && (!activeProfileId || !profiles.find(p => p.id === activeProfileId))) {
      setActiveProfileId(profiles[0].id);
    }
  }, [profiles, activeProfileId]);

  const addProfile = async (profile: Omit<Profile, 'id'>) => {
    if (!userId) return '';
    const newId = crypto.randomUUID();
    const newProfile: Profile = { ...profile, id: newId };
    await setDoc(doc(db, `users/${userId}/profiles`, newId), newProfile);
    setActiveProfileId(newId);
    return newId;
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    if (!userId) return;
    await setDoc(doc(db, `users/${userId}/profiles`, id), updates, { merge: true });
  };

  const deleteProfile = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, `users/${userId}/profiles`, id));
    if (activeProfileId === id) {
      setActiveProfileId(profiles.find(p => p.id !== id)?.id || null);
    }
  };

  return {
    profiles,
    activeProfileId,
    activeProfile: profiles.find(p => p.id === activeProfileId) || null,
    isLoadingProfiles,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile
  };
}
