'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timedOut, setTimedOut] = useState(false);

  const hasOAuthParams = useMemo(() => {
    return (
      searchParams.has('code') ||
      searchParams.has('state') ||
      searchParams.has('__clerk_status') ||
      searchParams.has('__clerk_db_jwt')
    );
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setTimedOut(true);
    }, 10000);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!timedOut) return;
    const redirect = window.setTimeout(() => {
      router.replace('/auth?error=oauth_callback_timeout');
    }, 1500);

    return () => window.clearTimeout(redirect);
  }, [router, timedOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
        {!timedOut ? (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
            <h1 className="mt-4 text-lg font-semibold text-gray-900">Completing sign-in</h1>
            <p className="mt-2 text-sm text-gray-600">Please wait...</p>
            {!hasOAuthParams && (
              <p className="mt-3 text-xs text-amber-700">
                Waiting for OAuth callback parameters.
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-gray-900">Sign-in is taking too long</h1>
            <p className="mt-2 text-sm text-gray-600">
              We could not complete OAuth callback on this attempt.
            </p>
            <Link
              href="/auth"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to sign in
            </Link>
          </>
        )}

        <div className="sr-only" aria-hidden="true">
          <AuthenticateWithRedirectCallback
            signInUrl="/auth"
            signUpUrl="/auth"
            signInFallbackRedirectUrl="/app"
            signUpFallbackRedirectUrl="/app"
          />
        </div>
      </div>
    </div>
  );
}
