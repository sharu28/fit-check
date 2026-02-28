'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  AuthenticateWithRedirectCallback,
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
} from '@clerk/nextjs';

function CallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Sign-in callback timed out</h1>
        <p className="mt-2 text-sm text-gray-600">
          We could not complete Google sign-in on this screen.
        </p>
        <Link
          href="/auth"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

function CallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
        <h1 className="mt-4 text-lg font-semibold text-gray-900">Completing sign-in</h1>
        <p className="mt-2 text-sm text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      router.replace('/auth?error=oauth_callback_timeout');
    }, 10000);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <>
      <ClerkLoading>
        <CallbackLoading />
      </ClerkLoading>
      <ClerkFailed>
        <CallbackFallback />
      </ClerkFailed>
      <ClerkLoaded>
        <AuthenticateWithRedirectCallback
          signInUrl="/auth"
          signUpUrl="/auth"
          signInFallbackRedirectUrl="/app"
          signUpFallbackRedirectUrl="/app"
        />
      </ClerkLoaded>
    </>
  );
}
