import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadImageToKie, createImageGeneration } from '@/lib/kie';

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
    const {
      personImage,
      garments,
      prompt,
      mode,
      scene,
      visualStyle,
      aspectRatio,
      resolution,
      numGenerations,
    } = body;

    const missing: string[] = [];
    if (!personImage?.base64) missing.push('personImage');
    if (!garments?.length) missing.push('garments');
    if (!prompt) missing.push('prompt');
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const requestedGenerations = Number(numGenerations ?? 1);
    if (
      !Number.isInteger(requestedGenerations) ||
      requestedGenerations < 1 ||
      requestedGenerations > 4
    ) {
      return NextResponse.json(
        { error: 'numGenerations must be an integer between 1 and 4' },
        { status: 400 },
      );
    }

    const normalizedResolution = resolution || '2K';

    if (!['2K', '4K'].includes(normalizedResolution)) {
      return NextResponse.json(
        { error: 'Resolution must be 2K or 4K' },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.plan || 'free';
    if (plan === 'free' && requestedGenerations > 1) {
      return NextResponse.json(
        { error: 'Free users can only generate 1 image at a time' },
        { status: 403 },
      );
    }

    // Upload images to kie.ai
    const personUrl = await uploadImageToKie(
      personImage.base64,
      personImage.mimeType,
    );

    const garmentUrls = await Promise.all(
      garments.map((g: { base64: string; mimeType: string }) =>
        uploadImageToKie(g.base64, g.mimeType),
      ),
    );

    // Build the full prompt with scene/style context
    let fullPrompt = prompt;
    if (scene) fullPrompt += ` Scene: ${scene}.`;
    if (visualStyle) fullPrompt += ` Visual style: ${visualStyle}.`;
    if (mode === 'panel')
      fullPrompt += ' Show all garments in a grid panel layout.';

    // Create kie.ai task
    const imageInputs = [
      { url: personUrl, type: 'person' as const },
      ...garmentUrls.map((url) => ({
        url,
        type: 'garment' as const,
      })),
    ];

    const taskIds = await Promise.all(
      Array.from({ length: requestedGenerations }, () =>
        createImageGeneration({
          prompt: fullPrompt,
          imageInputs,
          aspectRatio,
          resolution: normalizedResolution,
        }),
      ),
    );

    return NextResponse.json({ taskIds });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Generation request failed',
      },
      { status: 500 },
    );
  }
}
