import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { uploadToR2 } from '@/lib/r2';
import { removeBackground } from '@/lib/pixian';
import { createVideoGeneration, uploadImageToKie } from '@/lib/kie';
import { BG_REMOVER_VIDEO_PROMPT } from '@/lib/template-preview-prompts';

function isAdminEmail(email: string): boolean {
  const csv = process.env.MODEL_PRESET_ADMIN_EMAILS ?? '';
  return csv
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

type SaveBody = {
  templateId: string;
  resultUrl: string;
  type: 'image' | 'video';
  /** Set to true when this is the bg-source image for bg-remover multi-step flow */
  isBgSource?: boolean;
};

/**
 * POST /api/admin/template-previews/save
 * Downloads the generated result from kie.ai and uploads to R2 as a template preview.
 * For bg-remover: also runs Pixian bg removal + sharp composite + starts kling video.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { templateId, resultUrl, type, isBgSource } = (await request.json()) as SaveBody;

  if (!templateId || !resultUrl || !type) {
    return NextResponse.json({ error: 'templateId, resultUrl, and type are required' }, { status: 400 });
  }

  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain) {
    return NextResponse.json({ error: 'R2_PUBLIC_DOMAIN not configured' }, { status: 500 });
  }

  try {
    // Download the generated result
    const res = await fetch(resultUrl);
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch result: ${res.status}` }, { status: 502 });
    }
    const buffer = Buffer.from(await res.arrayBuffer());

    // --- bg-remover multi-step flow ---
    if (templateId === 'remove-background-batch' && isBgSource) {
      // Step 2a: Remove background via Pixian
      const removedBuffer = await removeBackground(buffer);

      // Step 2b: Create side-by-side before/after composite with sharp
      const W = 600;
      const H = 800;

      const leftPanel = await sharp(buffer)
        .resize(W, H, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Checkerboard background (20px squares, grey/white) to illustrate transparency
      const checkerSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="checker" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#e5e5e5"/>
            <rect x="20" width="20" height="20" fill="#f5f5f5"/>
            <rect y="20" width="20" height="20" fill="#f5f5f5"/>
            <rect x="20" y="20" width="20" height="20" fill="#e5e5e5"/>
          </pattern>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#checker)"/>
      </svg>`;

      const checkerBuffer = Buffer.from(checkerSvg);

      // Right panel: checkerboard bg + removed PNG composited on top
      const resizedRemoved = await sharp(removedBuffer)
        .resize(W, H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      const rightPanel = await sharp({ create: { width: W, height: H, channels: 3, background: { r: 245, g: 245, b: 245 } } })
        .composite([
          { input: checkerBuffer, top: 0, left: 0 },
          { input: resizedRemoved, top: 0, left: 0 },
        ])
        .jpeg({ quality: 90 })
        .toBuffer();

      const compositeBuffer = await sharp({
        create: { width: W * 2, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .composite([
          { input: leftPanel, top: 0, left: 0 },
          { input: rightPanel, top: 0, left: W },
        ])
        .jpeg({ quality: 92 })
        .toBuffer();

      // Upload static before/after image
      const imageKey = `template-previews/${templateId}.jpg`;
      const imageUrl = await uploadToR2(imageKey, compositeBuffer, 'image/jpeg');

      // Step 2c: Start kling video using composite as image input
      let videoTaskId: string | undefined;
      try {
        const kieUrl = await uploadImageToKie(compositeBuffer.toString('base64'), 'image/jpeg');
        videoTaskId = await createVideoGeneration({
          prompt: BG_REMOVER_VIDEO_PROMPT,
          imageInput: kieUrl,
          aspectRatio: '3:2',
          duration: 5,
          sound: false,
          modelOverride: 'kling-3.0/image-to-video',
        });
      } catch (videoErr) {
        console.error('[template-previews] bg-remover video task failed:', videoErr);
      }

      return NextResponse.json({
        previewUrl: imageUrl,
        videoTaskId,
        message: videoTaskId
          ? 'Static preview saved. Poll videoTaskId for video completion, then call save again with type=video.'
          : 'Static preview saved. Video generation failed.',
      });
    }

    // --- Standard image/video save ---
    const ext = type === 'video' ? 'mp4' : 'jpg';
    const contentType = type === 'video' ? 'video/mp4' : 'image/jpeg';
    const key = `template-previews/${templateId}.${ext}`;

    const previewUrl = await uploadToR2(key, buffer, contentType);
    return NextResponse.json({ previewUrl });
  } catch (err) {
    console.error('[template-previews/save] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 },
    );
  }
}
