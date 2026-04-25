import { useState, useEffect } from 'react';
import type { Supplement, IntakeLog } from '../types';

const STORAGE_KEY_SUPPLEMENTS = 'supplements_v1';
const STORAGE_KEY_LOGS = 'intake_logs_v1';

export function useSupplements(activeProfileId: string | null) {
  const [supplements, setSupplements] = useState<Supplement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SUPPLEMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [intakeLogs, setIntakeLogs] = useState<IntakeLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUPPLEMENTS, JSON.stringify(supplements));
  }, [supplements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(intakeLogs));
  }, [intakeLogs]);

  // One-time Migration: Assign profileId to legacy items when the first profile becomes active
  useEffect(() => {
    if (activeProfileId) {
      let migrated = false;
      
      const newSupplements = supplements.map(s => {
        if (!s.profileId) {
          migrated = true;
          return { ...s, profileId: activeProfileId };
        }
        return s;
      });

      if (migrated) setSupplements(newSupplements);

      let migratedLogs = false;
      const newLogs = intakeLogs.map(l => {
        if (!l.profileId) {
          migratedLogs = true;
          return { ...l, profileId: activeProfileId };
        }
        return l;
      });
      
      if (migratedLogs) setIntakeLogs(newLogs);
    }
  }, [activeProfileId, supplements, intakeLogs]);

  const activeSupplements = supplements.filter(s => s.profileId === activeProfileId);
  const activeIntakeLogs = intakeLogs.filter(l => l.profileId === activeProfileId);

  const addSupplement = (supplement: Omit<Supplement, 'id' | 'profileId'> & { profileId?: string }) => {
    if (!activeProfileId && !supplement.profileId) return;
    const newSupp: Supplement = {
      ...supplement,
      id: crypto.randomUUID(),
      profileId: supplement.profileId || activeProfileId!
    };
    setSupplements(prev => [...prev, newSupp]);
  };

  const updateSupplement = (id: string, updates: Partial<Supplement>) => {
    setSupplements(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSupplement = (id: string) => {
    setSupplements(prev => prev.filter(s => s.id !== id));
  };

  const markTaken = (supplementId: string, date: string, taken: boolean = true) => {
    if (!activeProfileId) return;
    
    // Check if it's already logged for today
    const existingLogIndex = intakeLogs.findIndex(
      log => log.supplementId === supplementId && log.date === date && log.profileId === activeProfileId
    );

    if (existingLogIndex >= 0) {
      // It's already logged, if taken state is changing, handle inventory update
      const existingLog = intakeLogs[existingLogIndex];
      if (existingLog.taken !== taken) {
        // Toggle taken state
        const newLogs = [...intakeLogs];
        newLogs[existingLogIndex] = { ...existingLog, taken };
        setIntakeLogs(newLogs);
        
        // Adjust inventory
        const supplement = supplements.find(s => s.id === supplementId);
        if (supplement) {
          updateSupplement(supplementId, {
            currentQuantity: taken 
              ? Math.max(0, supplement.currentQuantity - supplement.dosage)
              : supplement.currentQuantity + supplement.dosage // restore if untaken
          });
        }
      }
    } else {
      // New log entry
      const newLog: IntakeLog = {
        id: crypto.randomUUID(),
        profileId: activeProfileId,
        supplementId,
        date,
        taken
      };
      setIntakeLogs(prev => [...prev, newLog]);

      // Reduce inventory if taken
      if (taken) {
        const supplement = supplements.find(s => s.id === supplementId);
        if (supplement) {
          updateSupplement(supplementId, {
            currentQuantity: Math.max(0, supplement.currentQuantity - supplement.dosage)
          });
        }
      }
    }
  };

  return {
    supplements: activeSupplements,
    intakeLogs: activeIntakeLogs,
    addSupplement,
    updateSupplement,
    deleteSupplement,
    markTaken
  };
}
