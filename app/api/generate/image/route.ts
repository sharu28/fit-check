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

    const taskId = await createImageGeneration({
      prompt: fullPrompt,
      imageInputs,
      aspectRatio,
      resolution,
    });

    return NextResponse.json({ taskId });
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
