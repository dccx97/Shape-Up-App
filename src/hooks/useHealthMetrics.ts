import { useState, useEffect } from 'react';
import type { HealthMetric } from '../types';

const STORAGE_KEY = 'app_health_metrics';

const DEFAULT_METRICS: HealthMetric[] = [
  { id: 'weight', name: 'Weight (lbs)', isDeletable: false },
  { id: 'bodyFat', name: 'Body Fat %', isDeletable: true },
  { id: 'visceralFat', name: 'Visceral Fat', isDeletable: true }
];

export function useHealthMetrics() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMetrics(parsed);
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

  const addMetric = (name: string) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (metrics.some(m => m.id === id)) return; // Prevent duplicates

    const newMetric: HealthMetric = {
      id,
      name,
      isDeletable: true
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
