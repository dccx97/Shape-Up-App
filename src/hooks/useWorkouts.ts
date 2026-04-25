import { useState, useEffect } from 'react';
import type { Workout, WorkoutLog } from '../types';

const STORAGE_KEY = 'app_workouts';
const LOGS_STORAGE_KEY = 'app_workout_logs';

export function useWorkouts(activeProfileId: string | null) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    // Load Workouts
    const storedWorkouts = localStorage.getItem(STORAGE_KEY);
    if (storedWorkouts) {
      try {
        const parsedWorkouts: Workout[] = JSON.parse(storedWorkouts);
        setWorkouts(parsedWorkouts.filter(w => w.profileId === activeProfileId));
      } catch (e) {
        console.error("Failed to parse workouts", e);
      }
    } else {
      setWorkouts([]);
    }

    // Load Logs
    const storedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
    if (storedLogs) {
      try {
        const parsedLogs: WorkoutLog[] = JSON.parse(storedLogs);
        setWorkoutLogs(parsedLogs.filter(l => l.profileId === activeProfileId));
      } catch (e) {
        console.error("Failed to parse workout logs", e);
      }
    } else {
      setWorkoutLogs([]);
    }
  }, [activeProfileId]);

  const saveWorkouts = (newWorkouts: Workout[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let allW: Workout[] = stored ? JSON.parse(stored) : [];
      const otherProfiles = allW.filter(w => w.profileId !== activeProfileId);
      const combined = [...otherProfiles, ...newWorkouts];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
    } catch (e) {
      console.error("Failed to save workouts", e);
    }
  };

  const addWorkout = (workoutData: Omit<Workout, 'id' | 'profileId'>) => {
    if (!activeProfileId) return;
    const newWorkout: Workout = {
      ...workoutData,
      id: crypto.randomUUID(),
      profileId: activeProfileId
    };
    const newWorkouts = [...workouts, newWorkout];
    setWorkouts(newWorkouts);
    saveWorkouts(newWorkouts);
  };

  const updateWorkout = (id: string, workoutData: Omit<Workout, 'id' | 'profileId'>) => {
    if (!activeProfileId) return;
    const newWorkouts = workouts.map(w => w.id === id ? { ...workoutData, id, profileId: activeProfileId } : w);
    setWorkouts(newWorkouts);
    saveWorkouts(newWorkouts);
  };

  const deleteWorkout = (id: string) => {
    const newWorkouts = workouts.filter(w => w.id !== id);
    setWorkouts(newWorkouts);
    saveWorkouts(newWorkouts);
  };

  const markWorkoutCompleted = (workoutId: string, date: string, completed: boolean = true) => {
    if (!activeProfileId) return;

    try {
      const storedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      let allLogs: WorkoutLog[] = storedLogs ? JSON.parse(storedLogs) : [];

      // Remove existing log for this workout/date
      allLogs = allLogs.filter(log => !(log.workoutId === workoutId && log.date === date && log.profileId === activeProfileId));

      if (completed) {
        const newLog: WorkoutLog = {
          id: crypto.randomUUID(),
          profileId: activeProfileId,
          workoutId,
          date,
          completed: true
        };
        allLogs.push(newLog);
      }

      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(allLogs));
      setWorkoutLogs(allLogs.filter(l => l.profileId === activeProfileId));
    } catch (e) {
      console.error("Failed to mark workout completed", e);
    }
  };

  return {
    workouts,
    workoutLogs,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    markWorkoutCompleted
  };
}
