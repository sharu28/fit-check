import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listR2Objects } from '@/lib/r2';

export async function GET() {
  const result: Record<string, unknown> = {};

  // 1. Check env vars
  result.env = {
    R2_ENDPOINT: !!process.env.R2_ENDPOINT,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
    R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN || 'MISSING',
  };

  // 2. Auth
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    result.auth = { userId: user?.id ?? null, email: user?.email ?? null, error: authError?.message ?? null };

    if (!user) return NextResponse.json(result);

    // 3. gallery_items count
    const { count, error: countError } = await supabase
      .from('gallery_items')
      .select('*', { count: 'exact', head: true });
    result.gallery_items_count = count;
    result.gallery_items_error = countError?.message ?? null;

    // 4. R2 list
    try {
      const objects = await listR2Objects(`${user.id}/`);
      result.r2_objects_found = objects.length;
      result.r2_sample = objects.slice(0, 3).map(o => o.key);
    } catch (e) {
      result.r2_error = e instanceof Error ? e.message : String(e);
    }

    // 5. Try upsert of a dummy row to test RLS
    const testId = '00000000-0000-0000-0000-000000000001';
    const { error: upsertError } = await supabase
      .from('gallery_items')
      .upsert({
        id: testId,
        user_id: user.id,
        url: 'https://test.example.com/test.png',
        mime_type: 'image/png',
        type: 'generation',
        folder_id: null,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true });
    result.upsert_test_error = upsertError?.message ?? null;
    result.upsert_test_code = upsertError?.code ?? null;

    // Clean up test row
    if (!upsertError) {
      await supabase.from('gallery_items').delete().eq('id', testId);
    }

  } catch (e) {
    result.fatal_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(result, { status: 200 });
}
