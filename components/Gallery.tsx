'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GalleryFolder, GalleryItem } from '@/types';
import {
  ArrowRightLeft,
  Check,
  Clapperboard,
  Clock,
  Download,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Play,
  Shirt,
  Trash2,
  Upload,
  User,
} from 'lucide-react';

type GalleryTab = 'uploads' | 'designs' | 'videos';
type GalleryAssetType = 'upload' | 'generation' | 'video';

interface GalleryProps {
  uploads: GalleryItem[];
  generations: GalleryItem[];
  videos?: GalleryItem[];
  folders: GalleryFolder[];
  onSelectUpload: (item: GalleryItem, target: 'person' | 'garment') => void;
  onDelete: (id: string, type: 'upload' | 'generation') => void;
  onDeleteVideo?: (id: string) => void;
  onCreateVideoFromImage?: (item: GalleryItem) => void;
  onUpload?: (file: File, folderId?: string | null) => void;
  onCreateFolder: (
    name: string,
    parentId: string | null,
  ) => Promise<GalleryFolder | void> | GalleryFolder | void;
  onRenameFolder: (
    id: string,
    name: string,
  ) => Promise<GalleryFolder | void> | GalleryFolder | void;
  onDeleteFolder: (id: string) => Promise<string[] | void> | string[] | void;
  onMoveItem: (
    id: string,
    type: GalleryAssetType,
    folderId: string | null,
  ) => Promise<void> | void;
  selectionMode?: 'try-on' | 'single';
}

export function Gallery({
  uploads,
  generations,
  videos = [],
  folders,
  onSelectUpload,
  onDelete,
  onDeleteVideo,
  onCreateVideoFromImage,
  onUpload,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveItem,
  selectionMode = 'try-on',
}: GalleryProps) {
  const [activeTab, setActiveTab] = useState<GalleryTab>('uploads');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: GalleryAssetType } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ id: string; type: GalleryAssetType } | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string>('');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeFolderId && !folders.some((folder) => folder.id === activeFolderId)) {
      setActiveFolderId(null);
    }
  }, [activeFolderId, folders]);

  const folderById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );

  const foldersByParent = useMemo(() => {
    const map = new Map<string | null, GalleryFolder[]>();
    const sorted = [...folders].sort((a, b) => a.name.localeCompare(b.name));
    for (const folder of sorted) {
      const key = folder.parentId ?? null;
      const siblings = map.get(key) ?? [];
      siblings.push(folder);
      map.set(key, siblings);
    }
    return map;
  }, [folders]);

  const folderOptions = useMemo(() => {
    const options: Array<{ id: string; label: string }> = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = foldersByParent.get(parentId) ?? [];
      children.forEach((folder) => {
        options.push({
          id: folder.id,
          label: `${depth > 0 ? `${'  '.repeat(depth)}↳ ` : ''}${folder.name}`,
        });
        walk(folder.id, depth + 1);
      });
    };
    walk(null, 0);
    return options;
  }, [foldersByParent]);

  const activePath = useMemo(() => {
    if (!activeFolderId) return [] as GalleryFolder[];
    const path: GalleryFolder[] = [];
    let cursor = folderById.get(activeFolderId) ?? null;
    let guard = 0;
    while (cursor && guard < 32) {
      path.unshift(cursor);
      cursor = cursor.parentId ? folderById.get(cursor.parentId) ?? null : null;
      guard += 1;
    }
    return path;
  }, [activeFolderId, folderById]);

  const visibleUploads = useMemo(
    () => uploads.filter((item) => (item.folderId ?? null) === activeFolderId),
    [uploads, activeFolderId],
  );
  const visibleGenerations = useMemo(
    () => generations.filter((item) => (item.folderId ?? null) === activeFolderId),
    [generations, activeFolderId],
  );
  const visibleVideos = useMemo(
    () => videos.filter((item) => (item.folderId ?? null) === activeFolderId),
    [videos, activeFolderId],
  );

  const openMoveModal = (id: string, type: GalleryAssetType, currentFolderId?: string | null) => {
    setMoveTarget({ id, type });
    setMoveFolderId(currentFolderId ?? '');
    setActionError(null);
  };

  const handleMoveItem = async () => {
    if (!moveTarget) return;
    setIsMoving(true);
    setActionError(null);
    try {
      await onMoveItem(moveTarget.id, moveTarget.type, moveFolderId || null);
      setMoveTarget(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to move item.');
    } finally {
      setIsMoving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onUpload) {
      Array.from(files).forEach((file) => onUpload(file, activeFolderId));
    }
    if (e.target) e.target.value = '';
  };

  const handleCreateFolder = async (parentId: string | null) => {
    const name = window.prompt(parentId ? 'Subfolder name' : 'Folder name');
    if (!name?.trim()) return;
    try {
      const created = await onCreateFolder(name, parentId);
      if (created && typeof created === 'object' && 'id' in created) {
        setActiveFolderId(created.id);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to create folder');
    }
  };

  const handleRenameFolder = async () => {
    if (!activeFolderId) return;
    const current = folderById.get(activeFolderId);
    const nextName = window.prompt('Rename folder', current?.name ?? '');
    if (!nextName?.trim()) return;
    try {
      await onRenameFolder(activeFolderId, nextName);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to rename folder');
    }
  };

  const handleDeleteFolder = async () => {
    if (!activeFolderId) return;
    const ok = window.confirm(
      'Delete this folder and all subfolders? Items will move back to All Items.',
    );
    if (!ok) return;
    try {
      const deleted = await onDeleteFolder(activeFolderId);
      const deletedIds = Array.isArray(deleted) ? deleted : [activeFolderId];
      if (deletedIds.includes(activeFolderId)) {
        setActiveFolderId(null);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete folder');
    }
  };

  const renderFolderNodes = (parentId: string | null, depth = 0): ReactNode => {
    const children = foldersByParent.get(parentId) ?? [];
    return children.map((folder) => (
      <div key={folder.id}>
        <button
          type="button"
          onClick={() => setActiveFolderId(folder.id)}
          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
            activeFolderId === folder.id
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          {activeFolderId === folder.id ? <FolderOpen size={14} /> : <Folder size={14} />}
          <span className="truncate">{folder.name}</span>
        </button>
        {renderFolderNodes(folder.id, depth + 1)}
      </div>
    ));
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="w-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
        <Clock size={20} />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Your Gallery</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'uploads'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Uploads ({visibleUploads.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('designs')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'designs'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Designs ({visibleGenerations.length})
          </button>
          {videos.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'videos'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Videos ({visibleVideos.length})
            </button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-4">
        <aside className="lg:w-72 lg:shrink-0 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500 font-semibold">
              Folders
            </p>
            <button
              type="button"
              onClick={() => void handleCreateFolder(null)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition inline-flex items-center gap-1"
            >
              <FolderPlus size={12} />
              New
            </button>
          </div>

          <div className="space-y-1 max-h-[260px] lg:max-h-[540px] overflow-y-auto pr-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveFolderId(null)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                activeFolderId === null
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Folder size={14} />
              <span>All Items</span>
            </button>
            {renderFolderNodes(null)}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handleCreateFolder(activeFolderId)}
              disabled={!activeFolderId}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Subfolder
            </button>
            <button
              type="button"
              onClick={() => void handleRenameFolder()}
              disabled={!activeFolderId}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1">
                <Pencil size={12} />
                Rename
              </span>
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteFolder()}
              disabled={!activeFolderId}
              className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50"
            >
              Delete Folder
            </button>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600 mb-4">
            <span className="font-medium text-gray-800">Location:</span>
            <button type="button" onClick={() => setActiveFolderId(null)} className="rounded px-1 py-0.5 hover:bg-gray-100">
              All Items
            </button>
            {activePath.map((folder) => (
              <span key={folder.id} className="inline-flex items-center gap-1">
                <span>/</span>
                <button type="button" onClick={() => setActiveFolderId(folder.id)} className="rounded px-1 py-0.5 hover:bg-gray-100">
                  {folder.name}
                </button>
              </span>
            ))}
          </div>

          {activeTab === 'uploads' && (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={18} className="text-gray-400 group-hover:text-indigo-600" />
                </div>
                <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-700">Upload Here</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </div>

              {visibleUploads.map((item) => (
                <div key={item.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={item.thumbnailUrl || item.url} alt="Upload" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    {selectionMode === 'single' ? (
                      <button type="button" onClick={() => onSelectUpload(item, 'person')} className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors font-semibold">
                        <Check size={14} /> Select
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={() => onSelectUpload(item, 'person')} className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors">
                          <User size={12} /> Person
                        </button>
                        <button type="button" onClick={() => onSelectUpload(item, 'garment')} className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors">
                          <Shirt size={12} /> Garment
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => openMoveModal(item.id, 'upload', item.folderId)} className="absolute top-2 left-2 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors" title="Move to folder">
                      <ArrowRightLeft size={14} />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget({ id: item.id, type: 'upload' })} className="absolute top-2 right-2 p-1.5 text-white/60 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'designs' && (
            visibleGenerations.length === 0 ? (
              <EmptyState message="No designs in this folder yet" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleGenerations.map((item) => (
                  <div key={item.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={item.thumbnailUrl || item.url} alt="Generated Design" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={`/api/download?url=${encodeURIComponent(item.url)}`} className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors" title="Download High Res">
                        <Download size={18} />
                      </a>
                      {onCreateVideoFromImage && (
                        <button
                          type="button"
                          onClick={() => onCreateVideoFromImage(item)}
                          className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors"
                          title="Create Video"
                        >
                          <Clapperboard size={16} />
                        </button>
                      )}
                      <button type="button" onClick={() => openMoveModal(item.id, 'generation', item.folderId)} className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors" title="Move">
                        <ArrowRightLeft size={16} />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget({ id: item.id, type: 'generation' })} className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'videos' && (
            visibleVideos.length === 0 ? (
              <EmptyState message="No videos in this folder yet" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {visibleVideos.map((item) => (
                  <div key={item.id} className="group relative aspect-video rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                    {playingVideoId === item.id ? (
                      <video src={item.url} controls autoPlay loop className="w-full h-full object-contain" />
                    ) : (
                      <div onClick={() => setPlayingVideoId(item.id)} className="w-full h-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                          <Play size={20} className="text-white ml-0.5" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 pb-3 pointer-events-none">
                      <a href={`/api/download?url=${encodeURIComponent(item.url)}`} className="pointer-events-auto p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors shadow-sm" title="Download">
                        <Download size={16} />
                      </a>
                      <button type="button" onClick={() => openMoveModal(item.id, 'video', item.folderId)} className="pointer-events-auto p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors shadow-sm" title="Move">
                        <ArrowRightLeft size={15} />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget({ id: item.id, type: 'video' })} className="pointer-events-auto p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-sm" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </section>
      </div>

      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Move item</h3>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination folder</label>
              <select value={moveFolderId} onChange={(event) => setMoveFolderId(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                <option value="">All Items (root)</option>
                {folderOptions.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.label}</option>
                ))}
              </select>
              {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
            </div>
            <div className="flex border-t border-gray-100">
              <button type="button" onClick={() => setMoveTarget(null)} className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={() => void handleMoveItem()} disabled={isMoving} className="flex-1 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors border-l border-gray-100 disabled:opacity-60">
                {isMoving ? 'Moving...' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Delete {deleteTarget.type === 'upload' ? 'upload' : deleteTarget.type === 'video' ? 'video' : 'design'}?
              </h3>
              <p className="text-sm text-gray-500">
                This will permanently remove this {deleteTarget.type === 'video' ? 'video' : 'image'}.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget.type === 'video') {
                    onDeleteVideo?.(deleteTarget.id);
                  } else {
                    onDelete(deleteTarget.id, deleteTarget.type);
                  }
                  setDeleteTarget(null);
                }}
                className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
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
