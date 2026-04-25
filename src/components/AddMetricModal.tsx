import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { HealthMetric } from '../types';

interface AddMetricModalProps {
  metrics: HealthMetric[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function AddMetricModal({ metrics, onAdd, onDelete, onClose }: AddMetricModalProps) {
  const [newMetricName, setNewMetricName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricName.trim()) return;
    onAdd(newMetricName.trim());
    setNewMetricName('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">
            Manage Health Metrics
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleAdd} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">New Metric Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newMetricName}
                onChange={e => setNewMetricName(e.target.value)}
                placeholder="e.g. Muscle Mass"
              />
            </div>
            <button
              type="submit"
              disabled={!newMetricName.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
            >
              Add
            </button>
          </form>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Available Metrics</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {metrics.map(metric => (
                <div key={metric.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="font-medium text-slate-700">{metric.name}</span>
                  <button
                    onClick={() => metric.isDeletable && onDelete(metric.id)}
                    disabled={!metric.isDeletable}
                    className={`p-1.5 rounded-lg transition-colors ${
                      metric.isDeletable 
                        ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title={metric.isDeletable ? "Delete Metric" : "Cannot delete this metric"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
