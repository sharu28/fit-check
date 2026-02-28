import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();

    const body = await request.json();
    const itemId = body?.itemId;
    const folderId = body?.folderId ?? null;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    if (folderId) {
      const { data: folder, error: folderError } = await supabase
        .from('gallery_folders')
        .select('id')
        .eq('id', folderId)
        .eq('user_id', userId)
        .maybeSingle();

      if (folderError) {
        console.error('Failed to validate folder for move:', folderError);
        return NextResponse.json({ error: 'Failed to move item' }, { status: 500 });
      }

      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }
    }

    const { data: movedItem, error: moveError } = await supabase
      .from('gallery_items')
      .update({
        folder_id: folderId,
      })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select('id, folder_id')
      .maybeSingle();

    if (moveError) {
      console.error('Failed to move gallery item:', moveError);
      return NextResponse.json({ error: 'Failed to move item' }, { status: 500 });
    }

    if (!movedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: {
        id: movedItem.id,
        folderId: movedItem.folder_id,
      },
    });
  } catch (error) {
    console.error('Gallery move error:', error);
    return NextResponse.json({ error: 'Failed to move item' }, { status: 500 });
  }
}
