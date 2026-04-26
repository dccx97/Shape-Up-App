import { useState, useEffect } from 'react';
import type { HealthMetric } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const DEFAULT_METRICS: HealthMetric[] = [
  { id: 'weight', name: 'Weight', isDeletable: false, unit: 'lbs' },
  { id: 'bodyFat', name: 'Body Fat', isDeletable: false, unit: '%' },
  { id: 'visceralFat', name: 'Visceral Fat', isDeletable: false }
];

export function useHealthMetrics(userId?: string) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    if (!userId) {
      setMetrics([]);
      return;
    }

    const metricsRef = collection(db, `users/${userId}/healthMetrics`);

    // Migration
    const localMetrics = localStorage.getItem('health_metrics_v1');
    if (localMetrics) {
      const batch = writeBatch(db);
      try {
        const parsed: HealthMetric[] = JSON.parse(localMetrics);
        parsed.forEach(m => { batch.set(doc(metricsRef, m.id), m); });
        batch.commit().then(() => {
          localStorage.removeItem('health_metrics_v1');
          console.log('Migrated metrics to Firebase');
        });
      } catch(e) {
        localStorage.removeItem('health_metrics_v1');
      }
    }

    const unsubscribe = onSnapshot(metricsRef, (snap) => {
      const data: HealthMetric[] = [];
      snap.forEach(d => data.push(d.data() as HealthMetric));
      
      // Merge with defaults
      const combined = [...DEFAULT_METRICS];
      data.forEach(m => {
        if (!combined.find(d => d.id === m.id)) {
          combined.push(m);
        }
      });
      setMetrics(combined);
    });

    return () => unsubscribe();
  }, [userId]);

  const addMetric = async (name: string, unit: string) => {
    if (!userId) return;
    const newId = crypto.randomUUID();
    const newMetric: HealthMetric = {
      name,
      unit,
      id: newId,
      isDeletable: true
    };
    await setDoc(doc(db, `users/${userId}/healthMetrics`, newId), newMetric);
  };

  const deleteMetric = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, `users/${userId}/healthMetrics`, id));
  };

  return {
    metrics,
    addMetric,
    deleteMetric
  };
}
