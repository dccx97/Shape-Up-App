import { useState } from 'react';
import type { HealthLog, HealthMetric } from '../types';
import { HealthLogModal } from './HealthLogModal';
import { AddMetricModal } from './AddMetricModal';
import { Plus, Activity, Trash2, Edit2, History, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HealthProps {
  healthLogs: HealthLog[];
  metrics: HealthMetric[];
  addMetric: (name: string, unit: string) => void;
  deleteMetric: (id: string) => void;
  addLog: (logData: Omit<HealthLog, 'id' | 'profileId' | 'editHistory'>) => void;
  updateLog: (id: string, logData: Omit<HealthLog, 'id' | 'profileId' | 'editHistory'>) => void;
  deleteLog: (id: string) => void;
}

export function Health({ healthLogs, metrics, addMetric, deleteMetric, addLog, updateLog, deleteLog }: HealthProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
  const [viewingHistoryLog, setViewingHistoryLog] = useState<HealthLog | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('weight');

  // For the chart, we want ascending chronological order and only points that have the selected metric
  const chartDataRaw = [...healthLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = chartDataRaw.filter(d => {
    if (selectedMetric === 'weight') return d.weight !== undefined && d.weight !== null;
    if (selectedMetric === 'bodyFat') return d.bodyFat !== undefined && d.bodyFat !== null;
    if (selectedMetric === 'visceralFat') return d.visceralFat !== undefined && d.visceralFat !== null;
    return d.customMetrics?.[selectedMetric] !== undefined && d.customMetrics?.[selectedMetric] !== null;
  });

  const activeMetricObj = metrics.find(m => m.id === selectedMetric);
  const getUnitString = () => {
    if (!activeMetricObj?.unit) return '';
    return activeMetricObj.unit === '%' ? '%' : ` ${activeMetricObj.unit}`;
  };

  const getFormattedValue = (log: any) => {
    let val: number | undefined | null;
    if (selectedMetric === 'weight') val = log.weight;
    else if (selectedMetric === 'bodyFat') val = log.bodyFat;
    else if (selectedMetric === 'visceralFat') val = log.visceralFat;
    else val = log.customMetrics?.[selectedMetric];

    if (val === undefined || val === null) return '-';
    return `${val}${getUnitString()}`;
  };

  // Chart Dimensions
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 200;
  const PADDING_Y = 40;
  const PADDING_X = 40;

  const metricValues = chartData.map(d => {
    if (selectedMetric === 'weight') return d.weight || 0;
    if (selectedMetric === 'bodyFat') return d.bodyFat || 0;
    if (selectedMetric === 'visceralFat') return d.visceralFat || 0;
    return d.customMetrics?.[selectedMetric] || 0;
  });
  const paddingBuffer = selectedMetric === 'weight' ? 5 : 1;
  const minMetric = metricValues.length > 0 ? Math.min(...metricValues) - paddingBuffer : 0;
  const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) + paddingBuffer : 100;

  const getCoordinates = (index: number, val: number) => {
    const x = chartData.length > 1 
      ? PADDING_X + (index * (SVG_WIDTH - 2 * PADDING_X) / (chartData.length - 1))
      : SVG_WIDTH / 2;
    const y = SVG_HEIGHT - PADDING_Y - ((val - minMetric) / (maxMetric - minMetric)) * (SVG_HEIGHT - 2 * PADDING_Y);
    return { x, y };
  };

  const points = chartData.map((d, i) => {
    let val = 0;
    if (selectedMetric === 'weight') val = d.weight || 0;
    else if (selectedMetric === 'bodyFat') val = d.bodyFat || 0;
    else if (selectedMetric === 'visceralFat') val = d.visceralFat || 0;
    else val = d.customMetrics?.[selectedMetric] || 0;
    return getCoordinates(i, val);
  });
  const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-4">
        {/* Pink separator line */}
        <div className="h-2 w-full bg-rose-600 mb-6 rounded-full" />
        
        <div className="flex items-end justify-between mb-8">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Health Tracker</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddMetricOpen(true)}
              className="flex items-center gap-2 bg-[#d82a71] hover:bg-[#c32262] text-white px-6 py-3 rounded-2xl font-bold transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Add Metric</span>
            </button>
            <button
              onClick={() => {
                setEditingLog(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#d82a71] hover:bg-[#c32262] text-white px-6 py-3 rounded-2xl font-bold transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Log Entry</span>
            </button>
          </div>
        </div>
      </div>

      {healthLogs.length > 0 ? (
        <>
          <div className="mb-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-48 bg-white text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 shadow-sm transition-shadow cursor-pointer"
            >
              {metrics.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-400" />
                Trend
              </h3>
            </div>
          
          {chartData.length > 0 ? (
            <div className="w-full overflow-x-auto overflow-y-hidden">
              <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto min-w-[500px]">
                {/* Grid Lines */}
                <line x1={PADDING_X} y1={PADDING_Y} x2={SVG_WIDTH - PADDING_X} y2={PADDING_Y} stroke="#f1f5f9" strokeWidth="1" />
                <line x1={PADDING_X} y1={SVG_HEIGHT / 2} x2={SVG_WIDTH - PADDING_X} y2={SVG_HEIGHT / 2} stroke="#f1f5f9" strokeWidth="1" />
                <line x1={PADDING_X} y1={SVG_HEIGHT - PADDING_Y} x2={SVG_WIDTH - PADDING_X} y2={SVG_HEIGHT - PADDING_Y} stroke="#e2e8f0" strokeWidth="1" />
                
                {/* Line */}
                {chartData.length > 1 && (
                  <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}
                
                {/* Points & Labels */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="hover:r-6 cursor-pointer transition-all duration-200" />
                    <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12" fill="#475569" fontWeight="600">
                      {getFormattedValue(chartData[i])}
                    </text>
                    <text x={p.x} y={SVG_HEIGHT - PADDING_Y + 20} textAnchor="middle" fontSize="10" fill="#94a3b8">
                      {format(parseISO(chartData[i].date), 'MMM d')}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-slate-500 font-medium">No data for this metric have been input.</p>
            </div>
          )}
        </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-lg">No health data yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Log your weight to start seeing your trend over time.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 font-medium hover:underline text-sm"
          >
            Add your first entry
          </button>
        </div>
      )}

      {/* History Table */}
      {healthLogs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">{metrics.find(m => m.id === selectedMetric)?.name || 'Value'}</th>
                  <th className="p-4 font-semibold">Notes</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {chartData.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {format(parseISO(log.date), 'MMM d, yyyy')}
                        {log.editHistory && log.editHistory.length > 0 && (
                          <button
                            onClick={() => setViewingHistoryLog(log)}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                          >
                            <History className="w-3 h-3" />
                            Edited
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-blue-600">
                      {getFormattedValue(log)}
                    </td>
                    <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate">
                      {log.notes || '-'}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingLog(log)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(isModalOpen || editingLog) && (
        <HealthLogModal
          initialData={editingLog || undefined}
          metrics={metrics}
          initialMetricId={selectedMetric}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLog(null);
          }}
          onSave={(data) => {
            if (editingLog) {
              updateLog(editingLog.id, data);
            } else {
              addLog(data);
            }
          }}
        />
      )}

      {viewingHistoryLog && viewingHistoryLog.editHistory && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                Change Log
              </h2>
              <button onClick={() => setViewingHistoryLog(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              <p className="text-sm text-slate-500">
                History of changes for entry on <span className="font-semibold text-slate-700">{format(parseISO(viewingHistoryLog.date), 'MMMM d, yyyy')}</span>:
              </p>
              
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                {[...viewingHistoryLog.editHistory].reverse().map((edit, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                      {format(new Date(edit.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                    <div className="space-y-2">
                      {edit.changes.map((change, cIdx) => (
                        <div key={cIdx} className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm">
                          <span className="font-semibold capitalize text-slate-700">{change.field.replace(/([A-Z])/g, ' $1').trim()}</span> changed:
                          <div className="mt-1 flex items-center gap-2 font-mono text-xs">
                            <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded line-through">{String(change.oldValue ?? 'none')}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{String(change.newValue ?? 'none')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddMetricOpen && (
        <AddMetricModal
          metrics={metrics}
          onAdd={addMetric}
          onDelete={deleteMetric}
          onClose={() => setIsAddMetricOpen(false)}
        />
      )}
    </div>
  );
}
