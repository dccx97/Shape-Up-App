import { useState } from 'react';
import type { Supplement, IntakeLog, WorkoutLog } from '../types';
import { subDays, startOfToday, getDay, format } from 'date-fns';
import { Award, CalendarX, Target, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnalyticsProps {
  supplements: Supplement[];
  intakeLogs: IntakeLog[];
  workoutLogs: WorkoutLog[];
}

export function Analytics({ supplements, intakeLogs, workoutLogs }: AnalyticsProps) {
  const [timeframe, setTimeframe] = useState<7 | 30>(7);

  // Calculate statistics
  const today = startOfToday();
  const daysToEvaluate = Array.from({ length: timeframe }).map((_, i) => subDays(today, i));

  let perfectDays = 0;
  let missedDays = 0;
  let totalScheduled = 0;
  let totalTaken = 0;
  let totalWorkoutsCompleted = 0;

  daysToEvaluate.forEach(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);
    const scheduledForDay = supplements.filter(s => s.schedule.includes(dayOfWeek));
    
    // Workout calculation
    const completedWorkoutsForDay = workoutLogs.filter(l => l.date === dateStr && l.completed);
    totalWorkoutsCompleted += completedWorkoutsForDay.length;

    if (scheduledForDay.length > 0) {
      const takenCount = scheduledForDay.reduce((acc, curr) => {
        const log = intakeLogs.find(l => l.supplementId === curr.id && l.date === dateStr);
        return acc + (log?.taken ? 1 : 0);
      }, 0);

      totalScheduled += scheduledForDay.length;
      totalTaken += takenCount;

      if (takenCount === scheduledForDay.length) {
        perfectDays++;
      } else {
        missedDays++;
      }
    }
  });

  const complianceRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">Compliance Analytics</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setTimeframe(7)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              timeframe === 7 ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe(30)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              timeframe === 30 ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compliance Rate Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Overall Compliance</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-slate-900">{complianceRate}%</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {totalTaken} of {totalScheduled} doses taken
            </p>
          </div>
        </div>

        {/* Perfect Days Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-amber-50 opacity-50">
            <Award className="w-48 h-48" />
          </div>
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center relative z-10">
            <Award className="w-8 h-8" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-amber-700 mb-1">Perfect Days</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-amber-600">{perfectDays}</h3>
              <span className="text-sm font-medium text-amber-700">days</span>
            </div>
            <p className="text-sm text-amber-700/80 mt-1">
              All scheduled supplements taken
            </p>
          </div>
        </div>

        {/* Missed Days Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
            <CalendarX className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Missed Days</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-slate-700">{missedDays}</h3>
              <span className="text-sm font-medium text-slate-500">days</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              At least one dose missed
            </p>
          </div>
        </div>

        {/* Workouts Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Workouts Completed</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-bold text-slate-700">{totalWorkoutsCompleted}</h3>
              <span className="text-sm font-medium text-slate-500">workouts</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              In the last {timeframe} days
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
