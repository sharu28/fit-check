import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { removeBackground } from '@/lib/pixian';
import { uploadToR2 } from '@/lib/r2';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, base64, mimeType, saveToGallery = true } = await request.json();

    if (!imageUrl && !base64) {
      return NextResponse.json(
        { error: 'Missing imageUrl or base64' },
        { status: 400 },
      );
    }

    // Get image buffer from URL or base64
    let imageBuffer: Buffer;
    if (base64) {
      const raw = base64.startsWith('data:')
        ? base64.split(',')[1]
        : base64;
      imageBuffer = Buffer.from(raw, 'base64');
    } else {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch source image' },
          { status: 502 },
        );
      }
      imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    }

    // Call Pixian API to remove background
    const resultBuffer = await removeBackground(imageBuffer);

    // If not saving to gallery, return base64 directly (for garment inline replacement)
    if (!saveToGallery) {
      const resultBase64 = resultBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${resultBase64}`;
      return NextResponse.json({
        base64: resultBase64,
        previewUrl: dataUrl,
        mimeType: 'image/png',
      });
    }

    // Upload result to R2
    const id = crypto.randomUUID();
    const originalKey = `${user.id}/generations/${id}.png`;
    const originalUrl = await uploadToR2(originalKey, resultBuffer, 'image/png');

    // Generate thumbnail
    let thumbnailUrl: string | undefined;
    try {
      const thumbnailBuffer = await sharp(resultBuffer)
        .resize(300, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbKey = `${user.id}/generations/thumbs/${id}.webp`;
      thumbnailUrl = await uploadToR2(thumbKey, thumbnailBuffer, 'image/webp');
    } catch (e) {
      console.error('BG removal thumbnail failed:', e);
    }

    // Save as new gallery item
    const { data } = await supabase
      .from('gallery_items')
      .insert({
        id,
        user_id: user.id,
        url: originalUrl,
        thumbnail_url: thumbnailUrl,
        mime_type: 'image/png',
        type: 'generation',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return NextResponse.json({
      id: data?.id || id,
      url: originalUrl,
      thumbnailUrl,
      mimeType: 'image/png',
      timestamp: Date.now(),
      type: 'generation',
    });
  } catch (error) {
    console.error('Background removal error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Background removal failed',
      },
      { status: 500 },
    );
  }
}
