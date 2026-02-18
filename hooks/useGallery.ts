'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GalleryItem, UploadedImage } from '@/types';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';

interface UseGalleryOptions {
  userId: string | null;
}

export function useGallery({ userId }: UseGalleryOptions) {
  const [uploads, setUploads] = useState<GalleryItem[]>([]);
  const [generations, setGenerations] = useState<GalleryItem[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Load gallery from API
  useEffect(() => {
    if (!userId) return;

    const loadGallery = async () => {
      try {
        const res = await fetch('/api/gallery');
        if (!res.ok) return;
        const data = await res.json();
        setUploads(data.uploads ?? []);
        setGenerations(data.generations ?? []);
      } catch (e) {
        console.error('Failed to load gallery:', e);
      }
    };

    loadGallery();
  }, [userId]);

  const saveUpload = useCallback(
    async (image: UploadedImage, saveId: string) => {
      setSavingId(saveId);
      try {
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: image.base64,
            mimeType: image.mimeType,
            type: 'upload',
          }),
        });

        if (!res.ok) throw new Error('Upload failed');
        const item: GalleryItem = await res.json();
        setUploads((prev) => [item, ...prev]);
      } catch (e) {
        console.error('Failed to save upload:', e);
        throw e;
      } finally {
        setSavingId(null);
      }
    },
    [],
  );

  const directUpload = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          mimeType: file.type,
          type: 'upload',
        }),
      });

      if (!res.ok) throw new Error('Upload failed');
      const item: GalleryItem = await res.json();
      setUploads((prev) => [item, ...prev]);
    } catch (e) {
      console.error('Failed to upload to gallery:', e);
      throw e;
    }
  }, []);

  const deleteItem = useCallback(
    async (id: string, type: 'upload' | 'generation') => {
      const setter = type === 'upload' ? setUploads : setGenerations;

      // Optimistic delete with rollback
      let previousItems: GalleryItem[] = [];
      setter((prev) => {
        previousItems = prev;
        return prev.filter((i) => i.id !== id);
      });

      try {
        const res = await fetch('/api/storage/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, type }),
        });

        if (!res.ok) throw new Error('Delete failed');
      } catch (e) {
        console.error('Failed to delete item:', e);
        setter(previousItems); // Rollback
        throw e;
      }
    },
    [],
  );

  const addGeneration = useCallback((item: GalleryItem) => {
    setGenerations((prev) => [item, ...prev]);
  }, []);

  const selectGalleryItem = useCallback(
    async (item: GalleryItem): Promise<UploadedImage> => {
      let base64 = item.base64;

      // Fetch base64 if not loaded (cloud storage optimization)
      if (!base64 && item.url) {
        const res = await fetch(item.url);
        const blob = await res.blob();
        const file = new File([blob], 'temp.png', { type: item.mimeType });
        base64 = await fileToBase64(file);
      }

      return {
        previewUrl: item.url,
        base64,
        mimeType: item.mimeType,
      };
    },
    [],
  );

  return {
    uploads,
    generations,
    showLibrary,
    setShowLibrary,
    savingId,
    saveUpload,
    directUpload,
    deleteItem,
    addGeneration,
    selectGalleryItem,
  };
}
