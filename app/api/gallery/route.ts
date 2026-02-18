import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: items, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch gallery:', error);
      return NextResponse.json(
        { error: 'Failed to fetch gallery' },
        { status: 500 },
      );
    }

    const uploads = (items || [])
      .filter((i) => i.type === 'upload')
      .map((i) => ({
        id: i.id,
        url: i.url,
        thumbnailUrl: i.thumbnail_url,
        base64: '',
        mimeType: i.mime_type,
        timestamp: new Date(i.created_at).getTime(),
        type: 'upload' as const,
      }));

    const generations = (items || [])
      .filter((i) => i.type === 'generation')
      .map((i) => ({
        id: i.id,
        url: i.url,
        thumbnailUrl: i.thumbnail_url,
        base64: '',
        mimeType: i.mime_type,
        timestamp: new Date(i.created_at).getTime(),
        type: 'generation' as const,
      }));

    return NextResponse.json({ uploads, generations });
  } catch (error) {
    console.error('Gallery error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Gallery fetch failed',
      },
      { status: 500 },
    );
  }
}
