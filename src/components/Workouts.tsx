import { useState } from 'react';
import type { Workout } from '../types';
import { WorkoutModal } from './WorkoutModal';
import { Plus, Dumbbell, Calendar, Repeat, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface WorkoutsProps {
  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, 'id' | 'profileId'>) => void;
  updateWorkout: (id: string, workout: Omit<Workout, 'id' | 'profileId'>) => void;
  deleteWorkout: (id: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Workouts({ workouts, addWorkout, updateWorkout, deleteWorkout }: WorkoutsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const oneOffs = workouts.filter(w => w.isOneOff);
  const recurring = workouts.filter(w => !w.isOneOff);

  const renderWorkoutCard = (workout: Workout) => (
    <div key={workout.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-slate-900 text-lg">{workout.name}</h3>
          {workout.category && (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
              {workout.category}
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {workout.isOneOff ? (
              <>
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>{workout.oneOffDate ? format(parseISO(workout.oneOffDate), 'MMM d, yyyy') : 'No Date'}</span>
              </>
            ) : (
              <>
                <Repeat className="w-4 h-4 text-emerald-500" />
                <span>
                  {workout.schedule.length === 7 
                    ? 'Every Day' 
                    : workout.schedule.map(d => DAYS[d]).join(', ')}
                </span>
              </>
            )}
            {workout.time && (
              <span className="ml-2 px-2 py-0.5 bg-slate-50 rounded text-xs font-mono">{workout.time}</span>
            )}
          </div>
          {!workout.isOneOff && workout.startDate && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-6">
               <span className="font-semibold text-slate-500">Range:</span>
               <span>
                 {format(parseISO(workout.startDate), 'MMM d')} - {workout.endDate ? format(parseISO(workout.endDate), 'MMM d, yyyy') : 'Forever'}
               </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Exercises ({(workout.exercises || []).length})
          </p>
          <ul className="space-y-1">
            {(workout.exercises || []).slice(0, 3).map((ex, i) => (
              <li key={ex.id || i} className="text-sm text-slate-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="truncate">{ex.name}</span>
                {(ex.sets || ex.reps) && (
                  <span className="text-xs text-slate-400">({ex.sets || '-'}x{ex.reps || '-'})</span>
                )}
              </li>
            ))}
            {(workout.exercises || []).length > 3 && (
              <li className="text-sm text-slate-400 italic pl-3.5">
                +{(workout.exercises || []).length - 3} more...
              </li>
            )}
          </ul>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditingWorkout(workout)}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Edit Workout"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteWorkout(workout.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete Workout"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-4">
        {/* Pink separator line */}
        <div className="h-2 w-full bg-rose-600 mb-6 rounded-full" />
        
        <div className="flex items-end justify-between mb-8">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Workouts</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Create Workout</span>
          </button>
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
          <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium text-lg">No workouts created yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">Build your first routine or schedule a one-off event.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 font-medium hover:underline text-sm"
          >
            Create your first workout
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {recurring.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-500" />
                Recurring Plans
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recurring.map(renderWorkoutCard)}
              </div>
            </div>
          )}

          {oneOffs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                One-Off Events
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {oneOffs.map(renderWorkoutCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {(isModalOpen || editingWorkout) && (
        <WorkoutModal
          initialData={editingWorkout || undefined}
          onClose={() => {
            setIsModalOpen(false);
            setEditingWorkout(null);
          }}
          onSave={(data) => {
            if (editingWorkout) {
              updateWorkout(editingWorkout.id, data);
            } else {
              addWorkout(data);
            }
          }}
        />
      )}
    </div>
  );
}
