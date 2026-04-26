import { useState, useEffect } from 'react';
import type { Workout, WorkoutLog } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export function useWorkouts(profileId: string | null, userId?: string) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    if (!userId) {
      setWorkouts([]);
      setWorkoutLogs([]);
      return;
    }

    const workoutsRef = collection(db, `users/${userId}/workouts`);
    const logsRef = collection(db, `users/${userId}/workoutLogs`);

    // Migration
    const localWorkouts = localStorage.getItem('workouts_v1');
    const localLogs = localStorage.getItem('workout_logs_v1');
    if (localWorkouts || localLogs) {
      const batch = writeBatch(db);
      let hasData = false;
      if (localWorkouts) {
        try {
          const parsed: Workout[] = JSON.parse(localWorkouts);
          parsed.forEach(w => { batch.set(doc(workoutsRef, w.id), w); hasData = true; });
        } catch(e){}
      }
      if (localLogs) {
        try {
          const parsed: WorkoutLog[] = JSON.parse(localLogs);
          parsed.forEach(l => { batch.set(doc(logsRef, l.id), l); hasData = true; });
        } catch(e){}
      }
      if (hasData) {
        batch.commit().then(() => {
          localStorage.removeItem('workouts_v1');
          localStorage.removeItem('workout_logs_v1');
          console.log('Migrated workouts and logs to Firebase');
        });
      } else {
        localStorage.removeItem('workouts_v1');
        localStorage.removeItem('workout_logs_v1');
      }
    }

    const unsubWorkouts = onSnapshot(workoutsRef, (snap) => {
      const data: Workout[] = [];
      snap.forEach(d => data.push(d.data() as Workout));
      setWorkouts(data);
    });

    const unsubLogs = onSnapshot(logsRef, (snap) => {
      const data: WorkoutLog[] = [];
      snap.forEach(d => data.push(d.data() as WorkoutLog));
      setWorkoutLogs(data);
    });

    return () => {
      unsubWorkouts();
      unsubLogs();
    };
  }, [userId]);

  const profileWorkouts = workouts.filter(w => w.profileId === profileId);
  const profileLogs = workoutLogs.filter(l => l.profileId === profileId);

  const addWorkout = async (workout: Omit<Workout, 'id' | 'profileId'>) => {
    if (!userId || !profileId) return;
    const newId = crypto.randomUUID();
    const newWorkout: Workout = { ...workout, id: newId, profileId };
    await setDoc(doc(db, `users/${userId}/workouts`, newId), newWorkout);
  };

  const updateWorkout = async (id: string, updates: Partial<Workout>) => {
    if (!userId) return;
    await setDoc(doc(db, `users/${userId}/workouts`, id), updates, { merge: true });
  };

  const deleteWorkout = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, `users/${userId}/workouts`, id));
  };

  const markWorkoutCompleted = async (workoutId: string, date: string, completed: boolean = true) => {
    if (!userId || !profileId) return;
    
    if (completed) {
      const newId = crypto.randomUUID();
      const newLog: WorkoutLog = { id: newId, profileId, workoutId, date, completed: true };
      await setDoc(doc(db, `users/${userId}/workoutLogs`, newId), newLog);
    } else {
      const logsToRemove = workoutLogs.filter(l => l.workoutId === workoutId && l.date === date);
      for (const log of logsToRemove) {
        await deleteDoc(doc(db, `users/${userId}/workoutLogs`, log.id));
      }
    }
  };

  return {
    workouts: profileWorkouts,
    workoutLogs: profileLogs,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    markWorkoutCompleted
  };
}
