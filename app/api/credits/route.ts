import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { getUserCredits } from '@/lib/credits';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
    const supabase = await createClient();

    const { credits, plan, isUnlimited } = await getUserCredits(
      supabase,
      userId,
      userEmail,
    );
    return NextResponse.json({ credits, plan, isUnlimited });
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 },
    );
  }
}
