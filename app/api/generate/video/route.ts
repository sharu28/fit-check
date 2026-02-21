import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadImageToKie, createVideoGeneration } from '@/lib/kie';
import { getVideoCreditCost, getUserCredits, deductCredits } from '@/lib/credits';

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
    const { imageInput, prompt, aspectRatio, duration, sound } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 },
      );
    }

    // Credit check
    const creditCost = getVideoCreditCost((duration || 5) as 5 | 10);
    const { credits, isUnlimited } = await getUserCredits(
      supabase,
      user.id,
      user.email,
    );

    if (!isUnlimited && credits < creditCost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          required: creditCost,
          available: credits,
        },
        { status: 402 },
      );
    }

    // Upload reference image if provided
    let imageUrl: string | undefined;
    if (imageInput?.base64) {
      imageUrl = await uploadImageToKie(imageInput.base64, imageInput.mimeType);
    }

    const taskId = await createVideoGeneration({
      prompt,
      imageInput: imageUrl,
      aspectRatio: aspectRatio || '16:9',
      duration: duration || 5,
      sound: sound ?? false,
    });

    // Deduct credits after successful task submission
    await deductCredits(supabase, user.id, creditCost, user.email);

    return NextResponse.json({ taskId, creditsUsed: isUnlimited ? 0 : creditCost });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Video generation failed',
      },
      { status: 500 },
    );
  }
}
