import { NextRequest, NextResponse } from 'next/server';
import { Webhooks } from '@polar-sh/nextjs';

const handler = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const event = payload.type;

    switch (event) {
      case 'subscription.created':
      case 'subscription.active': {
        // A subscription was created or activated
        console.log('Subscription event:', event, payload.data);
        break;
      }

      case 'subscription.canceled': {
        // Subscription was canceled
        console.log('Subscription canceled:', payload.data);
        break;
      }

      case 'order.paid': {
        // One-time credit purchase or subscription payment
        console.log('Order paid:', payload.data);
        break;
      }

      case 'customer.created': {
        // New customer created in Polar
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
