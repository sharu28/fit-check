import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadImageToKie, createVideoGeneration } from '@/lib/kie';
import { getVideoCreditCost, getUserCredits, deductCredits } from '@/lib/credits';
import { MODEL_FALLBACK_WARNING, resolveVideoModel } from '@/lib/template-model-map';

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
    const { imageInput, prompt, aspectRatio, duration, sound, templateId } = body;

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

    const hasImageInput = Boolean(imageUrl);
    const {
      modelId: preferredVideoModel,
      defaultModelId: defaultVideoModel,
    } = resolveVideoModel(templateId, hasImageInput);

    const createWithModel = (modelOverride: string) =>
      createVideoGeneration({
        prompt,
        imageInput: imageUrl,
        aspectRatio: aspectRatio || '16:9',
        duration: duration || 5,
        sound: sound ?? false,
        modelOverride,
      });

    let taskId: string;
    let fallbackUsed = false;
    if (preferredVideoModel === defaultVideoModel) {
      taskId = await createWithModel(preferredVideoModel);
    } else {
      try {
        taskId = await createWithModel(preferredVideoModel);
      } catch (preferredError) {
        console.warn('[generate:video] preferred model rejected, retrying with default', {
          templateId: templateId ?? null,
          requestedModel: preferredVideoModel,
          fallbackModel: defaultVideoModel,
          tool: 'video',
          error:
            preferredError instanceof Error
              ? preferredError.message
              : String(preferredError),
        });
        taskId = await createWithModel(defaultVideoModel);
        fallbackUsed = true;
      }
    }

    console.log('[generate:video] task created', {
      templateId: templateId ?? null,
      requestedModel: preferredVideoModel,
      finalModel: fallbackUsed ? defaultVideoModel : preferredVideoModel,
      fallbackUsed,
      tool: 'video',
      hasImageInput,
    });

    if (!taskId) {
      throw new Error('Video task could not be created. Please try again.');
    }

    // Deduct credits after successful task submission
    await deductCredits(supabase, user.id, creditCost, user.email);

    return NextResponse.json({
      taskId,
      creditsUsed: isUnlimited ? 0 : creditCost,
      warning: fallbackUsed ? MODEL_FALLBACK_WARNING : undefined,
    });
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
