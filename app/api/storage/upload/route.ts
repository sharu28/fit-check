import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToR2 } from '@/lib/r2';
import { applyWatermark } from '@/lib/watermark';
import { getUserCredits } from '@/lib/credits';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { base64, url, mimeType, type } = body;

    let fileBuffer: Buffer;

    if (base64) {
      fileBuffer = Buffer.from(base64, 'base64');
    } else if (url) {
      // Fetch from URL (for saving generation results)
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

    // Watermark free-tier generation images
    if (type === 'generation' && !isVideo) {
      try {
        const { plan, isUnlimited } = await getUserCredits(
          supabase,
          user.id,
          user.email,
        );
        if (plan === 'free' && !isUnlimited) {
          fileBuffer = Buffer.from(await applyWatermark(fileBuffer));
        }
      } catch (e) {
        console.error('Watermark check failed, skipping:', e);
      }
    }

    // Upload original
    const originalKey = `${user.id}/${type}s/${id}.${ext}`;
    const originalUrl = await uploadToR2(
      originalKey,
      fileBuffer,
      mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
    );

    // Generate and upload thumbnail (images only)
    let thumbnailUrl: string | undefined;
    if (!isVideo) {
      try {
        const thumbnailBuffer = await sharp(fileBuffer)
          .resize(300, 400, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer();

        const thumbKey = `${user.id}/${type}s/thumbs/${id}.webp`;
        thumbnailUrl = await uploadToR2(thumbKey, thumbnailBuffer, 'image/webp');
      } catch (e) {
        console.error('Thumbnail generation failed:', e);
      }
    }

    // Save metadata to Supabase
    const { data, error } = await supabase
      .from('gallery_items')
      .insert({
        id,
        user_id: user.id,
        url: originalUrl,
        thumbnail_url: thumbnailUrl,
        mime_type: mimeType || 'image/jpeg',
        type,
        created_at: new Date(timestamp).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save gallery item:', error);
      // Return the item even if DB save fails (the files are in R2)
    }

    return NextResponse.json({
      id: data?.id || id,
      url: originalUrl,
      thumbnailUrl,
      base64: '',
      mimeType: mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
      timestamp,
      type,
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
