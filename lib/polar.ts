import { Polar } from '@polar-sh/sdk';

let polarClient: Polar | null = null;

function getPolar(): Polar {
  if (!polarClient) {
    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token) throw new Error('POLAR_ACCESS_TOKEN is not configured');
    polarClient = new Polar({ accessToken: token });
  }
  return polarClient;
}

/**
 * Get a customer's state including meter balances.
 */
export async function getCustomerCredits(
  customerId: string,
): Promise<number> {
  const polar = getPolar();
  try {
    const state = await polar.customers.getState({ id: customerId });
    // Look through active meters for a credits-related meter
    const meterStates = (state as Record<string, unknown>).activeMeters as
      | Array<{ slug: string; balance: number }>
      | undefined;
    if (meterStates) {
      const creditsMeter = meterStates.find((m) => m.slug === 'credits');
      return creditsMeter?.balance ?? 0;
    }
    return 0;
  } catch (e) {
    console.error('Failed to get customer credits:', e);
    return 0;
  }
}

/**
 * Get customer by email (to link Supabase user to Polar customer).
 */
export async function getCustomerByEmail(
  email: string,
): Promise<{ id: string } | null> {
  const polar = getPolar();
  try {
    const result = await polar.customers.list({ query: email });
    const items = (result as Record<string, unknown>).result as
      | { items?: Array<{ id: string }> }
      | undefined;
    const match = items?.items?.[0];
    return match ? { id: match.id } : null;
  } catch (e) {
    console.error('Failed to get customer by email:', e);
    return null;
  }
}

/**
 * Create a Polar customer for a new user.
 */
export async function createCustomer(
  email: string,
  name?: string,
): Promise<{ id: string }> {
  const polar = getPolar();
  const customer = await polar.customers.create({
    email,
    name: name || email.split('@')[0],
  });
  return { id: (customer as Record<string, unknown>).id as string };
}

/**
 * Create a customer portal session URL for managing subscriptions.
 */
export async function createCustomerSession(
  customerId: string,
): Promise<string> {
  const polar = getPolar();
  const session = await polar.customerSessions.create({
    customerId,
  });
  return (session as Record<string, unknown>).customerPortalUrl as string;
}
