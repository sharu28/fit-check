'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GalleryItem, GalleryFolder, UploadedImage } from '@/types';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';

interface UseGalleryOptions {
  userId: string | null;
}

export function useGallery({ userId }: UseGalleryOptions) {
  const [uploads, setUploads] = useState<GalleryItem[]>([]);
  const [generations, setGenerations] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<GalleryItem[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
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
        setVideos(data.videos ?? []);
        setFolders(data.folders ?? []);
      } catch (e) {
        console.error('Failed to load gallery:', e);
      }
    };

    loadGallery();
  }, [userId]);

  const saveUpload = useCallback(
    async (image: UploadedImage, saveId: string, folderId: string | null = null) => {
      setSavingId(saveId);
      try {
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: image.base64,
            mimeType: image.mimeType,
            type: 'upload',
            folderId,
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

  const directUpload = useCallback(async (file: File, folderId: string | null = null) => {
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64,
          mimeType: file.type,
          type: 'upload',
          folderId,
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

  const addVideo = useCallback((item: GalleryItem) => {
    setVideos((prev) => [item, ...prev]);
  }, []);

  const deleteVideo = useCallback(
    async (id: string) => {
      let previousItems: GalleryItem[] = [];
      setVideos((prev) => {
        previousItems = prev;
        return prev.filter((i) => i.id !== id);
      });

      try {
        const res = await fetch('/api/storage/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, type: 'video' }),
        });
        if (!res.ok) throw new Error('Delete failed');
      } catch (e) {
        console.error('Failed to delete video:', e);
        setVideos(previousItems);
        throw e;
      }
    },
    [],
  );

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

  const createFolder = useCallback(
    async (name: string, parentId: string | null = null) => {
      const res = await fetch('/api/gallery/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to create folder');
      }

      const folder = body.folder as GalleryFolder;
      setFolders((prev) => [...prev, folder]);
      return folder;
    },
    [],
  );

  const renameFolder = useCallback(async (id: string, name: string) => {
    const res = await fetch('/api/gallery/folders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Failed to rename folder');
    }

    const folder = body.folder as GalleryFolder;
    setFolders((prev) =>
      prev.map((current) =>
        current.id === id ? folder : current,
      ),
    );
    return folder;
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    const res = await fetch('/api/gallery/folders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Failed to delete folder');
    }

    const deletedIds: string[] = Array.isArray(body.deletedIds)
      ? body.deletedIds
      : [id];
    const deletedSet = new Set(deletedIds);

    setFolders((prev) => prev.filter((folder) => !deletedSet.has(folder.id)));
    setUploads((prev) =>
      prev.map((item) =>
        item.folderId && deletedSet.has(item.folderId)
          ? { ...item, folderId: null }
          : item,
      ),
    );
    setGenerations((prev) =>
      prev.map((item) =>
        item.folderId && deletedSet.has(item.folderId)
          ? { ...item, folderId: null }
          : item,
      ),
    );
    setVideos((prev) =>
      prev.map((item) =>
        item.folderId && deletedSet.has(item.folderId)
          ? { ...item, folderId: null }
          : item,
      ),
    );

    return deletedIds;
  }, []);

  const moveItem = useCallback(
    async (
      itemId: string,
      type: 'upload' | 'generation' | 'video',
      folderId: string | null,
    ) => {
      const res = await fetch('/api/gallery/items/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, folderId }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Failed to move item');
      }

      const applyFolder = (item: GalleryItem) =>
        item.id === itemId ? { ...item, folderId } : item;

      if (type === 'upload') {
        setUploads((prev) => prev.map(applyFolder));
      } else if (type === 'generation') {
        setGenerations((prev) => prev.map(applyFolder));
      } else {
        setVideos((prev) => prev.map(applyFolder));
      }
    },
    [],
  );

  return {
    uploads,
    generations,
    videos,
    folders,
    showLibrary,
    setShowLibrary,
    savingId,
    saveUpload,
    directUpload,
    deleteItem,
    addGeneration,
    addVideo,
    deleteVideo,
    selectGalleryItem,
    createFolder,
    renameFolder,
    deleteFolder,
    moveItem,
  };
}
