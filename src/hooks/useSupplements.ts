import { useState, useEffect } from 'react';
import type { Supplement, IntakeLog } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export function useSupplements(profileId: string | null, userId?: string) {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [intakeLogs, setIntakeLogs] = useState<IntakeLog[]>([]);

  useEffect(() => {
    if (!userId) {
      setSupplements([]);
      setIntakeLogs([]);
      return;
    }

    const suppRef = collection(db, `users/${userId}/supplements`);
    const logsRef = collection(db, `users/${userId}/intakeLogs`);

    // Migration
    const localSupps = localStorage.getItem('supplements_v1');
    const localLogs = localStorage.getItem('intake_logs_v1');
    if (localSupps || localLogs) {
      const batch = writeBatch(db);
      let hasData = false;
      if (localSupps) {
        try {
          const parsed: Supplement[] = JSON.parse(localSupps);
          parsed.forEach(s => { batch.set(doc(suppRef, s.id), s); hasData = true; });
        } catch(e){}
      }
      if (localLogs) {
        try {
          const parsed: IntakeLog[] = JSON.parse(localLogs);
          parsed.forEach(l => { batch.set(doc(logsRef, l.id), l); hasData = true; });
        } catch(e){}
      }
      if (hasData) {
        batch.commit().then(() => {
          localStorage.removeItem('supplements_v1');
          localStorage.removeItem('intake_logs_v1');
          console.log('Migrated supplements and logs to Firebase');
        });
      } else {
        localStorage.removeItem('supplements_v1');
        localStorage.removeItem('intake_logs_v1');
      }
    }

    const unsubSupps = onSnapshot(suppRef, (snap) => {
      const data: Supplement[] = [];
      snap.forEach(d => data.push(d.data() as Supplement));
      setSupplements(data);
    });

    const unsubLogs = onSnapshot(logsRef, (snap) => {
      const data: IntakeLog[] = [];
      snap.forEach(d => data.push(d.data() as IntakeLog));
      setIntakeLogs(data);
    });

    return () => {
      unsubSupps();
      unsubLogs();
    };
  }, [userId]);

  const profileSupplements = supplements.filter(s => s.profileId === profileId);
  const profileLogs = intakeLogs.filter(l => l.profileId === profileId);

  const addSupplement = async (supplement: Omit<Supplement, 'id' | 'profileId'>) => {
    if (!userId || !profileId) return;
    const newId = crypto.randomUUID();
    const newSupp: Supplement = { ...supplement, id: newId, profileId };
    await setDoc(doc(db, `users/${userId}/supplements`, newId), newSupp);
  };

  const updateSupplement = async (id: string, updates: Partial<Supplement>) => {
    if (!userId) return;
    await setDoc(doc(db, `users/${userId}/supplements`, id), updates, { merge: true });
  };

  const deleteSupplement = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, `users/${userId}/supplements`, id));
  };

  const markTaken = async (supplementId: string, date: string, taken: boolean = true) => {
    if (!userId || !profileId) return;
    
    if (taken) {
      const newId = crypto.randomUUID();
      const newLog: IntakeLog = { id: newId, profileId, supplementId, date, taken: true };
      await setDoc(doc(db, `users/${userId}/intakeLogs`, newId), newLog);
    } else {
      const logsToRemove = intakeLogs.filter(l => l.supplementId === supplementId && l.date === date);
      for (const log of logsToRemove) {
        await deleteDoc(doc(db, `users/${userId}/intakeLogs`, log.id));
      }
    }
  };

  return {
    supplements: profileSupplements,
    intakeLogs: profileLogs,
    addSupplement,
    updateSupplement,
    deleteSupplement,
    markTaken
  };
}
