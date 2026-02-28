import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { listR2Objects } from '@/lib/r2';

type GalleryType = 'upload' | 'generation' | 'video';

type GalleryRow = {
  id: string;
  user_id: string;
  url: string;
  thumbnail_url: string | null;
  mime_type: string;
  type: GalleryType;
  folder_id: string | null;
  created_at: string;
};

type FolderRow = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
};

type PostgrestLikeError = {
  code?: string;
  message?: string;
};

const FOLDER_TO_TYPE: Record<string, GalleryType> = {
  uploads: 'upload',
  generations: 'generation',
  videos: 'video',
};

function inferMimeType(ext: string, type: GalleryType): string {
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

function isMissingTableError(error: PostgrestLikeError | null, table: string): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;

  const message = (error.message || '').toLowerCase();
  return message.includes(table.toLowerCase()) && message.includes('schema cache');
}

function mapGalleryRowsToPayload(items: GalleryRow[], type: GalleryType) {
  return items
    .filter((item) => item.type === type)
    .map((item) => ({
      id: item.id,
      url: item.url,
      thumbnailUrl: item.thumbnail_url,
      base64: '',
      mimeType: item.mime_type,
      timestamp: new Date(item.created_at).getTime(),
      type,
      folderId: item.folder_id ?? null,
    }));
}

async function listGalleryRowsFromR2(userId: string): Promise<GalleryRow[]> {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain) return [];

  const objects = await listR2Objects(`${userId}/`);
  if (objects.length === 0) return [];

  const objectMap = new Map(objects.map((entry) => [entry.key, entry]));
  const rows: GalleryRow[] = [];

  for (const object of objects) {
    const key = object.key;
    if (key.includes('/thumbs/')) continue;

    const match = key.match(
      new RegExp(`^${userId}/(uploads|generations|videos)/([^/.]+)\\.([a-zA-Z0-9]+)$`),
    );
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

    rows.push({
      id,
      user_id: userId,
      url: `${publicDomain}/${key}`,
      thumbnail_url: thumbnailUrl,
      mime_type: inferMimeType(extension, type),
      type,
      folder_id: null,
      created_at: (object.lastModified ?? new Date()).toISOString(),
    });
  }

  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return rows;
}

async function recoverGalleryItemsFromR2(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<GalleryRow[]> {
  const recoveredRows = await listGalleryRowsFromR2(userId);
  if (recoveredRows.length === 0) return [];

  const { error } = await supabase
    .from('gallery_items')
    .upsert(recoveredRows, { onConflict: 'id', ignoreDuplicates: true });

  if (error) {
    console.error('Failed to recover gallery metadata from R2:', error);
    return [];
  }

  return recoveredRows;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();

    let items: GalleryRow[] = [];

    const { data: fetchedItems, error: itemsError } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (itemsError) {
      if (isMissingTableError(itemsError as PostgrestLikeError, 'gallery_items')) {
        console.warn('gallery_items table missing; loading gallery directly from R2');
        items = await listGalleryRowsFromR2(userId);
      } else {
        console.error('Failed to fetch gallery:', itemsError);
        return NextResponse.json(
          { error: 'Failed to fetch gallery' },
          { status: 500 },
        );
      }
    } else {
      items = (fetchedItems ?? []) as GalleryRow[];

      if (items.length === 0) {
        try {
          const recovered = await recoverGalleryItemsFromR2(supabase, userId);
          if (recovered.length > 0) {
            items = recovered;
          }
        } catch (recoveryError) {
          console.error('Gallery recovery failed:', recoveryError);
        }
      }
    }

    let folderRows: FolderRow[] = [];
    const { data: fetchedFolders, error: folderError } = await supabase
      .from('gallery_folders')
      .select('id, name, parent_id, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (folderError) {
      if (!isMissingTableError(folderError as PostgrestLikeError, 'gallery_folders')) {
        console.error('Failed to fetch gallery folders:', folderError);
        return NextResponse.json(
          { error: 'Failed to fetch gallery folders' },
          { status: 500 },
        );
      }
    } else {
      folderRows = (fetchedFolders ?? []) as FolderRow[];
    }

    const uploads = mapGalleryRowsToPayload(items, 'upload');
    const generations = mapGalleryRowsToPayload(items, 'generation');
    const videos = mapGalleryRowsToPayload(items, 'video');

    const folders = folderRows.map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parent_id,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at,
    }));

    return NextResponse.json({ uploads, generations, videos, folders });
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
