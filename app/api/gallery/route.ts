import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listR2Objects } from '@/lib/r2';

const FOLDER_TO_TYPE: Record<string, 'upload' | 'generation' | 'video'> = {
  uploads: 'upload',
  generations: 'generation',
  videos: 'video',
};

function inferMimeType(ext: string, type: 'upload' | 'generation' | 'video'): string {
  const normalized = ext.toLowerCase();
  if (type === 'video') {
    if (normalized === 'mov') return 'video/quicktime';
    if (normalized === 'webm') return 'video/webm';
    return 'video/mp4';
  }
  if (normalized === 'png') return 'image/png';
  if (normalized === 'webp') return 'image/webp';
  return 'image/jpeg';
}

async function recoverGalleryItemsFromR2(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain) return 0;

  const objects = await listR2Objects(`${userId}/`);
  if (objects.length === 0) return 0;

  const objectMap = new Map(objects.map((entry) => [entry.key, entry]));
  const recoveredRows: Array<{
    id: string;
    user_id: string;
    url: string;
    thumbnail_url: string | null;
    mime_type: string;
    type: 'upload' | 'generation' | 'video';
    created_at: string;
  }> = [];

  for (const object of objects) {
    const key = object.key;
    if (key.includes('/thumbs/')) continue;

    const match = key.match(new RegExp(`^${userId}/(uploads|generations|videos)/([^/.]+)\\.([a-zA-Z0-9]+)$`));
    if (!match) continue;

    const folder = match[1];
    const id = match[2];
    const extension = match[3];
    const type = FOLDER_TO_TYPE[folder];
    if (!type) continue;

    const thumbKey = `${userId}/${folder}/thumbs/${id}.webp`;
    const thumbnailUrl = objectMap.has(thumbKey)
      ? `${publicDomain}/${thumbKey}`
      : null;

    recoveredRows.push({
      id,
      user_id: userId,
      url: `${publicDomain}/${key}`,
      thumbnail_url: thumbnailUrl,
      mime_type: inferMimeType(extension, type),
      type,
      created_at: (object.lastModified ?? new Date()).toISOString(),
    });
  }

  if (recoveredRows.length === 0) return 0;

  const { error } = await supabase
    .from('gallery_items')
    .upsert(recoveredRows, { onConflict: 'id', ignoreDuplicates: true });

  if (error) {
    console.error('Failed to recover gallery metadata from R2:', error);
    return 0;
  }

  return recoveredRows.length;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: fetchedItems, error } = await supabase
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

    let items = fetchedItems || [];
    if (items.length === 0) {
      try {
        const recovered = await recoverGalleryItemsFromR2(supabase, user.id);
        if (recovered > 0) {
          const { data: refreshedItems, error: refreshError } = await supabase
            .from('gallery_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (!refreshError && refreshedItems) {
            items = refreshedItems;
          }
        }
      } catch (recoveryError) {
        console.error('Gallery recovery failed:', recoveryError);
      }
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

    const videos = (items || [])
      .filter((i) => i.type === 'video')
      .map((i) => ({
        id: i.id,
        url: i.url,
        thumbnailUrl: i.thumbnail_url,
        base64: '',
        mimeType: i.mime_type,
        timestamp: new Date(i.created_at).getTime(),
        type: 'video' as const,
      }));

    return NextResponse.json({ uploads, generations, videos });
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
