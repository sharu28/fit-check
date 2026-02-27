'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface WorkspaceStateValue {
  galleryOpen: boolean;
  setGalleryOpen: (next: boolean) => void;
  activeTemplateId: string | null;
  setActiveTemplateId: (next: string | null) => void;
}

const WorkspaceStateContext = createContext<WorkspaceStateValue | null>(null);

export function WorkspaceStateProvider({ children }: { children: ReactNode }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ galleryOpen, setGalleryOpen, activeTemplateId, setActiveTemplateId }),
    [galleryOpen, activeTemplateId],
  );

  return (
    <WorkspaceStateContext.Provider value={value}>
      {children}
    </WorkspaceStateContext.Provider>
  );
}

export function useWorkspaceState() {
  const context = useContext(WorkspaceStateContext);
  if (!context) {
    throw new Error('useWorkspaceState must be used within WorkspaceStateProvider');
  }
  return context;
}
