import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_CREDITS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    );
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await request.text();
  const wh = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 },
    );
  }

  if (event.type === 'user.created') {
    const { id: clerkUserId } = event.data;
    const supabase = createAdminClient();

    const { error } = await supabase.from('user_profiles').upsert(
      {
        id: clerkUserId,
        plan: 'free',
        credits_remaining: PLAN_CREDITS.free,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    if (error) {
      console.error('Failed to create user_profile for Clerk user:', clerkUserId, error);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 },
      );
    }

    console.log(`Created user_profile for Clerk user: ${clerkUserId}`);
  }

  return NextResponse.json({ received: true });
}
