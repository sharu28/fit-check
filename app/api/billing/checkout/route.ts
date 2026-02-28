import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLAN_PRODUCT_MAP: Record<string, string | undefined> = {
  pro: process.env.POLAR_PRO_PRODUCT_ID,
  premium: process.env.POLAR_PREMIUM_PRODUCT_ID,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();
    const productId = PLAN_PRODUCT_MAP[plan];

    if (!productId) {
      return NextResponse.json(
        { error: 'Billing is not configured yet. Please check back later.' },
        { status: 503 },
      );
    }

    // TODO: Create Polar checkout session with productId
    // const polar = getPolar();
    // const checkout = await polar.checkouts.create({ productId, customerEmail: user.email });
    // return NextResponse.json({ checkoutUrl: checkout.url });

    return NextResponse.json(
      { error: 'Billing is not configured yet. Please check back later.' },
      { status: 503 },
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
