import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFromR2, uploadToR2 } from '@/lib/r2';
import { applyWatermark } from '@/lib/watermark';
import { getUserCredits } from '@/lib/credits';

type PostgrestLikeError = {
  code?: string;
  message?: string;
};

function isMissingGalleryItemsTable(error: PostgrestLikeError | null): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  const message = (error.message || '').toLowerCase();
  return message.includes('gallery_items') && message.includes('schema cache');
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
    const supabase = await createClient();

    const body = await request.json();
    const { base64, url, mimeType, type, folderId = null } = body;

    if (folderId) {
      const { data: folder, error: folderError } = await supabase
        .from('gallery_folders')
        .select('id')
        .eq('id', folderId)
        .eq('user_id', userId)
        .maybeSingle();

      if (folderError) {
        console.error('Failed to validate folder during upload:', folderError);
        return NextResponse.json(
          { error: 'Failed to validate destination folder' },
          { status: 500 },
        );
      }

      if (!folder) {
        return NextResponse.json(
          { error: 'Destination folder not found' },
          { status: 404 },
        );
      }
    }

    let fileBuffer: Buffer;

    if (base64) {
      fileBuffer = Buffer.from(base64, 'base64');
    } else if (url) {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json(
        { error: 'Missing base64 or url' },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const id = crypto.randomUUID();
    const isVideo = mimeType?.startsWith('video/');
    const ext = isVideo ? 'mp4' : mimeType?.includes('png') ? 'png' : 'jpg';

    if (type === 'generation' && !isVideo) {
      try {
        const { plan, isUnlimited } = await getUserCredits(
          supabase,
          userId,
          userEmail,
        );
        if (plan === 'free' && !isUnlimited) {
          fileBuffer = Buffer.from(await applyWatermark(fileBuffer));
        }
      } catch (watermarkError) {
        console.error('Watermark check failed, skipping:', watermarkError);
      }
    }

    const originalKey = `${userId}/${type}s/${id}.${ext}`;
    const originalUrl = await uploadToR2(
      originalKey,
      fileBuffer,
      mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
    );

    let thumbnailUrl: string | undefined;
    let thumbKey: string | undefined;
    if (!isVideo) {
      try {
        const thumbnailBuffer = await sharp(fileBuffer)
          .resize(300, 400, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer();

        thumbKey = `${userId}/${type}s/thumbs/${id}.webp`;
        thumbnailUrl = await uploadToR2(thumbKey, thumbnailBuffer, 'image/webp');
      } catch (thumbnailError) {
        console.error('Thumbnail generation failed:', thumbnailError);
      }
    }

    const { data, error } = await supabase
      .from('gallery_items')
      .insert({
        id,
        user_id: userId,
        url: originalUrl,
        thumbnail_url: thumbnailUrl,
        mime_type: mimeType || 'image/jpeg',
        type,
        folder_id: folderId,
        created_at: new Date(timestamp).toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (isMissingGalleryItemsTable(error as PostgrestLikeError)) {
        console.warn('gallery_items table missing; returning R2-backed item without DB metadata');
        return NextResponse.json({
          id,
          url: originalUrl,
          thumbnailUrl,
          base64: '',
          mimeType: mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          timestamp,
          type,
          folderId,
        });
      }

      console.error('Failed to save gallery item:', error);

      try {
        await deleteFromR2(originalKey);
      } catch (cleanupError) {
        console.error('Failed to cleanup original after DB failure:', cleanupError);
      }
      if (thumbKey) {
        try {
          await deleteFromR2(thumbKey);
        } catch (cleanupError) {
          console.error('Failed to cleanup thumbnail after DB failure:', cleanupError);
        }
      }

      return NextResponse.json(
        { error: 'Failed to save gallery metadata' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: data?.id || id,
      url: originalUrl,
      thumbnailUrl,
      base64: '',
      mimeType: mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
      timestamp,
      type,
      folderId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 },
    );
  }
}
