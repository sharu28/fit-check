'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

/**
 * Returns a Supabase client configured with the current Clerk JWT.
 * Use this hook in client components that need to query Supabase directly.
 * Most data access should go through API routes instead.
 */
export function useSupabaseClient() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            fetch: async (url, options = {}) => {
              const clerkToken = await getToken({ template: 'supabase' });
              const headers = new Headers(options?.headers);
              if (clerkToken) {
                headers.set('Authorization', `Bearer ${clerkToken}`);
              }
              return fetch(url, { ...options, headers });
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        },
      ),
    [getToken],
  );
}
