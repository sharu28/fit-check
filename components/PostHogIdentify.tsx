'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import type { User } from '@supabase/supabase-js';

export function PostHogIdentify({ user }: { user: User | null }) {
  useEffect(() => {
    if (user) {
      posthog.identify(user.id, { email: user.email });
    } else {
      posthog.reset();
    }
  }, [user]);

  return null;
}
