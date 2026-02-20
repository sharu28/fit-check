import { SupabaseClient } from '@supabase/supabase-js';
import { CREDIT_COSTS } from '@/lib/constants';

type ImageResolution = '2K' | '4K';
type VideoDuration = 5 | 10;

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
): Promise<{ credits: number; plan: string }> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('credits_remaining, plan')
    .eq('id', userId)
    .single();

  return {
    credits: profile?.credits_remaining ?? 0,
    plan: profile?.plan ?? 'free',
  };
}

export async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<{ success: boolean; remaining: number }> {
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) throw error;
  return data as { success: boolean; remaining: number };
}
