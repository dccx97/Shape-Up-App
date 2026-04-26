import { useState } from 'react';
import type { Workout, WorkoutExercise } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface WorkoutModalProps {
  onClose: () => void;
  onSave: (data: Omit<Workout, 'id' | 'profileId'>) => void;
  initialData?: Workout;
}

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export function WorkoutModal({ onClose, onSave, initialData }: WorkoutModalProps) {
  const [formData, setFormData] = useState<Omit<Workout, 'id' | 'profileId'>>({
    name: initialData?.name || '',
    isOneOff: initialData?.isOneOff ?? false,
    oneOffDate: initialData?.oneOffDate || format(new Date(), 'yyyy-MM-dd'),
    schedule: initialData?.schedule || [],
    time: initialData?.time || '',
    category: initialData?.category || '',
    exercises: initialData?.exercises || []
  });

  const handleToggleDay = (dayId: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.includes(dayId)
        ? prev.schedule.filter(d => d !== dayId)
        : [...prev.schedule, dayId].sort()
    }));
  };

  const handleAddExercise = () => {
    const newEx: WorkoutExercise = {
      id: crypto.randomUUID(),
      name: '',
    };
    setFormData(prev => ({ ...prev, exercises: [...prev.exercises, newEx] }));
  };

  const handleUpdateExercise = (id: string, updates: Partial<WorkoutExercise>) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => ex.id === id ? { ...ex, ...updates } : ex)
    }));
  };

  const handleRemoveExercise = (id: string) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (!formData.isOneOff && formData.schedule.length === 0) return;
    
    // Clean up empty exercises
    const cleanedExercises = formData.exercises.filter(ex => ex.name.trim() !== '');
    
    onSave({ ...formData, exercises: cleanedExercises });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col my-8">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialData ? 'Edit Workout' : 'Create Workout'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form id="workout-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Workout Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arms (Weight Lifting)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Strength, Cardio"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time (Optional)</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.time || ''}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {/* Scheduling Type */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
              <div className="flex gap-4 border-b border-slate-200 pb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    checked={!formData.isOneOff}
                    onChange={() => setFormData({ ...formData, isOneOff: false })}
                  />
                  <span className="text-sm font-medium text-slate-700">Recurring Plan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    checked={formData.isOneOff}
                    onChange={() => setFormData({ ...formData, isOneOff: true })}
                  />
                  <span className="text-sm font-medium text-slate-700">One-Off Event</span>
                </label>
              </div>

              {formData.isOneOff ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Event Date</label>
                  <input
                    type="date"
                    required={formData.isOneOff}
                    className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.oneOffDate || ''}
                    onChange={e => setFormData({ ...formData, oneOffDate: e.target.value })}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleToggleDay(day.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                          ${formData.schedule.includes(day.id)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        {day.label.charAt(0)}
                      </button>
                    ))}
                  </div>
                  {formData.schedule.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">Please select at least one day.</p>
                  )}
                </div>
              )}
            </div>

            {/* Exercises Builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Actionable Items</h3>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {formData.exercises.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-500">No items added yet. Add exercises or tasks to this workout.</p>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                  >
                    + Add your first item
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.exercises.map((ex) => (
                    <div key={ex.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 30lb Dumbbell curls"
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={ex.name}
                            onChange={e => handleUpdateExercise(ex.id, { name: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500">Sets:</label>
                            <input
                              type="number"
                              min="1"
                              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded outline-none"
                              value={ex.sets || ''}
                              onChange={e => handleUpdateExercise(ex.id, { sets: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500">Reps:</label>
                            <input
                              type="number"
                              min="1"
                              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded outline-none"
                              value={ex.reps || ''}
                              onChange={e => handleUpdateExercise(ex.id, { reps: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500">Weight (lbs):</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              className="w-20 px-2 py-1 text-xs border border-slate-200 rounded outline-none"
                              value={ex.weight || ''}
                              onChange={e => handleUpdateExercise(ex.id, { weight: parseFloat(e.target.value) || undefined })}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="workout-form"
            disabled={!formData.name || (!formData.isOneOff && formData.schedule.length === 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? 'Update Workout' : 'Save Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}
