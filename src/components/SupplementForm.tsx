import { useState, useRef } from 'react';
import type { Supplement, Profile } from '../types';
import { X, Upload } from 'lucide-react';

interface SupplementFormProps {
  onClose: () => void;
  onSave: (data: Omit<Supplement, 'id'>) => void;
  initialData?: Supplement;
  allProfiles?: Profile[];
  activeProfileId?: string | null;
  onShare?: (profileId: string, data: Omit<Supplement, 'id'>) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function SupplementForm({ onClose, onSave, initialData, allProfiles, activeProfileId, onShare }: SupplementFormProps) {
  const [formData, setFormData] = useState<Omit<Supplement, 'id'>>({
    profileId: initialData?.profileId || activeProfileId || '',
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    schedule: initialData?.schedule || [0, 1, 2, 3, 4, 5, 6],
    reasonForTaking: initialData?.reasonForTaking || '',
    buyLink: initialData?.buyLink || '',
    currentQuantity: initialData?.currentQuantity || 0,
    dosage: initialData?.dosage || 1,
    strength: initialData?.strength || '',
    bottleImage: initialData?.bottleImage || '',
    pillImage: initialData?.pillImage || '',
    type: initialData?.type || 'OTC',
    doctorName: initialData?.doctorName || '',
    doctorPhone: initialData?.doctorPhone || '',
  });

  const bottleInputRef = useRef<HTMLInputElement>(null);
  const pillInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleDay = (dayValue: number) => {
    setFormData(prev => {
      const isSelected = prev.schedule.includes(dayValue);
      if (isSelected) {
        return { ...prev, schedule: prev.schedule.filter(d => d !== dayValue) };
      } else {
        return { ...prev, schedule: [...prev.schedule, dayValue].sort() };
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'bottleImage' | 'pillImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // Safe size for local storage
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG to save space in local storage
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, [field]: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const ImageUploader = ({ field, label, imgRef }: { field: 'bottleImage' | 'pillImage', label: string, imgRef: React.RefObject<HTMLInputElement | null> }) => (
    <div className="flex-1">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div 
        onClick={() => imgRef.current?.click()}
        className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden relative"
      >
        {formData[field] ? (
          <img src={formData[field]} alt={label} className="w-full h-full object-cover" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-xs text-slate-500 font-medium">Upload photo</span>
          </>
        )}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={imgRef}
          onChange={(e) => handleImageUpload(e, field)}
        />
      </div>
      {formData[field] && (
        <button 
          type="button" 
          onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, [field]: '' })) }}
          className="text-xs text-red-500 mt-1 hover:underline font-medium"
        >
          Remove image
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialData ? 'Edit Supplement' : 'Add Supplement'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Image Uploaders */}
          <div className="flex gap-4 mb-2">
            <ImageUploader field="bottleImage" label="Bottle Photo" imgRef={bottleInputRef} />
            <ImageUploader field="pillImage" label="Pill/Capsule Photo" imgRef={pillInputRef} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vitamin D3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Thorne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as 'OTC' | 'Prescription' })}
              >
                <option value="OTC">Over the Counter</option>
                <option value="Prescription">Prescription</option>
              </select>
            </div>
          </div>

          {formData.type === 'Prescription' && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Prescribing Doctor</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  value={formData.doctorName}
                  onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                  placeholder="Dr. Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Office Phone</label>
                <input
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  value={formData.doctorPhone}
                  onChange={e => setFormData({ ...formData, doctorPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosage (pills/scoops)</label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.dosage}
                onChange={e => setFormData({ ...formData, dosage: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Quantity</label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.currentQuantity}
                onChange={e => setFormData({ ...formData, currentQuantity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Strength (Optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.strength}
              onChange={e => setFormData({ ...formData, strength: e.target.value })}
              placeholder="e.g. 100 mg, 5000 IU"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Schedule</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    formData.schedule.includes(day.value)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day.label[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for taking (Optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.reasonForTaking}
              onChange={e => setFormData({ ...formData, reasonForTaking: e.target.value })}
              placeholder="e.g. Bone health, immune support"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Buy Link (Optional)</label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.buyLink}
              onChange={e => setFormData({ ...formData, buyLink: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {initialData && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-3">Assigned Profiles</label>
              <div className="space-y-2">
                {allProfiles?.map(p => {
                  const isCurrent = p.id === activeProfileId;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-500">
                            {p.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      </div>
                      
                      {isCurrent ? (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Current Profile</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onShare && onShare(p.id, formData)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1"
                        >
                          Copy to Profile
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            Save Supplement
          </button>
        </div>
      </div>
    </div>
  );
}
