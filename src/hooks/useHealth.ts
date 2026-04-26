import { useState, useEffect } from 'react';
import type { HealthLog } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export function useHealth(profileId: string | null, userId?: string) {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);

  useEffect(() => {
    if (!userId) {
      setHealthLogs([]);
      return;
    }

    const logsRef = collection(db, `users/${userId}/healthLogs`);

    // Migration
    const localLogs = localStorage.getItem('health_logs_v1');
    if (localLogs) {
      const batch = writeBatch(db);
      try {
        const parsed: HealthLog[] = JSON.parse(localLogs);
        if (parsed.length > 0) {
          parsed.forEach(l => { batch.set(doc(logsRef, l.id), l); });
          batch.commit().then(() => {
            localStorage.removeItem('health_logs_v1');
            console.log('Migrated health logs to Firebase');
          });
        } else {
          localStorage.removeItem('health_logs_v1');
        }
      } catch(e) {
        localStorage.removeItem('health_logs_v1');
      }
    }

    const unsubscribe = onSnapshot(logsRef, (snap) => {
      const data: HealthLog[] = [];
      snap.forEach(d => data.push(d.data() as HealthLog));
      setHealthLogs(data);
    });

    return () => unsubscribe();
  }, [userId]);

  const profileLogs = healthLogs.filter(l => l.profileId === profileId);

  const addLog = async (log: Omit<HealthLog, 'id' | 'profileId'>) => {
    if (!userId || !profileId) return;
    const newId = crypto.randomUUID();
    const newLog: HealthLog = { ...log, id: newId, profileId };
    await setDoc(doc(db, `users/${userId}/healthLogs`, newId), newLog);
  };

  const updateLog = async (id: string, updates: Partial<HealthLog>) => {
    if (!userId) return;
    await setDoc(doc(db, `users/${userId}/healthLogs`, id), updates, { merge: true });
  };

  const deleteLog = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, `users/${userId}/healthLogs`, id));
  };

  return {
    healthLogs: profileLogs,
    addLog,
    updateLog,
    deleteLog
  };
}
