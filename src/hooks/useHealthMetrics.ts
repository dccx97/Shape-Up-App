import { useState, useEffect } from 'react';
import type { HealthMetric } from '../types';

const STORAGE_KEY = 'app_health_metrics';

const DEFAULT_METRICS: HealthMetric[] = [
  { id: 'weight', name: 'Weight', isDeletable: false, unit: 'lbs' },
  { id: 'bodyFat', name: 'Body Fat', isDeletable: true, unit: '%' },
  { id: 'visceralFat', name: 'Visceral Fat', isDeletable: true, unit: '' }
];

export function useHealthMetrics() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: HealthMetric[] = JSON.parse(stored);
        
        // Migration: Ensure units are set for defaults if missing, and fix legacy names
        const migrated = parsed.map(m => {
          if (m.id === 'weight') return { ...m, name: 'Weight', unit: m.unit !== undefined ? m.unit : 'lbs' };
          if (m.id === 'bodyFat') return { ...m, name: 'Body Fat', unit: m.unit !== undefined ? m.unit : '%' };
          if (m.id === 'visceralFat') return { ...m, unit: m.unit !== undefined ? m.unit : '' };
          return m;
        });

        setMetrics(migrated);
      } catch (e) {
        console.error("Failed to parse health metrics", e);
        setMetrics(DEFAULT_METRICS);
      }
    } else {
      setMetrics(DEFAULT_METRICS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_METRICS));
    }
  }, []);

  const saveMetrics = (newMetrics: HealthMetric[]) => {
    setMetrics(newMetrics);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMetrics));
  };

  const addMetric = (name: string, unit: string) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (metrics.some(m => m.id === id)) return; // Prevent duplicates

    const newMetric: HealthMetric = {
      id,
      name,
      isDeletable: true,
      unit
    };

    saveMetrics([...metrics, newMetric]);
  };

  const deleteMetric = (id: string) => {
    const metricToDelete = metrics.find(m => m.id === id);
    if (metricToDelete && !metricToDelete.isDeletable) return;
    saveMetrics(metrics.filter(m => m.id !== id));
  };

  return {
    metrics,
    addMetric,
    deleteMetric
  };
}
