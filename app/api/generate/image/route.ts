import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadImageToKie, createImageGeneration } from '@/lib/kie';
import { getImageCreditCost, getUserCredits, deductCredits } from '@/lib/credits';
import { buildBrandDnaPromptAddendum, normalizeBrandDnaInput } from '@/lib/brand-dna';
import {
  MODEL_FALLBACK_WARNING,
  resolveImageModel,
} from '@/lib/template-model-map';
import sharp from 'sharp';

async function buildGarmentPanel(
  garments: { base64: string; mimeType: string }[],
): Promise<{ base64: string; mimeType: string }> {
  const slotWidth = 768;
  const slotHeight = 1024;
  const cols = 2;
  const rows = 2;

  const panel = sharp({
    create: {
      width: slotWidth * cols,
      height: slotHeight * rows,
      channels: 3,
      background: { r: 245, g: 245, b: 245 },
    },
  });

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < Math.min(garments.length, 4); i += 1) {
    const garment = garments[i];
    const inputBuffer = Buffer.from(garment.base64, 'base64');
    const resized = await sharp(inputBuffer)
      .resize(slotWidth, slotHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 },
      })
      .toBuffer();

    composites.push({
      input: resized,
      left: (i % cols) * slotWidth,
      top: Math.floor(i / cols) * slotHeight,
    });
  }

  const panelBuffer = await panel
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();

  return {
    base64: panelBuffer.toString('base64'),
    mimeType: 'image/jpeg',
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = user.email ?? null;

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
      templateId,
    } = body;

    const missing: string[] = [];
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

    if (resolution && !['2K', '4K'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Resolution must be 2K or 4K' },
        { status: 400 },
      );
    }

    const {
      modelId: preferredImageModel,
      defaultModelId: defaultImageModel,
      resolution: resolvedResolution,
      forcedResolution,
    } = resolveImageModel(templateId, resolution);

    const { credits, plan, isUnlimited } = await getUserCredits(
      supabase,
      user.id,
      userEmail,
    );

    if (plan === 'free' && requestedGenerations > 1 && !isUnlimited) {
      return NextResponse.json(
        { error: 'Free users can only generate 1 image at a time' },
        { status: 403 },
      );
    }

    // Credit check
    const creditCost = getImageCreditCost(
      resolvedResolution,
      requestedGenerations,
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

    // Upload images to kie.ai
    let personUrl: string | null = null;
    if (personImage?.base64) {
      personUrl = await uploadImageToKie(
        personImage.base64,
        personImage.mimeType,
      );
    }

    let garmentUrls: string[] = [];

    if (mode === 'panel') {
      const panelImage = await buildGarmentPanel(garments);
      const panelUrl = await uploadImageToKie(panelImage.base64, panelImage.mimeType);
      garmentUrls = [panelUrl];
    } else {
      // Single swap mode uses the first garment as the reference.
      const firstGarment = garments[0];
      const firstGarmentUrl = await uploadImageToKie(
        firstGarment.base64,
        firstGarment.mimeType,
      );
      garmentUrls = [firstGarmentUrl];
    }

    // Build the full prompt with scene/style context
    let fullPrompt = prompt;
    if (scene) fullPrompt += ` Scene: ${scene}.`;
    if (visualStyle) fullPrompt += ` Visual style: ${visualStyle}.`;
    if (mode === 'panel')
      fullPrompt += ' Use the reference garment panel image and show all outfits in a 2x2 multi-shot output.';

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('brand_dna')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('Failed to load brand DNA for generation:', profileError);
    } else {
      const brandDnaAddendum = buildBrandDnaPromptAddendum(
        normalizeBrandDnaInput(profile?.brand_dna),
      );
      if (brandDnaAddendum) {
        fullPrompt += ` ${brandDnaAddendum}`;
      }
    }

    // Create kie.ai task
    const imageInputs = [
      ...(personUrl ? [{ url: personUrl, type: 'person' as const }] : []),
      ...garmentUrls.map((url) => ({
        url,
        type: 'garment' as const,
      })),
    ];

    const createTaskWithFallback = async () => {
      if (preferredImageModel === defaultImageModel) {
        const taskId = await createImageGeneration({
          prompt: fullPrompt,
          imageInputs,
          aspectRatio,
          resolution: resolvedResolution,
          modelOverride: preferredImageModel,
        });
        return { taskId, fallbackUsed: false };
      }

      try {
        const taskId = await createImageGeneration({
          prompt: fullPrompt,
          imageInputs,
          aspectRatio,
          resolution: resolvedResolution,
          modelOverride: preferredImageModel,
        });
        return { taskId, fallbackUsed: false };
      } catch (preferredError) {
        console.warn('[generate:image] preferred model rejected, retrying with default', {
          templateId: templateId ?? null,
          requestedModel: preferredImageModel,
          fallbackModel: defaultImageModel,
          tool: 'image',
          error:
            preferredError instanceof Error
              ? preferredError.message
              : String(preferredError),
        });

        const taskId = await createImageGeneration({
          prompt: fullPrompt,
          imageInputs,
          aspectRatio,
          resolution: resolvedResolution,
          modelOverride: defaultImageModel,
        });
        return { taskId, fallbackUsed: true };
      }
    };

    const taskResults = await Promise.all(
      Array.from({ length: requestedGenerations }, () => createTaskWithFallback()),
    );
    const taskIds = taskResults.map((result) => result.taskId);
    const fallbackUsed = taskResults.some((result) => result.fallbackUsed);
    const finalModel = fallbackUsed ? defaultImageModel : preferredImageModel;

    console.log('[generate:image] task created', {
      templateId: templateId ?? null,
      requestedModel: preferredImageModel,
      finalModel,
      fallbackUsed,
      requestedResolution: resolution ?? null,
      finalResolution: resolvedResolution,
      forcedResolution: forcedResolution ?? null,
      tool: 'image',
    });

    // Deduct credits after successful task submission
    await deductCredits(supabase, user.id, creditCost, userEmail);

    return NextResponse.json({
      taskIds,
      creditsUsed: isUnlimited ? 0 : creditCost,
      warning: fallbackUsed ? MODEL_FALLBACK_WARNING : undefined,
    });
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
