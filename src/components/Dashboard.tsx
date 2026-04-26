import { useState } from 'react';
import { 
  format, addDays, startOfWeek, isSameDay, subWeeks, addWeeks, 
  startOfMonth, eachDayOfInterval, addMonths, isBefore, startOfDay, isSameMonth,
  subMonths
} from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Pill, Activity, ChevronDown, ChevronUp, X, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Supplement, IntakeLog, Profile, Workout, WorkoutLog } from '../types';

interface DashboardProps {
  supplements: Supplement[];
  intakeLogs: IntakeLog[];
  markTaken: (supplementId: string, date: string, taken?: boolean) => void;
  activeProfile: Profile | null;
  workouts: Workout[];
  workoutLogs: WorkoutLog[];
  markWorkoutCompleted: (workoutId: string, date: string, completed?: boolean) => void;
  onNavigate?: (tab: 'cabinet' | 'workouts') => void;
}

export function Dashboard({ 
  supplements, 
  intakeLogs, 
  markTaken, 
  activeProfile,
  workouts,
  workoutLogs,
  markWorkoutCompleted,
  onNavigate
}: DashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedWorkouts, setExpandedWorkouts] = useState<string[]>([]);
  
  // Two-Month Calendar State
  const [calendarBaseDate, setCalendarBaseDate] = useState(startOfMonth(new Date()));
  const [modalDate, setModalDate] = useState<Date | null>(null);

  const toggleWorkoutExpanded = (id: string) => {
    setExpandedWorkouts(prev => 
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  // Weekly Calendar (Mon-Sun)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // 1 = Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Get stats for a specific date
  const getStatsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();

    const scheduledSupplements = supplements.filter(s => s.schedule.length === 0 || s.schedule.includes(dayOfWeek));
    const totalSupplements = scheduledSupplements.length;
    const takenSupplements = scheduledSupplements.filter(s => {
      const logs = intakeLogs.filter(log => log.supplementId === s.id && log.date === dateStr);
      return logs.length > 0;
    }).length;

    const scheduledWorkouts = workouts.filter(w => {
      if (w.isOneOff) return w.oneOffDate === dateStr;
      if (w.startDate && dateStr < w.startDate) return false;
      if (w.endDate && dateStr > w.endDate) return false;
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

  const todaysSupplements = supplements.filter(s => s.schedule.length === 0 || s.schedule.includes(selectedDayOfWeek));
  const todaysWorkouts = workouts.filter(w => {
    if (w.isOneOff) return w.oneOffDate === selectedDateStr;
    if (w.startDate && selectedDateStr < w.startDate) return false;
    if (w.endDate && selectedDateStr > w.endDate) return false;
    return w.schedule.includes(selectedDayOfWeek);
  });

  // Modal specific data
  const modalDateStr = modalDate ? format(modalDate, 'yyyy-MM-dd') : '';
  const modalDayOfWeek = modalDate ? modalDate.getDay() : 0;
  
  const modalSupplements = modalDate ? supplements.filter(s => s.schedule.length === 0 || s.schedule.includes(modalDayOfWeek)) : [];
  const modalWorkouts = modalDate ? workouts.filter(w => {
    if (w.isOneOff) return w.oneOffDate === modalDateStr;
    if (w.startDate && modalDateStr < w.startDate) return false;
    if (w.endDate && modalDateStr > w.endDate) return false;
    return w.schedule.includes(modalDayOfWeek);
  }) : [];

  // Generate calendar days
  const renderMonthCalendar = (baseDate: Date) => {
    const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
    const end = addDays(start, 41); // 6 rows of 7 days
    const days = eachDayOfInterval({ start, end });
    const today = startOfDay(new Date());

    return (
      <div className="flex-1 min-w-[280px]">
        <h4 className="text-center font-bold text-slate-800 mb-4">{format(baseDate, 'MMMM yyyy')}</h4>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, baseDate);
            const isPast = isBefore(day, today);
            const stats = getStatsForDate(day);
            const hasItems = stats.supplements.total > 0 || stats.workouts.total > 0;
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setModalDate(day)}
                disabled={!isCurrentMonth}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all border border-transparent",
                  !isCurrentMonth ? "opacity-0 cursor-default" : "hover:border-slate-200 hover:bg-slate-50 cursor-pointer",
                  isCurrentMonth && isPast && !isToday ? "bg-slate-50/50 text-slate-400" : "text-slate-700",
                  isToday && "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                )}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                {hasItems && isCurrentMonth && (
                  <div className="flex gap-0.5 mt-0.5">
                    {stats.supplements.total > 0 && (
                      <div className={cn("w-1 h-1 rounded-full", stats.supplements.taken === stats.supplements.total ? "bg-amber-400" : "bg-slate-300")} />
                    )}
                    {stats.workouts.total > 0 && (
                      <div className={cn("w-1 h-1 rounded-full", stats.workouts.taken === stats.workouts.total ? "bg-blue-400" : "bg-slate-300")} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="pt-4">
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
              {activeProfile.image ? (
                <img src={activeProfile.image} alt={activeProfile.name} className="w-6 h-6 rounded-full object-cover" />
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

      {/* Today's Plan Sections */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Daily Details</h3>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Supplement Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Supplements</h3>
            <div className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-md shrink-0">
              {todaysSupplements.length} Scheduled
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {todaysSupplements.length > 0 ? todaysSupplements.map(supplement => {
              const logsForToday = intakeLogs.filter(log => log.supplementId === supplement.id && log.date === selectedDateStr);
              const isCompleted = logsForToday.length > 0;
              return (
                <div key={supplement.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => markTaken(supplement.id, selectedDateStr, !isCompleted)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        isCompleted ? "bg-slate-800 border-slate-800" : "border-slate-300 hover:border-slate-400 group-hover:bg-slate-50"
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
                        <p className={cn("font-bold transition-colors", isCompleted ? "text-slate-400 line-through" : "text-slate-900")}>
                          {supplement.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{supplement.dosage} doses • {supplement.brand || 'No Brand'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center text-slate-500">
                <Pill className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No supplements scheduled.</p>
              </div>
            )}
          </div>
        </div>
        {/* Workout Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Workouts</h3>
            <div className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-md shrink-0">
              {todaysWorkouts.length} Scheduled
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
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
                          isCompleted ? "bg-slate-800 border-slate-800" : "border-slate-300 hover:border-slate-400 group-hover:bg-slate-50"
                        )}
                      >
                        {isCompleted && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-lg transition-colors font-medium", isCompleted ? "text-slate-400 line-through" : "text-slate-800")}>
                          {workout.name}
                        </span>
                        {workout.exercises && workout.exercises.length > 0 && (
                          <button onClick={() => toggleWorkoutExpanded(workout.id)} className="p-1 text-slate-400 hover:bg-slate-200 rounded transition-colors ml-1">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && workout.exercises && workout.exercises.length > 0 && (
                    <div className="px-16 pb-4 pt-1">
                      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                        <ul className="space-y-3">
                          {workout.exercises.map((ex, idx) => (
                            <li key={ex.id || idx} className="flex flex-col border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                              <span className="font-semibold text-slate-700 text-sm">{ex.name}</span>
                              <div className="flex gap-3 text-xs font-medium text-slate-600 mt-1">
                                {ex.sets && <span>{ex.sets} sets</span>}
                                {ex.reps && <span>{ex.reps} reps</span>}
                                {ex.weight && <span>{ex.weight} lbs</span>}
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
                <p>No workouts scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Weekly Calendar Component */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Weekly Summary</h3>
        
        <div className="flex items-start overflow-x-auto pb-4">
          <div className="flex flex-col items-end gap-3 pt-[72px] shrink-0 pr-4">
            <span className="text-sm font-medium text-slate-500 h-6 flex items-center">Supplements:</span>
            <span className="text-sm font-medium text-slate-500 h-6 flex items-center">Workouts:</span>
          </div>

          <div className="flex items-start gap-1 min-w-max">
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
                
                const suppColor = stats.supplements.taken === stats.supplements.total && stats.supplements.total > 0
                  ? "bg-amber-200 text-amber-900" : "bg-rose-50 text-slate-600";
                const workColor = stats.workouts.taken === stats.workouts.total && stats.workouts.total > 0
                  ? "bg-amber-200 text-amber-900" : "bg-rose-50 text-slate-600";

                return (
                  <div key={date.toISOString()} className="flex flex-col items-center px-2 relative group">
                    <button
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-xl min-w-[4rem] transition-all relative z-10",
                        isSelected ? "border-2 border-rose-400" : "border-2 border-transparent hover:border-slate-100",
                        isToday && !isSelected && "bg-slate-50"
                      )}
                    >
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {format(date, 'EEE')}
                      </span>
                      <span className={cn(
                        "text-lg font-bold",
                        isSelected ? "text-slate-900" : "text-slate-700"
                      )}>
                        {format(date, 'MM/dd')}
                      </span>
                    </button>
                    
                    <div className="flex flex-col gap-3 mt-1 items-center">
                      <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-center min-w-[32px] h-6", suppColor)}>
                        {suppFraction}
                      </div>
                      <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-center min-w-[32px] h-6", workColor)}>
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

      {/* Two-Month Calendar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Monthly View</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setCalendarBaseDate(subMonths(calendarBaseDate, 1))} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCalendarBaseDate(new Date())} className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
              Today
            </button>
            <button onClick={() => setCalendarBaseDate(addMonths(calendarBaseDate, 1))} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {renderMonthCalendar(calendarBaseDate)}
          <div className="hidden md:block w-px bg-slate-100"></div>
          {renderMonthCalendar(addMonths(calendarBaseDate, 1))}
        </div>
      </div>

      {/* Day Details Modal */}
      {modalDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">
                {format(modalDate, 'EEEE, MMMM do')}
              </h3>
              <button onClick={() => setModalDate(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-500" />
                    Supplements ({modalSupplements.length})
                  </h4>
                  {onNavigate && (
                    <button 
                      onClick={() => { setModalDate(null); onNavigate('cabinet'); }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Manage Cabinet
                    </button>
                  )}
                </div>
                {modalSupplements.length > 0 ? (
                  <div className="space-y-2">
                    {modalSupplements.map(s => {
                      const isTaken = intakeLogs.some(l => l.supplementId === s.id && l.date === modalDateStr);
                      return (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full", isTaken ? "bg-green-500" : "bg-slate-300")} />
                            <span className={cn("font-medium", isTaken ? "text-slate-500 line-through" : "text-slate-800")}>{s.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">{s.dosage} doses</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No supplements scheduled.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500" />
                    Workouts ({modalWorkouts.length})
                  </h4>
                  {onNavigate && (
                    <button 
                      onClick={() => { setModalDate(null); onNavigate('workouts'); }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Manage Workouts
                    </button>
                  )}
                </div>
                {modalWorkouts.length > 0 ? (
                  <div className="space-y-2">
                    {modalWorkouts.map(w => {
                      const isCompleted = workoutLogs.some(l => l.workoutId === w.id && l.date === modalDateStr && l.completed);
                      return (
                        <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full", isCompleted ? "bg-green-500" : "bg-slate-300")} />
                            <span className={cn("font-medium", isCompleted ? "text-slate-500 line-through" : "text-slate-800")}>{w.name}</span>
                          </div>
                          {w.category && <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded">{w.category}</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No workouts scheduled.</p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
