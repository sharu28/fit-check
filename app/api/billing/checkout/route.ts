import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Polar } from '@polar-sh/sdk';

const PLAN_PRODUCT_MAP: Record<string, string | undefined> = {
  starter: process.env.POLAR_STARTER_PRODUCT_ID,
  pro: process.env.POLAR_PRO_PRODUCT_ID,
  studio: process.env.POLAR_STUDIO_PRODUCT_ID,
};

function getPolar(): Polar {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error('POLAR_ACCESS_TOKEN is not configured');
  return new Polar({ accessToken: token });
}

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

    const polar = getPolar();
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/app?checkout=success`;

    const checkout = await polar.checkouts.create({
      productId,
      customerEmail: user.email,
      successUrl,
    });

    return NextResponse.json({ checkoutUrl: (checkout as Record<string, unknown>).url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
