import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserCredits } from '@/lib/credits';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credits, plan } = await getUserCredits(supabase, user.id);
    return NextResponse.json({ credits, plan });
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 },
    );
  }
}
