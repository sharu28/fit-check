import { NextRequest } from 'next/server';
import { Webhooks } from '@polar-sh/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_CREDITS } from '@/lib/constants';

const PRODUCT_PLAN_MAP: Record<string, string> = {
  ...(process.env.POLAR_CREATOR_PRODUCT_ID ? { [process.env.POLAR_CREATOR_PRODUCT_ID]: 'creator' } : {}),
  ...(process.env.POLAR_PRO_PRODUCT_ID ? { [process.env.POLAR_PRO_PRODUCT_ID]: 'pro' } : {}),
  ...(process.env.POLAR_STUDIO_PRODUCT_ID ? { [process.env.POLAR_STUDIO_PRODUCT_ID]: 'studio' } : {}),
};

const handler = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const event = payload.type;
    const supabase = createAdminClient();

    switch (event) {
      case 'subscription.created':
      case 'subscription.active': {
        const data = payload.data as { customer_id?: string; product_id?: string };
        const customerId = data.customer_id;
        const productId = data.product_id;
        if (!customerId || !productId) break;

        const plan = PRODUCT_PLAN_MAP[productId] || 'creator';
        const credits = PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS] ?? PLAN_CREDITS.creator;

        await supabase
          .from('user_profiles')
          .update({
            plan,
            credits_remaining: credits,
            updated_at: new Date().toISOString(),
          })
          .eq('polar_customer_id', customerId);

        console.log(`Subscription ${event}: ${customerId} → ${plan} (${credits} credits)`);
        break;
      }

      case 'subscription.canceled': {
        const data = payload.data as { customer_id?: string };
        const customerId = data.customer_id;
        if (!customerId) break;

        await supabase
          .from('user_profiles')
          .update({
            plan: 'free',
            credits_remaining: PLAN_CREDITS.free,
            updated_at: new Date().toISOString(),
          })
          .eq('polar_customer_id', customerId);

        console.log(`Subscription canceled: ${customerId} → free`);
        break;
      }

      case 'order.paid': {
        const data = payload.data as { customer_id?: string; metadata?: { credits?: number } };
        const customerId = data.customer_id;
        const creditAmount = data.metadata?.credits;
        if (!customerId || !creditAmount) break;

        await supabase.rpc('add_credits', {
          p_customer_id: customerId,
          p_amount: creditAmount,
        });

        console.log(`Order paid: ${customerId} +${creditAmount} credits`);
        break;
      }

      case 'customer.created': {
        console.log('Customer created:', payload.data);
        break;
      }

      default:
        console.log('Unhandled webhook event:', event);
    }
  },
});

export async function POST(request: NextRequest) {
  return handler(request);
}
