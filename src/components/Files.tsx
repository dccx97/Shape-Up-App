import { useState } from 'react';
import type { DocumentFile, FileCategory } from '../types';
import { FileUploadModal } from './FileUploadModal';
import { Plus, Download, ExternalLink, Trash2, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const CATEGORIES: FileCategory[] = [
  'Purchase Receipt',
  'Lab Reports',
  'Doctors Notes',
  'Dosing Instructions',
  'Other'
];

interface FilesProps {
  files: DocumentFile[];
  isLoading: boolean;
  addFile: (data: Omit<DocumentFile, 'id' | 'profileId' | 'uploadedAt'>) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
}

export function Files({ files, isLoading, addFile, deleteFile }: FilesProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FileCategory | 'All'>('All');
  const [deletingFile, setDeletingFile] = useState<DocumentFile | null>(null);

  const filteredFiles = activeCategory === 'All' 
    ? files 
    : files.filter(f => f.category === activeCategory);

  const handleDownload = (file: DocumentFile) => {
    const a = document.createElement('a');
    a.href = file.data;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpen = (file: DocumentFile) => {
    // For PDFs and images, try to open in a new tab
    if (file.fileType.startsWith('image/') || file.fileType === 'application/pdf') {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<iframe src="${file.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        handleDownload(file); // fallback
      }
    } else {
      handleDownload(file); // fallback for other doc types
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800">My Files</h2>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>Upload File</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory('All')}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeCategory === 'All' ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          All Files
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeCategory === cat ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 mt-4 font-medium">Loading your files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-lg">No files found</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">
            {activeCategory === 'All' ? "You haven't uploaded any files yet." : `No files in the ${activeCategory} category.`}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="text-blue-600 font-medium hover:underline text-sm"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map(file => {
            const isImage = file.fileType.startsWith('image/');
            return (
              <div key={file.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition-all">
                {/* Preview Area */}
                <div 
                  onClick={() => handleOpen(file)}
                  className="h-32 bg-slate-50 flex items-center justify-center border-b border-slate-100 cursor-pointer overflow-hidden relative"
                >
                  {isImage ? (
                    <img src={file.data} alt={file.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                
                {/* Details */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800 line-clamp-1 flex-1" title={file.title}>
                      {file.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {file.category}
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span>{format(new Date(file.uploadedAt), 'MMM d, yyyy')}</span>
                    <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleOpen(file)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingFile(file)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isUploadOpen && (
        <FileUploadModal
          onClose={() => setIsUploadOpen(false)}
          onSave={addFile}
        />
      )}

      {deletingFile && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Trash2 className="w-6 h-6" />
              <h3 className="font-semibold text-lg text-slate-800">Delete File</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deletingFile.title}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingFile(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteFile(deletingFile.id);
                  setDeletingFile(null);
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
