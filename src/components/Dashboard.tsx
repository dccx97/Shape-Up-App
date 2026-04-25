import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, subWeeks, addWeeks } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Pill, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Supplement, IntakeLog, Profile, Workout, WorkoutLog } from '../types';

interface DashboardProps {
  supplements: Supplement[];
  intakeLogs: IntakeLog[];
  markTaken: (supplementId: string, date: string, timeOfDay: 'morning' | 'afternoon' | 'evening', taken?: boolean) => void;
  activeProfile: Profile | null;
  workouts: Workout[];
  workoutLogs: WorkoutLog[];
  markWorkoutCompleted: (workoutId: string, date: string, completed?: boolean) => void;
}

export function Dashboard({ 
  supplements, 
  intakeLogs, 
  markTaken, 
  activeProfile,
  workouts,
  workoutLogs,
  markWorkoutCompleted
}: DashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedWorkouts, setExpandedWorkouts] = useState<string[]>([]);

  const toggleWorkoutExpanded = (id: string) => {
    setExpandedWorkouts(prev => 
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Get stats for a specific date
  const getStatsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();

    // Supplements
    const scheduledSupplements = supplements.filter(s => s.schedule.length === 0 || s.schedule.includes(dayOfWeek));
    const totalSupplements = scheduledSupplements.length;
    const takenSupplements = scheduledSupplements.filter(s => {
      const logs = intakeLogs.filter(log => log.supplementId === s.id && log.date === dateStr);
      return logs.length > 0; // Simplified for MVP: any taken counts as taken for the day
    }).length;

    // Workouts
    const scheduledWorkouts = workouts.filter(w => {
      if (w.isOneOff) return w.oneOffDate === dateStr;
      return w.schedule.includes(dayOfWeek);
    });
    const totalWorkouts = scheduledWorkouts.length;
    const takenWorkouts = scheduledWorkouts.filter(w => {
      return workoutLogs.some(log => log.workoutId === w.id && log.date === dateStr && log.completed);
    }).length;

    return {
      supplements: { taken: takenSupplements, total: totalSupplements },
      workouts: { taken: takenWorkouts, total: totalWorkouts }
    };
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayOfWeek = selectedDate.getDay();

  // Selected Day Items
  const todaysSupplements = supplements.filter(s => s.schedule.length === 0 || s.schedule.includes(selectedDayOfWeek));
  const todaysWorkouts = workouts.filter(w => {
    if (w.isOneOff) return w.oneOffDate === selectedDateStr;
    return w.schedule.includes(selectedDayOfWeek);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="pt-4">
        {/* Pink separator line */}
        <div className="h-2 w-full bg-rose-600 mb-6 rounded-full" />
        
        <div className="flex items-end justify-between pb-2">
          <div className="flex items-center">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Today's Plan</h1>
            <span className="text-4xl text-slate-300 mx-4 font-light leading-none mb-1">|</span>
            <span className="text-2xl text-slate-700 mb-1">
              {format(selectedDate, 'EEEE, MMMM do yyyy')}
            </span>
          </div>
          
          {activeProfile && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-rose-100 shadow-sm mb-1">
              {activeProfile.avatar ? (
                <img src={activeProfile.avatar} alt={activeProfile.name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">
                  {activeProfile.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-bold text-slate-700">{activeProfile.name}'s Regimen</span>
            </div>
          )}
        </div>
      </div>

      {/* Daily Summary Component */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-x-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 min-w-[700px]">
          <h3 className="text-3xl font-bold text-slate-900 shrink-0">Daily Summary</h3>
          
          <div className="flex flex-1 items-start justify-end gap-4">
            
            {/* Labels */}
            <div className="flex flex-col items-end gap-3 pt-[72px] shrink-0">
              <span className="text-sm font-medium text-slate-500 h-6 flex items-center">Supplements taken:</span>
              <span className="text-sm font-medium text-slate-500 h-6 flex items-center">Workout:</span>
            </div>

            {/* Date Strip */}
            <div className="flex items-start gap-1">
              <button 
                onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                className="p-1 text-slate-400 hover:text-slate-800 transition-colors mt-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {weekDays.map(date => {
                const isSelected = isSameDay(date, selectedDate);
                const stats = getStatsForDate(date);
                const isToday = isSameDay(date, new Date());
                
                const suppFraction = `${stats.supplements.taken}/${stats.supplements.total}`;
                const workFraction = `${stats.workouts.taken}/${stats.workouts.total}`;
                
                // Colors based on completion
                const suppColor = stats.supplements.taken === stats.supplements.total && stats.supplements.total > 0
                  ? "bg-amber-200 text-amber-900" 
                  : "bg-rose-50 text-slate-600";
                  
                const workColor = stats.workouts.taken === stats.workouts.total && stats.workouts.total > 0
                  ? "bg-amber-200 text-amber-900" 
                  : "bg-rose-50 text-slate-600";

                return (
                  <div key={date.toISOString()} className="flex flex-col items-center px-2 relative group">
                    <button
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-xl min-w-[3rem] transition-all relative z-10",
                        isSelected ? "border-2 border-rose-400" : "border-2 border-transparent hover:border-slate-100",
                        isToday && !isSelected && "bg-slate-50"
                      )}
                    >
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {format(date, 'EEE')}
                      </span>
                      <span className={cn(
                        "text-xl font-bold",
                        isSelected ? "text-slate-900" : "text-slate-700"
                      )}>
                        {format(date, 'd')}
                      </span>
                    </button>
                    
                    <div className="flex flex-col gap-3 mt-1 items-center">
                      <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-center min-w-[28px] h-6", suppColor)}>
                        {suppFraction}
                      </div>
                      <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-center min-w-[28px] h-6", workColor)}>
                        {workFraction}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button 
                onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                className="p-1 text-slate-400 hover:text-slate-800 transition-colors mt-2"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">Today's Workout Schedule</h3>
            <span className="text-sm text-slate-500 hidden sm:inline">({format(selectedDate, 'EEEE, MMMM d, yyyy')})</span>
          </div>
          <div className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-md shrink-0 self-start sm:self-auto">
            {todaysWorkouts.length} Scheduled
          </div>
        </div>
        
        <div className="divide-y divide-slate-50">
          {todaysWorkouts.length > 0 ? todaysWorkouts.map(workout => {
            const isCompleted = workoutLogs.some(log => log.workoutId === workout.id && log.date === selectedDateStr && log.completed);
            const isExpanded = expandedWorkouts.includes(workout.id);
            
            return (
              <div key={workout.id} className="flex flex-col group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => markWorkoutCompleted(workout.id, selectedDateStr, !isCompleted)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        isCompleted 
                          ? "bg-slate-800 border-slate-800" 
                          : "border-slate-300 hover:border-slate-400 group-hover:bg-slate-50"
                      )}
                    >
                      {isCompleted && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg transition-colors font-medium",
                        isCompleted ? "text-slate-400 line-through" : "text-slate-800"
                      )}>
                        {workout.name}
                      </span>
                      {workout.exercises && workout.exercises.length > 0 && (
                        <button 
                          onClick={() => toggleWorkoutExpanded(workout.id)}
                          className="p-1 text-slate-400 hover:bg-slate-200 rounded transition-colors ml-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {workout.category && (
                    <span className="bg-rose-50 text-rose-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0 ml-4">
                      {workout.category}
                    </span>
                  )}
                </div>
                
                {/* Accordion for Exercises */}
                {isExpanded && workout.exercises && workout.exercises.length > 0 && (
                  <div className="px-16 pb-4 pt-1">
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Actionable Items</h4>
                      <ul className="space-y-3">
                        {workout.exercises.map((ex, idx) => (
                          <li key={ex.id || idx} className="flex items-start justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                            <div>
                              <span className="font-semibold text-slate-700 text-sm">{ex.name}</span>
                              {ex.notes && <p className="text-xs text-slate-500 mt-0.5">{ex.notes}</p>}
                            </div>
                            <div className="flex gap-3 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded">
                              {ex.sets && <span>{ex.sets} sets</span>}
                              {ex.reps && <span>{ex.reps} reps</span>}
                              {ex.weight && <span>{ex.weight} lbs</span>}
                              {ex.duration && <span>{ex.duration} min</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="p-8 text-center text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No workouts scheduled for today.</p>
            </div>
          )}
        </div>
      </div>

      {/* Supplement Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">Today's Supplement Schedule</h3>
            <span className="text-sm text-slate-500 hidden sm:inline">({format(selectedDate, 'EEEE, MMMM d, yyyy')})</span>
          </div>
          <div className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-md shrink-0 self-start sm:self-auto">
            {todaysSupplements.length} Scheduled
          </div>
        </div>
        
        <div className="divide-y divide-slate-50">
          {todaysSupplements.length > 0 ? todaysSupplements.map(supplement => {
            const logsForToday = intakeLogs.filter(log => log.supplementId === supplement.id && log.date === selectedDateStr);
            // Assuming 1 dose for simplicity in the UI unless complex
            const isCompleted = logsForToday.length > 0;
            
            return (
              <div key={supplement.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => markTaken(supplement.id, selectedDateStr, 'morning', !isCompleted)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      isCompleted 
                        ? "bg-slate-800 border-slate-800" 
                        : "border-slate-300 hover:border-slate-400 group-hover:bg-slate-50"
                    )}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </button>
                  
                  <div className="flex items-center gap-3">
                    {supplement.pillImage ? (
                      <img src={supplement.pillImage} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Pill className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className={cn(
                        "font-bold transition-colors",
                        isCompleted ? "text-slate-400 line-through" : "text-slate-900"
                      )}>
                        {supplement.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {supplement.dosage} doses • {supplement.brand || 'No Brand'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {supplement.category && (
                  <span className="bg-rose-50 text-rose-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0 ml-4 hidden sm:block">
                    {supplement.category}
                  </span>
                )}
              </div>
            );
          }) : (
            <div className="p-8 text-center text-slate-500">
              <Pill className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No supplements scheduled for today.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
