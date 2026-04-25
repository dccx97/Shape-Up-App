import { useState, useEffect } from 'react';
import type { HealthLog } from '../types';

const STORAGE_KEY = 'app_health_logs';

export function useHealth(activeProfileId: string | null) {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: HealthLog[] = JSON.parse(stored);
        const profileLogs = parsed.filter(log => log.profileId === activeProfileId);
        // Sort by date descending (newest first)
        profileLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHealthLogs(profileLogs);
      } catch (e) {
        console.error("Failed to parse health logs", e);
      }
    } else {
      setHealthLogs([]);
    }
  }, [activeProfileId]);

  const saveLogs = (logs: HealthLog[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let allLogs: HealthLog[] = [];
      if (stored) {
        allLogs = JSON.parse(stored);
      }
      
      // Remove current profile's logs from allLogs, then append new ones
      const otherProfiles = allLogs.filter(log => log.profileId !== activeProfileId);
      const combined = [...otherProfiles, ...logs];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
    } catch (e) {
      console.error("Failed to save health logs", e);
    }
  };

  const addLog = (logData: Omit<HealthLog, 'id' | 'profileId'>) => {
    if (!activeProfileId) return;

    const newLog: HealthLog = {
      ...logData,
      id: crypto.randomUUID(),
      profileId: activeProfileId
    };

    const newLogs = [newLog, ...healthLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHealthLogs(newLogs);
    saveLogs(newLogs);
  };

  const deleteLog = (id: string) => {
    const newLogs = healthLogs.filter(log => log.id !== id);
    setHealthLogs(newLogs);
    saveLogs(newLogs);
  };

  const updateLog = (id: string, updates: Omit<HealthLog, 'id' | 'profileId' | 'editHistory'>) => {
    const existingLog = healthLogs.find(log => log.id === id);
    if (!existingLog) return;

    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    const keysToCheck: (keyof typeof updates)[] = ['date', 'weight', 'bodyFat', 'visceralFat', 'notes'];
    
    keysToCheck.forEach(key => {
      if (existingLog[key] !== updates[key]) {
        changes.push({
          field: key,
          oldValue: existingLog[key],
          newValue: updates[key]
        });
      }
    });

    if (updates.customMetrics) {
      const existingMetrics = existingLog.customMetrics || {};
      const newMetrics = updates.customMetrics;

      Object.keys(newMetrics).forEach(metricId => {
        if (existingMetrics[metricId] !== newMetrics[metricId]) {
          changes.push({
            field: `customMetrics.${metricId}`,
            oldValue: existingMetrics[metricId],
            newValue: newMetrics[metricId]
          });
        }
      });
      // Handle deleted metrics (not really expected during normal updates, but good for completeness)
      Object.keys(existingMetrics).forEach(metricId => {
        if (newMetrics[metricId] === undefined) {
          changes.push({
            field: `customMetrics.${metricId}`,
            oldValue: existingMetrics[metricId],
            newValue: undefined
          });
        }
      });
    }

    if (changes.length === 0) return; // No changes made

    const newEdit = {
      timestamp: new Date().toISOString(),
      changes
    };

    const updatedLog: HealthLog = {
      ...existingLog,
      ...updates,
      editHistory: [...(existingLog.editHistory || []), newEdit]
    };

    const newLogs = healthLogs.map(log => log.id === id ? updatedLog : log)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setHealthLogs(newLogs);
    saveLogs(newLogs);
  };

  return {
    healthLogs,
    addLog,
    deleteLog,
    updateLog
  };
}
