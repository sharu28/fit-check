import { SupabaseClient } from '@supabase/supabase-js';
import { CREDIT_COSTS } from '@/lib/constants';

type ImageResolution = '2K' | '4K';
type VideoDuration = 5 | 10;
const ADMIN_CREDIT_BALANCE = 999_999_999;
const DEFAULT_UNLIMITED_CREDITS_ADMINS = ['sharukesh.seker@gmail.com'];

function getUnlimitedCreditsAdminEmails(): string[] {
  const csv = process.env.UNLIMITED_CREDITS_ADMIN_EMAILS || '';
  const configured = csv
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_UNLIMITED_CREDITS_ADMINS, ...configured]));
}

export function isUnlimitedCreditsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return getUnlimitedCreditsAdminEmails().includes(email.toLowerCase());
}

export function getImageCreditCost(resolution: ImageResolution, count: number = 1): number {
  const key = `image_${resolution.toLowerCase()}` as keyof typeof CREDIT_COSTS;
  return (CREDIT_COSTS[key] ?? CREDIT_COSTS.image_2k) * count;
}

export function getVideoCreditCost(duration: VideoDuration): number {
  const key = `video_${duration}s` as keyof typeof CREDIT_COSTS;
  return CREDIT_COSTS[key] ?? CREDIT_COSTS.video_5s;
}

export async function getUserCredits(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string | null,
): Promise<{ credits: number; plan: string; isUnlimited: boolean }> {
  if (isUnlimitedCreditsAdmin(userEmail)) {
    return {
      credits: ADMIN_CREDIT_BALANCE,
      plan: 'admin',
      isUnlimited: true,
    };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('credits_remaining, plan')
    .eq('id', userId)
    .single();

  return {
    credits: profile?.credits_remaining ?? 0,
    plan: profile?.plan ?? 'free',
    isUnlimited: false,
  };
}

export async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  userEmail?: string | null,
): Promise<{ success: boolean; remaining: number }> {
  if (isUnlimitedCreditsAdmin(userEmail)) {
    return { success: true, remaining: ADMIN_CREDIT_BALANCE };
  }

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) throw error;
  return data as { success: boolean; remaining: number };
}
