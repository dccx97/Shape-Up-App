import { useState, useEffect } from 'react';
import type { HealthLog, HealthMetric } from '../types';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface HealthLogModalProps {
  onClose: () => void;
  onSave: (data: Omit<HealthLog, 'id' | 'profileId' | 'editHistory'>) => void;
  initialData?: HealthLog;
  metrics: HealthMetric[];
  initialMetricId?: string;
}

export function HealthLogModal({ onClose, onSave, initialData, metrics, initialMetricId = 'weight' }: HealthLogModalProps) {
  const [date, setDate] = useState(initialData?.date || format(new Date(), 'yyyy-MM-dd'));
  const [selectedMetricId, setSelectedMetricId] = useState(initialMetricId);
  const [metricValue, setMetricValue] = useState<string>('');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Load value when metric changes or on mount
  useEffect(() => {
    if (initialData) {
      if (selectedMetricId === 'weight' && initialData.weight !== undefined) {
        setMetricValue(initialData.weight.toString());
      } else if (selectedMetricId === 'bodyFat' && initialData.bodyFat !== undefined) {
        setMetricValue(initialData.bodyFat.toString());
      } else if (selectedMetricId === 'visceralFat' && initialData.visceralFat !== undefined) {
        setMetricValue(initialData.visceralFat.toString());
      } else if (initialData.customMetrics?.[selectedMetricId] !== undefined) {
        setMetricValue(initialData.customMetrics[selectedMetricId].toString());
      } else {
        setMetricValue('');
      }
    } else {
      setMetricValue('');
    }
  }, [selectedMetricId, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(metricValue);
    if (isNaN(numValue)) return;

    // Preserve initial data so we don't overwrite other metrics that might be on the same row
    const baseData = initialData ? {
      date: initialData.date,
      weight: initialData.weight,
      bodyFat: initialData.bodyFat,
      visceralFat: initialData.visceralFat,
      customMetrics: initialData.customMetrics || {},
      notes: initialData.notes
    } : {
      date,
      customMetrics: {},
      notes
    };

    // Update with new values
    baseData.date = date;
    baseData.notes = notes;

    if (selectedMetricId === 'weight') {
      baseData.weight = numValue;
    } else if (selectedMetricId === 'bodyFat') {
      baseData.bodyFat = numValue;
    } else if (selectedMetricId === 'visceralFat') {
      baseData.visceralFat = numValue;
    } else {
      baseData.customMetrics = {
        ...baseData.customMetrics,
        [selectedMetricId]: numValue
      };
    }

    onSave(baseData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialData ? 'Edit Health Metrics' : 'Log Health Metrics'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Metric</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
              value={selectedMetricId}
              onChange={e => setSelectedMetricId(e.target.value)}
            >
              {metrics.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Value
              {(() => {
                const activeMetric = metrics.find(m => m.id === selectedMetricId);
                return activeMetric?.unit ? ` (${activeMetric.unit})` : '';
              })()}
            </label>
            <input
              type="number"
              step="0.1"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-semibold"
              value={metricValue}
              onChange={e => setMetricValue(e.target.value)}
              placeholder="e.g. 175.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Morning weigh-in"
            />
          </div>
        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!metricValue || isNaN(parseFloat(metricValue))}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? 'Update Metrics' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}
