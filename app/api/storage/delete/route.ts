import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFromR2, getKeyFromUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Get item from DB to find the R2 URLs
    const { data: item } = await supabase
      .from('gallery_items')
      .select('url, thumbnail_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (item) {
      // Delete from R2
      const originalKey = getKeyFromUrl(item.url);
      if (originalKey) {
        await deleteFromR2(originalKey).catch((e) =>
          console.error('Failed to delete original from R2:', e),
        );
      }

      if (item.thumbnail_url) {
        const thumbKey = getKeyFromUrl(item.thumbnail_url);
        if (thumbKey) {
          await deleteFromR2(thumbKey).catch((e) =>
            console.error('Failed to delete thumbnail from R2:', e),
          );
        }
      }
    }

    // Delete from DB
    const { error } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete gallery item:', error);
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 },
    );
  }
}
