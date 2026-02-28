'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
    router.refresh();
  };

  return {
    user: user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          phone: user.primaryPhoneNumber?.phoneNumber ?? null,
        }
      : null,
    loading: !isLoaded,
    signOut: handleSignOut,
  };
}
