'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
type AuthUser = { id: string; email: string | null; phone?: string | null };

export function PostHogIdentify({ user }: { user: AuthUser | null }) {
  useEffect(() => {
    if (user) {
      posthog.identify(user.id, { email: user.email });
    } else {
      posthog.reset();
    }
  }, [user]);

  return null;
}
