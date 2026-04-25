import { useState, useRef } from 'react';
import type { DocumentFile, FileCategory } from '../types';
import { X, Upload, FileText } from 'lucide-react';

const CATEGORIES: FileCategory[] = [
  'Purchase Receipt',
  'Lab Reports',
  'Doctors Notes',
  'Dosing Instructions',
  'Other'
];

interface FileUploadModalProps {
  onClose: () => void;
  onSave: (data: Omit<DocumentFile, 'id' | 'profileId' | 'uploadedAt'>) => Promise<void>;
}

export function FileUploadModal({ onClose, onSave }: FileUploadModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FileCategory>('Other');
  const [fileData, setFileData] = useState<{ data: string; name: string; type: string; size: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large. Please select a file under 50MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData({
        data: event.target?.result as string,
        name: file.name,
        type: file.type,
        size: file.size
      });
      // Auto-fill title if empty
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileData || !title) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        category,
        data: fileData.data,
        fileName: fileData.name,
        fileType: fileData.type,
        fileSize: fileData.size
      });
      onClose();
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Upload File</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select File</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors p-4 text-center"
            >
              {fileData ? (
                <>
                  <FileText className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-slate-800 truncate max-w-full px-4">{fileData.name}</p>
                  <p className="text-xs text-slate-500">{(fileData.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Click to browse files</p>
                  <p className="text-xs text-slate-500 mt-1">Images, PDFs, or Documents</p>
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
            </div>
            {fileData && (
              <div className="mt-2 text-right">
                <button 
                  type="button" 
                  onClick={() => setFileData(null)}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Recent Bloodwork"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              value={category}
              onChange={e => setCategory(e.target.value as FileCategory)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
            disabled={!fileData || !title || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
}
