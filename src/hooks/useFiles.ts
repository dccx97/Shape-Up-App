import { useState, useEffect } from 'react';
import type { DocumentFile } from '../types';
import { db, storage } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

export function useFiles(profileId: string | null, userId?: string) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !profileId) {
      setFiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const filesRef = collection(db, `users/${userId}/files`);

    const unsubscribe = onSnapshot(filesRef, (snap) => {
      const data: DocumentFile[] = [];
      snap.forEach(d => data.push(d.data() as DocumentFile));
      
      // Filter by profileId
      const profileFiles = data.filter(f => f.profileId === profileId);
      // Sort by newest first
      profileFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      setFiles(profileFiles);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, profileId]);

  const addFile = async (newFile: Omit<DocumentFile, 'id' | 'profileId' | 'uploadedAt'>) => {
    if (!userId || !profileId) return;

    const fileId = crypto.randomUUID();
    
    // Upload the base64 data to Firebase Storage
    const storageRef = ref(storage, `users/${userId}/files/${fileId}_${newFile.fileName}`);
    await uploadString(storageRef, newFile.data, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);

    const fileDoc: DocumentFile = {
      ...newFile,
      id: fileId,
      profileId,
      uploadedAt: new Date().toISOString(),
      data: downloadUrl // Replace base64 with URL
    };

    await setDoc(doc(db, `users/${userId}/files`, fileId), fileDoc);
  };

  const deleteFile = async (fileId: string) => {
    if (!userId) return;
    
    // Find file to get filename for storage deletion
    const file = files.find(f => f.id === fileId);
    if (file) {
      try {
        const storageRef = ref(storage, `users/${userId}/files/${fileId}_${file.fileName}`);
        await deleteObject(storageRef);
      } catch (e) {
        console.error("Failed to delete file from storage:", e);
      }
    }
    
    await deleteDoc(doc(db, `users/${userId}/files`, fileId));
  };

  return {
    files,
    isLoading,
    addFile,
    deleteFile
  };
}
