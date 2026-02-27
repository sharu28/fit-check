import type { ReactNode } from 'react';
import { WorkspaceStateProvider } from '@/components/WorkspaceStateProvider';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <WorkspaceStateProvider>{children}</WorkspaceStateProvider>;
}
