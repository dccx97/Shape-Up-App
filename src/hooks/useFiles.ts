import { useState, useEffect } from 'react';
import * as idb from 'idb-keyval';
import type { DocumentFile } from '../types';

const STORE_KEY = 'app_document_files';

export function useFiles(activeProfileId: string | null) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load files from IndexedDB when profile changes
  useEffect(() => {
    async function loadFiles() {
      try {
        setIsLoading(true);
        const allFiles: DocumentFile[] = (await idb.get(STORE_KEY)) || [];
        const profileFiles = allFiles.filter(f => f.profileId === activeProfileId);
        
        // Sort by newest first
        profileFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        
        setFiles(profileFiles);
      } catch (err) {
        console.error("Failed to load files from IndexedDB:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (activeProfileId) {
      loadFiles();
    } else {
      setFiles([]);
      setIsLoading(false);
    }
  }, [activeProfileId]);

  const addFile = async (newFile: Omit<DocumentFile, 'id' | 'profileId' | 'uploadedAt'>) => {
    if (!activeProfileId) return;

    const file: DocumentFile = {
      ...newFile,
      id: crypto.randomUUID(),
      profileId: activeProfileId,
      uploadedAt: new Date().toISOString()
    };

    try {
      const allFiles: DocumentFile[] = (await idb.get(STORE_KEY)) || [];
      const updatedFiles = [...allFiles, file];
      await idb.set(STORE_KEY, updatedFiles);
      
      // Update local state
      setFiles(prev => [file, ...prev]);
    } catch (err) {
      console.error("Failed to save file:", err);
      alert("Failed to save the file. Please try again.");
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const allFiles: DocumentFile[] = (await idb.get(STORE_KEY)) || [];
      const updatedFiles = allFiles.filter(f => f.id !== fileId);
      await idb.set(STORE_KEY, updatedFiles);
      
      // Update local state
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  return {
    files,
    isLoading,
    addFile,
    deleteFile
  };
}
