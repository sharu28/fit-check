import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCustomerSession } from '@/lib/polar';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('polar_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.polar_customer_id) {
      return NextResponse.json(
        { error: 'No billing account linked' },
        { status: 404 },
      );
    }

    const portalUrl = await createCustomerSession(profile.polar_customer_id);
    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 },
    );
  }
}
