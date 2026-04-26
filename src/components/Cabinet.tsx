import { useState } from 'react';
import type { Supplement, Profile } from '../types';
import { AlertTriangle, Plus, ExternalLink, Edit2, Trash2, Pill, ShoppingCart } from 'lucide-react';
import { SupplementForm } from './SupplementForm';
import { AdjustQuantityModal } from './AdjustQuantityModal';
import { cn } from '../lib/utils';

interface CabinetProps {
  supplements: Supplement[];
  addSupplement: (supplement: Omit<Supplement, 'id' | 'profileId'> & { profileId?: string }) => void;
  updateSupplement: (id: string, updates: Partial<Supplement>) => void;
  deleteSupplement: (id: string) => void;
  profiles: Profile[];
  activeProfileId: string | null;
}

export function Cabinet({ supplements, addSupplement, updateSupplement, deleteSupplement, profiles, activeProfileId }: CabinetProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [adjustingSupplement, setAdjustingSupplement] = useState<Supplement | null>(null);
  const [deletingSupplement, setDeletingSupplement] = useState<Supplement | null>(null);

  const handleEdit = (supplement: Supplement) => {
    setEditingSupplement(supplement);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSupplement(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-4">
        {/* Pink separator line */}
        <div className="h-2 w-full bg-rose-600 mb-6 rounded-full" />
        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-8">Supplement Cabinet</h1>
      </div>

      {/* Low Inventory Section */}
      {(() => {
        const lowInventorySupplements = supplements.filter(s => {
          const dosesPerDay = s.schedule.length > 0 ? (s.schedule.length * s.dosage) / 7 : s.dosage;
          const daysLeft = s.currentQuantity / dosesPerDay;
          return daysLeft <= 10;
        });

        if (lowInventorySupplements.length === 0) return null;

        return (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm flex flex-col gap-3 mb-10">
            <div className="flex items-center gap-2 text-red-600 font-semibold mb-1 border-b border-red-100/50 pb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Low Inventory Alert</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lowInventorySupplements.map(s => {
                const dosesPerDay = s.schedule.length > 0 ? (s.schedule.length * s.dosage) / 7 : s.dosage;
                const daysLeft = Math.floor(s.currentQuantity / dosesPerDay);
                
                return (
                  <div key={s.id} className="bg-white rounded-lg p-3 border border-red-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {s.pillImage ? (
                        <img src={s.pillImage} alt={s.name} className="w-10 h-10 rounded-md object-cover border border-slate-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                          <Pill className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                        <p className="text-xs text-red-600 font-bold">
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left ({s.currentQuantity} remaining)
                        </p>
                      </div>
                    </div>
                    
                    {s.buyLink && (
                      <a
                        href={s.buyLink.startsWith('http') ? s.buyLink : `https://${s.buyLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 ml-2 p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors flex items-center justify-center"
                        title="Purchase more"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">My Cabinet</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Supplement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supplements.map(supplement => {
          const alertThreshold = supplement.dosage * 7;
          const isLowStock = supplement.currentQuantity <= alertThreshold;

          return (
            <div key={supplement.id} className={cn(
              "bg-white rounded-xl shadow-sm border p-5 flex flex-col transition-all hover:shadow-md",
              isLowStock ? "border-red-200" : "border-slate-100"
            )}>
              {supplement.bottleImage && (
                <div className="w-full h-32 mb-4 bg-slate-50 rounded-lg overflow-hidden relative border border-slate-100">
                  <img src={supplement.bottleImage} alt="Bottle" className="w-full h-full object-contain mix-blend-multiply" />
                  {supplement.pillImage && (
                    <div className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full p-0.5 shadow-md border border-slate-200">
                      <img src={supplement.pillImage} alt="Pill" className="w-full h-full object-cover rounded-full" />
                    </div>
                  )}
                </div>
              )}
              {!supplement.bottleImage && supplement.pillImage && (
                <div className="w-12 h-12 mb-4 bg-white rounded-full p-0.5 shadow-sm border border-slate-200">
                  <img src={supplement.pillImage} alt="Pill" className="w-full h-full object-cover rounded-full" />
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{supplement.name}</h3>
                  <p className="text-sm text-slate-500">{supplement.brand}</p>
                </div>
                {isLowStock && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                    <AlertTriangle className="w-3 h-3" />
                    Low Stock
                  </div>
                )}
              </div>

              <div className="text-sm text-slate-600 mb-4 flex-1">
                <p className="mb-1"><span className="font-medium">Dosage:</span> {supplement.dosage}</p>
                {supplement.strength && (
                  <p className="mb-1"><span className="font-medium">Strength:</span> {supplement.strength}</p>
                )}
                {supplement.reasonForTaking && (
                  <p className="line-clamp-2"><span className="font-medium">Reason:</span> {supplement.reasonForTaking}</p>
                )}
                {supplement.type === 'Prescription' && supplement.doctorName && (
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-blue-50/50 p-2 rounded-lg text-xs">
                    <p className="font-semibold text-blue-800 mb-1">Prescription</p>
                    <p className="text-slate-700">{supplement.doctorName}</p>
                    {supplement.doctorPhone && <p className="text-slate-600 font-medium">{supplement.doctorPhone}</p>}
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between pt-4 border-t border-slate-50 mt-auto">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Current Quantity</p>
                  <div className="flex items-baseline gap-2">
                    <p className={cn("text-2xl font-bold", isLowStock ? "text-red-600" : "text-slate-800")}>
                      {supplement.currentQuantity}
                    </p>
                  </div>
                  <button 
                    onClick={() => setAdjustingSupplement(supplement)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Adjust Quantity
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {supplement.buyLink && (
                    <a
                      href={supplement.buyLink.startsWith('http') ? supplement.buyLink : `https://${supplement.buyLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Buy Again"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(supplement)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeletingSupplement(supplement)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {supplements.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-500 mb-4">Your cabinet is empty.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Add your first supplement
            </button>
          </div>
        )}
      </div>

      {isFormOpen && (
        <SupplementForm 
          onClose={handleCloseForm}
          onSave={(data) => {
            if (editingSupplement) {
              const updates: Partial<Supplement> = { ...data };
              
              if (data.currentQuantity !== editingSupplement.currentQuantity) {
                const diff = data.currentQuantity - editingSupplement.currentQuantity;
                const newLog = {
                  id: crypto.randomUUID(),
                  date: new Date().toISOString(),
                  quantityAdded: diff,
                  notes: "Adjusted via Edit Supplement"
                };
                updates.orderHistory = [...(editingSupplement.orderHistory || []), newLog];
              }
              
              updateSupplement(editingSupplement.id, updates);
            } else {
              if (data.currentQuantity > 0) {
                const newLog = {
                  id: crypto.randomUUID(),
                  date: new Date().toISOString(),
                  quantityAdded: data.currentQuantity,
                  notes: "Initial inventory"
                };
                addSupplement({ ...data, orderHistory: [newLog] });
              } else {
                addSupplement(data);
              }
            }
            handleCloseForm();
          }}
          onShare={(targetProfileId, data) => {
            if (data.currentQuantity > 0) {
              const newLog = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                quantityAdded: data.currentQuantity,
                notes: "Shared from another profile"
              };
              addSupplement({ ...data, profileId: targetProfileId, orderHistory: [newLog] });
            } else {
              addSupplement({ ...data, profileId: targetProfileId });
            }
            alert("Supplement successfully shared to profile!");
            handleCloseForm();
          }}
          initialData={editingSupplement || undefined}
          allProfiles={profiles}
          activeProfileId={activeProfileId}
        />
      )}

      {adjustingSupplement && (
        <AdjustQuantityModal
          supplement={adjustingSupplement}
          onClose={() => setAdjustingSupplement(null)}
          onUpdate={updateSupplement}
        />
      )}

      {deletingSupplement && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-semibold text-lg text-slate-800">Delete Supplement</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deletingSupplement.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingSupplement(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSupplement(deletingSupplement.id);
                  setDeletingSupplement(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
