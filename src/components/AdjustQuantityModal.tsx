import { useState } from 'react';
import type { Supplement, OrderLog } from '../types';
import { X, PackagePlus, Edit3, History, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface AdjustQuantityModalProps {
  supplement: Supplement;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Supplement>) => void;
}

type Tab = 'receive' | 'manual' | 'history';

export function AdjustQuantityModal({ supplement, onClose, onUpdate }: AdjustQuantityModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('receive');
  
  // Receive state
  const [receiveQuantity, setReceiveQuantity] = useState<number>(30); // Default common size
  const [receiveNotes, setReceiveNotes] = useState<string>('');
  
  // Manual state
  const [manualQuantity, setManualQuantity] = useState<number>(supplement.currentQuantity);
  const [manualOrders, setManualOrders] = useState<number>(supplement.ordersCount || 0);

  const handleReceiveBottle = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: OrderLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      quantityAdded: receiveQuantity,
      notes: receiveNotes.trim() || undefined
    };
    
    const newOrdersCount = (supplement.ordersCount || 0) + 1;
    const newHistory = [...(supplement.orderHistory || []), newLog];
    const newQuantity = supplement.currentQuantity + receiveQuantity;

    onUpdate(supplement.id, {
      currentQuantity: newQuantity,
      ordersCount: newOrdersCount,
      orderHistory: newHistory
    });
    onClose();
  };

  const handleManualOverride = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(supplement.id, {
      currentQuantity: manualQuantity,
      ordersCount: manualOrders
    });
    onClose();
  };

  const handleDeleteHistoryLog = (logId: string) => {
    if (!supplement.orderHistory) return;
    
    // Optional: we don't strictly subtract the quantity or order count here, 
    // it's just removing the history log. If they want to fix counts, they use manual override.
    const newHistory = supplement.orderHistory.filter(l => l.id !== logId);
    onUpdate(supplement.id, {
      orderHistory: newHistory
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Adjust Inventory</h2>
            <p className="text-xs text-slate-500">{supplement.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white">
          <button 
            onClick={() => setActiveTab('receive')}
            className={cn("flex-1 py-3 text-sm font-medium flex justify-center gap-2 items-center transition-colors border-b-2", activeTab === 'receive' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50")}
          >
            <PackagePlus className="w-4 h-4" /> Receive
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={cn("flex-1 py-3 text-sm font-medium flex justify-center gap-2 items-center transition-colors border-b-2", activeTab === 'manual' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50")}
          >
            <Edit3 className="w-4 h-4" /> Manual
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn("flex-1 py-3 text-sm font-medium flex justify-center gap-2 items-center transition-colors border-b-2", activeTab === 'history' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50")}
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50/30">
          
          {activeTab === 'receive' && (
            <form onSubmit={handleReceiveBottle} className="space-y-4">
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm border border-blue-100">
                Quickly add a full bottle's worth of pills to your current inventory. This also logs the order in your history.
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity in New Bottle</label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={receiveQuantity}
                  onChange={e => setReceiveQuantity(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ordered new full bottle"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={receiveNotes}
                  onChange={e => setReceiveNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                  Add to Inventory
                </button>
              </div>
            </form>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Quantity (Total)</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={manualQuantity}
                  onChange={e => setManualQuantity(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Times Ordered (Count)</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={manualOrders}
                  onChange={e => setManualOrders(Number(e.target.value))}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm">
                  Save Overrides
                </button>
              </div>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-slate-600">Total Times Ordered</span>
                <span className="text-lg font-bold text-slate-800">{supplement.ordersCount || 0}</span>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 mt-4 mb-2">Order Log</h3>
              
              {(!supplement.orderHistory || supplement.orderHistory.length === 0) ? (
                <div className="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  No orders logged yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {[...supplement.orderHistory].reverse().map(log => (
                    <div key={log.id} className="flex justify-between items-start p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">+{log.quantityAdded} pills</p>
                        {log.notes && <p className="text-sm text-slate-600 mt-0.5">"{log.notes}"</p>}
                        <p className="text-xs text-slate-400 mt-1">{format(new Date(log.date), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteHistoryLog(log.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-colors ml-2 flex-shrink-0"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
