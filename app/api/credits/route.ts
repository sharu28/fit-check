import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCustomerCredits } from '@/lib/polar';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Polar customer ID from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('polar_customer_id, plan')
      .eq('id', user.id)
      .single();

    if (!profile?.polar_customer_id) {
      // No Polar customer linked yet — return free tier defaults
      return NextResponse.json({ credits: 0, plan: 'free' });
    }

    const credits = await getCustomerCredits(profile.polar_customer_id);

    return NextResponse.json({
      credits,
      plan: profile.plan || 'free',
    });
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 },
    );
  }
}
